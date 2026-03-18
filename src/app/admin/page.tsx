import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import AdminDashboardClient from "@/components/admin/dashboard/AdminDashboardClient";
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
  "A renderização de KPIs consome `/api/admin/dashboard` sem recalcular regra de negócio no frontend.",
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="space-y-5">
      <AdminDashboardClient />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5c7cfa]/25 bg-[#5c7cfa]/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#5c7cfa] uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sprint 06
          </div>

          <div className="mt-4 max-w-3xl space-y-3">
            <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-[#f1f3f5]">
              Entrada operacional única para o painel administrativo
            </h2>
            <p className="[font-family:var(--font-arimo)] text-sm leading-7 text-[#99a1af] sm:text-base">
              O shell do painel agora concentra navegação, contexto de escopo e
              acesso direto aos módulos previstos da fase 06. Os KPIs mínimos da
              sprint ficam disponíveis no topo da rota e mantêm fallback seguro
              para loading, empty e error sem quebrar a navegação entre
              dashboard, pedidos, catálogo, clientes e auditoria.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {shellGuarantees.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/6 bg-[#12151a] p-4 [font-family:var(--font-arimo)] text-sm leading-6 text-[#f1f3f5]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6">
          <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.2em] text-[#5c7cfa] uppercase">
            KPI ativo
          </p>
          <h3 className="mt-4 [font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f1f3f5]">
            Dashboard administrativo
          </h3>
          <p className="mt-3 [font-family:var(--font-arimo)] text-sm leading-7 text-[#99a1af]">
            <code className="rounded-md border border-white/6 bg-[#12151a] px-1.5 py-0.5 font-mono text-xs text-[#5c7cfa]">
              S06-DSH-003
            </code>{" "}
            integra o endpoint consolidado de métricas para preencher cards,
            comparativos por janela e fallback de erro sem duplicar regra de
            cálculo no frontend.
          </p>
          <div className="mt-6 rounded-xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#99a1af]">
            <div className="flex items-center gap-2 text-[#5c7cfa]">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-[#f1f3f5]">
                Janela padrão de 7 dias com atualização on-demand e preservação
                da última leitura válida em falha de refresh.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {moduleHighlights.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              className="group rounded-2xl border border-white/6 bg-[#171a21] p-6 transition hover:border-[#5c7cfa]/30 hover:bg-[#5c7cfa]/5"
              href={item.href}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-2xl border border-white/6 bg-[#12151a] p-3 text-[#5c7cfa] transition group-hover:border-[#5c7cfa]/30 group-hover:bg-[#5c7cfa]/10">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-5 w-5 text-[#6a7282] transition group-hover:text-[#5c7cfa]" />
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="[font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f1f3f5]">
                  {item.title}
                </h3>
                <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-[#99a1af]">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
        <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.2em] text-[#6a7282] uppercase">
          Rotas previstas no shell
        </p>

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              className="rounded-xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm font-medium text-[#99a1af] transition hover:border-[#5c7cfa]/30 hover:text-[#f1f3f5]"
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
