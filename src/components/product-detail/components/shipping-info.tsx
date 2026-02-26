"use client";

import { Truck, Shield, RotateCcw } from "lucide-react";

export function ShippingInfo() {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-green-400" />
          <span className="text-sm text-gray-300">
            Entrega grátis em pedidos acima de R$ 99
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-blue-400" />
          <span className="text-sm text-gray-300">Garantia de 30 dias</span>
        </div>
        <div className="flex items-center gap-3">
          <RotateCcw className="h-5 w-5 text-purple-400" />
          <span className="text-sm text-gray-300">Devolução gratuita</span>
        </div>
      </div>
    </div>
  );
}
