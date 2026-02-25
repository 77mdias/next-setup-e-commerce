import { Prisma, ShippingMethod } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { createStripeCheckoutSession } from "@/lib/stripe-config";

const checkoutItemSchema = z
  .object({
    productId: z.string().trim().min(1),
    quantity: z.number().int().positive(),
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
  totalPrice: number;
  productName: string;
  productImage: string;
  productDescription: string;
  specifications: Prisma.InputJsonValue;
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

    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
        specifications: true,
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            value: true,
            price: true,
          },
        },
      },
    });

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const canonicalItems: CanonicalCheckoutItem[] = [];

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);

      if (!product) {
        return badRequest(
          `Produto inválido para a loja selecionada: ${item.productId}`,
        );
      }

      const selectedVariant = item.variantId
        ? product.variants.find((variant) => variant.id === item.variantId)
        : undefined;

      if (item.variantId && !selectedVariant) {
        return badRequest(`Variação inválida para o produto ${item.productId}`);
      }

      const unitPrice = selectedVariant?.price ?? product.price;
      const itemName = resolveItemName(product.name, selectedVariant);

      canonicalItems.push({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
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

    const subtotal = canonicalItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
    const shippingFee =
      subtotal >= store.freeShipping ? 0 : Number(store.shippingFee ?? 0);
    const total = subtotal + shippingFee;

    const order = await db.order.create({
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
    });

    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${store.slug}/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${store.slug}/pedido/falha?session_id={CHECKOUT_SESSION_ID}`;

    const stripeSession = await createStripeCheckoutSession({
      payment_method_types: ["card"],
      line_items: canonicalItems.map((item) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: item.productName,
            images: item.productImage ? [item.productImage] : [],
            description: item.productDescription,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: order.id.toString(),
        storeId: store.id,
        userId: session.user.id,
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
