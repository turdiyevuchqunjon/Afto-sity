/**
 * Bitrix24 REST API client
 *
 * Web saytdan kelgan lid'larni Bitrix24 CRM'ga yozadi.
 * Meta CAPI uchun kerakli ma'lumotlar (IP, UA, fbp, fbc, eventId)
 * Deal'ning Comments maydoniga structured tarzda saqlanadi —
 * keyinroq Purchase event uchun shu yerdan o'qib olamiz.
 */

const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;
const REQUEST_TIMEOUT_MS = 10_000;

// ============================================================
// LOW-LEVEL CLIENT
// ============================================================

interface BitrixSuccessResponse<T> {
  result: T;
  time?: { start: number; finish: number; duration: number };
}

interface BitrixErrorResponse {
  error: string;
  error_description: string;
}

type BitrixResponse<T> = BitrixSuccessResponse<T> | BitrixErrorResponse;

function isErrorResponse<T>(
  data: BitrixResponse<T>
): data is BitrixErrorResponse {
  return typeof (data as BitrixErrorResponse).error === "string";
}

async function bitrixCall<T>(
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  if (!BITRIX_WEBHOOK_URL) {
    throw new Error("BITRIX_WEBHOOK_URL sozlanmagan");
  }

  const url = `${BITRIX_WEBHOOK_URL.replace(/\/$/, "")}/${method}.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Bitrix24 javob bermadi (timeout)`);
    }
    throw new Error(
      `Bitrix24'ga ulanishda xato: ${e instanceof Error ? e.message : String(e)}`
    );
  } finally {
    clearTimeout(timeout);
  }

  let data: BitrixResponse<T>;
  try {
    data = (await res.json()) as BitrixResponse<T>;
  } catch {
    throw new Error(`Bitrix24 yaroqsiz JSON qaytardi (status: ${res.status})`);
  }

  if (isErrorResponse(data)) {
    throw new Error(
      `Bitrix24 xato (${method}): ${data.error} — ${data.error_description}`
    );
  }

  return data.result;
}

// ============================================================
// META METADATA — Comments ichida saqlash uchun
// ============================================================

/**
 * Meta CAPI uchun kerakli ma'lumotlarni Comments ichiga
 * structured tarzda yozamiz. Keyinroq Purchase event uchun
 * shu yerdan parse qilib olishimiz mumkin.
 */
function buildMetaMetadata(input: {
  metaEventId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
}): string {
  const lines: string[] = ["", "--- META TRACKING (sotuvchi e'tibor bermasin) ---"];

  if (input.metaEventId) lines.push(`META_EVENT_ID: ${input.metaEventId}`);
  if (input.fbp) lines.push(`META_FBP: ${input.fbp}`);
  if (input.fbc) lines.push(`META_FBC: ${input.fbc}`);
  if (input.clientIp) lines.push(`META_IP: ${input.clientIp}`);
  if (input.clientUserAgent) lines.push(`META_UA: ${input.clientUserAgent}`);

  return lines.length > 2 ? lines.join("\n") : "";
}

/**
 * Comments matnidan Meta metadata'ni parse qilib oladi.
 * Purchase event yuborish paytida kerak bo'ladi.
 */
export function parseMetaMetadata(comments: string | undefined): {
  eventId?: string;
  fbp?: string;
  fbc?: string;
  ip?: string;
  ua?: string;
} {
  if (!comments) return {};

  const get = (key: string): string | undefined => {
    const match = comments.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : undefined;
  };

  return {
    eventId: get("META_EVENT_ID"),
    fbp: get("META_FBP"),
    fbc: get("META_FBC"),
    ip: get("META_IP"),
    ua: get("META_UA"),
  };
}

// ============================================================
// CREATE LEAD
// ============================================================

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  productName?: string;
  comments?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  pageUrl?: string;
  clientIp?: string;
  clientUserAgent?: string;
  metaEventId?: string;
  fbp?: string;
  fbc?: string;
}

export interface CreateLeadResult {
  dealId: number;
  contactId: number;
}

export async function createLead(
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  // 1. Contact yaratamiz
  const contactFields: Record<string, unknown> = {
    NAME: input.name,
    OPENED: "Y",
    TYPE_ID: "CLIENT",
    SOURCE_ID: "WEB",
    PHONE: [{ VALUE: input.phone, VALUE_TYPE: "WORK" }],
  };
  if (input.email) {
    contactFields.EMAIL = [{ VALUE: input.email, VALUE_TYPE: "WORK" }];
  }

  const contactId = await bitrixCall<number>("crm.contact.add", {
    fields: contactFields,
  });

  // 2. Comments — sotuvchi uchun ko'rinadigan qism
  const visibleLines: string[] = [];
  if (input.productName) visibleLines.push(`🚗 Mashina/qism: ${input.productName}`);
  if (input.comments) visibleLines.push(`💬 Izoh: ${input.comments}`);
  if (input.pageUrl) visibleLines.push(`🔗 Sahifa: ${input.pageUrl}`);

  // 3. Meta metadata — sotuvchiga yashirin, lekin texnik kerak
  const metaBlock = buildMetaMetadata({
    metaEventId: input.metaEventId,
    fbp: input.fbp,
    fbc: input.fbc,
    clientIp: input.clientIp,
    clientUserAgent: input.clientUserAgent,
  });

  const fullComments = [visibleLines.join("\n"), metaBlock]
    .filter(Boolean)
    .join("\n");

  // 4. Deal yaratamiz
  const dealFields: Record<string, unknown> = {
    TITLE: input.productName
      ? `${input.productName} — ${input.name}`
      : `Web sayt: ${input.name}`,
    OPENED: "Y",
    CURRENCY_ID: "USD",
    SOURCE_ID: "WEB",
    CONTACT_ID: contactId,
    COMMENTS: fullComments,
  };

  if (input.utmSource) dealFields.UTM_SOURCE = input.utmSource;
  if (input.utmMedium) dealFields.UTM_MEDIUM = input.utmMedium;
  if (input.utmCampaign) dealFields.UTM_CAMPAIGN = input.utmCampaign;
  if (input.utmContent) dealFields.UTM_CONTENT = input.utmContent;
  if (input.utmTerm) dealFields.UTM_TERM = input.utmTerm;

  let dealId: number;
  try {
    dealId = await bitrixCall<number>("crm.deal.add", { fields: dealFields });
  } catch (e) {
    console.error(
      `[bitrix] Contact ${contactId} yaratilgan, lekin Deal yaratilmadi:`,
      e
    );
    throw new Error(
      `Mijoz saqlandi, lekin sделka xato: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  return { dealId, contactId };
}

// ============================================================
// READ DEAL — Purchase event uchun
// ============================================================

export interface DealData {
  ID: string;
  TITLE: string;
  OPPORTUNITY?: string;
  CURRENCY_ID?: string;
  CONTACT_ID?: string;
  STAGE_ID?: string;
  COMMENTS?: string;
  // Meta'dan Comments orqali parse qilingan ma'lumotlar
  UF_CRM_META_EVENT_ID?: string;
  UF_CRM_META_FBP?: string;
  UF_CRM_META_FBC?: string;
  UF_CRM_META_CLIENT_IP?: string;
  UF_CRM_META_CLIENT_UA?: string;
  UF_CRM_META_PURCHASE_SENT?: string;
  [key: string]: unknown;
}

export async function getDeal(dealId: number | string): Promise<DealData> {
  const deal = await bitrixCall<DealData>("crm.deal.get", { id: dealId });

  // Comments dan Meta metadata'ni ajratib olamiz
  const meta = parseMetaMetadata(deal.COMMENTS);

  return {
    ...deal,
    UF_CRM_META_EVENT_ID: meta.eventId,
    UF_CRM_META_FBP: meta.fbp,
    UF_CRM_META_FBC: meta.fbc,
    UF_CRM_META_CLIENT_IP: meta.ip,
    UF_CRM_META_CLIENT_UA: meta.ua,
    UF_CRM_META_PURCHASE_SENT: undefined, // alohida belgi yo'q, idempotent bo'ladi event_id orqali
  };
}

export interface ContactData {
  ID: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: Array<{ VALUE: string }>;
  EMAIL?: Array<{ VALUE: string }>;
  [key: string]: unknown;
}

export async function getContact(
  contactId: number | string
): Promise<ContactData> {
  return bitrixCall<ContactData>("crm.contact.get", { id: contactId });
}

/**
 * Purchase event yuborilganini belgilash.
 * Bu versiyada hech narsa qilmaydi — Meta tomonida event_id orqali deduplikatsiya bo'ladi.
 * Kelajakda kerak bo'lsa custom field qo'shish mumkin.
 */
export async function markDealAsPurchaseSent(
  _dealId: number | string
): Promise<boolean> {
  return true;
}