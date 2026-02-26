"use client";

import { useState } from "react";

interface ProductTabsProps {
  description?: string;
  specifications?: any;
  sku: string;
  weight?: number | null;
  warranty?: string | null;
  dimensions?: any;
}

export function ProductTabs({
  description,
  specifications,
  sku,
  weight,
  warranty,
  dimensions,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { id: "description", label: "Descrição" },
    { id: "specifications", label: "Especificações" },
    { id: "reviews", label: "Avaliações" },
  ];

  return (
    <div className="space-y-8">
      {/* Abas */}
      <div className="border-b border-gray-800">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--button-primary)] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="grid gap-8 lg:grid-cols-2">
        {activeTab === "description" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">
              Descrição do Produto
            </h3>
            <div className="prose prose-invert max-w-none">
              <p className="leading-relaxed text-gray-300">
                {description ||
                  "Descrição detalhada do produto será exibida aqui."}
              </p>
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">
              Especificações Técnicas
            </h3>
            <div className="space-y-4">
              {specifications && typeof specifications === "object" ? (
                Object.entries(specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b border-gray-800 pb-2"
                  >
                    <span className="text-gray-400 capitalize">{key}:</span>
                    <span className="text-white">{String(value)}</span>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-800 pb-2">
                    <span className="text-gray-400">SKU:</span>
                    <span className="text-white">{sku}</span>
                  </div>
                  {weight && (
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400">Peso:</span>
                      <span className="text-white">{weight}g</span>
                    </div>
                  )}
                  {warranty && (
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400">Garantia:</span>
                      <span className="text-white">{warranty}</span>
                    </div>
                  )}
                  {dimensions && (
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-gray-400">Dimensões:</span>
                      <span className="text-white">
                        {typeof dimensions === "object" && dimensions !== null
                          ? `${(dimensions as any).length || 0} x ${(dimensions as any).width || 0} x ${(dimensions as any).height || 0} cm`
                          : String(dimensions)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Avaliações</h3>
            <div className="py-8 text-center">
              <p className="text-gray-400">
                Sistema de avaliações em desenvolvimento...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
