import { NextRequest, NextResponse } from "next/server";
import { createStripeCheckoutSession } from "@/lib/stripe-config";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      storeId,
      items,
      customerInfo,
      shippingMethod = "STANDARD",
      addressId,
    } = body;

    if (!storeId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Dados inválidos para checkout" },
        { status: 400 },
      );
    }

    // Buscar informações da loja
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        shippingFee: true,
        freeShipping: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    // Calcular totais
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);

    const shippingFee = subtotal >= store.freeShipping ? 0 : store.shippingFee;
    const total = subtotal + shippingFee;

    // Criar pedido no banco
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        storeId,
        addressId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerCpf: customerInfo.cpf,
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingMethod,
        subtotal,
        shippingFee,
        total,
        paymentMethod: "stripe",
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            productName: item.name,
            productImage: item.images[0] || "",
            specifications: item.specifications || {},
          })),
        },
      },
      include: {
        items: true,
        store: { select: { name: true, slug: true } },
      },
    });

    // Criar sessão do Stripe
    console.log("🔧 Criando sessão do Stripe com dados:", {
      storeId,
      itemsCount: items.length,
      subtotal,
      shippingFee,
      total,
      customerEmail: customerInfo.email,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    });

    const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${store.slug}/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${store.slug}/pedido/falha?session_id={CHECKOUT_SESSION_ID}`;

    console.log("🔧 URLs do Stripe:", {
      successUrl,
      cancelUrl,
    });

    const stripeSession = await createStripeCheckoutSession({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: item.name,
            images: item.images ? [item.images[0]] : [],
            description: item.description || item.name,
          },
          unit_amount: Math.round(item.price * 100), // Stripe usa centavos
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
      customer_email: customerInfo.email,
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

    // Atualizar pedido com o ID da sessão do Stripe
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
    console.error("❌ Erro ao criar checkout:", error);

    // Log detalhado para debug em produção
    if (error instanceof Error) {
      console.error("❌ Mensagem de erro:", error.message);
      console.error("❌ Stack trace:", error.stack);
    }

    // Verificar se é erro do Stripe
    if (error && typeof error === "object" && "type" in error) {
      console.error("❌ Erro do Stripe:", {
        type: (error as any).type,
        message: (error as any).message,
        code: (error as any).code,
      });
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    );
  }
}
