import { Suspense } from "react";

import VerifyEmailContent from "./components/VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
