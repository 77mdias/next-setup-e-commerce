import { Prisma, ShippingMethod } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import {
  createStripeCheckoutSession,
  expireStripeCheckoutSession,
} from "@/lib/stripe-config";

const MAX_ITEM_QUANTITY = 1000;

const checkoutItemSchema = z
  .object({
    productId: z.string().trim().min(1),
    quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
    variantId: z.string().trim().min(1).optional(),
  })
  .strict();

const checkoutPayloadSchema = z
  .object({
    storeId: z.string().trim().min(1),
    items: z.array(checkoutItemSchema).min(1),
    addressId: z.string().trim().min(1).optional(),
    shippingMethod: z.nativeEnum(ShippingMethod).default("STANDARD"),
  })
  .strict();

type CheckoutItemPayload = z.infer<typeof checkoutItemSchema>;

type CanonicalCheckoutItem = {
  productId: string;
  variantId?: string;
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
  productId: string;
  variantId: string | null;
  quantity: number;
  reserved: number;
  minStock: number;
};

function badRequest(
  error: string,
  issues?: Array<{ field: string; message: string }>,
) {
  return NextResponse.json(
    {
      error,
      ...(issues ? { issues } : {}),
    },
    { status: 400 },
  );
}

function notFound(error: string) {
  return NextResponse.json({ error }, { status: 404 });
}

function conflict(error: string) {
  return NextResponse.json({ error }, { status: 409 });
}

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return badRequest("Payload JSON inválido");
    }

    const parsedPayload = checkoutPayloadSchema.safeParse(requestBody);

    if (!parsedPayload.success) {
      return badRequest(
        "Dados inválidos para checkout",
        parsedPayload.error.issues.map((issue) => ({
          field: issue.path.join(".") || "payload",
          message: issue.message,
        })),
      );
    }

    const payload = parsedPayload.data;
    const normalizedItems = normalizeItems(payload.items);

    const [store, customer] = await Promise.all([
      db.store.findUnique({
        where: { id: payload.storeId },
        select: {
          id: true,
          name: true,
          slug: true,
          shippingFee: true,
          freeShipping: true,
        },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: {
          email: true,
          name: true,
          phone: true,
          cpf: true,
        },
      }),
    ]);

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Usuário autenticado não encontrado" },
        { status: 401 },
      );
    }

    if (!customer.email) {
      return badRequest("Email do usuário é obrigatório para checkout");
    }

    if (payload.addressId) {
      const address = await db.address.findFirst({
        where: {
          id: payload.addressId,
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (!address) {
        return badRequest("Endereço inválido para o usuário autenticado");
      }
    }

    const productIds = [
      ...new Set(normalizedItems.map((item) => item.productId)),
    ];
    const variantIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.variantId)
          .filter((variantId): variantId is string => Boolean(variantId)),
      ),
    ];

    const [products, variants, inventories] = await Promise.all([
      db.product.findMany({
        where: {
          id: { in: productIds },
        },
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
        where: {
          id: { in: variantIds },
        },
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
          productId: true,
          variantId: true,
          quantity: true,
          reserved: true,
          minStock: true,
        },
      }),
    ]);

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const variantById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );
    const inventoryByKey = new Map(
      inventories.map((inventory) => [
        buildInventoryKey(inventory.productId, inventory.variantId),
        inventory,
      ]),
    );

    const missingProduct = productIds.find(
      (productId) => !productById.has(productId),
    );

    if (missingProduct) {
      return notFound(`Produto não encontrado: ${missingProduct}`);
    }

    const canonicalItems: CanonicalCheckoutItem[] = [];
    const requestedByInventory = new Map<
      string,
      { quantity: number; label: string; inventory: InventorySnapshot }
    >();

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);

      if (!product) {
        return notFound(`Produto não encontrado: ${item.productId}`);
      }

      if (!product.isActive) {
        return badRequest(`Produto inativo: ${item.productId}`);
      }

      if (product.storeId !== store.id) {
        return badRequest(
          `Produto não pertence à loja selecionada: ${item.productId}`,
        );
      }

      const selectedVariant = item.variantId
        ? variantById.get(item.variantId)
        : undefined;

      if (item.variantId && !selectedVariant) {
        return notFound(`Variação não encontrada: ${item.variantId}`);
      }

      if (selectedVariant && !selectedVariant.isActive) {
        return badRequest(`Variação inválida para o produto ${item.productId}`);
      }

      if (selectedVariant && selectedVariant.productId !== product.id) {
        return badRequest(
          `Variação ${selectedVariant.id} não pertence ao produto ${item.productId}`,
        );
      }

      const variantInventoryKey = buildInventoryKey(
        product.id,
        selectedVariant?.id,
      );
      const baseInventoryKey = buildInventoryKey(product.id);
      let inventoryKey = selectedVariant
        ? variantInventoryKey
        : baseInventoryKey;
      let inventory = inventoryByKey.get(inventoryKey);

      if (!inventory && selectedVariant) {
        // Fallback para produtos que usam inventário consolidado no nível do produto.
        inventoryKey = baseInventoryKey;
        inventory = inventoryByKey.get(baseInventoryKey);
      }

      if (!inventory) {
        return conflict(
          `Estoque indisponível para o produto ${item.productId}`,
        );
      }

      const availableInventory = Math.max(
        inventory.quantity - inventory.reserved,
        0,
      );
      const variantStock = selectedVariant
        ? Math.max(selectedVariant.stock, 0)
        : Number.POSITIVE_INFINITY;

      if (item.quantity > variantStock) {
        return conflict(
          `Quantidade indisponível para a variação ${selectedVariant?.id}`,
        );
      }

      const availableForSale = Math.min(availableInventory, variantStock);

      if (item.quantity > availableForSale) {
        return conflict(
          `Estoque insuficiente para o produto ${item.productId}`,
        );
      }

      const inventoryRequest = requestedByInventory.get(inventoryKey);
      requestedByInventory.set(inventoryKey, {
        quantity: (inventoryRequest?.quantity ?? 0) + item.quantity,
        label:
          inventoryRequest?.label ??
          resolveItemName(product.name, selectedVariant),
        inventory,
      });

      const unitPrice = selectedVariant?.price ?? product.price;
      const unitPriceCents = moneyToCents(unitPrice);
      const totalPriceCents = unitPriceCents * item.quantity;
      const itemName = resolveItemName(product.name, selectedVariant);

      canonicalItems.push({
        productId: product.id,
        variantId: selectedVariant?.id,
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

    for (const inventoryRequest of requestedByInventory.values()) {
      const available = Math.max(
        inventoryRequest.inventory.quantity -
          inventoryRequest.inventory.reserved,
        0,
      );

      if (inventoryRequest.quantity > available) {
        return conflict(`Estoque insuficiente para ${inventoryRequest.label}`);
      }

      const remainingAfterCheckout = available - inventoryRequest.quantity;

      if (remainingAfterCheckout < inventoryRequest.inventory.minStock) {
        return conflict(
          `Quantidade indisponível para ${inventoryRequest.label} devido ao estoque mínimo`,
        );
      }
    }

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

    const order = await db.$transaction((transaction) =>
      transaction.order.create({
        data: {
          userId: session.user.id,
          storeId: store.id,
          addressId: payload.addressId,
          customerName: customer.name?.trim() || session.user.name || "Cliente",
          customerPhone: customer.phone?.trim() || "Não informado",
          customerEmail: customer.email,
          customerCpf: customer.cpf?.trim() || null,
          status: "PENDING",
          paymentStatus: "PENDING",
          shippingMethod: payload.shippingMethod,
          subtotal,
          shippingFee,
          total,
          paymentMethod: "stripe",
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
      }),
    );

    let stripeSession: Awaited<
      ReturnType<typeof createStripeCheckoutSession>
    > | null = null;

    try {
      const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${store.slug}/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${store.slug}/pedido/falha?session_id={CHECKOUT_SESSION_ID}`;

      stripeSession = await createStripeCheckoutSession({
        payment_method_types: ["card"],
        line_items: stripeLineItems,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId: order.id.toString(),
          storeId: store.id,
          userId: session.user.id,
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
            label: {
              type: "custom",
              custom: "Nome completo",
            },
            type: "text",
            optional: false,
          },
          {
            key: "customer_phone",
            label: {
              type: "custom",
              custom: "Telefone",
            },
            type: "text",
            optional: false,
          },
          {
            key: "customer_cpf",
            label: {
              type: "custom",
              custom: "CPF",
            },
            type: "text",
            optional: false,
          },
        ],
      });

      await db.order.update({
        where: { id: order.id },
        data: {
          stripePaymentId: stripeSession.id,
          paymentMethod: "stripe",
        },
      });
    } catch (checkoutError) {
      if (stripeSession?.id) {
        try {
          await expireStripeCheckoutSession(stripeSession.id);
        } catch (expireError) {
          console.error(
            `Erro ao expirar sessão Stripe ${stripeSession.id} durante rollback do pedido ${order.id}:`,
            expireError,
          );
        }
      }

      try {
        await db.order.delete({
          where: { id: order.id },
        });
      } catch (rollbackError) {
        console.error(
          `Erro ao executar rollback do pedido ${order.id}:`,
          rollbackError,
        );
      }

      throw checkoutError;
    }

    if (!stripeSession) {
      throw new Error(
        `Sessão Stripe não foi criada para o pedido ${order.id} após checkout`,
      );
    }

    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
