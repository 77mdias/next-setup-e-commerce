import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    console.log("API: Listando produtos para store:", storeSlug);

    // Buscar produtos da loja específica
    const products = await db.product.findMany({
      where: {
        isActive: true,
        store: {
          slug: storeSlug || "",
          isActive: true,
        },
      },
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("API: Produtos encontrados:", products.length);

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
