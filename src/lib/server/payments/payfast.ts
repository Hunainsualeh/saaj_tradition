// Shape per PayFast API guide: POST /token response
type PayFastTokenResponse = {
  token?: string;
  refresh_token?: string;
  code?: string;
  message?: string | null;
  expiry?: number;
  // Fallback — some UAT builds still return uppercase key
  ACCESS_TOKEN?: string;
  [key: string]: unknown;
};

export type PayFastInitPayload = {
  actionUrl: string;
  fields: Record<string, string>;
  token: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function getStoreUrl(): string {
  const vercelUrl = process.env.VERCEL_URL;
  const normalizedVercelUrl = vercelUrl
    ? /^https?:\/\//i.test(vercelUrl)
      ? vercelUrl
      : `https://${vercelUrl}`
    : null;

  // On Vercel, VERCEL_URL is the production domain → prefer it over
  // NEXT_PUBLIC_SITE_URL which is usually set to localhost for local dev.
  const siteUrl =
    normalizedVercelUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
}

function parseExtraFields(raw: string | undefined): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value)]),
    );
  } catch {
    throw new Error("PAYFAST_POST_EXTRA_FIELDS must be valid JSON");
  }
}

function normalizeAmount(amount: number): string {
  return Math.max(amount, 0).toFixed(2);
}

// Guide: format YYYY-MM-DD HH:mm:ss
function formatOrderDate(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// Per the API guide the token endpoint only needs merchant_id, secured_key,
// grant_type and customer_ip — amount / basket_id are NOT part of the token call.
async function requestPayFastToken(input: {
  customerIp: string;
}): Promise<string> {
  const tokenUrl = getRequiredEnv("PAYFAST_TOKEN_URL");
  const merchantId = getRequiredEnv("PAYFAST_MERCHANT_ID");
  const secureKey = getRequiredEnv("PAYFAST_SECURE_KEY");

  // Guide: Content-Type must be application/x-www-form-urlencoded
  const body = new URLSearchParams({
    merchant_id: merchantId,
    secured_key: secureKey,
    grant_type: "client_credentials",
    customer_ip: input.customerIp,
  });

  // DEBUG logging
  console.log("[PayFast token] POST", tokenUrl, body.toString());

  // In non-production environments the UAT endpoint often uses a self-signed
  // certificate which causes Node's native fetch to ECONNRESET during the TLS
  // handshake. We use undici (bundled with Node 18+) directly so we can pass a
  // permissive TLS agent.
  const isProduction = process.env.NODE_ENV === "production";

  let rawText: string;
  let statusCode: number;

  try {
    if (!isProduction) {
      // undici is bundled with Node 18+; we import it dynamically so the
      // module resolves at runtime only (avoids bundler complaints).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: undiciFetch, Agent } = require("undici") as typeof import("undici");
      const agent = new Agent({ connect: { rejectUnauthorized: false } });

      const res = await undiciFetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        dispatcher: agent,
      });

      rawText = await res.text();
      statusCode = res.status;
    } else {
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        cache: "no-store",
      });

      rawText = await res.text();
      statusCode = res.status;
    }
  } catch (err) {
    console.error("[PayFast token] fetch error", err);
    throw err;
  }

  console.log("[PayFast token] response", statusCode, rawText.slice(0, 1000));

  let data: PayFastTokenResponse;
  try {
    data = JSON.parse(rawText) as PayFastTokenResponse;
  } catch {
    // Some UAT builds return URL-encoded responses
    const urlEncoded = new URLSearchParams(rawText);
    const fallbackToken =
      urlEncoded.get("token") ??
      urlEncoded.get("ACCESS_TOKEN") ??
      urlEncoded.get("Token");

    if (fallbackToken) {
      return fallbackToken;
    }

    throw new Error(
      `PayFast token API returned non-JSON response: ${rawText.slice(0, 200)}`,
    );
  }

  // Guide response key is "token" (lowercase); accept "ACCESS_TOKEN" as fallback
  const token =
    data.token ??
    data.ACCESS_TOKEN ??
    (typeof data.data === "object" && data.data
      ? ((data.data as Record<string, unknown>).token as string | undefined) ??
        ((data.data as Record<string, unknown>).ACCESS_TOKEN as string | undefined)
      : undefined) ??
    null;

  if (statusCode >= 400 || !token) {
    const message =
      data.errorDescription ??
      data.message ??
      data.code ??
      data.errorCode ??
      "Token generation failed";
    throw new Error(`PayFast token error: ${message}`);
  }

  return token;
}

export async function buildPayFastPaymentPayload(input: {
  amount: number;
  orderId: string;
  orderNumber: number;
  customerIp?: string;
}): Promise<PayFastInitPayload> {
  const actionUrl = getRequiredEnv("NEXT_PUBLIC_PAYFAST_POST_URL");
  const merchantId = getRequiredEnv("PAYFAST_MERCHANT_ID");
  const amount = normalizeAmount(input.amount);
  const basketId = input.orderId;
  const customerIp = input.customerIp ?? "127.0.0.1";
  const token = await requestPayFastToken({ customerIp });

  const callbackUrl =
    process.env.PAYFAST_RETURN_URL ?? `${getStoreUrl()}/api/payment/payfast/return`;
  const extraFields = parseExtraFields(process.env.PAYFAST_POST_EXTRA_FIELDS);

  // Field names follow the PayFast API guide (lowercase)
  const fields: Record<string, string> = {
    merchant_id: merchantId,
    token: token,
    txnamt: amount,
    basket_id: basketId,
    order_id: String(input.orderNumber),
    txndesc: `Order #${input.orderNumber}`,
    order_date: formatOrderDate(),
    success_url: callbackUrl,
    failure_url: callbackUrl,
    cancel_url: callbackUrl,
    customer_ip: customerIp,
    ...extraFields,
  };

  return {
    actionUrl,
    fields,
    token,
  };
}

function readValue(
  data: Record<string, string>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = data[key];
    if (value && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }

  return null;
}

export function extractPayFastOrderId(data: Record<string, string>): string | null {
  // Guide sends lowercase field names; keep uppercase as fallback for legacy UAT responses
  return readValue(data, ["basket_id", "BASKET_ID", "basketId", "order_id", "ORDER_ID", "orderId"]);
}

export function isPayFastSuccess(data: Record<string, string>): boolean {
  // Per PayFast API guide error codes table:
  //   "00"  = Processed OK  → success
  //   "79"  = Alternate Success response → success
  //   "001" = Pending, "002" = Timeout, all others = failure
  const code = readValue(data, [
    "code",        // primary field per guide transaction response
    "status_code", // alternate guide field
    "RESPONSE_CODE",
    "responseCode",
  ]);

  if (code !== null) {
    const c = code.trim();
    if (c === "00" || c === "000" || c === "0" || c === "79") return true;
    return false;
  }

  // Fallback: status message check when code field is absent
  const statusMsg = readValue(data, ["status_msg", "STATUS", "status", "TransactionStatus"]);
  if (statusMsg) {
    const msg = statusMsg.toLowerCase();
    if (msg === "processed ok" || msg.includes("success") || msg.includes("approved")) {
      return true;
    }
  }

  return false;
}
