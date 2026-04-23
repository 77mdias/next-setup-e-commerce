import { Prisma, ShippingMethod } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { createRequestLogger } from "@/lib/logger";
import { INITIAL_ORDER_STATE } from "@/lib/order-state-machine";
import { db } from "@/lib/prisma";
import {
  cleanupAbandonedReservations,
  confirmReservationsByOrder,
  createReservation,
  releaseReservationsByOrder,
} from "@/lib/stock-reservation";
import {
  createStripeCheckoutSession,
  expireStripeCheckoutSession,
} from "@/lib/stripe-config";

// ============================================================================
// Types
// ============================================================================

const MAX_ITEM_QUANTITY = 1000;
const E2E_CHECKOUT_MOCK_MODE = "true";
const E2E_CHECKOUT_OUTCOME_HEADER = "x-e2e-checkout-outcome";

type E2ECheckoutOutcome = "success" | "failed";

const checkoutItemSchema = {
  object: z.object({
    productId: z.string().trim().min(1),
    quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
    variantId: z.string().trim().min(1).optional(),
  }).strict(),
};

const checkoutPayloadSchema = {
  object: z.object({
    storeId: z.string().trim().min(1),
    items: z.array(checkoutItemSchema.object).min(1),
    addressId: z.string().trim().min(1).optional(),
    shippingMethod: z.nativeEnum(ShippingMethod).default("STANDARD"),
  }).strict(),
};

type CheckoutItemPayload = z.infer<typeof checkoutItemSchema.object>;

type CanonicalCheckoutItem = {
  productId: string;
  variantId?: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
  unitPriceCents: number;
  totalPrice: number;
  totalPriceCents: number;
  productName: string;
  productImage: string;
  productDescription: string;
  specifications: Prisma.InputJsonValue;
};

type InventorySnapshot = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  reserved: number;
  minStock: number;
};

// ============================================================================
// Error Classes
// ============================================================================

class CheckoutReservationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutReservationConflictError";
  }
}

export class CheckoutValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public issues?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeItems(items: CheckoutItemPayload[]): CheckoutItemPayload[] {
  const groupedItems = new Map<string, CheckoutItemPayload>();

  for (const item of items) {
    const variantKey = item.variantId ?? "";
    const key = `${item.productId}:${variantKey}`;
    const existing = groupedItems.get(key);

    if (!existing) {
      groupedItems.set(key, { ...item });
      continue;
    }

    groupedItems.set(key, {
      ...existing,
      quantity: existing.quantity + item.quantity,
    });
  }

  return [...groupedItems.values()];
}

function resolveItemName(
  productName: string,
  variant?: { name: string; value: string },
): string {
  if (!variant) {
    return productName;
  }

  return `${productName} (${variant.name}: ${variant.value})`;
}

function moneyToCents(amount: number): number {
  return Math.round(amount * 100);
}

function centsToMoney(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function buildInventoryKey(
  productId: string,
  variantId?: string | null,
): string {
  return `${productId}:${variantId ?? ""}`;
}

function resolveShippingFeeCents(
  shippingMethod: ShippingMethod,
  subtotalCents: number,
  storeShippingFee: number,
  freeShippingThreshold: number,
): number {
  if (shippingMethod === "PICKUP") {
    return 0;
  }

  const shippingFeeCents = moneyToCents(storeShippingFee);

  if (shippingFeeCents <= 0) {
    return 0;
  }

  const freeShippingThresholdCents = moneyToCents(freeShippingThreshold);

  if (
    freeShippingThresholdCents > 0 &&
    subtotalCents >= freeShippingThresholdCents
  ) {
    return 0;
  }

  return shippingFeeCents;
}

function resolveReservationConflictMessage(
  itemName: string,
  reason: string,
): string {
  if (reason.includes("minimum stock")) {
    return `Quantidade indisponível para ${itemName} devido ao estoque mínimo`;
  }

  return `Estoque insuficiente para ${itemName}`;
}

// ============================================================================
// E2E Mock Helpers
// ============================================================================

function isE2ECheckoutMockModeEnabled() {
  return process.env.E2E_CHECKOUT_MOCK_MODE === E2E_CHECKOUT_MOCK_MODE;
}

function resolveE2ECheckoutOutcome(
  requestedOutcome: string | null,
): E2ECheckoutOutcome {
  return requestedOutcome === "failed" ? "failed" : "success";
}

function buildE2EMockSessionId(orderId: number): string {
  return `cs_e2e_${orderId}_${Date.now()}`;
}

function buildE2EOrderStatusHistoryNote(
  outcome: E2ECheckoutOutcome,
  orderStatus: string,
  paymentStatus: string,
) {
  return [
    "source:e2e",
    "reason:mock_checkout_outcome",
    `outcome:${outcome}`,
    `orderStatus:${orderStatus}`,
    `paymentStatus:${paymentStatus}`,
  ].join("; ");
}

// ============================================================================
// Checkout Service
// ============================================================================

export interface CreateCheckoutSessionParams {
  request: Request;
  requestOrigin: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  orderId: number;
}

export class CheckoutService {
  private logger: ReturnType<typeof createRequestLogger>;

  constructor() {
    this.logger = createRequestLogger({
      headers: new Headers(),
      route: "/api/checkout",
    });
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<CheckoutSessionResult> {
    const { request, requestOrigin, userId, userEmail, userName } = params;

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.clone().json();
    } catch {
      throw new CheckoutValidationError("Payload JSON inválido", 400);
    }

    const parsedPayload = checkoutPayloadSchema.object.safeParse(requestBody);

    if (!parsedPayload.success) {
      throw new CheckoutValidationError(
        "Dados inválidos para checkout",
        400,
        parsedPayload.error.issues.map((issue) => ({
          field: issue.path.join(".") || "payload",
          message: issue.message,
        })),
      );
    }

    const payload = parsedPayload.data;
    const normalizedItems = normalizeItems(payload.items);

    // Run best-effort reservation cleanup
    await this.runBestEffortReservationCleanup();

    // Fetch store and customer in parallel
    const [store, customer] = await Promise.all([
      db.store.findUnique({
        where: { id: payload.storeId },
        select: {
          id: true,
          name: true,
          shippingFee: true,
          freeShipping: true,
        },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          phone: true,
          cpf: true,
        },
      }),
    ]);

    if (!store) {
      throw new CheckoutValidationError("Loja não encontrada", 404);
    }

    if (!customer) {
      throw new CheckoutValidationError(
        "Usuário autenticado não encontrado",
        401,
      );
    }

    if (!customer.email) {
      throw new CheckoutValidationError(
        "Email do usuário é obrigatório para checkout",
        400,
      );
    }

    // Validate address if provided
    if (payload.addressId) {
      const address = await db.address.findFirst({
        where: {
          id: payload.addressId,
          userId: userId,
        },
        select: { id: true },
      });

      if (!address) {
        throw new CheckoutValidationError(
          "Endereço inválido para o usuário autenticado",
          400,
        );
      }
    }

    // Build product and variant ID sets
    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const variantIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.variantId)
          .filter((variantId): variantId is string => Boolean(variantId)),
      ),
    ];

    // Fetch products, variants, and inventories in parallel
    const [products, variants, inventories] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          storeId: true,
          isActive: true,
          name: true,
          description: true,
          price: true,
          images: true,
          specifications: true,
        },
      }),
      db.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          productId: true,
          isActive: true,
          name: true,
          value: true,
          price: true,
          stock: true,
        },
      }),
      db.inventory.findMany({
        where: {
          storeId: store.id,
          productId: { in: productIds },
        },
        select: {
          id: true,
          productId: true,
          variantId: true,
          quantity: true,
          reserved: true,
          minStock: true,
        },
      }),
    ]);

    // Build lookup maps
    const productById = new Map(products.map((p) => [p.id, p]));
    const variantById = new Map(variants.map((v) => [v.id, v]));
    const inventoryByKey = new Map(
      inventories.map((i) => [buildInventoryKey(i.productId, i.variantId), i]),
    );

    // Validate all products exist
    const missingProduct = productIds.find((id) => !productById.has(id));
    if (missingProduct) {
      throw new CheckoutValidationError(
        `Produto não encontrado: ${missingProduct}`,
        404,
      );
    }

    // Process and validate items
    const canonicalItems: CanonicalCheckoutItem[] = [];
    const requestedByInventory = new Map<
      string,
      { quantity: number; label: string; inventory: InventorySnapshot }
    >();

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);

      if (!product) {
        throw new CheckoutValidationError(
          `Produto não encontrado: ${item.productId}`,
          404,
        );
      }

      if (!product.isActive) {
        throw new CheckoutValidationError(
          `Produto inativo: ${item.productId}`,
          400,
        );
      }

      if (product.storeId !== store.id) {
        throw new CheckoutValidationError(
          `Produto não pertence à loja selecionada: ${item.productId}`,
          400,
        );
      }

      const selectedVariant = item.variantId
        ? variantById.get(item.variantId)
        : undefined;

      if (item.variantId && !selectedVariant) {
        throw new CheckoutValidationError(
          `Variação não encontrada: ${item.variantId}`,
          404,
        );
      }

      if (selectedVariant && !selectedVariant.isActive) {
        throw new CheckoutValidationError(
          `Variação inválida para o produto ${item.productId}`,
          400,
        );
      }

      if (selectedVariant && selectedVariant.productId !== product.id) {
        throw new CheckoutValidationError(
          `Variação ${selectedVariant.id} não pertence ao produto ${item.productId}`,
          400,
        );
      }

      // Resolve inventory
      const variantInventoryKey = buildInventoryKey(product.id, selectedVariant?.id);
      const baseInventoryKey = buildInventoryKey(product.id);
      let inventoryKey = selectedVariant ? variantInventoryKey : baseInventoryKey;
      let inventory = inventoryByKey.get(inventoryKey);

      if (!inventory && selectedVariant) {
        inventoryKey = baseInventoryKey;
        inventory = inventoryByKey.get(baseInventoryKey);
      }

      if (!inventory) {
        throw new CheckoutValidationError(
          `Estoque indisponível para o produto ${item.productId}`,
          409,
        );
      }

      const availableInventory = Math.max(inventory.quantity - inventory.reserved, 0);
      const variantStock = selectedVariant
        ? Math.max(selectedVariant.stock, 0)
        : Number.POSITIVE_INFINITY;

      if (item.quantity > variantStock) {
        throw new CheckoutValidationError(
          `Quantidade indisponível para a variação ${selectedVariant?.id}`,
          409,
        );
      }

      const availableForSale = Math.min(availableInventory, variantStock);

      if (item.quantity > availableForSale) {
        throw new CheckoutValidationError(
          `Estoque insuficiente para o produto ${item.productId}`,
          409,
        );
      }

      const inventoryRequest = requestedByInventory.get(inventoryKey);
      requestedByInventory.set(inventoryKey, {
        quantity: (inventoryRequest?.quantity ?? 0) + item.quantity,
        label: inventoryRequest?.label ?? resolveItemName(product.name, selectedVariant),
        inventory,
      });

      const unitPrice = selectedVariant?.price ?? product.price;
      const unitPriceCents = moneyToCents(unitPrice);
      const totalPriceCents = unitPriceCents * item.quantity;
      const itemName = resolveItemName(product.name, selectedVariant);

      canonicalItems.push({
        productId: product.id,
        variantId: selectedVariant?.id,
        inventoryId: inventory.id,
        quantity: item.quantity,
        unitPrice,
        unitPriceCents,
        totalPrice: centsToMoney(totalPriceCents),
        totalPriceCents,
        productName: itemName,
        productImage: product.images[0] ?? "",
        productDescription: product.description || product.name,
        specifications: selectedVariant
          ? ({
              product: product.specifications,
              selectedVariant: {
                id: selectedVariant.id,
                name: selectedVariant.name,
                value: selectedVariant.value,
              },
            } as Prisma.InputJsonValue)
          : (product.specifications as Prisma.InputJsonValue),
      });
    }

    // Final stock validation
    for (const inventoryRequest of requestedByInventory.values()) {
      const available = Math.max(
        inventoryRequest.inventory.quantity - inventoryRequest.inventory.reserved,
        0,
      );

      if (inventoryRequest.quantity > available) {
        throw new CheckoutValidationError(
          `Estoque insuficiente para ${inventoryRequest.label}`,
          409,
        );
      }

      const remainingAfterCheckout = available - inventoryRequest.quantity;

      if (remainingAfterCheckout < inventoryRequest.inventory.minStock) {
        throw new CheckoutValidationError(
          `Quantidade indisponível para ${inventoryRequest.label} devido ao estoque mínimo`,
          409,
        );
      }
    }

    // Calculate totals
    const subtotalCents = canonicalItems.reduce(
      (sum, item) => sum + item.totalPriceCents,
      0,
    );
    const shippingFeeCents = resolveShippingFeeCents(
      payload.shippingMethod,
      subtotalCents,
      Number(store.shippingFee ?? 0),
      Number(store.freeShipping ?? 0),
    );
    const totalCents = subtotalCents + shippingFeeCents;

    const subtotal = centsToMoney(subtotalCents);
    const shippingFee = centsToMoney(shippingFeeCents);
    const total = centsToMoney(totalCents);
    const initialOrderState = INITIAL_ORDER_STATE;
    const initialStatusHistoryNote = [
      "source:checkout",
      "reason:order_created",
      `orderStatus:${initialOrderState.orderStatus}`,
      `paymentStatus:${initialOrderState.paymentStatus}`,
    ].join("; ");

    // Build Stripe line items
    const stripeLineItems = canonicalItems.map((item) => ({
      price_data: {
        currency: "brl" as const,
        product_data: {
          name: item.productName,
          images: item.productImage ? [item.productImage] : [],
          description: item.productDescription,
        },
        unit_amount: item.unitPriceCents,
      },
      quantity: item.quantity,
    }));

    if (shippingFeeCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: "Frete",
            images: [],
            description: `Envio ${payload.shippingMethod.toLowerCase()} - ${store.name}`,
          },
          unit_amount: shippingFeeCents,
        },
        quantity: 1,
      });
    }

    // Create order with reservations
    let order: { id: number };

    try {
      order = await db.$transaction(async (transaction) => {
        const createdOrder = await transaction.order.create({
          data: {
            userId: userId,
            storeId: store.id,
            addressId: payload.addressId,
            customerName: customer.name?.trim() || userName || "Cliente",
            customerPhone: customer.phone?.trim() || "Não informado",
            customerEmail: customer.email,
            customerCpf: customer.cpf?.trim() || null,
            status: initialOrderState.orderStatus,
            paymentStatus: initialOrderState.paymentStatus,
            shippingMethod: payload.shippingMethod,
            subtotal,
            shippingFee,
            total,
            paymentMethod: "stripe",
            statusHistory: {
              create: {
                status: initialOrderState.orderStatus,
                notes: initialStatusHistoryNote,
                changedBy: userId,
              },
            },
            items: {
              create: canonicalItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                productName: item.productName,
                productImage: item.productImage,
                specifications: item.specifications,
              })),
            },
          },
          select: {
            id: true,
            items: {
              select: {
                id: true,
                productId: true,
                variantId: true,
              },
            },
          },
        });

        // Create reservations for each item
        const orderItemIdByKey = new Map(
          createdOrder.items.map((item) => [
            buildInventoryKey(item.productId, item.variantId),
            item.id,
          ]),
        );

        for (const item of canonicalItems) {
          const orderItemId = orderItemIdByKey.get(
            buildInventoryKey(item.productId, item.variantId),
          );

          if (!orderItemId) {
            throw new Error(
              `Pedido ${createdOrder.id} sem item para reserva ${item.productId}`,
            );
          }

          const reservationResult = await createReservation(
            {
              inventoryId: item.inventoryId,
              quantity: item.quantity,
              orderId: createdOrder.id,
              orderItemId,
            },
            transaction,
          );

          if (!reservationResult.success) {
            throw new CheckoutReservationConflictError(
              resolveReservationConflictMessage(item.productName, reservationResult.reason),
            );
          }
        }

        return { id: createdOrder.id };
      });
    } catch (error) {
      if (error instanceof CheckoutReservationConflictError) {
        throw new CheckoutValidationError(error.message, 409);
      }
      throw error;
    }

    const orderLogger = this.logger.child({ orderId: order.id });

    // Handle E2E mock mode
    if (isE2ECheckoutMockModeEnabled()) {
      const requestedOutcome = request.headers
        .get(E2E_CHECKOUT_OUTCOME_HEADER)
        ?.trim()
        .toLowerCase() ?? null;
      const mockOutcome = resolveE2ECheckoutOutcome(requestedOutcome);
      const mockSessionId = buildE2EMockSessionId(order.id);
      const redirectPath = mockOutcome === "failed" ? "failure" : "success";
      const checkoutReturnPath = `/orders/${redirectPath}?session_id=${mockSessionId}`;

      await this.finalizeE2EMockCheckout({
        orderId: order.id,
        sessionId: mockSessionId,
        userId: userId,
        outcome: mockOutcome,
      });

      return {
        sessionId: mockSessionId,
        url: checkoutReturnPath,
        orderId: order.id,
      };
    }

    // Create Stripe checkout session
    let stripeSession: Awaited<ReturnType<typeof createStripeCheckoutSession>> | null = null;

    try {
      const successUrl = `${requestOrigin}/orders/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${requestOrigin}/orders/failure?session_id={CHECKOUT_SESSION_ID}`;

      stripeSession = await createStripeCheckoutSession({
        payment_method_types: ["card"],
        line_items: stripeLineItems,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId: order.id.toString(),
          storeId: store.id,
          userId: userId,
          subtotalCents: subtotalCents.toString(),
          shippingFeeCents: shippingFeeCents.toString(),
          totalCents: totalCents.toString(),
        },
        customer_email: customer.email,
        shipping_address_collection: {
          allowed_countries: ["BR"],
        },
        payment_intent_data: {
          metadata: {
            orderId: order.id.toString(),
            storeId: store.id,
          },
        },
        custom_fields: [
          {
            key: "customer_name",
            label: { type: "custom" as const, custom: "Nome completo" },
            type: "text" as const,
            optional: false,
          },
          {
            key: "customer_phone",
            label: { type: "custom" as const, custom: "Telefone" },
            type: "text" as const,
            optional: false,
          },
          {
            key: "customer_cpf",
            label: { type: "custom" as const, custom: "CPF" },
            type: "text" as const,
            optional: false,
          },
        ],
      });

      // Update order with Stripe session ID
      await db.order.update({
        where: { id: order.id },
        data: {
          stripeCheckoutSessionId: stripeSession.id,
          stripePaymentId: stripeSession.id,
          paymentMethod: "stripe",
        },
      });

      // Clear cart
      try {
        await db.cart.deleteMany({
          where: { userId: userId },
        });
      } catch (clearCartError) {
        orderLogger.error("checkout.cart_clear_failed", {
          error: clearCartError,
        });
      }
    } catch (checkoutError) {
      // Attempt to expire Stripe session
      if (stripeSession?.id) {
        try {
          await expireStripeCheckoutSession(stripeSession.id);
        } catch (expireError) {
          orderLogger.error("checkout.stripe_session_expire_failed", {
            context: { checkoutSessionId: stripeSession.id },
            error: expireError,
          });
        }
      }

      // Rollback: release reservations and delete order
      try {
        await db.$transaction(async (transaction) => {
          await releaseReservationsByOrder(order.id, transaction);
          await transaction.order.delete({
            where: { id: order.id },
          });
        });
      } catch (rollbackError) {
        orderLogger.error("checkout.rollback_order_delete_failed", {
          error: rollbackError,
        });
      }

      throw checkoutError;
    }

    if (!stripeSession) {
      throw new Error(
        `Sessão Stripe não foi criada para o pedido ${order.id} após checkout`,
      );
    }

    return {
      sessionId: stripeSession.id,
      url: stripeSession.url ?? "",
      orderId: order.id,
    };
  }

  private async runBestEffortReservationCleanup() {
    try {
      const cleanupResult = await cleanupAbandonedReservations();

      if (cleanupResult.expiredCount > 0 || cleanupResult.releasedCount > 0) {
        this.logger.info("checkout.reservations_cleanup_applied", {
          data: {
            referenceDate: cleanupResult.referenceDate.toISOString(),
            expiredCount: cleanupResult.expiredCount,
            releasedCount: cleanupResult.releasedCount,
          },
        });
      }
    } catch (cleanupError) {
      this.logger.warn("checkout.reservations_cleanup_failed", {
        error: cleanupError,
      });
    }
  }

  private async finalizeE2EMockCheckout(params: {
    orderId: number;
    sessionId: string;
    userId: string;
    outcome: E2ECheckoutOutcome;
  }) {
    const nextState =
      params.outcome === "failed"
        ? {
            orderStatus: "CANCELLED" as const,
            paymentStatus: "FAILED" as const,
            cancelReason: "Pagamento falhou (simulação E2E).",
          }
        : {
            orderStatus: "PAID" as const,
            paymentStatus: "PAID" as const,
            cancelReason: null,
          };

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: params.orderId },
        data: {
          status: nextState.orderStatus,
          paymentStatus: nextState.paymentStatus,
          stripeCheckoutSessionId: params.sessionId,
          stripePaymentIntentId: params.sessionId,
          stripePaymentId: params.sessionId,
          paymentMethod: "stripe",
          cancelledAt: params.outcome === "failed" ? new Date() : null,
          cancelReason: nextState.cancelReason,
          statusHistory: {
            create: {
              status: nextState.orderStatus,
              notes: buildE2EOrderStatusHistoryNote(
                params.outcome,
                nextState.orderStatus,
                nextState.paymentStatus,
              ),
              changedBy: params.userId,
            },
          },
        },
      });

      if (params.outcome === "failed") {
        await releaseReservationsByOrder(params.orderId, tx);
      } else {
        await confirmReservationsByOrder(params.orderId, tx);
      }

      await tx.cart.deleteMany({
        where: { userId: params.userId },
      });
    });
  }
}

// Export singleton instance
export const checkoutService = new CheckoutService();
