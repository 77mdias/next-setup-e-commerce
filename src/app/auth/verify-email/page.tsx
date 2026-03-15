import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";

import { EmailAuthShell } from "../components/EmailAuthShell";
import VerifyEmailContent from "./components/VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <EmailAuthShell
          badge="Verification"
          title="Carregando verificação."
          description="Estamos preparando seu fluxo de confirmação."
          icon={
            <LoaderCircle className="h-6 w-6 animate-spin text-[#667085] dark:text-[#98A2B3]" />
          }
        >
          <div className="rounded-3xl border border-[#e4e7ec] bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-[#667085] dark:text-[#98A2B3]">
              Só mais um instante.
            </p>
          </div>
        </EmailAuthShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
