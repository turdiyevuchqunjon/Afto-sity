"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collectTrackingData } from "@/lib/tracking";

// ============================================================
// VALIDATION SCHEMA (server tarafidagi bilan mos)
// ============================================================

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ism kamida 2 ta harf bo'lishi kerak")
    .max(100, "Ism juda uzun"),
  phone: z
    .string()
    .trim()
    .min(7, "Telefon raqam to'liq emas")
    .max(30, "Telefon raqam juda uzun")
    .regex(/^[\d\s+()-]+$/, "Faqat raqam, +, (), - bo'lishi mumkin"),
  email: z.string().trim().email("Email noto'g'ri").or(z.literal("")).optional(),
  productName: z.string().trim().max(200).optional(),
  comments: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================
// COMPONENT
// ============================================================

type Status = "idle" | "loading" | "success" | "error";

export function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
  });

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    setErrorMsg("");

    const tracking = collectTrackingData();

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...tracking,
        }),
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // JSON yo'q bo'lsa ham davom etamiz
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Yuborishda xato yuz berdi");
      }

      setStatus("success");
      reset();
    } catch (e) {
      setStatus("error");
      setErrorMsg(
        e instanceof Error
          ? e.message
          : "Yuborib bo'lmadi. Iltimos, qayta urinib ko'ring."
      );
    }
  }

  // -----------------------
  // SUCCESS STATE
  // -----------------------
  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border-2 border-rust bg-bone p-8 text-center"
      >
        <div
          className="mb-3 text-5xl"
          aria-hidden="true"
        >
          ✓
        </div>
        <h3 className="font-display text-2xl font-bold text-ink">
          So'rovingiz qabul qilindi
        </h3>
        <p className="mt-2 text-steel">
          Tez orada operator siz bilan bog'lanadi.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-rust underline transition-colors hover:text-amber"
        >
          Yangi so'rov yuborish
        </button>
      </div>
    );
  }

  // -----------------------
  // FORM
  // -----------------------
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
      aria-label="Buyurtma berish formasi"
    >
      {/* ISM */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-steel"
        >
          Ismingiz <span className="text-rust">*</span>
        </label>
        <input
          {...register("name")}
          id="name"
          type="text"
          placeholder="Aliev Aziz"
          autoComplete="name"
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="input-field w-full rounded-lg border-2 border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-sm text-rust">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* TELEFON */}
      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-steel"
        >
          Telefon raqam <span className="text-rust">*</span>
        </label>
        <input
          {...register("phone")}
          id="phone"
          type="tel"
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? "true" : "false"}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className="input-field w-full rounded-lg border-2 border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30"
        />
        {errors.phone && (
          <p id="phone-error" role="alert" className="mt-1 text-sm text-rust">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* MAHSULOT NOMI */}
      <div>
        <label
          htmlFor="productName"
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-steel"
        >
          Mashina / Ehtiyot qism
          <span className="ml-2 text-ink/30">(ixtiyoriy)</span>
        </label>
        <input
          {...register("productName")}
          id="productName"
          type="text"
          placeholder="KIA 2020 — old amartizator"
          aria-invalid={errors.productName ? "true" : "false"}
          className="input-field w-full rounded-lg border-2 border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30"
        />
        {errors.productName && (
          <p role="alert" className="mt-1 text-sm text-rust">
            {errors.productName.message}
          </p>
        )}
      </div>

      {/* IZOH */}
      <div>
        <label
          htmlFor="comments"
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-steel"
        >
          Qo'shimcha ma'lumot
          <span className="ml-2 text-ink/30">(ixtiyoriy)</span>
        </label>
        <textarea
          {...register("comments")}
          id="comments"
          rows={3}
          placeholder="Asl yoki analog kerakligi, manzil, va h.k."
          aria-invalid={errors.comments ? "true" : "false"}
          className="input-field w-full resize-none rounded-lg border-2 border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30"
        />
        {errors.comments && (
          <p role="alert" className="mt-1 text-sm text-rust">
            {errors.comments.message}
          </p>
        )}
      </div>

      {/* SUBMIT TUGMASI */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary w-full rounded-lg bg-ink py-4 font-display text-lg font-bold uppercase tracking-wider text-bone"
      >
        {status === "loading" ? (
          <span className="inline-flex items-center justify-center gap-3">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.3"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Yuborilmoqda...
          </span>
        ) : (
          "Buyurtma berish"
        )}
      </button>

      {status === "error" && (
        <p
          role="alert"
          aria-live="assertive"
          className="text-center text-sm text-rust"
        >
          {errorMsg}
        </p>
      )}

      <p className="text-center text-xs text-ink/40">
        Ma'lumotlaringiz xavfsiz saqlanadi va faqat siz bilan bog'lanish uchun
        ishlatiladi.
      </p>
    </form>
  );
}
