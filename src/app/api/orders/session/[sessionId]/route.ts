import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildOrderSessionLookupWhere,
  normalizeOrderSessionId,
} from "@/lib/order-session";

function logOrderSessionLookupFailure(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    console.error("Erro ao buscar pedido por sessão");
    return;
  }

  if (error instanceof Error) {
    console.error("Erro ao buscar pedido por sessão:", {
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error("Erro ao buscar pedido por sessão:", error);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = await params;
    const normalizedSessionId = normalizeOrderSessionId(sessionId);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!normalizedSessionId) {
      return NextResponse.json(
        { error: "ID da sessão é obrigatório" },
        { status: 400 },
      );
    }

    const order = await db.order.findFirst({
      where: buildOrderSessionLookupWhere({
        userId: session.user.id,
        sessionId: normalizedSessionId,
      }),
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
          select: {
            id: true,
            status: true,
            amount: true,
            paidAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    logOrderSessionLookupFailure(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
