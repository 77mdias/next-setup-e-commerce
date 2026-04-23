import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  consumeRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

const CART_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CART_RATE_LIMIT_MESSAGE =
  "Muitas operações no carrinho. Tente novamente em instantes.";

// GET - Buscar carrinho do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const cartItems = await db.cart.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            store: true,
            brand: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular totais
    const total = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
    const totalQuantity = cartItems.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    return NextResponse.json({
      cart: cartItems,
      total,
      totalQuantity,
    });
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST - Adicionar produto ao carrinho ou atualizar quantidade
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "api.cart",
      now: new Date(),
      ip: {
        limit: 30,
        windowMs: CART_RATE_LIMIT_WINDOW_MS,
      },
    });

    if (!rateLimitResult.allowed) {
      console.warn("cart.rate_limited", {
        bucketKey: rateLimitResult.bucketKey,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      });

      return createRateLimitResponse({
        message: CART_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { message: "ID do produto é obrigatório" },
        { status: 400 },
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { message: "Quantidade deve ser maior que zero" },
        { status: 400 },
      );
    }

    // Verificar se o produto existe
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se o produto já está no carrinho
    const existingCartItem = await db.cart.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    if (existingCartItem) {
      // Se já existe, atualiza a quantidade
      const updatedCartItem = await db.cart.update({
        where: {
          userId_productId: {
            userId: user.id,
            productId: productId,
          },
        },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json({
        message: "Quantidade atualizada no carrinho",
        action: "updated",
        cartItem: updatedCartItem,
      });
    } else {
      // Se não existe, cria novo item
      const newCartItem = await db.cart.create({
        data: {
          userId: user.id,
          productId: productId,
          quantity: quantity,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json({
        message: "Produto adicionado ao carrinho",
        action: "added",
        cartItem: newCartItem,
      });
    }
  } catch (error) {
    console.error("Erro ao adicionar produto ao carrinho:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// PUT - Atualizar quantidade específica de um produto
export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "api.cart",
      now: new Date(),
      ip: {
        limit: 30,
        windowMs: CART_RATE_LIMIT_WINDOW_MS,
      },
    });

    if (!rateLimitResult.allowed) {
      console.warn("cart.rate_limited", {
        bucketKey: rateLimitResult.bucketKey,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      });

      return createRateLimitResponse({
        message: CART_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { message: "ID do produto e quantidade são obrigatórios" },
        { status: 400 },
      );
    }

    if (quantity <= 0) {
      // Se quantidade é 0 ou negativa, remove o item
      await db.cart.delete({
        where: {
          userId_productId: {
            userId: user.id,
            productId: productId,
          },
        },
      });

      return NextResponse.json({
        message: "Produto removido do carrinho",
        action: "removed",
      });
    }

    // Atualizar quantidade
    const updatedCartItem = await db.cart.update({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
      data: {
        quantity: quantity,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({
      message: "Quantidade atualizada",
      action: "updated",
      cartItem: updatedCartItem,
    });
  } catch (error) {
    console.error("Erro ao atualizar carrinho:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// DELETE - Remover produto específico do carrinho
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResult = consumeRequestRateLimit({
      headers: request.headers,
      scope: "api.cart",
      now: new Date(),
      ip: {
        limit: 30,
        windowMs: CART_RATE_LIMIT_WINDOW_MS,
      },
    });

    if (!rateLimitResult.allowed) {
      console.warn("cart.rate_limited", {
        bucketKey: rateLimitResult.bucketKey,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
      });

      return createRateLimitResponse({
        message: CART_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (productId) {
      // Remover produto específico
      await db.cart.delete({
        where: {
          userId_productId: {
            userId: user.id,
            productId: productId,
          },
        },
      });

      return NextResponse.json({
        message: "Produto removido do carrinho",
        action: "removed",
      });
    } else {
      // Limpar carrinho inteiro
      await db.cart.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        message: "Carrinho limpo com sucesso",
        action: "cleared",
      });
    }
  } catch (error) {
    console.error("Erro ao remover do carrinho:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
