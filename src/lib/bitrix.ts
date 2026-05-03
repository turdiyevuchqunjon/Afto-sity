/**
 * Bitrix24 REST API client
 */

const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;
const REQUEST_TIMEOUT_MS = 10_000;

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

  const commentLines: string[] = [];
  if (input.productName) commentLines.push(`🚗 Mashina/qism: ${input.productName}`);
  if (input.comments) commentLines.push(`💬 Izoh: ${input.comments}`);
  if (input.pageUrl) commentLines.push(`🔗 Sahifa: ${input.pageUrl}`);
  if (input.clientIp) commentLines.push(`🌐 IP: ${input.clientIp}`);
  if (input.clientUserAgent) commentLines.push(`📱 UA: ${input.clientUserAgent}`);

  const dealFields: Record<string, unknown> = {
    TITLE: input.productName
      ? `${input.productName} — ${input.name}`
      : `Web sayt: ${input.name}`,
    OPENED: "Y",
    CURRENCY_ID: "USD",
    SOURCE_ID: "WEB",
    CONTACT_ID: contactId,
    COMMENTS: commentLines.join("\n"),
  };

  if (input.utmSource) dealFields.UTM_SOURCE = input.utmSource;
  if (input.utmMedium) dealFields.UTM_MEDIUM = input.utmMedium;
  if (input.utmCampaign) dealFields.UTM_CAMPAIGN = input.utmCampaign;
  if (input.utmContent) dealFields.UTM_CONTENT = input.utmContent;
  if (input.utmTerm) dealFields.UTM_TERM = input.utmTerm;

  if (input.metaEventId) dealFields.UF_CRM_META_EVENT_ID = input.metaEventId;
  if (input.fbp) dealFields.UF_CRM_META_FBP = input.fbp;
  if (input.fbc) dealFields.UF_CRM_META_FBC = input.fbc;
  if (input.clientIp) dealFields.UF_CRM_META_CLIENT_IP = input.clientIp;
  if (input.clientUserAgent) dealFields.UF_CRM_META_CLIENT_UA = input.clientUserAgent;

  let dealId: number;
  try {
    dealId = await bitrixCall<number>("crm.deal.add", { fields: dealFields });
  } catch (e) {
    console.error(
      `[bitrix] Contact ${contactId} yaratilgan, lekin Deal yaratilmadi:`,
      e
    );
    throw new Error(
      `Mijoz saqlandi, lekin sделka xato: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  return { dealId, contactId };
}

// ============================================================
// READ DEAL
// ============================================================

export interface DealData {
  ID: string;
  TITLE: string;
  OPPORTUNITY?: string;
  CURRENCY_ID?: string;
  CONTACT_ID?: string;
  STAGE_ID?: string;
  UF_CRM_META_EVENT_ID?: string;
  UF_CRM_META_FBP?: string;
  UF_CRM_META_FBC?: string;
  UF_CRM_META_CLIENT_IP?: string;
  UF_CRM_META_CLIENT_UA?: string;
  UF_CRM_META_PURCHASE_SENT?: string;
  [key: string]: unknown;
}

export async function getDeal(dealId: number | string): Promise<DealData> {
  return bitrixCall<DealData>("crm.deal.get", { id: dealId });
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

export async function markDealAsPurchaseSent(
  dealId: number | string
): Promise<boolean> {
  return bitrixCall<boolean>("crm.deal.update", {
    id: dealId,
    fields: {
      UF_CRM_META_PURCHASE_SENT: "Y",
    },
  });
}