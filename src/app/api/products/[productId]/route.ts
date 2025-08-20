import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    console.log("API: Buscando produto com ID:", productId);

    // Buscar o produto pelo ID (versão simplificada)
    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        brand: true,
        category: true,
        store: true,
      },
    });

    console.log(
      "API: Resultado da query:",
      product ? "Produto encontrado" : "Produto não encontrado",
    );

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
