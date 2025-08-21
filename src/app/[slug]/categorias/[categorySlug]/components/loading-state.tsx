"use client";

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--button-primary)]"></div>
        <p className="text-white">Carregando...</p>
      </div>
    </div>
  );
}
