import { NextRequest, NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth";
import type { StructuredLogger } from "@/lib/logger";
import {
  consumeRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

const REMOVE_BG_RATE_LIMIT_SCOPE = "remove_bg.process";
const REMOVE_BG_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const REMOVE_BG_RATE_LIMIT_MESSAGE =
  "Muitas tentativas de processamento de imagem. Tente novamente em instantes.";

type RemoveBgAuthorizationResult =
  | {
      authorized: true;
      logger: StructuredLogger;
      userId: string;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

export function extractRemoveBgHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }

  const status = (error as { response?: { status?: unknown } }).response
    ?.status;
  return typeof status === "number" ? status : null;
}

export async function authorizeRemoveBgRequest(params: {
  request: NextRequest;
  logger: StructuredLogger;
  logPrefix: string;
}): Promise<RemoveBgAuthorizationResult> {
  // AIDEV-CRITICAL: legacy e admin compartilham o mesmo escopo para evitar
  // bypass do rate limit alternando entre rotas que consomem o mesmo provedor.
  const access = await requireAdminAccess();

  if (!access.authorized) {
    params.logger.warn(`${params.logPrefix}.access_denied`, {
      data: {
        status: access.status,
      },
    });

    if (access.status === 401) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Usuário não autenticado" },
          { status: 401 },
        ),
      };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Acesso administrativo obrigatório" },
        { status: 403 },
      ),
    };
  }

  const authorizedLogger = params.logger.child({
    userId: access.user.id,
  });

  const rateLimitResult = consumeRequestRateLimit({
    headers: params.request.headers,
    scope: REMOVE_BG_RATE_LIMIT_SCOPE,
    now: new Date(),
    ip: {
      limit: 10,
      windowMs: REMOVE_BG_RATE_LIMIT_WINDOW_MS,
    },
    identities: [
      {
        key: "userId",
        value: access.user.id,
        limit: 6,
        windowMs: REMOVE_BG_RATE_LIMIT_WINDOW_MS,
      },
    ],
  });

  if (!rateLimitResult.allowed) {
    authorizedLogger.warn(`${params.logPrefix}.rate_limited`, {
      data: {
        bucketKey: rateLimitResult.bucketKey,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
        windowMs: rateLimitResult.windowMs,
      },
    });

    return {
      authorized: false,
      response: createRateLimitResponse({
        message: REMOVE_BG_RATE_LIMIT_MESSAGE,
        retryAfter: rateLimitResult.retryAfter,
      }),
    };
  }

  return {
    authorized: true,
    logger: authorizedLogger,
    userId: access.user.id,
  };
}

export function logRemoveBgFailure(params: {
  logger: StructuredLogger;
  event: string;
  error: unknown;
  data?: Record<string, unknown>;
}): void {
  const upstreamStatus = extractRemoveBgHttpStatus(params.error);

  if (upstreamStatus !== null) {
    params.logger.error(params.event, {
      data: {
        ...(params.data ?? {}),
        upstreamStatus,
      },
    });
    return;
  }

  params.logger.error(params.event, {
    data: params.data,
    error: params.error,
  });
}
