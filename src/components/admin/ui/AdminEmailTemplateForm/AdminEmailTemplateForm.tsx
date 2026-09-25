"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Code2, Loader2, RefreshCw, Paintbrush, Monitor } from "lucide-react";
import type { EmailTemplate, EmailTemplateType } from "@prisma/client";
import { adminRoutes } from "@/lib";
import { AdminButton } from "../AdminButton";
import {
  createEmailTemplate,
  updateEmailTemplate,
} from "@/lib/server/actions/email-actions";
import {
  ORDER_CONFIRMATION_TEMPLATE,
  ORDER_ADMIN_NOTIFICATION_TEMPLATE,
  ORDER_STATUS_UPDATE_TEMPLATE,
  NEWSLETTER_TEMPLATE,
  PRODUCT_UPDATE_TEMPLATE,
  COLLECTION_UPDATE_TEMPLATE,
} from "@/lib/email/templates";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TEMPLATE_TYPES = [
  { value: "ORDER_CONFIRMATION", label: "Order Confirmation (Customer)" },
  { value: "ORDER_ADMIN_NOTIFICATION", label: "New Order Notification (Admin)" },
  { value: "ORDER_STATUS_UPDATE", label: "Order Status Update (Customer)" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "PRODUCT_UPDATE", label: "Product Update" },
  { value: "COLLECTION_UPDATE", label: "Collection Update" },
  { value: "CUSTOM", label: "Custom" },
] as const;

const DEFAULT_TEMPLATES: Record<string, { subject: string; html: string }> = {
  ORDER_CONFIRMATION: ORDER_CONFIRMATION_TEMPLATE,
  ORDER_ADMIN_NOTIFICATION: ORDER_ADMIN_NOTIFICATION_TEMPLATE,
  ORDER_STATUS_UPDATE: ORDER_STATUS_UPDATE_TEMPLATE,
  NEWSLETTER: NEWSLETTER_TEMPLATE,
  PRODUCT_UPDATE: PRODUCT_UPDATE_TEMPLATE,
  COLLECTION_UPDATE: COLLECTION_UPDATE_TEMPLATE,
  CUSTOM: {
    subject: "Subject",
    html: `<h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1a1a2e;margin-bottom:8px;">Your Heading Here</h2><div style="width:48px;height:2px;background:#c9a84c;margin-bottom:20px;"></div><p style="color:#555;line-height:1.7;">Your email message goes here. You can write anything you want.</p>`,
  },
};

// ─── SAMPLE DATA FOR LIVE PREVIEW ─────────────────────────────────────────────

const SAMPLE_VARS: Record<string, Record<string, string>> = {
  ORDER_CONFIRMATION: {
    customerName: "Ayesha Khan",
    orderNumber: "1042",
    orderDate: "March 5, 2026",
    orderStatus: "CONFIRMED",
    orderStatusBadge: `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;background:#d1fae5;color:#065f46;">CONFIRMED</span>`,
    items: `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece8;border-radius:8px;margin-bottom:12px;"><tr><td style="padding:12px;vertical-align:middle;"><p style="font-weight:600;color:#1a1a2e;font-size:14px;margin-bottom:4px;">Bahawalpuri Embroidered Suit</p><p style="font-size:12px;color:#888;margin-bottom:2px;">Size: M</p><p style="font-size:12px;color:#888;">Qty: 1 × Rs. 3,500</p></td><td align="right" style="padding:12px;vertical-align:middle;"><p style="font-weight:700;color:#1a1a2e;font-size:15px;">Rs. 3,500</p></td></tr></table>`,
    subtotal: "3,500.00",
    shipping: "Free",
    discountRow: "",
    total: "3,500.00",
    deliverySection: `<div style="margin-top:28px;padding:20px;background:#faf8f5;border-radius:8px;border-left:3px solid #c9a84c;"><p style="font-size:10px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;margin-bottom:8px;">Delivery Address</p><p style="font-size:14px;color:#444;line-height:1.8;">Ayesha Khan<br/>123 Model Town<br/>Bahawalpur, Punjab, 63100<br/>Pakistan</p></div>`,
    storeUrl: "#",
    storeEmail: "saajtraditionbahawalpur@gmail.com",
    adminOrderUrl: "#",
  },
  ORDER_ADMIN_NOTIFICATION: {
    customerName: "Ayesha Khan",
    customerEmail: "ayesha@example.com",
    customerPhone: "+92 300 1234567",
    orderNumber: "1042",
    orderDate: "March 5, 2026",
    orderStatus: "PENDING",
    orderStatusBadge: `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;background:#fef3c7;color:#92400e;">PENDING</span>`,
    items: `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece8;border-radius:8px;margin-bottom:12px;"><tr><td style="padding:12px;vertical-align:middle;"><p style="font-weight:600;color:#1a1a2e;font-size:14px;margin-bottom:4px;">Bahawalpuri Embroidered Suit</p><p style="font-size:12px;color:#888;margin-bottom:2px;">Size: M</p><p style="font-size:12px;color:#888;">Qty: 1 × Rs. 3,500</p></td><td align="right" style="padding:12px;vertical-align:middle;"><p style="font-weight:700;color:#1a1a2e;font-size:15px;">Rs. 3,500</p></td></tr></table>`,
    subtotal: "3,500.00",
    shipping: "Free",
    discountRow: "",
    total: "3,500.00",
    deliverySection: `<div style="margin-top:28px;padding:20px;background:#faf8f5;border-radius:8px;border-left:3px solid #c9a84c;"><p style="font-size:10px;font-weight:700;letter-spacing:2px;color:#c9a84c;text-transform:uppercase;margin-bottom:8px;">Delivery Address</p><p style="font-size:14px;color:#444;line-height:1.8;">Ayesha Khan<br/>123 Model Town<br/>Bahawalpur, Punjab, 63100<br/>Pakistan</p></div>`,
    storeUrl: "#",
    adminOrderUrl: "#",
  },
  ORDER_STATUS_UPDATE: {
    customerName: "Ayesha Khan",
    orderNumber: "1042",
    orderStatus: "SHIPPED",
    orderStatusBadge: `<span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;background:#ede9fe;color:#5b21b6;">SHIPPED</span>`,
    statusMessage: "Your order has been shipped and is on its way!",
    customMessage: `<div style="margin-top:20px;padding:16px;background:#faf8f5;border-left:3px solid #c9a84c;border-radius:4px;"><p style="font-size:14px;color:#444;line-height:1.8;">Your package will arrive in 2-3 business days.</p></div>`,
    storeUrl: "#",
    storeEmail: "saajtraditionbahawalpur@gmail.com",
  },
  NEWSLETTER: {
    subscriberName: "Valued Customer",
    emailHeading: "New Collection Alert",
    subject: "Discover Our Spring Collection",
    body: `<p style="font-size:15px;color:#555;line-height:1.8;">We're excited to share our brand new Spring 2026 collection featuring traditional Bahawalpuri designs with a modern twist.</p>`,
    imageSection: `<div style="margin:24px 0;border-radius:8px;overflow:hidden;"><img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80" alt="Newsletter" style="width:100%;height:auto;max-height:320px;object-fit:cover;" /></div>`,
    ctaText: "Shop the Collection",
    ctaUrl: "#",
    storeUrl: "#",
    unsubscribeUrl: "#",
  },
  PRODUCT_UPDATE: {
    productName: "Bahawalpuri Embroidered Suit",
    productDescription: "Elegant hand-embroidered suit featuring traditional Bahawalpuri motifs, crafted from premium cotton fabric.",
    productPrice: "3,500.00",
    productImageSection: `<img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80" alt="Product" style="width:100%;height:220px;object-fit:cover;" />`,
    productUrl: "#",
    storeUrl: "#",
    unsubscribeUrl: "#",
  },
  COLLECTION_UPDATE: {
    collectionName: "Spring Heritage",
    collectionDescription: "A curated collection celebrating the rich textile heritage of Bahawalpur.",
    collectionImageSection: `<img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80" alt="Collection" style="width:100%;height:240px;object-fit:cover;" />`,
    collectionUrl: "#",
    storeUrl: "#",
    unsubscribeUrl: "#",
  },
  CUSTOM: { storeUrl: "#" },
};

function buildPreviewHtml(html: string, type: string): string {
  const vars = SAMPLE_VARS[type] ?? SAMPLE_VARS.CUSTOM;
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key)
      ? vars[key]
      : `<mark style="background:#ffe4e4;color:#b00;padding:0 4px;border-radius:2px;">[${key}]</mark>`,
  );
}

// ─── REGEX HELPERS FOR QUICK-TEXT EXTRACTION ──────────────────────────────────

const HEADING_RE = /<h2([^>]*)>([^<]+)<\/h2>/;
const PARA_RE = /<p\s+style="([^"]*color:#555[^"]*)"([^>]*)>([\s\S]*?)<\/p>/;
const CTA_TEXT_RE = /(<a\s+href="[^"]*"\s+style="[^"]*background:#e94560[^"]*"[^>]*>)([\s\S]*?)(<\/a>)/;
const CTA_HREF_RE = /(<a\s+href=")([^"]+)("\s+style="[^"]*background:#e94560)/;

type Props = {
  template?: EmailTemplate;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function AdminEmailTemplateForm({ template }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "code">("visual");

  const [type, setType] = useState<string>(template?.type ?? "ORDER_CONFIRMATION");
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(
    template?.subject ?? DEFAULT_TEMPLATES["ORDER_CONFIRMATION"].subject,
  );
  const [htmlContent, setHtmlContent] = useState(
    template?.htmlContent ?? DEFAULT_TEMPLATES["ORDER_CONFIRMATION"].html,
  );

  // Palette state — defaults match the built-in Saaj template palette
  const [accentColor, setAccentColor] = useState("#e94560");
  const [goldColor, setGoldColor] = useState("#c9a84c");
  const [headerBg, setHeaderBg] = useState("#1a1a2e");

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!template) {
      const def = DEFAULT_TEMPLATES[newType] ?? DEFAULT_TEMPLATES["CUSTOM"];
      setSubject(def.subject);
      setHtmlContent(def.html);
      setAccentColor("#e94560");
      setGoldColor("#c9a84c");
      setHeaderBg("#1a1a2e");
    }
  };

  const handleLoadDefault = () => {
    const def = DEFAULT_TEMPLATES[type] ?? DEFAULT_TEMPLATES["CUSTOM"];
    setSubject(def.subject);
    setHtmlContent(def.html);
    setAccentColor("#e94560");
    setGoldColor("#c9a84c");
    setHeaderBg("#1a1a2e");
    toast.success("Default template loaded — customise it below");
  };

  const handleAccentChange = (newColor: string) => {
    setHtmlContent((prev) => prev.split(accentColor).join(newColor));
    setAccentColor(newColor);
  };

  const handleGoldChange = (newColor: string) => {
    setHtmlContent((prev) => prev.split(goldColor).join(newColor));
    setGoldColor(newColor);
  };

  const handleHeaderBgChange = (newColor: string) => {
    setHtmlContent((prev) => prev.split(headerBg).join(newColor));
    setHeaderBg(newColor);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Template name is required"); return; }
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!htmlContent.trim()) { toast.error("Email content is required"); return; }

    setSaving(true);
    try {
      const result = template
        ? await updateEmailTemplate(template.id, { name, subject, htmlContent })
        : await createEmailTemplate({ type: type as EmailTemplateType, name, subject, htmlContent });

      if (result.success) {
        toast.success(template ? "Template saved!" : "Template created!");
        router.push(adminRoutes.emails);
        return;
      }
      toast.error(result.error || "Failed to save template");
      setSaving(false);
    } catch {
      toast.error("Failed to save template");
      setSaving(false);
    }
  };

  const previewHtml = buildPreviewHtml(htmlContent, type);

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 mt-4">

      {/* ── Top meta row ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={!!template}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {TEMPLATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {template && (
              <p className="mt-1 text-xs text-gray-400">Type cannot be changed after creation.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Promo Confirmation"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your order #{{orderNumber}} is confirmed"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
      </div>

      {/* ── Colour quick tools ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Paintbrush size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Quick Colours:</span>
          </div>

          {(
            [
              { label: "Accent / Button", value: accentColor, onChange: handleAccentChange },
              { label: "Gold / Highlight", value: goldColor, onChange: handleGoldChange },
              { label: "Header Background", value: headerBg, onChange: handleHeaderBgChange },
            ] as const
          ).map(({ label, value, onChange }) => {
            const id = `color-${label.replace(/\s/g, "-")}`;
            return (
              <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    id={id}
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => (document.getElementById(id) as HTMLInputElement | null)?.click()}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-md ring-1 ring-gray-300 cursor-pointer focus:outline-none"
                    style={{ background: value }}
                    aria-label={`Pick ${label}`}
                  />
                </div>
                <span className="text-xs text-gray-600">{label}</span>
              </label>
            );
          })}

          <button
            type="button"
            onClick={handleLoadDefault}
            className="ml-auto cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-300 rounded px-3 py-1.5 transition-colors"
          >
            <RefreshCw size={11} />
            Reset to Default
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(
          [
            { id: "visual" as const, icon: <Monitor size={14} />, label: "Visual Preview + Edit" },
            { id: "code" as const, icon: <Code2 size={14} />, label: "HTML Code" },
          ]
        ).map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ── Visual mode: quick-edit left + preview right ── */}
      {activeTab === "visual" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">✏️ How to edit</p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Change <strong>brand colours</strong> using the colour circles above.</li>
                <li>Edit <strong>text fields</strong> below — the preview updates instantly.</li>
                <li>Switch to <strong>HTML Code</strong> for advanced / full HTML editing.</li>
                <li>Click <strong>Reset to Default</strong> to start fresh anytime.</li>
              </ul>
            </div>

            <QuickTextEditor html={htmlContent} onChange={setHtmlContent} />

            <p className="text-xs text-center text-gray-400">
              Need full control?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className="cursor-pointer text-blue-600 hover:underline"
              >
                Switch to HTML Code view →
              </button>
            </p>
          </div>

          <LivePreview html={previewHtml} />
        </div>
      )}

      {/* ── Code mode: textarea left + preview right ── */}
      {activeTab === "code" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Code2 size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">HTML Source</span>
              <span className="text-xs text-gray-400 ml-auto">
                Use <code className="bg-gray-200 px-1 rounded text-[10px]">{"{{variable}}"}</code> for dynamic data
              </span>
            </div>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full font-mono text-xs p-4 focus:outline-none resize-none border-0"
              style={{ minHeight: "560px" }}
              spellCheck={false}
              placeholder="Paste or write HTML email content here..."
            />
          </div>

          <LivePreview html={previewHtml} liveLabel />
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push(adminRoutes.emails)}
          className="cursor-pointer text-sm text-gray-500 hover:text-gray-800 underline"
        >
          Cancel
        </button>
        <AdminButton onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : template ? "Save Changes" : "Create Template"}
        </AdminButton>
      </div>
    </div>
  );
}

// ─── LIVE PREVIEW PANEL ───────────────────────────────────────────────────────

function LivePreview({ html, liveLabel = false }: { html: string; liveLabel?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Live Preview</span>
        </div>
        <span className="text-xs text-gray-400 italic">
          {liveLabel ? "Updates as you type" : "Sample data shown for preview"}
        </span>
      </div>
      <iframe
        srcDoc={html}
        title="Email Preview"
        sandbox="allow-same-origin"
        className="w-full flex-1 border-0"
        style={{ minHeight: "580px" }}
      />
    </div>
  );
}

// ─── QUICK TEXT EDITOR ────────────────────────────────────────────────────────
// Extracts the heading + first body paragraph + CTA button from raw HTML
// and presents them as simple form fields for non-technical admins.

function QuickTextEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (v: string) => void;
}) {
  const headingMatch = HEADING_RE.exec(html);
  const paraMatch = PARA_RE.exec(html);
  const ctaTextMatch = CTA_TEXT_RE.exec(html);
  const ctaHrefMatch = CTA_HREF_RE.exec(html);

  const heading = headingMatch?.[2] ?? "";
  const paraInner = paraMatch?.[3] ?? "";
  const paraPlain = paraInner.replace(/<[^>]+>/g, "").trim();
  const ctaText = ctaTextMatch?.[2]?.replace(/<[^>]+>/g, "").trim() ?? "";
  const ctaHref = ctaHrefMatch?.[2] ?? "";

  const hasFields = heading || paraPlain || ctaText;

  if (!hasFields) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm text-gray-500 text-center py-4">
          No quick-edit fields found.{" "}
          <strong>Click &ldquo;Reset to Default&rdquo;</strong> first, or switch to{" "}
          <strong>HTML Code</strong> view to edit directly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">Edit Text Content</h3>

      {heading && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Email Heading
          </label>
          <input
            type="text"
            value={heading}
            onChange={(e) => {
              const newVal = e.target.value;
              onChange(html.replace(HEADING_RE, (_m, attrs) => `<h2${attrs}>${newVal}</h2>`));
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      )}

      {paraPlain && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Body Text
          </label>
          <textarea
            value={paraPlain}
            onChange={(e) => {
              const newText = e.target.value;
              onChange(
                html.replace(
                  PARA_RE,
                  (_m, style, rest) => `<p style="${style}"${rest}>${newText}</p>`,
                ),
              );
            }}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            placeholder="Main email body paragraph"
          />
          <p className="text-xs text-gray-400 mt-0.5">
            Plain text only; HTML formatting is stripped.
          </p>
        </div>
      )}

      {(ctaText || ctaHref) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Button Text
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => {
                const newText = e.target.value;
                onChange(
                  html.replace(CTA_TEXT_RE, (_m, before, _old, after) => before + newText + after),
                );
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Button Link
            </label>
            <input
              type="text"
              value={ctaHref === "#" ? "" : ctaHref}
              onChange={(e) => {
                const newHref = e.target.value.trim() || "#";
                onChange(
                  html.replace(
                    CTA_HREF_RE,
                    (_m, before, _oldHref, after) => before + newHref + after,
                  ),
                );
              }}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        <strong>Tip:</strong> Placeholders like{" "}
        <code className="bg-gray-100 px-1 rounded">{"{{orderNumber}}"}</code> are filled in
        automatically when the email is sent — never delete them from the HTML.
      </p>
    </div>
  );
}
