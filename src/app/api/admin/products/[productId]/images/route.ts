import { NextRequest, NextResponse } from "next/server";

import {
  createCatalogValidationErrorResponse,
  normalizeAdminCatalogImagesInput,
} from "@/lib/admin/catalog";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/prisma";
import {
  authorizeAdminApiRequest,
  authorizeAdminStoreScopeAccess,
} from "@/lib/rbac";

type UpdateProductImagesPayload = {
  processedImages?: unknown;
  images?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
    return createCatalogValidationErrorResponse([
      {
        field: "payload",
        message: "Payload JSON inválido",
      },
    ]);
  }

  const { productId } = await params;

  if (!isNonEmptyString(productId)) {
    return createCatalogValidationErrorResponse([
      {
        field: "productId",
        message: "Identificador de produto inválido",
      },
    ]);
  }

  const rawImages = payload.processedImages ?? payload.images;

  if (!Array.isArray(rawImages)) {
    return createCatalogValidationErrorResponse([
      {
        field: "images",
        message: "Array de imagens processadas é obrigatório",
      },
    ]);
  }

  if (!rawImages.every((item) => typeof item === "string")) {
    return createCatalogValidationErrorResponse([
      {
        field: "images",
        message: "Todas as imagens enviadas precisam ser strings válidas",
      },
    ]);
  }

  const processedImages = normalizeAdminCatalogImagesInput(
    rawImages,
  );

  if (!processedImages.ok || processedImages.value.length === 0) {
    return createCatalogValidationErrorResponse(
      processedImages.ok
        ? [
            {
              field: "images",
              message: "Ao menos uma imagem válida é obrigatória",
            },
          ]
        : processedImages.issues,
    );
  }

  try {
    const product = await db.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        storeId: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    const storeScopeAccess = authorizeAdminStoreScopeAccess({
      authorization,
      resource: "catalog",
      resourceId: product.id,
      storeId: product.storeId,
    });

    if (!storeScopeAccess.authorized) {
      return storeScopeAccess.response;
    }

    const updatedProduct = await db.product.update({
      where: {
        id: productId,
      },
      data: {
        images: processedImages.value,
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
