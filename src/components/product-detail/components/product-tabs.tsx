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
      <div className="border-b border-[#d8cfbf] dark:border-white/10">
        <div className="flex flex-wrap gap-8">
          {(Object.keys(TAB_LABELS) as ProductTab[]).map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tabId
                  ? "border-[#916130] text-[#11100d] dark:text-white"
                  : "border-transparent text-[#655a4e] hover:text-[#11100d] dark:text-[#b8ad9f] dark:hover:text-white"
              }`}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "description" && (
        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-[#916130]/35 bg-[#916130]/10 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-[#d6a56f] uppercase">
            Conteúdo mockado
          </p>
          <p className="leading-relaxed text-[#403930] dark:text-[#c7ced9]">
            {descriptionText}
          </p>
          <p className="leading-relaxed text-[#655a4e] dark:text-[#b8ad9f]">
            Este bloco está marcado como mock enquanto a integração com os dados
            finais de descrição ainda está em andamento.
          </p>
        </div>
      )}

      {activeTab === "specifications" && (
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 md:p-7 dark:bg-[#17140f]">
          <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#59627a]/10 blur-3xl dark:bg-[#59627a]/20" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4efe5] text-[#50586c] dark:bg-white/5 dark:text-[#9ca4ba]">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="inline-flex rounded-full border border-[#916130]/35 bg-[#916130]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-[#b7894f] uppercase">
                    Em configuração
                  </p>
                  <h3 className="[font-family:var(--font-space-grotesk)] text-xl font-bold text-[#11100d] dark:text-white">
                    Especificações técnicas em breve
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[#655a4e] dark:text-[#b8ad9f]">
                Estamos preparando a ficha técnica completa deste produto para
                exibir os dados oficiais com consistência entre catálogo e
                checkout.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {SPECIFICATION_PREVIEW_ITEMS.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[#d8cfbf] bg-[#f8f4ec] px-4 py-3 text-sm text-[#403930] dark:border-white/10 dark:bg-[#17130f] dark:text-[#c7ced9]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#d8cfbf] bg-[#f8f4ec] p-4 dark:border-white/10 dark:bg-[#17130f]">
              <p className="text-xs font-semibold tracking-[0.05em] text-[#655a4e] uppercase dark:text-[#b8ad9f]">
                Preview do layout
              </p>
              <div className="mt-4 space-y-3">
                {[52, 68, 40, 74].map((width, index) => (
                  <div
                    key={`${width}-${index}`}
                    className="h-8 rounded-lg bg-[#f4efe5] dark:bg-white/5"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 md:p-7 dark:bg-[#17140f]">
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#916130]/10 blur-3xl dark:bg-[#916130]/20" />
          <div className="relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-xl border border-[#d8cfbf] bg-[#f8f4ec] p-5 dark:border-white/10 dark:bg-[#17130f]">
              <p className="text-xs font-semibold tracking-[0.05em] text-[#655a4e] uppercase dark:text-[#b8ad9f]">
                Rating
              </p>
              <p className="mt-2 [font-family:var(--font-space-grotesk)] text-4xl font-bold text-[#11100d] dark:text-white">
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
              <p className="mt-3 text-xs text-[#655a4e] dark:text-[#b8ad9f]">
                Aguardando as primeiras avaliações verificadas.
              </p>
            </div>

            <div>
              <div className="mb-4 flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4efe5] text-[#50586c] dark:bg-white/5 dark:text-[#9ca4ba]">
                  <MessageSquareQuote className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-[#59627a]/30 bg-[#59627a]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-[#50586c] uppercase dark:text-[#9ca4ba]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Em breve
                  </p>
                  <h3 className="[font-family:var(--font-space-grotesk)] text-xl font-bold text-[#11100d] dark:text-white">
                    Reviews em preparação
                  </h3>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[#655a4e] dark:text-[#b8ad9f]">
                Esta seção será habilitada após a conclusão da etapa de coleta e
                moderação, com notas, comentários e histórico por produto.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {REVIEW_SETUP_STEPS.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-xl border border-[#d8cfbf] bg-[#f8f4ec] p-4 dark:border-white/10 dark:bg-[#17130f]"
                  >
                    <p className="text-sm font-semibold text-[#11100d] dark:text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#655a4e] dark:text-[#b8ad9f]">
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
