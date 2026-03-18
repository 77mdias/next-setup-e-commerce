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
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase">
          <Clock3 className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <div className="mt-4 max-w-3xl space-y-2">
          <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-[#f1f3f5]">
            {title}
          </h2>
          <p className="[font-family:var(--font-arimo)] text-sm leading-relaxed text-[#99a1af] sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6">
          <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.2em] text-[#6a7282] uppercase">
            Escopo planejado
          </p>
          <div className="mt-4 space-y-2">
            {checklist.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm leading-6 text-[#f1f3f5]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#5c7cfa]/20 bg-[#5c7cfa]/5 p-6">
          <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.2em] text-[#5c7cfa] uppercase">
            Próximo passo
          </p>
          <p className="mt-4 [font-family:var(--font-arimo)] text-sm leading-7 text-[#99a1af]">
            O módulo definitivo entra nas tasks operacionais seguintes. Até lá,
            a navegação já está estabilizada e sem links quebrados para
            preservar a entrada única do painel.
          </p>

          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#12151a] px-4 py-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5] transition hover:border-[#5c7cfa]/40 hover:text-[#5c7cfa]"
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
