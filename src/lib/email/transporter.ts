import nodemailer from "nodemailer";

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("[Email] EMAIL_USER or EMAIL_PASS env vars not set. Emails will not be sent.");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Reuse a small pool of SMTP connections instead of opening a new one per
  // message — dramatically faster for newsletter/broadcast batches and avoids
  // Gmail rate-limiting from connection churn.
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
});

export const EMAIL_FROM = `"Saaj Tradition" <${process.env.EMAIL_USER}>`;
export const ADMIN_EMAIL = process.env.EMAIL_USER ?? "";
