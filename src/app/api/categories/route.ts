import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { resolveStoreBySlugOrActive } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");

    const store = await resolveStoreBySlugOrActive(storeSlug);

    if (!store) {
      return NextResponse.json(
        {
          error: storeSlug
            ? "Loja não encontrada"
            : "Nenhuma loja ativa encontrada",
        },
        { status: 404 },
      );
    }

    // Buscar categorias principais (sem parentId) com suas subcategorias
    const categories = await db.category.findMany({
      where: {
        parentId: null, // Apenas categorias principais
        isActive: true,
      },
      include: {
        children: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        _count: {
          select: {
            products: {
              where: {
                storeId: store.id,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
