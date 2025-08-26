import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = await params;

    console.log("🔍 Buscando pedido para sessão:", sessionId);
    console.log("👤 Usuário autenticado:", session?.user?.id);

    if (!sessionId) {
      console.error("❌ ID da sessão é obrigatório");
      return NextResponse.json(
        { error: "ID da sessão é obrigatório" },
        { status: 400 },
      );
    }

    // Buscar pedido pela sessão do Stripe
    const order = await db.order.findFirst({
      where: {
        stripePaymentId: sessionId,
        ...(session?.user?.id && { userId: session.user.id }),
      },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            productImage: true,
            specifications: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        payments: {
          where: {
            stripePaymentId: sessionId,
          },
          select: {
            id: true,
            status: true,
            amount: true,
            paidAt: true,
          },
        },
      },
    });

    console.log("🔍 Resultado da busca:", {
      orderFound: !!order,
      orderId: order?.id,
      orderStatus: order?.status,
      paymentStatus: order?.paymentStatus,
      userId: order?.userId,
      sessionUserId: session?.user?.id,
    });

    if (!order) {
      console.error("❌ Pedido não encontrado para sessão:", sessionId);

      // Buscar todos os pedidos com esse stripePaymentId para debug
      const allOrdersWithSession = await db.order.findMany({
        where: {
          stripePaymentId: sessionId,
        },
        select: {
          id: true,
          userId: true,
          status: true,
          paymentStatus: true,
        },
      });

      console.log("🔍 Todos os pedidos com essa sessão:", allOrdersWithSession);

      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o usuário tem permissão para ver este pedido
    if (session?.user?.id && order.userId !== session.user.id) {
      console.error("❌ Acesso negado - usuário não é dono do pedido:", {
        orderUserId: order.userId,
        sessionUserId: session.user.id,
      });
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    console.log("✅ Pedido encontrado e autorizado:", order.id);
    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
