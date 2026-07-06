import { NextRequest, NextResponse } from "next/server";

import { markOrderAsPaid, updateOrderDetails } from "@/lib/server/actions";
import { COOKIE_CART_ID, COOKIE_COUPON_CODE } from "@/lib/constants";
import type { DeliveryDetailsData } from "@/components/common/CheckoutForm/schema";

/**
 * COD / PayFast order placement as a NATIVE form POST → server → 303 redirect.
 *
 * Why a route handler instead of the old client flow:
 * The previous code did `await markOrderAsPaid()` and THEN
 * `window.location.href = /success` from client JS. On iOS Safari (and every
 * iOS browser, since they all use WebKit) a script-initiated navigation is only
 * honoured while the tap's "transient activation" is still fresh — and any
 * `await` expires it. So on iPhone the order was created/paid but the redirect
 * to the success page was silently dropped, leaving the customer on a cleared
 * cart. A real form submission navigates natively (within the gesture) and the
 * browser follows the server's 303 redirect natively — no gesture timing, no
 * client-side RSC fetch quirks. This is the reliable cross-browser pattern.
 */
function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone();
  const [pathname, search = ""] = path.split("?");
  url.pathname = pathname;
  url.search = search ? `?${search}` : "";
  // 303 See Other: turns the POST into a GET on the target (correct for
  // post-submit redirects).
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectTo(request, "/checkout");
  }

  const orderId = String(form.get("orderId") ?? "").trim();
  const paymentMethod = String(form.get("paymentMethod") ?? "COD");
  const deliveryRaw = String(form.get("delivery") ?? "");

  if (!orderId) {
    return redirectTo(request, "/cart");
  }

  // Parse the delivery details carried in the hidden field.
  let delivery: DeliveryDetailsData;
  try {
    delivery = JSON.parse(deliveryRaw) as DeliveryDetailsData;
  } catch {
    return redirectTo(request, "/checkout?error=1");
  }

  // Persist delivery details (re-validated server-side inside the action).
  const updateResult = await updateOrderDetails(orderId, delivery);
  if (!updateResult.success) {
    return redirectTo(request, "/checkout?error=1");
  }

  // PayFast: hand off to the existing gateway route (it renders the
  // auto-submitting PayFast form).
  if (paymentMethod === "PAYFAST") {
    return redirectTo(
      request,
      `/api/payment/payfast/checkout?orderId=${encodeURIComponent(orderId)}`,
    );
  }

  // COD: mark the order paid (idempotent) and go to the success page.
  const paidResult = await markOrderAsPaid(orderId);
  if (!paidResult.success) {
    return redirectTo(request, "/checkout?error=1");
  }

  const token = paidResult.data?.trackingToken;
  const successPath = token
    ? `/checkout/success?token=${encodeURIComponent(token)}`
    : `/checkout/success?orderId=${encodeURIComponent(orderId)}`;

  const response = redirectTo(request, successPath);
  // Belt-and-suspenders cookie cleanup on the redirect response itself, so the
  // finished cart is cleared regardless of how the server action's own cookie
  // mutations propagate from a route-handler context.
  response.cookies.delete(COOKIE_CART_ID);
  response.cookies.delete(COOKIE_COUPON_CODE);
  return response;
}
