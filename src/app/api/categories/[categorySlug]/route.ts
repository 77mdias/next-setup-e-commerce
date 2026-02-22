import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { resolveStoreBySlugOrActive } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categorySlug: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("storeSlug");
    const { categorySlug } = await params;

    if (!categorySlug) {
      return NextResponse.json(
        { error: "Category slug é obrigatório" },
        { status: 400 },
      );
    }

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

    // Buscar a categoria específica com suas subcategorias e produtos
    const category = await db.category.findFirst({
      where: {
        slug: categorySlug,
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
          include: {
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
        },
        products: {
          where: {
            storeId: store.id,
            isActive: true,
          },
          include: {
            brand: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
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
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
