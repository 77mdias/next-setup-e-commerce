import type { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";

const HOUR_IN_MS = 60 * 60 * 1000;

export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * HOUR_IN_MS;
export const RESET_PASSWORD_TOKEN_TTL_MS = HOUR_IN_MS;

type ExpiredTokenCleanupScope = {
  email?: string;
  referenceDate?: Date;
  tokenHash?: string;
  userId?: string;
};

function buildScopeFilter(scope: ExpiredTokenCleanupScope): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (scope.userId) {
    where.id = scope.userId;
  }

  if (scope.email) {
    where.email = scope.email;
  }

  return where;
}

export function getEmailVerificationTokenExpiry(referenceDate = new Date()): Date {
  return new Date(referenceDate.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
}

export function getResetPasswordTokenExpiry(referenceDate = new Date()): Date {
  return new Date(referenceDate.getTime() + RESET_PASSWORD_TOKEN_TTL_MS);
}

export async function cleanupExpiredVerificationTokens(
  scope: ExpiredTokenCleanupScope = {},
): Promise<number> {
  const referenceDate = scope.referenceDate ?? new Date();
  const result = await db.user.updateMany({
    where: {
      ...buildScopeFilter(scope),
      emailVerificationExpires: {
        lte: referenceDate,
      },
      emailVerificationTokenHash: scope.tokenHash ?? {
        not: null,
      },
    },
    data: {
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    },
  });

  return result.count;
}

export async function cleanupExpiredResetPasswordTokens(
  scope: ExpiredTokenCleanupScope = {},
): Promise<number> {
  const referenceDate = scope.referenceDate ?? new Date();
  const result = await db.user.updateMany({
    where: {
      ...buildScopeFilter(scope),
      resetPasswordExpires: {
        lte: referenceDate,
      },
      resetPasswordTokenHash: scope.tokenHash ?? {
        not: null,
      },
    },
    data: {
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
    },
  });

  return result.count;
}

export type AuthTokenCleanupResult = {
  cleanedEmailVerificationTokens: number;
  cleanedResetPasswordTokens: number;
  referenceDate: Date;
};

export async function cleanupExpiredAuthTokens(
  referenceDate = new Date(),
): Promise<AuthTokenCleanupResult> {
  const [verificationCleanupResult, resetCleanupResult] = await db.$transaction([
    db.user.updateMany({
      where: {
        emailVerificationTokenHash: {
          not: null,
        },
        emailVerificationExpires: {
          lte: referenceDate,
        },
      },
      data: {
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
      },
    }),
    db.user.updateMany({
      where: {
        resetPasswordTokenHash: {
          not: null,
        },
        resetPasswordExpires: {
          lte: referenceDate,
        },
      },
      data: {
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      },
    }),
  ]);

  return {
    cleanedEmailVerificationTokens: verificationCleanupResult.count,
    cleanedResetPasswordTokens: resetCleanupResult.count,
    referenceDate,
  };
}
