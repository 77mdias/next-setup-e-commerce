import { Suspense } from "react";
import SignUpForm from "./components/SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
