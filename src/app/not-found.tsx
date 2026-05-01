import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grain flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-rust">
          404
        </div>
        <h1 className="mt-4 font-display text-6xl font-black text-ink md:text-8xl">
          Topilmadi
        </h1>
        <p className="mt-4 text-lg text-ink/60">
          Bunday sahifa mavjud emas yoki ko'chirilgan.
        </p>
        <Link
          href="/"
          className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 font-display text-lg font-bold uppercase tracking-wider text-bone"
        >
          Bosh sahifaga
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
