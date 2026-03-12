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
  // Priority:
  // 1. NEXT_PUBLIC_SITE_URL — explicit custom domain set by the user (most reliable)
  // 2. VERCEL_PROJECT_PRODUCTION_URL — stable Vercel production URL, never changes per deploy
  // 3. VERCEL_URL — deployment-specific URL (e.g. project-abc123.vercel.app), changes per deploy
  // 4. localhost fallback for local dev
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL;
  if (explicit) {
    return explicit.endsWith("/") ? explicit.slice(0, -1) : explicit;
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl) {
    const url = `https://${productionUrl}`;
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const url = /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  return "http://localhost:3000";
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

async function requestPayFastToken(input: {
  customerIp: string;
  amount: string;
  basketId: string;
}): Promise<string> {
  const tokenUrl = getRequiredEnv("PAYFAST_TOKEN_URL");
  const merchantId = getRequiredEnv("PAYFAST_MERCHANT_ID");
  const secureKey = getRequiredEnv("PAYFAST_SECURE_KEY");
  const currencyCode = process.env.PAYFAST_CURRENCY_CODE ?? "PKR";

  // Guide: Content-Type must be application/x-www-form-urlencoded
  const body = new URLSearchParams({
    merchant_id: merchantId,
    secured_key: secureKey,
    grant_type: "client_credentials",
    customer_ip: input.customerIp,
    txnamt: input.amount,
    basket_id: input.basketId,
    currency_code: currencyCode,
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await undiciFetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        dispatcher: agent,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      rawText = await res.text();
      statusCode = res.status;
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
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
  const currencyCode = process.env.PAYFAST_CURRENCY_CODE ?? "PKR";
  const amount = normalizeAmount(input.amount);
  // Append a timestamp so each payment attempt has a unique basket_id.
  // PayFast blocks retries that reuse the same basket_id while a previous
  // transaction is still "in-flight" — this prevents that lock.
  const basketId = `${input.orderId}_${Date.now()}`;
  const customerIp = input.customerIp ?? "127.0.0.1";
  const token = await requestPayFastToken({ customerIp, amount, basketId });

  const callbackUrl =
    process.env.PAYFAST_RETURN_URL ?? `${getStoreUrl()}/api/payment/payfast/return`;
  const extraFields = parseExtraFields(process.env.PAYFAST_POST_EXTRA_FIELDS);

  // Field names follow the PayFast API guide (lowercase)
  const fields: Record<string, string> = {
    merchant_id: merchantId,
    token: token,
    txnamt: amount,
    currency_code: currencyCode,
    basket_id: basketId,
    order_id: String(input.orderNumber),
    txndesc: `Order #${input.orderNumber}`,
    order_date: formatOrderDate(),
    success_url: callbackUrl,
    failure_url: callbackUrl,
    cancel_url: callbackUrl,
    notify_url: process.env.PAYFAST_NOTIFY_URL ?? `${getStoreUrl()}/api/payment/payfast/notify`,
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
  const raw = readValue(data, ["basket_id", "BASKET_ID", "basketId", "order_id", "ORDER_ID", "orderId"]);
  if (!raw) return null;

  // Strip the timestamp suffix we append per-attempt (format: orderId_1234567890)
  // orderId is a cuid/UUID — no underscores — so splitting on the last "_" is safe.
  const underscoreIdx = raw.lastIndexOf("_");
  if (underscoreIdx > 0) {
    const suffix = raw.slice(underscoreIdx + 1);
    if (/^\d+$/.test(suffix)) {
      return raw.slice(0, underscoreIdx);
    }
  }

  return raw;
}

export function isPayFastSuccess(data: Record<string, string>): boolean {
  // Per PayFast API guide error codes table:
  //   "000" / "00" = Processed OK  → success
  //   "79"  = Alternate Success response → success
  //   "001" = Pending, "002" = Timeout, all others = failure
  //
  // PayFast UAT/production return URL sends the result as "err_code".
  const code = readValue(data, [
    "err_code",    // actual field name in PayFast return URL callback
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

export async function validatePayFastITN(
  payload: Record<string, string>,
): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === "production";
  const validationUrl = isProduction
    ? "https://www.gopayfast.com/eng/query/validate"
    : "https://sandbox.gopayfast.com/eng/query/validate";

  try {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      body.append(key, value);
    }

    let responseText = "";

    if (!isProduction) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: undiciFetch, Agent } = require("undici") as typeof import("undici");
      const agent = new Agent({ connect: { rejectUnauthorized: false } });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await undiciFetch(validationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        dispatcher: agent,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseText = await res.text();
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(validationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseText = await res.text();
    }

    return responseText.trim() === "VALID";
  } catch (error) {
    console.error("[PayFast ITN Validation] Failed to validate ITN:", error);
    return false;
  }
}

/**
 * Query PayFast "Get Transaction Status" API by basket_id.
 * Per the PayFast API guide: GET /transaction/basket_id/<basket_id>
 *
 * Returns the callback-style payload so callers can use `isPayFastSuccess()`
 * on the result. Returns `null` if the API is unreachable or misconfigured.
 */
export async function getPayFastTransactionStatus(
  basketId: string,
  orderDate: string,
): Promise<Record<string, string> | null> {
  const baseUrl = process.env.PAYFAST_BASE_URL;
  if (!baseUrl) {
    // If no base URL configured, reconciliation cannot run — skip silently.
    return null;
  }

  try {
    const tokenUrl = getRequiredEnv("PAYFAST_TOKEN_URL");
    const merchantId = getRequiredEnv("PAYFAST_MERCHANT_ID");
    const secureKey = getRequiredEnv("PAYFAST_SECURE_KEY");

    // 1. Get a fresh access token
    const tokenBody = new URLSearchParams({
      merchant_id: merchantId,
      secured_key: secureKey,
      grant_type: "client_credentials",
      customer_ip: "127.0.0.1",
    });

    const isProduction = process.env.NODE_ENV === "production";
    let tokenText: string;

    if (!isProduction) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: undiciFetch, Agent } = require("undici") as typeof import("undici");
      const agent = new Agent({ connect: { rejectUnauthorized: false } });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await undiciFetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
        dispatcher: agent,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      tokenText = await res.text();
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      tokenText = await res.text();
    }

    let accessToken: string | null = null;
    try {
      const parsed = JSON.parse(tokenText) as PayFastTokenResponse;
      accessToken = parsed.token ?? parsed.ACCESS_TOKEN ?? null;
    } catch {
      const fallback = new URLSearchParams(tokenText);
      accessToken = fallback.get("token") ?? fallback.get("ACCESS_TOKEN") ?? null;
    }

    if (!accessToken) {
      console.error("[PayFast Reconcile] Could not obtain access token");
      return null;
    }

    // 2. Query transaction status by basket_id
    const statusUrl = `${baseUrl}/transaction/basket_id/${encodeURIComponent(basketId)}?order_date=${encodeURIComponent(orderDate)}&customer_ip=127.0.0.1`;

    let statusText: string;
    if (!isProduction) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: undiciFetch, Agent } = require("undici") as typeof import("undici");
      const agent = new Agent({ connect: { rejectUnauthorized: false } });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await undiciFetch(statusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
        },
        dispatcher: agent,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      statusText = await res.text();
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      statusText = await res.text();
    }

    const parsed = JSON.parse(statusText) as Record<string, unknown>;
    // Convert all values to strings so callers can use isPayFastSuccess()
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")]),
    );
  } catch (error) {
    console.error("[PayFast Reconcile] Failed to fetch transaction status:", error);
    return null;
  }
}
