import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { message: "ID do produto é obrigatório" },
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

    // Verificar se já existe na wishlist
    const existingWishlistItem = await db.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId,
        },
      },
    });

    if (existingWishlistItem) {
      // Se já existe, remove (toggle)
      await db.wishlist.delete({
        where: {
          userId_productId: {
            userId: user.id,
            productId: productId,
          },
        },
      });

      return NextResponse.json({
        message: "Produto removido dos favoritos",
        action: "removed",
      });
    } else {
      // Se não existe, adiciona
      await db.wishlist.create({
        data: {
          userId: user.id,
          productId: productId,
        },
      });

      return NextResponse.json({
        message: "Produto adicionado aos favoritos",
        action: "added",
      });
    }
  } catch (error) {
    console.error("Erro na API de wishlist:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    const wishlist = await db.wishlist.findMany({
      where: { userId: user.id },
      select: {
        productId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error("Erro ao buscar wishlist:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
