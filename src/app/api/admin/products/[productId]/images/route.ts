import { NextRequest, NextResponse } from "next/server";

import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import { authorizeAdminApiRequest } from "@/lib/rbac";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestLogger = createRequestLogger({
    headers: request.headers,
    route: "/api/admin/products/[productId]/images",
  });
  const authorization = await authorizeAdminApiRequest({
    action: "update",
    logger: requestLogger,
    request,
    resource: "catalog",
  });

  if (!authorization.authorized) {
    return authorization.response;
  }

  const logger = authorization.logger;
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
    logger.error("admin.products.images.update_failed", {
      context: {
        productId,
      },
      error,
    });
    return NextResponse.json(
      { error: "Erro interno ao persistir imagens do produto" },
      { status: 500 },
    );
  }
}
