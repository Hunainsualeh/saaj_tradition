/**
 * Standalone test email script.
 * Sends an order-confirmation test email to the specified address.
 *
 * Run:  npx tsx prisma/send-test-email.ts
 */

import * as dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const STORE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://saajtradition.com");

const TO = "alijanali0091@gmail.com";

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌  EMAIL_USER or EMAIL_PASS is not set in .env — aborting.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// A realistic fake tracking token so the link is testable
const FAKE_TRACKING_TOKEN = "test-tracking-token-12345";
const TRACKING_URL = `${STORE_URL}/track/${FAKE_TRACKING_TOKEN}`;

const EMAIL_FROM = `"Saaj Tradition" <${EMAIL_USER}>`;

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Saaj Tradition — Test Email</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f5f0eb; color: #2c2c2c; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px;text-align:center;">
            <h1 style="color:#c9a84c;font-size:28px;letter-spacing:2px;margin:0;">SAAJ TRADITION</h1>
            <p style="color:#f5f0eb;font-size:13px;margin-top:6px;letter-spacing:1px;">TEST EMAIL</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px;">✅ Email System Working</h2>
            <p style="color:#555;font-size:15px;line-height:1.8;margin-bottom:24px;">
              This is a test email from <strong>Saaj Tradition</strong>. If you're reading this,
              the email system is configured correctly.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f2;border-radius:8px;padding:20px;margin-bottom:28px;">
              <tr><td>
                <p style="font-size:13px;color:#888;margin-bottom:6px;">Order Number</p>
                <p style="font-size:18px;font-weight:700;color:#1a1a2e;">#9999 (Test)</p>
              </td></tr>
              <tr><td style="padding-top:12px;">
                <p style="font-size:13px;color:#888;margin-bottom:6px;">Customer</p>
                <p style="font-size:15px;color:#1a1a2e;">Ali Jan (Test)</p>
              </td></tr>
              <tr><td style="padding-top:12px;">
                <p style="font-size:13px;color:#888;margin-bottom:6px;">Store URL resolved to</p>
                <p style="font-size:14px;color:#0f3460;">${STORE_URL}</p>
              </td></tr>
            </table>

            <!-- Sample order item -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece8;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px;vertical-align:middle;">
                  <p style="font-weight:700;color:#1a1a2e;font-size:14px;margin-bottom:4px;">Bahawalpuri Embroidered Suit</p>
                  <p style="font-size:12px;color:#888;">Size: M &nbsp;|&nbsp; Qty: 1 × Rs. 3,500.00</p>
                </td>
                <td align="right" style="padding:14px;">
                  <p style="font-weight:700;color:#1a1a2e;font-size:15px;">Rs. 3,500.00</p>
                </td>
              </tr>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="color:#555;font-size:14px;">Subtotal</td>
                <td align="right" style="font-size:14px;color:#1a1a2e;font-weight:600;">Rs. 3,500.00</td>
              </tr>
              <tr>
                <td style="color:#555;font-size:14px;">Shipping</td>
                <td align="right" style="font-size:14px;color:#065f46;font-weight:600;">Free</td>
              </tr>
              <tr style="border-top:2px solid #f0ece8;">
                <td style="padding-top:12px;font-size:16px;font-weight:700;color:#1a1a2e;">Total</td>
                <td align="right" style="padding-top:12px;font-size:18px;font-weight:700;color:#1a1a2e;">Rs. 3,500.00</td>
              </tr>
            </table>

            <!-- Tracking CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="${TRACKING_URL}"
                     style="display:inline-block;background:#c9a84c;color:#1a1a2e;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:1px;">
                    🔍 Track My Order
                  </a>
                  <p style="margin-top:10px;font-size:12px;color:#aaa;">Tracking link: <a href="${TRACKING_URL}" style="color:#0f3460;">${TRACKING_URL}</a></p>
                </td>
              </tr>
            </table>

            <p style="font-size:13px;color:#aaa;border-top:1px solid #f0ece8;padding-top:20px;text-align:center;">
              This is an automated test email from Saaj Tradition admin.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a1a2e;padding:20px;text-align:center;">
            <p style="color:#888;font-size:12px;">© ${new Date().getFullYear()} Saaj Tradition. All rights reserved.</p>
            <p style="margin-top:6px;"><a href="${STORE_URL}" style="color:#c9a84c;font-size:12px;text-decoration:none;">${STORE_URL}</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

async function main() {
  console.log(`\n📧  Sending test email to: ${TO}`);
  console.log(`    From:         ${EMAIL_FROM}`);
  console.log(`    Store URL:    ${STORE_URL}`);
  console.log(`    Tracking URL: ${TRACKING_URL}\n`);

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: TO,
      subject: `[TEST] Saaj Tradition — Order Confirmation Email Test`,
      html,
    });

    console.log(`✅  Email sent successfully!`);
    console.log(`    Message ID: ${info.messageId}`);
    console.log(`    Response:   ${info.response}`);
  } catch (err) {
    console.error("❌  Failed to send email:", err);
    process.exit(1);
  }
}

main();
