import { NextRequest, NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import { db } from "@/lib/prisma";

type UpdateProductImagesPayload = {
  processedImages?: unknown;
  images?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeProcessedImages(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalized = value
    .filter((item): item is string => isNonEmptyString(item))
    .map((item) => item.trim());

  if (normalized.length !== value.length) {
    return null;
  }

  return normalized;
}

async function assertAdminAuthorization(): Promise<NextResponse | null> {
  const access = await requireAdminAccess();

  if (access.authorized) {
    return null;
  }

  if (access.status === 401) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { error: "Acesso administrativo obrigatório" },
    { status: 403 },
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const unauthorizedResponse = await assertAdminAuthorization();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  let payload: UpdateProductImagesPayload;

  try {
    payload = (await request.json()) as UpdateProductImagesPayload;
  } catch {
    return NextResponse.json(
      { error: "Payload JSON inválido" },
      { status: 400 },
    );
  }

  const { productId } = await params;

  if (!isNonEmptyString(productId)) {
    return NextResponse.json(
      { error: "Identificador de produto inválido" },
      { status: 400 },
    );
  }

  const processedImages = normalizeProcessedImages(
    payload.processedImages ?? payload.images,
  );

  if (!processedImages) {
    return NextResponse.json(
      { error: "Array de imagens processadas é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const updatedProduct = await db.product.update({
      where: {
        id: productId,
      },
      data: {
        images: processedImages,
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
    });
  } catch (error) {
    console.error(
      "[api/admin/products/[productId]/images][PUT] falha ao persistir imagens",
      error,
    );
    return NextResponse.json(
      { error: "Erro interno ao persistir imagens do produto" },
      { status: 500 },
    );
  }
}
