/**
 * Bitrix24 REST API client
 * ==========================
 *
 * Incoming webhook orqali ishlaydi.
 *
 * Webhook URL formati:
 *   https://avtocitypro.bitrix24.kz/rest/{USER_ID}/{WEBHOOK_TOKEN}/
 *
 * Bitrix'da yaratish:
 *   1. Приложения → Разработчикам → Другое → Входящий вебхук
 *   2. Huquqlar (Права доступа): CRM (crm)
 *   3. Yaratilgan URL'ni .env.local'dagi BITRIX_WEBHOOK_URL ga qo'ying
 */

const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;
const REQUEST_TIMEOUT_MS = 10_000; // 10 sekund

interface BitrixSuccessResponse<T> {
  result: T;
  time?: {
    start: number;
    finish: number;
    duration: number;
  };
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

/**
 * Bitrix24 REST metodini chaqiradi.
 * Timeout va xato boshqaruvi bilan.
 */
async function bitrixCall<T>(
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  if (!BITRIX_WEBHOOK_URL) {
    throw new Error(
      "BITRIX_WEBHOOK_URL muhitning o'zgaruvchisida sozlanmagan. " +
        ".env.local fayliga qo'shing."
    );
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
      throw new Error(`Bitrix24 javob bermadi (${REQUEST_TIMEOUT_MS / 1000}s timeout)`);
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
    throw new Error(
      `Bitrix24 yaroqsiz JSON qaytardi (status: ${res.status})`
    );
  }

  if (isErrorResponse(data)) {
    throw new Error(
      `Bitrix24 xato (${method}): ${data.error} — ${data.error_description}`
    );
  }

  return data.result;
}

// ============================================================
// PUBLIC API
// ============================================================

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  productName?: string;
  comments?: string;
  // UTM tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  // Texnik ma'lumotlar
  pageUrl?: string;
  clientIp?: string;
  clientUserAgent?: string;
}

export interface CreateLeadResult {
  dealId: number;
  contactId: number;
}

/**
 * Web saytdan kelgan lead'ni Bitrix24'ga yozadi.
 *
 * Logika:
 *   1. Avval Contact (mijoz) yaratiladi
 *   2. Keyin Deal yaratiladi va Contact'ga bog'lanadi
 *   3. Agar Deal yaratish xato bo'lsa — Contact saqlanib qoladi (qo'lda tekshirish uchun)
 *
 * Deal Bitrix24 default pipeline'dagi birinchi stage'ga (sizdagi
 * "Маркетинг янги лид") avtomatik tushadi.
 */
export async function createLead(
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  // -----------------------
  // 1. CONTACT yaratish
  // -----------------------
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

  // -----------------------
  // 2. Comments tayyorlash
  // -----------------------
  const commentLines: string[] = [];
  if (input.productName) {
    commentLines.push(`🚗 Mashina/qism: ${input.productName}`);
  }
  if (input.comments) {
    commentLines.push(`💬 Izoh: ${input.comments}`);
  }
  if (input.pageUrl) {
    commentLines.push(`🔗 Sahifa: ${input.pageUrl}`);
  }
  if (input.clientIp) {
    commentLines.push(`🌐 IP: ${input.clientIp}`);
  }
  if (input.clientUserAgent) {
    commentLines.push(`📱 UA: ${input.clientUserAgent}`);
  }

  // -----------------------
  // 3. DEAL yaratish
  // -----------------------
  const dealFields: Record<string, unknown> = {
    TITLE: input.productName
      ? `${input.productName} — ${input.name}`
      : `Web sayt: ${input.name}`,
    OPENED: "Y",
    CURRENCY_ID: "UZS",
    SOURCE_ID: "WEB",
    CONTACT_ID: contactId,
    COMMENTS: commentLines.join("\n"),
  };

  if (input.utmSource) dealFields.UTM_SOURCE = input.utmSource;
  if (input.utmMedium) dealFields.UTM_MEDIUM = input.utmMedium;
  if (input.utmCampaign) dealFields.UTM_CAMPAIGN = input.utmCampaign;
  if (input.utmContent) dealFields.UTM_CONTENT = input.utmContent;
  if (input.utmTerm) dealFields.UTM_TERM = input.utmTerm;

  let dealId: number;
  try {
    dealId = await bitrixCall<number>("crm.deal.add", {
      fields: dealFields,
    });
  } catch (e) {
    // Contact yaratilgan, lekin Deal xato — admin'ga signal
    console.error(
      `[bitrix] Contact ${contactId} yaratilgan, lekin Deal yaratilmadi:`,
      e
    );
    throw new Error(
      `Mijoz ma'lumotlari saqlandi, lekin sделка yaratishda xato: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  return { dealId, contactId };
}
