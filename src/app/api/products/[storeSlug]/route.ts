import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> },
) {
  try {
    const { storeSlug } = await params;

    // Buscar a loja pelo slug
    const store = await prisma.store.findUnique({
      where: {
        slug: storeSlug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    // Buscar produtos da loja
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        sku: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      store,
      products,
      total: products.length,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// Atualizar imagens de um produto específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> },
) {
  try {
    const { storeSlug } = await params;
    const { productId, processedImages } = await request.json();

    if (!productId || !processedImages || !Array.isArray(processedImages)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: {
        slug: storeSlug,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    // Verificar se o produto pertence à loja
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
      },
      select: {
        id: true,
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    // Atualizar as imagens do produto
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        images: processedImages,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        images: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: "Imagens atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar imagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
