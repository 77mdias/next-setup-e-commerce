import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-navigation";
import { ROUTE_PATHS } from "@/lib/routes";

const moduleHighlights = [
  {
    description:
      "Rotina operacional para fila diária, pagamentos e exceções críticas.",
    href: ROUTE_PATHS.adminOrders,
    icon: ShoppingCart,
    title: "Pedidos",
  },
  {
    description:
      "Espaço de gestão para catálogo, estoque e mídia com isolamento por loja.",
    href: ROUTE_PATHS.adminCatalog,
    icon: Boxes,
    title: "Catálogo",
  },
  {
    description:
      "Visão administrativa preparada para suporte, histórico e relacionamento.",
    href: ROUTE_PATHS.adminCustomers,
    icon: Users,
    title: "Clientes",
  },
  {
    description:
      "Camada reservada para registrar eventos críticos e ações sensíveis do painel.",
    href: ROUTE_PATHS.adminAudit,
    icon: ScrollText,
    title: "Auditoria",
  },
] as const;

const shellGuarantees = [
  "Guard server-side reaproveita o mesmo contrato de bloqueio de `/admin` já protegido no middleware.",
  "Escopo global ou por loja é exibido no shell para reduzir erro operacional e vazamento cross-store.",
  "A API de métricas já existe em `/api/admin/dashboard`; a renderização de KPIs entra na task seguinte.",
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.4)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sprint 06
          </div>

          <div className="mt-4 max-w-3xl space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Entrada operacional única para o painel administrativo
            </h2>
            <p className="text-sm leading-7 text-slate-300 sm:text-base">
              O shell do painel agora concentra navegação, contexto de escopo e
              acesso direto aos módulos previstos da fase 06. A estrutura está
              pronta para receber KPIs e fluxos operacionais sem quebrar a
              navegação entre dashboard, pedidos, catálogo, clientes e
              auditoria.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {shellGuarantees.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-rose-100 uppercase">
            Próxima integração
          </p>
          <h3 className="mt-4 text-xl font-semibold text-white">
            KPIs administrativos
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-100">
            <code className="rounded bg-slate-950/60 px-1.5 py-0.5 text-xs text-cyan-100">
              S06-DSH-003
            </code>{" "}
            passa a consumir o endpoint consolidado de métricas para preencher
            cards, estados de loading, empty e error sem duplicar regra de
            cálculo no frontend.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100">
            Contrato disponível via API com filtros de janela, estoque baixo e
            <code className="rounded bg-slate-950/60 px-1.5 py-0.5 text-xs text-cyan-100">
              storeId
            </code>{" "}
            respeitando RBAC e escopo por loja.
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {moduleHighlights.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
              href={item.href}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-2xl bg-slate-950/50 p-3 text-cyan-100 transition group-hover:bg-cyan-400/20">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-white" />
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-slate-300">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
        <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
          Rotas previstas no shell
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              className="rounded-2xl border border-white/[0.08] bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-rose-400/35 hover:text-white"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
