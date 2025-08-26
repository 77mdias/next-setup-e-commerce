import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug da loja é obrigatório" },
        { status: 400 },
      );
    }

    const store = await db.store.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        email: true,
        shippingFee: true,
        freeShipping: true,
        processingTime: true,
        isActive: true,
        rating: true,
        totalSales: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 },
      );
    }

    if (!store.isActive) {
      return NextResponse.json({ error: "Loja inativa" }, { status: 403 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("❌ Erro ao buscar loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
