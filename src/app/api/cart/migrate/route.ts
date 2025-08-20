import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST - Migrar carrinho do localStorage para o banco de dados
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { cartItems } = await request.json();

    if (!Array.isArray(cartItems)) {
      return NextResponse.json(
        { message: "Dados do carrinho inválidos" },
        { status: 400 },
      );
    }

    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Processar cada item do localStorage
    for (const item of cartItems) {
      try {
        const { id: productId, quantity } = item;

        if (!productId || !quantity || quantity <= 0) {
          errorCount++;
          continue;
        }

        // Verificar se o produto existe
        const product = await db.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          errorCount++;
          continue;
        }

        // Verificar se já existe no carrinho do banco
        const existingCartItem = await db.cart.findUnique({
          where: {
            userId_productId: {
              userId: user.id,
              productId: productId,
            },
          },
        });

        if (existingCartItem) {
          // Se já existe, soma as quantidades
          await db.cart.update({
            where: {
              userId_productId: {
                userId: user.id,
                productId: productId,
              },
            },
            data: {
              quantity: existingCartItem.quantity + quantity,
            },
          });
          updatedCount++;
        } else {
          // Se não existe, cria novo item
          await db.cart.create({
            data: {
              userId: user.id,
              productId: productId,
              quantity: quantity,
            },
          });
          migratedCount++;
        }
      } catch (itemError) {
        console.error(`Erro ao migrar item ${item.id}:`, itemError);
        errorCount++;
      }
    }

    // Buscar carrinho atualizado
    const updatedCart = await db.cart.findMany({
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
    const total = updatedCart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
    const totalQuantity = updatedCart.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    return NextResponse.json({
      message: "Migração do carrinho concluída",
      migration: {
        migratedItems: migratedCount,
        updatedItems: updatedCount,
        errorItems: errorCount,
        totalProcessed: cartItems.length,
      },
      cart: updatedCart,
      total,
      totalQuantity,
    });
  } catch (error) {
    console.error("Erro na migração do carrinho:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor na migração" },
      { status: 500 },
    );
  }
}
