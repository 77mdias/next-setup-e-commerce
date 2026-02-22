import { Suspense } from "react";

import ThankYouContent from "./components/ThankYouContent";

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
