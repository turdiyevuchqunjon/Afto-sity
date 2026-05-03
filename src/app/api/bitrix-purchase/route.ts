import { NextRequest, NextResponse } from "next/server";
import { getDeal, getContact, markDealAsPurchaseSent } from "@/lib/bitrix";
import { sendMetaEvent, generateEventId } from "@/lib/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bitrix24 Robot/Webhook bu endpoint'ga POST yuboradi.
 *
 * Workflow:
 *   1. Sotuvchi Deal'ni "Сотувда бор" stage'ga ko'chiradi
 *   2. Bitrix Robot avtomatik bu URL'ga so'rov yuboradi
 *   3. Server Deal va Contact ma'lumotlarini Bitrix'dan o'qiydi
 *   4. Meta CAPI'ga Purchase event yuboradi (mijoz + summa bilan)
 *   5. Deal'ga belgi qo'yiladi (qayta yubormaslik uchun)
 *
 * Xavfsizlik: URL'da ?token=... bo'lishi shart.
 */

const SECRET_TOKEN = process.env.BITRIX_PURCHASE_WEBHOOK_TOKEN;

/**
 * Bitrix ikki xil format yuborishi mumkin:
 *   - JSON: { dealId: 123 } yoki { ID: 123 }
 *   - Form-urlencoded: data[FIELDS][ID]=123 (standart Bitrix robot formati)
 */
async function extractDealId(req: NextRequest): Promise<string | null> {
  const contentType = req.headers.get("content-type") || "";

  // JSON
  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      return (
        body?.dealId?.toString() ||
        body?.deal_id?.toString() ||
        body?.ID?.toString() ||
        body?.id?.toString() ||
        body?.data?.FIELDS?.ID?.toString() ||
        null
      );
    } catch {
      return null;
    }
  }

  // Form-urlencoded
  try {
    const formData = await req.formData();
    return (
      formData.get("data[FIELDS][ID]")?.toString() ||
      formData.get("data[FIELDS_AFTER][ID]")?.toString() ||
      formData.get("dealId")?.toString() ||
      formData.get("ID")?.toString() ||
      null
    );
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1. Token tekshirish
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!SECRET_TOKEN || token !== SECRET_TOKEN) {
    console.warn("[purchase] Noto'g'ri yoki yo'q token");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Deal ID
  const dealId = await extractDealId(req);
  if (!dealId) {
    console.error("[purchase] Deal ID topilmadi");
    return NextResponse.json(
      { ok: false, error: "Deal ID topilmadi" },
      { status: 400 }
    );
  }

  // 3. Bitrix'dan Deal o'qish
  let deal;
  try {
    deal = await getDeal(dealId);
  } catch (e) {
    console.error(`[purchase] Deal ${dealId} o'qishda xato:`, e);
    return NextResponse.json(
      { ok: false, error: "Deal topilmadi" },
      { status: 404 }
    );
  }

  // 4. Takrorlanish tekshiruvi (qayta yubormaslik)
  if (deal.UF_CRM_META_PURCHASE_SENT === "Y") {
    console.log(`[purchase] Deal ${dealId} uchun Purchase allaqachon yuborilgan`);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Purchase event allaqachon yuborilgan",
    });
  }

  // 5. Contact ma'lumotlarini olish
  let contact;
  if (deal.CONTACT_ID) {
    try {
      contact = await getContact(deal.CONTACT_ID);
    } catch (e) {
      console.warn(`[purchase] Contact ${deal.CONTACT_ID} o'qishda xato:`, e);
    }
  }

  const phone = contact?.PHONE?.[0]?.VALUE;
  const email = contact?.EMAIL?.[0]?.VALUE;
  const firstName = contact?.NAME;
  const lastName = contact?.LAST_NAME;

  // 6. Deal qiymati
  const value = deal.OPPORTUNITY ? parseFloat(deal.OPPORTUNITY) : undefined;
  const currency = deal.CURRENCY_ID || "UZS";

  if (!value || value <= 0) {
    console.warn(
      `[purchase] Deal ${dealId} qiymati 0 — Purchase yuborilmaydi (ROAS uchun summa shart)`
    );
    return NextResponse.json(
      {
        ok: false,
        error: "Deal qiymati (Sумма / Opportunity) 0 yoki kiritilmagan. Sotuvchi summa kiritishi kerak.",
        dealId,
      },
      { status: 400 }
    );
  }

  // 7. Meta'ga Purchase event yuboramiz
  const purchaseEventId = generateEventId();

  try {
    const result = await sendMetaEvent({
      eventName: "Purchase",
      eventId: purchaseEventId,
      userData: {
        phone,
        email,
        firstName,
        lastName,
        country: "uz",
        fbp: deal.UF_CRM_META_FBP,
        fbc: deal.UF_CRM_META_FBC,
        clientIp: deal.UF_CRM_META_CLIENT_IP,
        clientUserAgent: deal.UF_CRM_META_CLIENT_UA,
        externalId: dealId,
      },
      customData: {
        value,
        currency,
        contentName: deal.TITLE,
        contentIds: [dealId.toString()],
        contentType: "product",
      },
      actionSource: "system_generated",
    });

    if (!result.ok) {
      console.error(
        `[purchase] Meta CAPI xato (deal ${dealId}):`,
        JSON.stringify(result.body)
      );
      return NextResponse.json(
        { ok: false, error: "Meta CAPI xato", details: result.body },
        { status: 502 }
      );
    }

    // 8. Deal'ga belgi qo'yamiz
    try {
      await markDealAsPurchaseSent(dealId);
    } catch (e) {
      console.warn(`[purchase] Deal ${dealId} ga belgi qo'yib bo'lmadi:`, e);
      // Bu kritik emas, Purchase yuborilgan
    }

    console.log(
      `[purchase] ✓ Deal ${dealId}: Purchase yuborildi, value=${value} ${currency}`
    );

    return NextResponse.json({
      ok: true,
      dealId,
      eventId: purchaseEventId,
      value,
      currency,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[purchase] Meta'ga yuborishda xato:`, message);
    return NextResponse.json(
      { ok: false, error: "Meta'ga yuborib bo'lmadi" },
      { status: 500 }
    );
  }
}

// GET — debug uchun (Bitrix robot URL ulanganini tekshirish)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!SECRET_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "BITRIX_PURCHASE_WEBHOOK_TOKEN sozlanmagan" },
      { status: 500 }
    );
  }

  if (token !== SECRET_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri token" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Endpoint ishlayapti. Bitrix Robot bu URL'ga POST yuborishi kerak.",
    metaConfigured: !!process.env.META_PIXEL_ID && !!process.env.META_CAPI_ACCESS_TOKEN,
  });
}