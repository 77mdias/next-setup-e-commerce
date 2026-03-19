import type { StockReservationStatus } from "@prisma/client";

const DEFAULT_RESERVATION_TTL_MINUTES = 30;
const MIN_RESERVATION_TTL_MINUTES = 5;
const MAX_RESERVATION_TTL_MINUTES = 24 * 60;
const RESERVATION_TTL_ENV_NAME = "STOCK_RESERVATION_TTL_MINUTES";

export function resolveReservationTtlMinutes(): number {
  const fromEnv = process.env[RESERVATION_TTL_ENV_NAME];

  if (!fromEnv) {
    return DEFAULT_RESERVATION_TTL_MINUTES;
  }

  const parsedValue = Number.parseInt(fromEnv, 10);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_RESERVATION_TTL_MINUTES;
  }

  if (parsedValue < MIN_RESERVATION_TTL_MINUTES) {
    return MIN_RESERVATION_TTL_MINUTES;
  }

  if (parsedValue > MAX_RESERVATION_TTL_MINUTES) {
    return MAX_RESERVATION_TTL_MINUTES;
  }

  return parsedValue;
}

export const RESERVATION_TTL_MINUTES = DEFAULT_RESERVATION_TTL_MINUTES;

export type { StockReservationStatus };

export type ReservationInput = {
  inventoryId: string;
  quantity: number;
  orderId?: number;
  orderItemId?: string;
  /** Override default TTL in minutes */
  ttlMinutes?: number;
};

export type ReservationRecord = {
  id: string;
  inventoryId: string;
  orderId: number | null;
  orderItemId: string | null;
  quantity: number;
  status: StockReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationResult =
  | { success: true; reservation: ReservationRecord }
  | { success: false; reason: string };

export type ExpiredReservationsResult = {
  expiredCount: number;
  reservationIds: string[];
};

export type ReservationCleanupResult = {
  referenceDate: Date;
  expiredCount: number;
  releasedCount: number;
  expiredReservationIds: string[];
  releasedReservationIds: string[];
};

export type ReservationCleanupSnapshot = {
  referenceDate: Date;
  expiredCount: number;
  abandonedOrFailedCount: number;
};
