"use client";

export function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#efebe3] dark:bg-[#11100d]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#916130]"></div>
        <p className="text-[#11100d] dark:text-white">Carregando produto...</p>
      </div>
    </div>
  );
}
