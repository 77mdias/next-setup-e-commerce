"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  MessageSquareQuote,
  Sparkles,
  Star,
} from "lucide-react";

interface ProductTabsProps {
  description?: string | null;
}

type ProductTab = "description" | "specifications" | "reviews";

const TAB_LABELS: Record<ProductTab, string> = {
  description: "Descrição",
  specifications: "Especificações",
  reviews: "Reviews",
};

const MOCKED_DESCRIPTION =
  "Descrição mockada: este conteúdo foi incluído apenas para visualização do layout da página de produto. A descrição oficial será integrada quando o cadastro completo estiver finalizado.";

const SPECIFICATION_PREVIEW_ITEMS = [
  "Conectividade e compatibilidade",
  "Dimensões e peso",
  "Sensor, switches e latência",
  "Conteúdo da caixa",
];

const REVIEW_SETUP_STEPS = [
  {
    title: "Coleta",
    detail: "Recebimento de avaliações após compra confirmada.",
  },
  {
    title: "Moderação",
    detail: "Filtro automático e validação de conteúdo.",
  },
  {
    title: "Publicação",
    detail: "Exibição de notas, comentários e métricas.",
  },
];

export function ProductTabs({ description }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<ProductTab>("description");

  const descriptionText = useMemo(() => {
    const trimmed = description?.trim();
    if (!trimmed || trimmed.length === 0) {
      return MOCKED_DESCRIPTION;
    }

    return `Descrição mockada com base no cadastro atual: ${trimmed}`;
  }, [description]);

  return (
    <section className="space-y-8">
      <div className="border-b border-[#dbe4ff] dark:border-white/10">
        <div className="flex flex-wrap gap-8">
          {(Object.keys(TAB_LABELS) as ProductTab[]).map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tabId
                  ? "border-[#ff2e63] text-[#0f172a] dark:text-white"
                  : "border-transparent text-[#64748b] hover:text-[#0f172a] dark:text-[#99a1af] dark:hover:text-white"
              }`}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "description" && (
        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-[#ff2e63]/35 bg-[#ff2e63]/10 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-[#ff8eab] uppercase">
            Conteúdo mockado
          </p>
          <p className="leading-relaxed text-[#334155] dark:text-[#c7ced9]">
            {descriptionText}
          </p>
          <p className="leading-relaxed text-[#64748b] dark:text-[#99a1af]">
            Este bloco está marcado como mock enquanto a integração com os dados
            finais de descrição ainda está em andamento.
          </p>
        </div>
      )}

      {activeTab === "specifications" && (
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 md:p-7 dark:bg-[#12151a]">
          <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#5c7cfa]/10 blur-3xl dark:bg-[#5c7cfa]/20" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4a6ff0] dark:bg-white/5 dark:text-[#8fa3ff]">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="inline-flex rounded-full border border-[#ff2e63]/35 bg-[#ff2e63]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-[#ff5c88] uppercase">
                    Em configuração
                  </p>
                  <h3 className="[font-family:var(--font-space-grotesk)] text-xl font-bold text-[#0f172a] dark:text-white">
                    Especificações técnicas em breve
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#99a1af]">
                Estamos preparando a ficha técnica completa deste produto para
                exibir os dados oficiais com consistência entre catálogo e
                checkout.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {SPECIFICATION_PREVIEW_ITEMS.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[#dbe4ff] bg-[#f8fbff] px-4 py-3 text-sm text-[#334155] dark:border-white/10 dark:bg-[#0f1319] dark:text-[#c7ced9]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#dbe4ff] bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0f1319]">
              <p className="text-xs font-semibold tracking-[0.05em] text-[#64748b] uppercase dark:text-[#99a1af]">
                Preview do layout
              </p>
              <div className="mt-4 space-y-3">
                {[52, 68, 40, 74].map((width, index) => (
                  <div
                    key={`${width}-${index}`}
                    className="h-8 rounded-lg bg-[#e8efff] dark:bg-white/5"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 md:p-7 dark:bg-[#12151a]">
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#ff2e63]/10 blur-3xl dark:bg-[#ff2e63]/20" />
          <div className="relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-xl border border-[#dbe4ff] bg-[#f8fbff] p-5 dark:border-white/10 dark:bg-[#0f1319]">
              <p className="text-xs font-semibold tracking-[0.05em] text-[#64748b] uppercase dark:text-[#99a1af]">
                Rating
              </p>
              <p className="mt-2 [font-family:var(--font-space-grotesk)] text-4xl font-bold text-[#0f172a] dark:text-white">
                --
              </p>
              <div className="mt-3 flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="h-4 w-4 text-[#c4cfef] dark:text-[#3b4252]"
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-[#64748b] dark:text-[#99a1af]">
                Aguardando as primeiras avaliações verificadas.
              </p>
            </div>

            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4a6ff0] dark:bg-white/5 dark:text-[#8fa3ff]">
                  <MessageSquareQuote className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-[#5c7cfa]/30 bg-[#5c7cfa]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-[#4a6ff0] uppercase dark:text-[#8fa3ff]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Em breve
                  </p>
                  <h3 className="[font-family:var(--font-space-grotesk)] text-xl font-bold text-[#0f172a] dark:text-white">
                    Reviews em preparação
                  </h3>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[#64748b] dark:text-[#99a1af]">
                Esta seção será habilitada após a conclusão da etapa de coleta e
                moderação, com notas, comentários e histórico por produto.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {REVIEW_SETUP_STEPS.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-xl border border-[#dbe4ff] bg-[#f8fbff] p-4 dark:border-white/10 dark:bg-[#0f1319]"
                  >
                    <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#64748b] dark:text-[#99a1af]">
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
