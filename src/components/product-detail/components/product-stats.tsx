"use client";

import { Package, Eye, TrendingUp } from "lucide-react";

interface ProductStatsProps {
  viewCount: number;
  soldCount: number;
}

export function ProductStats({ viewCount, soldCount }: ProductStatsProps) {
  return (
    <div className="grid gap-6 rounded-lg border border-gray-800 bg-gray-900/50 p-6 lg:grid-cols-3">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-blue-400" />
        <div>
          <h4 className="font-medium text-white">Embalagem Segura</h4>
          <p className="text-sm text-gray-400">Produto embalado com cuidado</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Eye className="h-6 w-6 text-green-400" />
        <div>
          <h4 className="font-medium text-white">Visualizações</h4>
          <p className="text-sm text-gray-400">
            {viewCount} pessoas viram este produto
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-yellow-400" />
        <div>
          <h4 className="font-medium text-white">Popularidade</h4>
          <p className="text-sm text-gray-400">{soldCount} unidades vendidas</p>
        </div>
      </div>
    </div>
  );
}
