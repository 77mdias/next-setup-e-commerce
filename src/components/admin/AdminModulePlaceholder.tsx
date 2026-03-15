import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

type AdminModulePlaceholderProps = {
  checklist: readonly string[];
  ctaHref: string;
  ctaLabel: string;
  description: string;
  eyebrow: string;
  title: string;
};

export default function AdminModulePlaceholder({
  checklist,
  ctaHref,
  ctaLabel,
  description,
  eyebrow,
  title,
}: AdminModulePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.4)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-amber-100 uppercase">
          <Clock3 className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <div className="mt-4 max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
            Escopo planejado
          </p>
          <div className="mt-4 space-y-3">
            {checklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/[0.08] bg-slate-950/[0.45] px-4 py-3 text-sm leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
            Próximo passo
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-100">
            O módulo definitivo entra nas tasks operacionais seguintes. Até lá,
            a navegação já está estabilizada e sem links quebrados para
            preservar a entrada única do painel.
          </p>

          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-slate-950/60 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-slate-900"
            href={ctaHref}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
