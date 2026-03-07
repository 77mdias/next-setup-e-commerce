import axios from "axios";
import FormData from "form-data";
import { NextRequest, NextResponse } from "next/server";

import {
  getServerRemoveBgApiKey,
  validateRemoveBgImageUrl,
} from "@/lib/remove-bg-security";

const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";
const BATCH_REQUEST_DELAY_MS = 1000;

type RemoveBgErrorResponse = {
  status: number;
  error: string;
};

type RemoveBgBatchItemError = {
  index: number;
  originalUrl: string;
  error: string;
  success: false;
};

function extractHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }

  const status = (error as { response?: { status?: unknown } }).response?.status;
  return typeof status === "number" ? status : null;
}

function mapRemoveBgError(error: unknown): RemoveBgErrorResponse {
  const status = extractHttpStatus(error);

  if (status === 400 || status === 422) {
    return {
      status: 422,
      error: "Não foi possível processar a imagem enviada",
    };
  }

  if (status === 402) {
    return {
      status: 402,
      error: "Créditos insuficientes na API do Remove.bg",
    };
  }

  if (status === 403) {
    return {
      status: 403,
      error: "Falha na autenticação com o provedor de remoção de fundo",
    };
  }

  if (status === 429) {
    return {
      status: 429,
      error: "Limite de processamento atingido. Tente novamente em instantes",
    };
  }

  return {
    status: 502,
    error: "Falha ao processar imagem no provedor externo",
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeImageUrls(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalized = value
    .filter((item): item is string => isNonEmptyString(item))
    .map((url) => url.trim());

  if (normalized.length !== value.length) {
    return null;
  }

  return normalized;
}

async function processImageWithRemoveBg(imageUrl: string, apiKey: string, filename: string) {
  const imageResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  const originalImageBuffer = Buffer.from(imageResponse.data);
  const formData = new FormData();
  formData.append("image_file", originalImageBuffer, {
    filename,
    contentType: "image/jpeg",
  });
  formData.append("size", "auto");

  const removeBgResponse = await axios.post(REMOVE_BG_API_URL, formData, {
    headers: {
      "X-Api-Key": apiKey,
      ...formData.getHeaders(),
    },
    responseType: "arraybuffer",
  });

  const processedImageBuffer = Buffer.from(removeBgResponse.data);

  return {
    originalSize: originalImageBuffer.length,
    processedSize: processedImageBuffer.length,
    processedImage: `data:image/png;base64,${processedImageBuffer.toString("base64")}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      imageUrl?: unknown;
    };

    if (!isNonEmptyString(payload.imageUrl)) {
      return NextResponse.json(
        { error: "URL da imagem é obrigatória" },
        { status: 400 },
      );
    }

    const apiKey = getServerRemoveBgApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "REMOVE_BG_API_KEY não configurada no servidor" },
        { status: 500 },
      );
    }

    const imageUrlValidation = validateRemoveBgImageUrl(payload.imageUrl);
    if (!imageUrlValidation.valid) {
      return NextResponse.json(
        { error: imageUrlValidation.error },
        { status: 400 },
      );
    }

    const result = await processImageWithRemoveBg(
      imageUrlValidation.normalizedUrl,
      apiKey,
      "image.jpg",
    );

    return NextResponse.json({
      success: true,
      processedImage: result.processedImage,
      originalSize: result.originalSize,
      processedSize: result.processedSize,
    });
  } catch (error: unknown) {
    const mappedError = mapRemoveBgError(error);
    console.error("[api/remove-bg][POST] processamento falhou", {
      status: mappedError.status,
    });

    return NextResponse.json({ error: mappedError.error }, { status: mappedError.status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      imageUrls?: unknown;
    };

    const imageUrls = normalizeImageUrls(payload.imageUrls);

    if (!imageUrls) {
      return NextResponse.json(
        { error: "Array de URLs das imagens é obrigatório" },
        { status: 400 },
      );
    }

    const apiKey = getServerRemoveBgApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "REMOVE_BG_API_KEY não configurada no servidor" },
        { status: 500 },
      );
    }

    const validatedImageUrls: string[] = [];
    for (let index = 0; index < imageUrls.length; index += 1) {
      const validation = validateRemoveBgImageUrl(imageUrls[index]);

      if (!validation.valid) {
        return NextResponse.json(
          { error: `Imagem ${index + 1}: ${validation.error}` },
          { status: 400 },
        );
      }

      validatedImageUrls.push(validation.normalizedUrl);
    }

    const processedImages: Array<{
      index: number;
      originalUrl: string;
      processedImage: string;
      success: true;
    }> = [];
    const errors: RemoveBgBatchItemError[] = [];

    for (let index = 0; index < validatedImageUrls.length; index += 1) {
      const imageUrl = validatedImageUrls[index];

      try {
        const result = await processImageWithRemoveBg(
          imageUrl,
          apiKey,
          `image_${index}.jpg`,
        );

        processedImages.push({
          index,
          originalUrl: imageUrl,
          processedImage: result.processedImage,
          success: true,
        });

        if (index < validatedImageUrls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_REQUEST_DELAY_MS));
        }
      } catch (error: unknown) {
        const mappedError = mapRemoveBgError(error);
        errors.push({
          index,
          originalUrl: imageUrl,
          error: mappedError.error,
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedImages,
      errors,
      totalProcessed: processedImages.length,
      totalErrors: errors.length,
    });
  } catch (error: unknown) {
    console.error("[api/remove-bg][PUT] processamento em lote falhou", error);

    return NextResponse.json(
      { error: "Erro interno do servidor ao processar imagens" },
      { status: 500 },
    );
  }
}
