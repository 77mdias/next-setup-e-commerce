import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("API: Listando produtos...");
    // Buscar todos os produtos ativos
    const products = await db.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        store: {
          select: {
            slug: true,
          },
        },
      },
      take: 10, // Limitar a 10 produtos para debug
    });

    console.log("API: Produtos encontrados:", products.length);
    console.log("API: Primeiros produtos:", products.slice(0, 3));

    return NextResponse.json({
      success: true,
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
