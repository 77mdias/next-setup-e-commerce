import { AdminAuditAction, AdminAuditResource, Prisma } from "@prisma/client";

import type { AdminAuditLogEntry } from "@/lib/admin/audit-contract";
import { db } from "@/lib/prisma";

type AuditLogClient =
  | Pick<Prisma.TransactionClient, "adminAuditLog">
  | typeof db;

type AuditLogActor = {
  email?: string | null;
  id?: string | null;
  name?: string | null;
  role?: string | null;
};

type WriteAdminAuditLogParams = {
  action: AdminAuditAction;
  actor: AuditLogActor;
  after?: unknown;
  before?: unknown;
  client?: AuditLogClient;
  metadata?: unknown;
  resource: AdminAuditResource;
  storeId?: string | null;
  summary: string;
  targetId: number | string;
  targetLabel?: string | null;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeAuditValue(value: unknown): unknown {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAuditValue(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([entryKey, entryValue]) => [
          entryKey,
          normalizeAuditValue(entryValue),
        ]),
    );
  }

  return String(value);
}

function normalizeAuditRecord(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) {
    return Prisma.JsonNull;
  }

  return normalizeAuditValue(value) as Prisma.InputJsonValue;
}

function normalizeStoredJson(
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null {
  if (!isPlainObject(value)) {
    return null;
  }

  return value;
}

function resolveActorLabel(actor: AuditLogActor): string {
  return (
    normalizeString(actor.name) ??
    normalizeString(actor.email) ??
    "Operador admin"
  );
}

export async function writeAdminAuditLog(
  params: WriteAdminAuditLogParams,
): Promise<void> {
  const client = params.client ?? db;

  await client.adminAuditLog.create({
    data: {
      action: params.action,
      actorLabel: resolveActorLabel(params.actor),
      actorRole: normalizeString(params.actor.role) ?? "UNKNOWN",
      actorUserId: normalizeString(params.actor.id),
      after: normalizeAuditRecord(params.after),
      before: normalizeAuditRecord(params.before),
      metadata: normalizeAuditRecord(params.metadata),
      resource: params.resource,
      storeId: normalizeString(params.storeId),
      summary: params.summary.trim(),
      targetId: String(params.targetId),
      targetLabel: normalizeString(params.targetLabel),
    },
  });
}

export function serializeAdminAuditLogEntry(
  entry: Prisma.AdminAuditLogGetPayload<{
    select: {
      action: true;
      actorLabel: true;
      actorRole: true;
      actorUserId: true;
      after: true;
      before: true;
      createdAt: true;
      id: true;
      metadata: true;
      resource: true;
      storeId: true;
      summary: true;
      targetId: true;
      targetLabel: true;
    };
  }>,
): AdminAuditLogEntry {
  return {
    action: entry.action,
    actor: {
      id: entry.actorUserId,
      label: entry.actorLabel,
      role: entry.actorRole,
    },
    after: normalizeStoredJson(entry.after),
    before: normalizeStoredJson(entry.before),
    createdAt: entry.createdAt.toISOString(),
    id: entry.id,
    metadata: normalizeStoredJson(entry.metadata),
    resource: entry.resource,
    storeId: entry.storeId,
    summary: entry.summary,
    target: {
      id: entry.targetId,
      label: entry.targetLabel,
    },
  };
}
