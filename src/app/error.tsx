"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grain flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-rust">
          Xato yuz berdi
        </div>
        <h1 className="mt-4 font-display text-5xl font-black text-ink md:text-7xl">
          Nimadir buzildi
        </h1>
        <p className="mt-4 text-lg text-ink/60">
          Iltimos, sahifani qayta yuklashga urinib ko'ring.
        </p>
        <button
          onClick={reset}
          className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 font-display text-lg font-bold uppercase tracking-wider text-bone"
        >
          Qayta urinib ko'rish
        </button>
      </div>
    </main>
  );
}
