import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { OrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { createRequestLogger } from "@/lib/logger";
import { runDemoOrderAutomationForUser } from "@/lib/order-demo-automation";
import { buildOrderStatusHistory } from "@/lib/order-status-history";

const validOrderStatuses = new Set<OrderStatus>(Object.values(OrderStatus));

export async function GET(request: NextRequest) {
  const logger = createRequestLogger({
    headers: request.headers,
    route: "/api/orders/user",
  });

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    try {
      await runDemoOrderAutomationForUser(session.user.id);
    } catch (automationError) {
      logger.warn("orders.user.demo_automation_failed", {
        context: {
          userId: session.user.id,
        },
        error: automationError,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("query")?.trim() || "";
    const pageValue = Number.parseInt(searchParams.get("page") || "1", 10);
    const limitValue = Number.parseInt(searchParams.get("limit") || "10", 10);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit =
      Number.isFinite(limitValue) && limitValue > 0
        ? Math.min(limitValue, 20)
        : 10;
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.OrderWhereInput = {
      userId: session.user.id,
    };

    if (
      status &&
      status !== "ALL" &&
      validOrderStatuses.has(status as OrderStatus)
    ) {
      where.status = status as OrderStatus;
    }

    if (query) {
      const numericOrderId = Number.parseInt(query.replace(/\D/g, ""), 10);

      where.id =
        Number.isFinite(numericOrderId) && numericOrderId > 0
          ? numericOrderId
          : -1;
    }

    // Buscar pedidos com paginação
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              productImage: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true,
              paidAt: true,
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
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const normalizedOrders = orders.map((order) => ({
      ...order,
      statusHistory: buildOrderStatusHistory({
        orderId: order.id,
        currentStatus: order.status,
        updatedAt: order.updatedAt,
        statusHistory: order.statusHistory,
        fallbackChangedBy: order.userId,
      }),
    }));

    return NextResponse.json({
      orders: normalizedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("orders.user.lookup_failed", { error });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
