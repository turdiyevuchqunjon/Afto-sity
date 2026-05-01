/**
 * Browser tomonida URL'dan UTM parametrlarini va boshqa
 * tracking ma'lumotlarini yig'ish.
 */

export interface TrackingData {
  pageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

/**
 * Hozirgi sahifaning URL'i va URL parametrlaridan UTM'larni oladi.
 * Server'da chaqirilsa bo'sh obyekt qaytaradi.
 */
export function collectTrackingData(): TrackingData {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);

  return {
    pageUrl: window.location.href,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
  };
}
