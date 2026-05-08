import { LeadForm } from "@/components/LeadForm";

export default function HomePage() {
  return (
    <main className="grain min-h-screen overflow-hidden">
      {/* ============================================================
          TOP BAR
          ============================================================ */}
      <header className="relative z-10 border-b border-ink/10 bg-bone">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full bg-rust"
              aria-hidden="true"
            />
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              AvtoCity<span className="text-rust">Pro</span>
            </span>
          </div>
          <div className="hidden font-mono text-xs uppercase tracking-widest text-steel md:block">
            EST. 2018 / TASHKENT
          </div>
          <a
            href="#form"
            className="rounded-full border-2 border-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-bone"
          >
            Buyurtma
          </a>
        </div>
      </header>


      <section className="bg-bone py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
      <div className="lg:col-span-7">
              <div className="rise mb-6 flex items-center gap-3">
                <div className="h-px w-12 bg-rust" aria-hidden="true" />
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-rust">
                  Asl ehtiyot qismlar
                </span>
              </div>

              <h1
                className="rise font-display text-[3rem] font-black leading-[0.95] tracking-tight text-ink md:text-[5rem] lg:text-[6.5rem]"
                style={{ animationDelay: "0.1s" }}
              >
                Mashinangiz
                <br />
                <span className="italic text-rust">aslidan</span>
                <br />
                <span className="text-steel">yaxshi yursin.</span>
              </h1>

              <p
                className="rise mt-8 max-w-xl text-lg leading-relaxed text-ink/70 md:text-xl"
                style={{ animationDelay: "0.25s" }}
              >
                Cobalt, Spark, Lacetti, Nexia, Captiva va boshqa o'nlab
                modellar uchun asl va sertifikatlangan ehtiyot qismlar.
                Tezkor yetkazib berish — O'zbekiston bo'ylab.
              </p>

              {/* TRUST STATS */}
              <div
                className="rise mt-12 grid grid-cols-3 gap-8 border-t-2 border-ink/10 pt-8"
                style={{ animationDelay: "0.4s" }}
              >
                <div>
                  <div className="font-display text-4xl font-bold text-ink md:text-5xl">
                    7+
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
                    Yillik tajriba
                  </div>
                </div>
                <div>
                  <div className="font-display text-4xl font-bold text-ink md:text-5xl">
                    10K+
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
                    Mamnun mijoz
                  </div>
                </div>
                <div>
                  <div className="font-display text-4xl font-bold text-ink md:text-5xl">
                    24/7
                  </div>
                  <div className="mt-1 font-mono text-xs uppercase tracking-wider text-steel">
                    Yordam xizmati
                  </div>
                </div>
              </div>
            </div>

     </div>
      </section>

      {/* ============================================================
          HERO + FORM
          ============================================================ */}


      <section className="relative">

                     {/* ============================================================
          MODELS / KATEGORIYALAR
          ============================================================ */}
      {/* <div className="mx-auto max-w-7xl px-6 py-12 md:py-20 lg:py-24">
          <div className="mb-12 text-center lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-rust">
              Modellar
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink md:text-5xl">
              Qaysi mashina uchun?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink/60">
              Quyida ko'rsatilgan modellar — eng ko'p so'raladiganlari. Boshqa
              modellar uchun ham bemalol so'rov qoldiring.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              "Cobalt",
              "Spark",
              "Lacetti",
              "Nexia",
              "Captiva",
              "Damas",
              "Matiz",
              "Malibu",
              "Tracker",
              "Onix",
              "Lada",
              "Boshqa",
            ].map((model) => (
              <div
                key={model}
                className="rounded-2xl border-2 border-ink/10 bg-white p-4 text-center transition-colors hover:border-rust hover:bg-rust hover:text-bone"
              >
                <div className="font-display text-lg font-bold">{model}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="#form"
              className="btn-primary inline-flex items-center gap-2 rounded-full bg-rust px-8 py-4 font-display text-lg font-bold uppercase tracking-wider text-bone"
            >
              Buyurtma berish
              <span aria-hidden="true">→</span>
            </a>
          </div>
</div> */}
      </section>

 <section className="relative">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-20 lg:py-24">
            {/* CHAP TOMON — HERO */}
        

            {/* O'NG TOMON — FORM */}
            <div className="lg:col-span-5">
              <div
                id="form"
                className="form-card rise sticky top-8 rounded-3xl border-2 border-ink bg-bone p-6 shadow-[8px_8px_0_0_#0a0a0a] md:p-8"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="h-2 w-2 animate-pulse rounded-full bg-rust"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs uppercase tracking-widest text-rust">
                      Bepul konsultatsiya
                    </span>
                  </div>
                  <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
                    Ehtiyot qism kerakmi?
                  </h2>
                  <p className="mt-2 text-sm text-ink/60">
                    Buyurtma qoldiring — 15 daqiqa ichida narx va mavjudligini
                    aytamiz.
                  </p>
                </div>
                <LeadForm />
              </div>
            </div>
          </div>
      </section>

      {/* ============================================================
          FEATURES BAND
          ============================================================ */}
      <section
        className="border-y-4 border-ink bg-ink py-12 text-bone"
        aria-label="Bizning afzalliklarimiz"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-bone font-display text-xl font-bold"
                aria-hidden="true"
              >
                01
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">
                  Faqat asl mahsulot
                </h3>
                <p className="mt-1 text-sm text-bone/60">
                  Har bir ehtiyot qism sertifikatlangan — original yoki
                  tekshirilgan analog.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-bone font-display text-xl font-bold"
                aria-hidden="true"
              >
                02
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">
                  Tezkor yetkazish
                </h3>
                <p className="mt-1 text-sm text-bone/60">
                  Toshkent ichida 1 kun, viloyatlarga 2-3 kun ichida yetkazib
                  beramiz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-bone font-display text-xl font-bold"
                aria-hidden="true"
              >
                03
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Kafolat 100%</h3>
                <p className="mt-1 text-sm text-bone/60">
                  Mahsulot mos kelmasa yoki nuqsonli bo'lsa — pulingizni
                  qaytaramiz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="bg-bone py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 border-t border-ink/10 pt-8 md:flex-row md:items-center">
            <div>
              <div className="font-display text-2xl font-bold text-ink">
                AvtoCity<span className="text-rust">Pro</span>
              </div>
              <p className="mt-1 text-sm text-ink/50">
                © {new Date().getFullYear()} — Toshkent, O'zbekiston
              </p>
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-steel">
              Telegram · Instagram · +998 XX XXX XX XX
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}


