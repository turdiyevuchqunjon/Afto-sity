import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/bitrix";

// Node.js runtime kerak (crypto va to'liq fetch headers uchun)
export const runtime = "nodejs";

// Bu route'ni cache qilmaslik
export const dynamic = "force-dynamic";

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const leadSchema = z.object({
  name: z
    .string({ required_error: "Ism kiritilishi shart" })
    .trim()
    .min(2, "Ism kamida 2 ta harf bo'lishi kerak")
    .max(100, "Ism juda uzun"),

  phone: z
    .string({ required_error: "Telefon raqam kiritilishi shart" })
    .trim()
    .min(7, "Telefon raqam to'liq emas")
    .max(30, "Telefon raqam juda uzun")
    .regex(/^[\d\s+()-]+$/, "Telefon raqamda faqat raqam, +, (), - bo'lishi mumkin"),

  email: z
    .string()
    .trim()
    .email("Email noto'g'ri formatda")
    .optional()
    .or(z.literal("")),

  productName: z.string().trim().max(200).optional(),
  comments: z.string().trim().max(1000).optional(),

  // Tracking
  pageUrl: z.string().url().optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  utmContent: z.string().max(255).optional(),
  utmTerm: z.string().max(255).optional(),
});

// ============================================================
// POST HANDLER
// ============================================================

export async function POST(req: NextRequest) {
  // 1. JSON body'ni o'qish
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Yaroqsiz so'rov formati (JSON kutilgan)" },
      { status: 400 }
    );
  }

  // 2. Validatsiya
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error: firstIssue?.message ?? "Ma'lumotlar noto'g'ri",
        field: firstIssue?.path.join("."),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // 3. Texnik ma'lumotlarni headers'dan yig'amiz
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  const clientUserAgent = req.headers.get("user-agent") ?? undefined;

  // 4. Bitrix24'ga yuborish
  try {
    const result = await createLead({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      productName: data.productName,
      comments: data.comments,
      pageUrl: data.pageUrl,
      clientIp,
      clientUserAgent,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmContent: data.utmContent,
      utmTerm: data.utmTerm,
    });

    console.log(
      `[lead] ✓ Yangi lead: dealId=${result.dealId}, contactId=${result.contactId}, name=${data.name}, phone=${data.phone}`
    );

    return NextResponse.json({
      ok: true,
      dealId: result.dealId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[lead] ✗ Bitrix xato:`, message, {
      name: data.name,
      phone: data.phone,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Tizimga ulanishda xato yuz berdi. Iltimos qayta urinib ko'ring.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET HANDLER (sog'lomlik tekshiruvi uchun)
// ============================================================

export async function GET() {
  const isConfigured = !!process.env.BITRIX_WEBHOOK_URL;
  return NextResponse.json({
    ok: true,
    service: "lead-api",
    bitrixConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  });
}
