import { NextRequest, NextResponse } from "next/server";
import { getDeal, getContact, markDealAsPurchaseSent } from "@/lib/bitrix";
import { sendMetaEvent, generateEventId } from "@/lib/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET_TOKEN = process.env.BITRIX_PURCHASE_WEBHOOK_TOKEN;

async function extractDealId(req: NextRequest): Promise<string | null> {
  const contentType = req.headers.get("content-type") || "";

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
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!SECRET_TOKEN || token !== SECRET_TOKEN) {
    console.warn("[purchase] Noto'g'ri yoki yo'q token");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dealId = await extractDealId(req);
  if (!dealId) {
    console.error("[purchase] Deal ID topilmadi");
    return NextResponse.json(
      { ok: false, error: "Deal ID topilmadi" },
      { status: 400 }
    );
  }

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

  if (deal.UF_CRM_META_PURCHASE_SENT === "Y") {
    console.log(`[purchase] Deal ${dealId} uchun Purchase allaqachon yuborilgan`);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Purchase event allaqachon yuborilgan",
    });
  }

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

  const value = deal.OPPORTUNITY ? parseFloat(deal.OPPORTUNITY) : undefined;
  const currency = deal.CURRENCY_ID || "USD";

  if (!value || value <= 0) {
    console.warn(
      `[purchase] Deal ${dealId} qiymati 0 — Purchase yuborilmaydi`
    );
    return NextResponse.json(
      {
        ok: false,
        error: "Deal qiymati 0. Sotuvchi summa kiritishi kerak.",
        dealId,
      },
      { status: 400 }
    );
  }

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
        fbp: deal.UF_CRM_META_FBP as string | undefined,
        fbc: deal.UF_CRM_META_FBC as string | undefined,
        clientIp: deal.UF_CRM_META_CLIENT_IP as string | undefined,
        clientUserAgent: deal.UF_CRM_META_CLIENT_UA as string | undefined,
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

    try {
      await markDealAsPurchaseSent(dealId);
    } catch (e) {
      console.warn(`[purchase] Deal ${dealId} ga belgi qo'yib bo'lmadi:`, e);
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