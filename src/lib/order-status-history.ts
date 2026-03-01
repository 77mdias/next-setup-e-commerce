import type { OrderStatus } from "@prisma/client";

export type OrderStatusHistoryRecord = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  changedBy: string | null;
  createdAt: Date;
};

type BuildOrderStatusHistoryParams = {
  orderId: number;
  currentStatus: OrderStatus;
  updatedAt: Date;
  statusHistory: readonly OrderStatusHistoryRecord[];
  fallbackChangedBy?: string | null;
};

export type ApiOrderStatusHistoryEntry = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  changedBy: string | null;
  createdAt: string;
  isFallback: boolean;
};

type InternalOrderStatusHistoryEntry = Omit<
  ApiOrderStatusHistoryEntry,
  "createdAt"
> & {
  createdAt: Date;
};

const FALLBACK_NOTES_SOURCE = "source:api_fallback";

function compareHistoryByCreatedAt(
  left: OrderStatusHistoryRecord,
  right: OrderStatusHistoryRecord,
) {
  const createdAtDiff = left.createdAt.getTime() - right.createdAt.getTime();

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return left.id.localeCompare(right.id);
}

function buildFallbackNotes({
  currentStatus,
  reason,
  historyLastStatus,
}: {
  currentStatus: OrderStatus;
  reason: "legacy_missing_history" | "state_snapshot_mismatch";
  historyLastStatus?: OrderStatus;
}) {
  const notesParts = [
    FALLBACK_NOTES_SOURCE,
    `reason:${reason}`,
    `orderStatus:${currentStatus}`,
  ];

  if (historyLastStatus) {
    notesParts.push(`historyLastStatus:${historyLastStatus}`);
  }

  return notesParts.join("; ");
}

function buildFallbackEntry({
  orderId,
  currentStatus,
  createdAt,
  changedBy,
  reason,
  historyLastStatus,
}: {
  orderId: number;
  currentStatus: OrderStatus;
  createdAt: Date;
  changedBy: string | null;
  reason: "legacy_missing_history" | "state_snapshot_mismatch";
  historyLastStatus?: OrderStatus;
}): InternalOrderStatusHistoryEntry {
  return {
    id: `fallback-${orderId}-${createdAt.getTime()}-${currentStatus.toLowerCase()}`,
    status: currentStatus,
    notes: buildFallbackNotes({
      currentStatus,
      reason,
      historyLastStatus,
    }),
    changedBy,
    createdAt,
    isFallback: true,
  };
}

export function buildOrderStatusHistory({
  orderId,
  currentStatus,
  updatedAt,
  statusHistory,
  fallbackChangedBy = null,
}: BuildOrderStatusHistoryParams): ApiOrderStatusHistoryEntry[] {
  const normalizedHistory: InternalOrderStatusHistoryEntry[] = [...statusHistory]
    .sort(compareHistoryByCreatedAt)
    .map((historyEntry) => ({
      id: historyEntry.id,
      status: historyEntry.status,
      notes: historyEntry.notes,
      changedBy: historyEntry.changedBy,
      createdAt: historyEntry.createdAt,
      isFallback: false,
    }));

  const latestHistoryEntry = normalizedHistory.at(-1);

  if (!latestHistoryEntry) {
    normalizedHistory.push(
      buildFallbackEntry({
        orderId,
        currentStatus,
        createdAt: updatedAt,
        changedBy: fallbackChangedBy,
        reason: "legacy_missing_history",
      }),
    );
  } else if (latestHistoryEntry.status !== currentStatus) {
    const fallbackCreatedAt = new Date(
      Math.max(updatedAt.getTime(), latestHistoryEntry.createdAt.getTime() + 1),
    );

    normalizedHistory.push(
      buildFallbackEntry({
        orderId,
        currentStatus,
        createdAt: fallbackCreatedAt,
        changedBy: fallbackChangedBy,
        reason: "state_snapshot_mismatch",
        historyLastStatus: latestHistoryEntry.status,
      }),
    );
  }

  return normalizedHistory.map((historyEntry) => ({
    ...historyEntry,
    createdAt: historyEntry.createdAt.toISOString(),
  }));
}
