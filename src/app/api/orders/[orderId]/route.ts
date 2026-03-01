import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildOrderStatusHistory } from "@/lib/order-status-history";
import { db } from "@/lib/prisma";

function normalizeOrderId(rawOrderId: string): number | null {
  const trimmedOrderId = rawOrderId.trim();

  if (!/^\d+$/.test(trimmedOrderId)) {
    return null;
  }

  const parsedOrderId = Number.parseInt(trimmedOrderId, 10);

  if (!Number.isSafeInteger(parsedOrderId) || parsedOrderId <= 0) {
    return null;
  }

  return parsedOrderId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId: rawOrderId } = await params;
    const session = await getServerSession(authOptions);
    const orderId = normalizeOrderId(rawOrderId);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 },
      );
    }

    // Buscar o pedido com todas as informações relacionadas
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        address: true,
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
        statusHistory: {
          select: {
            id: true,
            status: true,
            notes: true,
            changedBy: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // Formatar os dados para a resposta
    const formattedOrder = {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: order.address
        ? `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city} - ${order.address.state}`
        : null,
      createdAt: order.createdAt.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString(),
      cancelReason: order.cancelReason,
      store: {
        id: order.store.id,
        name: order.store.name,
        slug: order.store.slug,
      },
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productImage: item.productImage || item.product?.images?.[0] || null,
      })),
      payments: order.payments.map((payment) => ({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        paidAt: payment.paidAt?.toISOString() || null,
      })),
      statusHistory: buildOrderStatusHistory({
        orderId: order.id,
        currentStatus: order.status,
        updatedAt: order.updatedAt,
        statusHistory: order.statusHistory,
        fallbackChangedBy: order.userId,
      }),
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error("❌ Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
