"use client";

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8ff] dark:bg-[#0b0d10]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#ff2e63]"></div>
        <p className="text-[#0f172a] dark:text-white">Carregando produto...</p>
      </div>
    </div>
  );
}
