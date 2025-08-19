import { Suspense } from "react";
import SignInForm from "./components/SignInForm";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
