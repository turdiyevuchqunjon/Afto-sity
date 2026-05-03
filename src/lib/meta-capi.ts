import crypto from "crypto";

/**
 * Meta Conversions API (CAPI) client
 */

const META_API_VERSION = "v21.0";
const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

function sha256(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
  externalId?: string;
}

export interface MetaEventOptions {
  eventName: "Lead" | "Purchase" | "InitiateCheckout" | "CompleteRegistration";
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData: MetaUserData;
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentIds?: string[];
    contentType?: string;
  };
  actionSource?: "website" | "system_generated" | "physical_store" | "other";
}

export interface MetaEventResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export async function sendMetaEvent(
  opts: MetaEventOptions
): Promise<MetaEventResult> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    throw new Error(
      "META_PIXEL_ID yoki META_CAPI_ACCESS_TOKEN env'da topilmadi"
    );
  }

  const u = opts.userData;
  const user_data: Record<string, string | string[]> = {};

  if (u.email) user_data.em = sha256(u.email);
  if (u.phone) user_data.ph = sha256(normalizePhone(u.phone));
  if (u.firstName) user_data.fn = sha256(u.firstName);
  if (u.lastName) user_data.ln = sha256(u.lastName);
  if (u.city) user_data.ct = sha256(u.city);
  if (u.country) user_data.country = sha256(u.country);
  if (u.externalId) user_data.external_id = sha256(u.externalId);

  if (u.fbp) user_data.fbp = u.fbp;
  if (u.fbc) user_data.fbc = u.fbc;
  if (u.clientIp) user_data.client_ip_address = u.clientIp;
  if (u.clientUserAgent) user_data.client_user_agent = u.clientUserAgent;

  const event: Record<string, unknown> = {
    event_name: opts.eventName,
    event_time: opts.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: opts.eventId,
    action_source: opts.actionSource ?? "website",
    user_data,
  };

  if (opts.eventSourceUrl) event.event_source_url = opts.eventSourceUrl;

  if (opts.customData) {
    const cd: Record<string, unknown> = {};
    if (opts.customData.value !== undefined) cd.value = opts.customData.value;
    if (opts.customData.currency) cd.currency = opts.customData.currency;
    if (opts.customData.contentName)
      cd.content_name = opts.customData.contentName;
    if (opts.customData.contentIds)
      cd.content_ids = opts.customData.contentIds;
    if (opts.customData.contentType)
      cd.content_type = opts.customData.contentType;
    event.custom_data = cd;
  }

  const payload: Record<string, unknown> = {
    data: [event],
    access_token: ACCESS_TOKEN,
  };

  if (TEST_EVENT_CODE) {
    payload.test_event_code = TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${PIXEL_ID}/events`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    body,
  };
}

export function buildFbcFromFbclid(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

export function generateEventId(): string {
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
}