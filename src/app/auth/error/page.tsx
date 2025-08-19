import { Suspense } from "react";
import ErrorContent from "./components/ErrorContent";

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
