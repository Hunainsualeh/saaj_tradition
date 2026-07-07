/**
 * Default HTML email templates for Saaj Tradition.
 * Templates support variable substitution using {{variableName}} syntax.
 * * Available variables per template type:
 * ORDER_CONFIRMATION:      {{customerName}}, {{orderNumber}}, {{orderDate}}, {{orderStatus}}, {{items}}, {{subtotal}}, {{shipping}}, {{discount}}, {{total}}, {{deliveryAddress}}, {{storeUrl}}
 * ORDER_ADMIN_NOTIFICATION: {{customerName}}, {{customerEmail}}, {{customerPhone}}, {{orderNumber}}, {{orderDate}}, {{items}}, {{subtotal}}, {{shipping}}, {{discount}}, {{total}}, {{deliveryAddress}}, {{adminOrderUrl}}
 * ORDER_STATUS_UPDATE:     {{customerName}}, {{orderNumber}}, {{orderStatus}}, {{storeUrl}}
 * NEWSLETTER:              {{subscriberName}}, {{subject}}, {{body}}, {{storeUrl}}
 * PRODUCT_UPDATE:          {{productName}}, {{productDescription}}, {{productPrice}}, {{productImageUrl}}, {{productUrl}}, {{storeUrl}}
 * COLLECTION_UPDATE:       {{collectionName}}, {{collectionDescription}}, {{collectionImageUrl}}, {{collectionUrl}}, {{storeUrl}}
 */

// Elegant Pastel Color Palette
const BG_BODY = "#FAF8F5"; 
const BG_CARD = "#FFFFFF";
const PASTEL_ACCENT = "#F0EBE1"; 
const PASTEL_HIGHLIGHT = "#E6DAC3"; 
const TEXT_DARK = "#2C2C2C";
const TEXT_MUTED = "#737373";

const LOGO_URL = "https://res.cloudinary.com/db5uillhc/image/upload/v1773048715/saaj-tradition/logo-golden.png";

const emailBase = (content: string, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Saaj Tradition</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Lato', Arial, sans-serif; background-color: ${BG_BODY}; color: ${TEXT_DARK}; -webkit-font-smoothing: antialiased; }
    a { color: inherit; }
    img { max-width: 100%; height: auto; display: block; }
    
    /* Defensive CSS to fix white tracking ID from backend */
    .fix-tracking-color, .fix-tracking-color a, .fix-tracking-color span, .fix-tracking-color td {
      color: ${TEXT_DARK} !important;
    }

    /* Premium Button Styles */
    .btn {
      display: inline-block;
      background-color: ${PASTEL_HIGHLIGHT};
      color: ${TEXT_DARK} !important;
      text-decoration: none;
      padding: 16px 42px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      transition: opacity 0.3s ease;
    }
    
    .btn-outline {
      display: inline-block;
      background-color: transparent;
      border: 1px solid ${TEXT_DARK};
      color: ${TEXT_DARK} !important;
      text-decoration: none;
      padding: 15px 42px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    /* Responsive Styles for Mobile */
    @media (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-body { padding: 32px 20px !important; border-radius: 16px !important; }
      .info-grid { display: block !important; }
      .info-grid td { display: block !important; width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.05) !important; padding: 16px 0 !important; }
      .info-grid td:last-child { border-bottom: none !important; }
      /* Keep the product thumbnail visible on mobile (previously hidden) — just
         tighten it so the row still fits a narrow screen. */
      .item-image { padding: 10px !important; width: 56px !important; }
      .item-image img { width: 48px !important; height: 48px !important; }
      h2 { font-size: 20px !important; }
    }
  </style>
</head>
<body style="background-color: ${BG_BODY}; margin: 0; padding: 0;">
<!-- Preheader: the preview snippet shown in the inbox list, hidden in the body. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BG_BODY};opacity:0;">${preheader}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BG_BODY}; min-height: 100vh;">
  <tr><td align="center" class="email-wrapper" style="padding: 60px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 800px; margin: 0 auto;">
      <tr>
        <td style="text-align: center; padding-bottom: 40px;">
          <a href="{{storeUrl}}" style="display: inline-block;">
            <img src="${LOGO_URL}" alt="Saaj Tradition" width="90" height="90" style="width: 90px; height: 90px; object-fit: contain; display: inline-block; border: 0; outline: none; text-decoration: none;" />
          </a>
          <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 500; color: ${TEXT_DARK}; letter-spacing: 3px; line-height: 1.2; margin-top: 16px; text-transform: uppercase;">
            Saaj Tradition
          </div>
        </td>
      </tr>
      <tr>
        <td style="background-color: ${BG_CARD}; padding: 56px 64px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.04);" class="email-body">
          ${content}
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 0; text-align: center;">
          <p style="font-family: 'Lato', sans-serif; font-size: 12px; color: ${TEXT_MUTED}; line-height: 1.6; letter-spacing: 0.5px;">
            © ${new Date().getFullYear()} Saaj Tradition. Bahawalpur, Pakistan.<br/>
            <a href="{{storeUrl}}" style="color: ${TEXT_DARK}; text-decoration: underline; margin-top: 8px; display: inline-block;">Visit our store</a>
          </p>
          <p style="font-family: 'Lato', sans-serif; font-size: 11px; color: ${TEXT_MUTED}; margin-top: 12px; line-height: 2;">
            <a href="{{storeUrl}}/return-policy" style="color: ${TEXT_MUTED}; text-decoration: underline;">Return Policy</a>
            &nbsp;&middot;&nbsp;
            <a href="{{storeUrl}}/privacy-policy" style="color: ${TEXT_MUTED}; text-decoration: underline;">Privacy Policy</a>
            &nbsp;&middot;&nbsp;
            <a href="{{storeUrl}}/terms-of-use" style="color: ${TEXT_MUTED}; text-decoration: underline;">Terms of Use</a>
            &nbsp;&middot;&nbsp;
            <a href="{{storeUrl}}/terms-of-sale" style="color: ${TEXT_MUTED}; text-decoration: underline;">Terms of Sale</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;

const sectionHeading = (text: string) => `
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 24px; text-transform: capitalize; letter-spacing: 0.5px;">${text}</h2>
`;

// Bulletproof buttons: the .btn/.btn-outline classes only exist in the <head>
// <style>, which Gmail's mobile app and several webmail clients strip. Repeating
// the full styling INLINE guarantees the CTA still looks like a button there.
const btnPrimary = (href: string, label: string) => `
  <a href="${href}" class="btn" style="display:inline-block;background-color:${PASTEL_HIGHLIGHT};color:${TEXT_DARK};text-decoration:none;padding:16px 42px;border-radius:50px;font-family:'Lato',Arial,sans-serif;font-weight:700;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;mso-padding-alt:16px 42px;">${label}</a>`;

const btnOutline = (href: string, label: string) => `
  <a href="${href}" class="btn-outline" style="display:inline-block;background-color:transparent;border:1px solid ${TEXT_DARK};color:${TEXT_DARK};text-decoration:none;padding:15px 42px;border-radius:50px;font-family:'Lato',Arial,sans-serif;font-weight:700;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;mso-padding-alt:15px 42px;">${label}</a>`;

// ─── ORDER CONFIRMATION (Customer) ───────────────────────────────────────────
export const ORDER_CONFIRMATION_TEMPLATE = {
  subject: "Order Confirmed — #{{orderNumber}} | Saaj Tradition",
  html: emailBase(`
    <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 16px;">
      Thank you, {{customerName}}.
    </p>
    <p style="color: ${TEXT_MUTED}; line-height: 1.8; margin-bottom: 32px; font-size: 15px;">
      Your order has been beautifully received and is currently being prepared with care. We will notify you the moment it ships.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" class="fix-tracking-color" style="background-color: ${PASTEL_ACCENT}; border-radius: 16px; padding: 32px; margin-bottom: 40px;">
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" class="info-grid">
            <tr>
              <td style="padding: 0 24px; border-right: 1px solid rgba(0,0,0,0.08); text-align: center;">
                <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 8px;">Order No.</p>
                <p style="font-size: 20px; font-weight: 600; color: ${TEXT_DARK}; font-family: 'Playfair Display', Georgia, serif;">#{{orderNumber}}</p>
              </td>
              <td style="padding: 0 24px; border-right: 1px solid rgba(0,0,0,0.08); text-align: center;">
                <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 8px;">Date</p>
                <p style="font-size: 15px; font-weight: 500; color: ${TEXT_DARK};">{{orderDate}}</p>
              </td>
              <td style="padding: 0 24px; text-align: center;">
                <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 8px;">Status</p>
                <p>{{orderStatusBadge}}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      {{trackingIdRow}}
    </table>

    ${sectionHeading("Order Summary")}
    <div style="margin-bottom: 32px;">
      {{items}}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; padding-top: 24px; border-top: 1px solid ${PASTEL_ACCENT};">
      <tr><td style="padding: 8px 0; color: ${TEXT_MUTED}; font-size: 15px;">Subtotal</td><td align="right" style="padding: 8px 0; font-size: 15px; color: ${TEXT_DARK};">Rs. {{subtotal}}</td></tr>
      <tr><td style="padding: 8px 0; color: ${TEXT_MUTED}; font-size: 15px;">Shipping</td><td align="right" style="padding: 8px 0; font-size: 15px; color: ${TEXT_DARK};">{{shipping}}</td></tr>
      {{discountRow}}
      <tr>
        <td style="padding: 24px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 600; color: ${TEXT_DARK};">Total</td>
        <td align="right" style="padding: 24px 0 0 0; font-size: 22px; font-weight: 700; color: ${TEXT_DARK};">Rs. {{total}}</td>
      </tr>
    </table>

    <div style="margin-top: 48px;">
      {{deliverySection}}
    </div>

    <div style="text-align: center; margin-top: 56px;">
      <span style="display:inline-block; margin: 0 6px 16px;">${btnPrimary("{{trackingUrl}}", "Track My Order")}</span>
      <span style="display:inline-block; margin: 0 6px 16px;">${btnOutline("{{storeUrl}}", "Continue Shopping")}</span>
    </div>

    <div style="margin-top: 48px; text-align: center;">
      <p style="font-size: 14px; color: ${TEXT_MUTED}; line-height: 1.6;">
        Questions about your order? Reach out to us at <br/>
        <a href="mailto:{{storeEmail}}" style="color: ${TEXT_DARK}; font-weight: 600;">{{storeEmail}}</a>
      </p>
    </div>
  `, "Thank you — your order #{{orderNumber}} is confirmed and being prepared with care."),
};

// ─── ORDER ADMIN NOTIFICATION ─────────────────────────────────────────────────
export const ORDER_ADMIN_NOTIFICATION_TEMPLATE = {
  subject: "🛍️ New Order #{{orderNumber}} — Rs. {{total}}",
  html: emailBase(`
    ${sectionHeading("New Order Received")}
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${PASTEL_HIGHLIGHT}; border-radius: 16px; margin-bottom: 40px;">
      <tr><td style="padding: 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" class="info-grid">
          <tr>
            <td style="padding: 0 24px; border-right: 1px solid rgba(0,0,0,0.08); text-align: center;">
              <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 8px;">Order No.</p>
              <p style="font-size: 22px; font-weight: 600; color: ${TEXT_DARK}; font-family: 'Playfair Display', Georgia, serif;">#{{orderNumber}}</p>
            </td>
            <td style="padding: 0 24px; border-right: 1px solid rgba(0,0,0,0.08); text-align: center;">
              <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 8px;">Total</p>
              <p style="font-size: 20px; font-weight: 700; color: ${TEXT_DARK};">Rs. {{total}}</p>
            </td>
            <td style="padding: 0 24px; text-align: center;">
              <p style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 8px;">Date</p>
              <p style="font-size: 15px; font-weight: 500; color: ${TEXT_DARK};">{{orderDate}}</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${sectionHeading("Customer Details")}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BG_BODY}; border-radius: 12px; margin-bottom: 40px; border: 1px solid rgba(0,0,0,0.03);">
      <tr><td style="padding: 32px;">
        <p style="margin-bottom: 12px; font-size: 15px; color: ${TEXT_MUTED};"><strong style="color: ${TEXT_DARK}; min-width: 70px; display: inline-block;">Name:</strong> {{customerName}}</p>
        <p style="margin-bottom: 12px; font-size: 15px; color: ${TEXT_MUTED};"><strong style="color: ${TEXT_DARK}; min-width: 70px; display: inline-block;">Email:</strong> {{customerEmail}}</p>
        <p style="font-size: 15px; color: ${TEXT_MUTED};"><strong style="color: ${TEXT_DARK}; min-width: 70px; display: inline-block;">Phone:</strong> {{customerPhone}}</p>
      </td></tr>
    </table>

    ${sectionHeading("Order Items")}
    {{items}}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; padding-top: 24px; border-top: 1px solid ${PASTEL_ACCENT};">
      <tr><td style="padding: 8px 0; color: ${TEXT_MUTED}; font-size: 15px;">Subtotal</td><td align="right" style="padding: 8px 0; font-size: 15px;">Rs. {{subtotal}}</td></tr>
      <tr><td style="padding: 8px 0; color: ${TEXT_MUTED}; font-size: 15px;">Shipping</td><td align="right" style="padding: 8px 0; font-size: 15px;">{{shipping}}</td></tr>
      {{discountRow}}
      <tr>
        <td style="padding: 24px 0 0 0; font-size: 20px; font-weight: 600; color: ${TEXT_DARK}; font-family: 'Playfair Display', Georgia, serif;">Total</td>
        <td align="right" style="padding: 24px 0 0 0; font-size: 22px; font-weight: 700; color: ${TEXT_DARK};">Rs. {{total}}</td>
      </tr>
    </table>

    <div style="margin-top: 48px;">
      {{deliverySection}}
    </div>

    <div style="text-align: center; margin-top: 56px;">
      ${btnPrimary("{{adminOrderUrl}}", "View In Dashboard")}
    </div>
  `, "New order #{{orderNumber}} — Rs. {{total}} from {{customerName}}."),
};

// ─── ORDER STATUS UPDATE ──────────────────────────────────────────────────────
export const ORDER_STATUS_UPDATE_TEMPLATE = {
  subject: "Order #{{orderNumber}} Update — {{orderStatus}} | Saaj Tradition",
  html: emailBase(`
    <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 16px;">
      Order Update
    </p>
    <p style="color: ${TEXT_MUTED}; line-height: 1.8; margin-bottom: 32px; font-size: 15px;">
      Dear <strong>{{customerName}}</strong>,<br/><br/>
      We wanted to let you know that the status of your order has changed.
    </p>

    <div class="fix-tracking-color" style="background-color: ${PASTEL_ACCENT}; border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 48px;">
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: ${TEXT_MUTED}; text-transform: uppercase; margin-bottom: 16px;">Order #{{orderNumber}}</p>
      <div style="margin-bottom: 20px;">{{orderStatusBadge}}</div>
      <p style="font-size: 15px; color: ${TEXT_DARK}; line-height: 1.6;">{{statusMessage}}</p>
    </div>

    {{customMessage}}

    <div style="text-align: center; margin-top: 56px;">
      <span style="display:inline-block; margin: 0 6px 16px;">${btnPrimary("{{trackingUrl}}", "Track My Order")}</span>
      <span style="display:inline-block; margin: 0 6px 16px;">${btnOutline("{{storeUrl}}", "Visit Store")}</span>
    </div>
  `, "An update on your order #{{orderNumber}} — {{orderStatus}}."),
};

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
export const NEWSLETTER_TEMPLATE = {
  subject: "{{subject}} | Saaj Tradition",
  html: emailBase(`
    ${sectionHeading("{{emailHeading}}")}
    <p style="color: ${TEXT_MUTED}; line-height: 1.8; margin-bottom: 24px; font-size: 15px;">
      Dear <strong>{{subscriberName}}</strong>,
    </p>

    <div style="color: ${TEXT_DARK}; line-height: 1.8; font-size: 15px; margin-bottom: 40px;">
      {{body}}
    </div>

    <div style="border-radius: 16px; overflow: hidden;">
      {{imageSection}}
    </div>

    <div style="text-align: center; margin-top: 56px;">
      ${btnPrimary("{{ctaUrl}}", "{{ctaText}}")}
    </div>

    <div style="margin-top: 56px; padding-top: 32px; border-top: 1px solid ${PASTEL_ACCENT}; text-align: center;">
      <p style="font-size: 13px; color: ${TEXT_MUTED}; line-height: 1.6;">
        You're receiving this because you subscribed to our elegant updates.<br/>
        <a href="{{unsubscribeUrl}}" style="color: ${TEXT_DARK}; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `, "{{emailHeading}} — a note from Saaj Tradition."),
};

// ─── PRODUCT UPDATE ───────────────────────────────────────────────────────────
export const PRODUCT_UPDATE_TEMPLATE = {
  subject: "New Arrival: {{productName}} | Saaj Tradition",
  html: emailBase(`
    <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 16px; text-align: center;">
      Just Arrived
    </p>
    <p style="color: ${TEXT_MUTED}; line-height: 1.8; margin-bottom: 40px; font-size: 15px; text-align: center;">
      Discover the latest addition to our carefully curated collection.
    </p>

    <div style="background-color: ${BG_BODY}; border-radius: 16px; overflow: hidden; margin-bottom: 48px; border: 1px solid rgba(0,0,0,0.03);">
      {{productImageSection}}
      <div style="padding: 40px 32px; text-align: center;">
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: ${TEXT_DARK}; margin-bottom: 16px;">{{productName}}</h3>
        <p style="font-size: 15px; color: ${TEXT_MUTED}; line-height: 1.6; margin-bottom: 24px;">{{productDescription}}</p>
        <span style="font-size: 20px; font-weight: 600; color: ${TEXT_DARK}; font-family: 'Lato', sans-serif;">Rs. {{productPrice}}</span>
      </div>
    </div>

    <div style="text-align: center;">
      ${btnPrimary("{{productUrl}}", "Shop Now")}
    </div>

    <div style="margin-top: 56px; padding-top: 32px; border-top: 1px solid ${PASTEL_ACCENT}; text-align: center;">
      <p style="font-size: 13px; color: ${TEXT_MUTED}; line-height: 1.6;">
        <a href="{{unsubscribeUrl}}" style="color: ${TEXT_DARK}; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `, "Just arrived: {{productName}} — now at Saaj Tradition."),
};

// ─── COLLECTION UPDATE ────────────────────────────────────────────────────────
export const COLLECTION_UPDATE_TEMPLATE = {
  subject: "New Collection: {{collectionName}} | Saaj Tradition",
  html: emailBase(`
    <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 16px; text-align: center;">
      A New Story Begins
    </p>
    <p style="color: ${TEXT_MUTED}; line-height: 1.8; margin-bottom: 40px; font-size: 15px; text-align: center;">
      Immerse yourself in our newest collection, crafted with patience and passion.
    </p>

    <div style="border-radius: 16px; overflow: hidden; margin-bottom: 48px; background-color: ${PASTEL_ACCENT};">
      {{collectionImageSection}}
      <div style="padding: 40px 32px; text-align: center;">
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; color: ${TEXT_DARK}; margin-bottom: 16px;">{{collectionName}}</h3>
        <p style="font-size: 15px; color: ${TEXT_DARK}; line-height: 1.8; opacity: 0.85;">{{collectionDescription}}</p>
      </div>
    </div>

    <div style="text-align: center;">
      ${btnPrimary("{{collectionUrl}}", "Explore Collection")}
    </div>

    <div style="margin-top: 56px; padding-top: 32px; border-top: 1px solid ${PASTEL_ACCENT}; text-align: center;">
      <p style="font-size: 13px; color: ${TEXT_MUTED}; line-height: 1.6;">
        <a href="{{unsubscribeUrl}}" style="color: ${TEXT_DARK}; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `, "A new collection has arrived: {{collectionName}}."),
};

// ─── WELCOME EMAIL (new subscriber) ─────────────────────────────────────────
export const WELCOME_EMAIL_TEMPLATE = {
  subject: "Welcome to Saaj Tradition",
  html: emailBase(`
    <div style="text-align: center; margin-bottom: 40px;">
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 20px;">
        Welcome.
      </p>
      <p style="color: ${TEXT_MUTED}; line-height: 1.8; font-size: 15px;">
        Dear <strong>{{subscriberName}}</strong>,<br/><br/>
        We're honored to have you with us. You've joined a space that celebrates elegance, heritage, and meticulous craftsmanship.
      </p>
    </div>

    <div style="background-color: ${PASTEL_ACCENT}; border-radius: 16px; padding: 48px 32px; margin-bottom: 48px; text-align: center;">
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: ${TEXT_DARK}; font-weight: 500; margin-bottom: 40px;">What awaits you</p>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 0 16px; text-align: center; width: 33.33%;">
            <p style="font-size: 12px; font-weight: 700; color: ${TEXT_DARK}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Collections</p>
            <p style="font-size: 14px; color: ${TEXT_MUTED}; line-height: 1.6;">First access to new arrivals</p>
          </td>
          <td style="padding: 0 16px; text-align: center; width: 33.33%;">
            <p style="font-size: 12px; font-weight: 700; color: ${TEXT_DARK}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Privileges</p>
            <p style="font-size: 14px; color: ${TEXT_MUTED}; line-height: 1.6;">Exclusive member rewards</p>
          </td>
          <td style="padding: 0 16px; text-align: center; width: 33.33%;">
            <p style="font-size: 12px; font-weight: 700; color: ${TEXT_DARK}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Heritage</p>
            <p style="font-size: 14px; color: ${TEXT_MUTED}; line-height: 1.6;">Stories behind the craft</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 48px;">
      ${btnPrimary("{{storeUrl}}", "Step Inside")}
    </div>

    <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.8; text-align: center; font-style: italic;">
      Warm regards,<br/>
      <strong style="color: ${TEXT_DARK}; font-style: normal;">The Saaj Tradition Team</strong>
    </p>

    <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid ${PASTEL_ACCENT}; text-align: center;">
      <p style="font-size: 13px; color: ${TEXT_MUTED};">
        <a href="{{unsubscribeUrl}}" style="color: ${TEXT_DARK}; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `, "Welcome to Saaj Tradition — elegance, heritage, and craftsmanship await."),
};

// ─── THANK-YOU EMAIL (order customer) ───────────────────────────────────────
export const THANK_YOU_EMAIL_TEMPLATE = {
  subject: "With Gratitude | Saaj Tradition",
  html: emailBase(`
    <div style="text-align: center; margin-bottom: 40px;">
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 600; color: ${TEXT_DARK}; margin-bottom: 20px;">
        Thank You.
      </p>
      <p style="color: ${TEXT_MUTED}; line-height: 1.8; font-size: 15px;">
        Dear <strong>{{customerName}}</strong>,<br/><br/>
        We wanted to pause and personally thank you for your order <strong>#{{orderNumber}}</strong>.
      </p>
    </div>

    <div class="fix-tracking-color" style="background-color: ${PASTEL_HIGHLIGHT}; border-radius: 16px; padding: 48px 40px; margin-bottom: 48px; text-align: center;">
      <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: ${TEXT_DARK}; font-weight: 500; margin-bottom: 20px;">
        A testament to tradition.
      </p>
      <p style="font-size: 15px; color: ${TEXT_DARK}; line-height: 1.8; max-width: 500px; margin: 0 auto; opacity: 0.85;">
        Every piece is made with intention. We hope it brings an unparalleled sense of elegance to your wardrobe.
      </p>
    </div>

    <p style="color: ${TEXT_MUTED}; line-height: 1.8; margin-bottom: 48px; text-align: center; font-size: 15px;">
      If you need anything at all, simply reply to this email. We are always here for you.
    </p>

    <div style="text-align: center; margin-bottom: 48px;">
      ${btnPrimary("{{storeUrl}}", "Return to Store")}
    </div>

    <p style="color: ${TEXT_MUTED}; font-size: 15px; line-height: 1.8; text-align: center; font-style: italic;">
      With sincere gratitude,<br/>
      <strong style="color: ${TEXT_DARK}; font-style: normal;">The Saaj Tradition Team</strong>
    </p>
  `, "A heartfelt thank you for your order #{{orderNumber}} from Saaj Tradition."),
};