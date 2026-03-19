import type { StockReservationStatus } from "@prisma/client";

export const RESERVATION_TTL_MINUTES = 30;

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
