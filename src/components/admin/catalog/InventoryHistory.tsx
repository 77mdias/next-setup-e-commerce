"use client";

import { History } from "lucide-react";

import { formatDateTime } from "./utils";

interface InventoryMovement {
  id: string;
  reason: string;
  quantity: number;
  userLabel: string;
  createdAt: string;
  reference: string | null;
}

interface InventoryHistoryProps {
  movements: InventoryMovement[];
}

export function InventoryHistory({ movements }: InventoryHistoryProps) {
  return (
    <div className="space-y-3">
      {movements.length ? (
        movements.map((movement) => (
          <div
            key={movement.id}
            className="rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="[font-family:var(--font-arimo)] font-medium text-[#f2eee8]">
                  {movement.reason}
                </p>
                <p className="[font-family:var(--font-arimo)] text-xs text-[#9f9383]">
                  {movement.userLabel} · {formatDateTime(movement.createdAt)}
                </p>
              </div>
              <span className="rounded-full border border-white/6 bg-[#1b1712] px-2 py-1 [font-family:var(--font-arimo)] text-xs text-[#f2eee8]">
                {movement.quantity > 0 ? "+" : ""}
                {movement.quantity}
              </span>
            </div>
            {movement.reference ? (
              <p className="mt-2 [font-family:var(--font-arimo)] text-xs text-[#9f9383]">
                Referência: {movement.reference}
              </p>
            ) : null}
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-white/12 bg-[#17140f] px-4 py-8 text-center [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
          Nenhum ajuste registrado para este produto ainda.
        </div>
      )}
    </div>
  );
}
