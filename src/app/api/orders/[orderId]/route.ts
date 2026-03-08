import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runDemoOrderAutomationForOrder } from "@/lib/order-demo-automation";
import { buildOrderStatusHistory } from "@/lib/order-status-history";
import { db } from "@/lib/prisma";

function buildOrderDetailsInclude() {
  return {
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
        createdAt: "desc" as const,
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
      orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    },
  };
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.length > 0 ? normalizedEmail : null;
}

function logLegacyOrderNeedsManualReview(payload: {
  orderId: number;
  sessionUserId: string;
  reason:
    | "missing_session_email"
    | "missing_order_email"
    | "email_mismatch_or_unmapped";
}) {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[orders][legacy-ownership] orderId=${payload.orderId} reason=${payload.reason}`,
    );
    return;
  }

  console.warn("[orders][legacy-ownership]", payload);
}

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

    // Buscar o pedido com ownership canônico por userId.
    let order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: buildOrderDetailsInclude(),
    });

    // Fallback temporário até conclusão do backfill S02-ORD-002.
    // Remover até 2026-03-31 após validação do vínculo canônico por userId.
    if (!order) {
      const normalizedSessionEmail = normalizeEmail(session.user.email);

      if (normalizedSessionEmail) {
        const linkedOrder = await db.order.updateMany({
          where: {
            id: orderId,
            userId: null,
            customerEmail: {
              equals: normalizedSessionEmail,
              mode: "insensitive",
            },
          },
          data: {
            userId: session.user.id,
          },
        });

        if (linkedOrder.count > 0) {
          order = await db.order.findFirst({
            where: {
              id: orderId,
              userId: session.user.id,
            },
            include: buildOrderDetailsInclude(),
          });
        }
      }

      if (!order) {
        const legacyOrder = await db.order.findFirst({
          where: {
            id: orderId,
            userId: null,
          },
          select: {
            id: true,
            customerEmail: true,
          },
        });

        if (legacyOrder) {
          logLegacyOrderNeedsManualReview({
            orderId: legacyOrder.id,
            sessionUserId: session.user.id,
            reason: !normalizedSessionEmail
              ? "missing_session_email"
              : legacyOrder.customerEmail
                ? "email_mismatch_or_unmapped"
                : "missing_order_email",
          });
        }
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    try {
      const automationResult = await runDemoOrderAutomationForOrder(order.id);

      if (automationResult.updated) {
        const refreshedOrder = await db.order.findFirst({
          where: {
            id: orderId,
            userId: session.user.id,
          },
          include: buildOrderDetailsInclude(),
        });

        if (refreshedOrder) {
          order = refreshedOrder;
        }
      }
    } catch (automationError) {
      console.error(
        "⚠️ Falha ao executar automação demo para o pedido:",
        automationError,
      );
    }

    // Formatar os dados para a resposta
    const formattedOrder = {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      trackingCode: order.trackingCode,
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      deliveredAt: order.deliveredAt?.toISOString() ?? null,
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
