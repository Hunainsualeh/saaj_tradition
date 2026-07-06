"use client";

import { useCallback, useState } from "react";

type SaveOrderImageButtonProps = {
  orderNumber: number;
  trackingToken: string | null;
  createdAt: string | Date;
  totalPrice: number;
  paymentMethod: string;
  customerName?: string | null;
};

// Brand palette (kept local so the generated image is self-contained and
// matches the Saaj Tradition look — cream + gold + charcoal).
const CREAM_TOP = "#f6efe3";
const CREAM_BOTTOM = "#ebdfca";
const GOLD = "#b28a4c";
const DARK = "#1b1b1b";
const MUTED = "#8c8378";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type TextOpts = {
  font: string;
  color: string;
  align?: CanvasTextAlign;
  spacing?: number;
};

function drawText(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  { font, color, align = "center", spacing = 0 }: TextOpts,
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  // letterSpacing is supported in modern engines; harmlessly ignored elsewhere.
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${spacing}px`;
  } catch {
    /* no-op */
  }
  ctx.fillText(str, x, y);
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0px";
  } catch {
    /* no-op */
  }
}

/** Draw the full confirmation card onto a 1080×1350 canvas. */
function renderCard(
  ctx: CanvasRenderingContext2D,
  data: SaveOrderImageButtonProps,
) {
  const W = 1080;
  const H = 1350;
  const cx = W / 2;

  // ── Background ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, CREAM_TOP);
  bg.addColorStop(1, CREAM_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft blurred gold blobs — the "blur effect" behind the glass card.
  ctx.save();
  ctx.filter = "blur(90px)";
  ctx.fillStyle = "rgba(178,138,76,0.45)";
  ctx.beginPath();
  ctx.arc(210, 210, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(150,110,60,0.38)";
  ctx.beginPath();
  ctx.arc(900, 1160, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Frosted glass card ──
  const cardX = 70;
  const cardY = 108;
  const cardW = W - 140;
  const cardH = H - 216;
  ctx.save();
  ctx.shadowColor = "rgba(60,45,20,0.18)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 46);
  ctx.fillStyle = "rgba(255,255,255,0.74)";
  ctx.fill();
  ctx.restore();
  roundedRect(ctx, cardX, cardY, cardW, cardH, 46);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Brand wordmark ──
  drawText(ctx, "SAAJ TRADITION", cx, 202, {
    font: "600 30px 'Helvetica Neue', Arial, sans-serif",
    color: GOLD,
    spacing: 8,
  });
  ctx.fillStyle = GOLD;
  ctx.fillRect(cx - 34, 224, 68, 2);

  // ── Success check ──
  const checkY = 320;
  ctx.beginPath();
  ctx.arc(cx, checkY, 52, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 24, checkY + 2);
  ctx.lineTo(cx - 6, checkY + 20);
  ctx.lineTo(cx + 26, checkY - 18);
  ctx.stroke();

  // ── Heading ──
  drawText(ctx, "Thank You!", cx, 470, {
    font: "700 78px Georgia, 'Times New Roman', serif",
    color: DARK,
  });
  drawText(ctx, "YOUR ORDER IS CONFIRMED", cx, 516, {
    font: "600 22px 'Helvetica Neue', Arial, sans-serif",
    color: MUTED,
    spacing: 4,
  });

  // divider with diamond
  ctx.strokeStyle = "rgba(178,138,76,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 90, 560);
  ctx.lineTo(cx - 18, 560);
  ctx.moveTo(cx + 18, 560);
  ctx.lineTo(cx + 90, 560);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, 560);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-5, -5, 10, 10);
  ctx.restore();

  // ── Tracking ID (the important part) ──
  if (data.trackingToken) {
    drawText(ctx, "TRACKING ID", cx, 638, {
      font: "700 20px 'Helvetica Neue', Arial, sans-serif",
      color: MUTED,
      spacing: 3,
    });

    const boxW = 800;
    const boxX = cx - boxW / 2;
    const boxY = 662;
    const boxH = 84;
    roundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fillStyle = "rgba(178,138,76,0.10)";
    ctx.fill();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(178,138,76,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Auto-shrink the token so it always fits the box width.
    let fontSize = 34;
    ctx.textAlign = "center";
    do {
      ctx.font = `600 ${fontSize}px 'Courier New', monospace`;
      if (ctx.measureText(data.trackingToken).width <= boxW - 48) break;
      fontSize -= 2;
    } while (fontSize > 16);
    drawText(ctx, data.trackingToken, cx, boxY + boxH / 2 + fontSize / 3, {
      font: `600 ${fontSize}px 'Courier New', monospace`,
      color: DARK,
    });
  }

  // ── Meta grid ──
  const leftX = 330;
  const rightX = 750;
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const payStr =
    data.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";

  const metaRow = (
    label1: string,
    value1: string,
    label2: string,
    value2: string,
    y: number,
  ) => {
    drawText(ctx, label1, leftX, y, {
      font: "700 18px 'Helvetica Neue', Arial, sans-serif",
      color: MUTED,
      spacing: 2,
    });
    drawText(ctx, value1, leftX, y + 40, {
      font: "600 32px 'Helvetica Neue', Arial, sans-serif",
      color: DARK,
    });
    drawText(ctx, label2, rightX, y, {
      font: "700 18px 'Helvetica Neue', Arial, sans-serif",
      color: MUTED,
      spacing: 2,
    });
    drawText(ctx, value2, rightX, y + 40, {
      font: "600 32px 'Helvetica Neue', Arial, sans-serif",
      color: DARK,
    });
  };

  metaRow(
    "ORDER NUMBER",
    `#${data.orderNumber}`,
    "DATE",
    dateStr,
    data.trackingToken ? 838 : 700,
  );
  metaRow(
    "TOTAL",
    `Rs.${Math.round(data.totalPrice)}`,
    "PAYMENT",
    payStr,
    data.trackingToken ? 968 : 830,
  );

  if (data.customerName) {
    drawText(ctx, `For ${data.customerName}`, cx, 1090, {
      font: "italic 24px Georgia, serif",
      color: MUTED,
    });
  }

  // ── Footer ──
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, 1150);
  ctx.lineTo(cardX + cardW - 60, 1150);
  ctx.stroke();
  drawText(ctx, "Keep this image to track your order anytime", cx, 1192, {
    font: "400 21px 'Helvetica Neue', Arial, sans-serif",
    color: MUTED,
  });
  drawText(ctx, "saajtradition.com/track", cx, 1224, {
    font: "600 22px 'Helvetica Neue', Arial, sans-serif",
    color: GOLD,
    spacing: 1,
  });
}

function generateBlob(data: SaveOrderImageButtonProps): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    renderCard(ctx, data);
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

export function SaveOrderImageButton(props: SaveOrderImageButtonProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await generateBlob(props);
      if (!blob) return;

      const fileName = `Saaj-Order-${props.orderNumber}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // On phones, the Web Share sheet exposes "Save to Photos"/gallery, which
      // is exactly what the customer wants. Fall back to a normal download
      // (which lands in the gallery/Downloads) on desktop or if share fails.
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: `Saaj Tradition — Order #${props.orderNumber}`,
            text: "My order confirmation & tracking ID",
          });
          setDone(true);
          return;
        } catch (err) {
          // User cancelled the share sheet — don't fall through to a download.
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } finally {
      setBusy(false);
    }
  }, [props]);

  return (
    <button
      onClick={handleSave}
      disabled={busy}
      title="Save a PNG with your Order # and Tracking ID"
      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-04 bg-white/70 px-4 py-1.5 text-xs font-semibold text-neutral-11 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:border-neutral-06 disabled:opacity-60 cursor-pointer"
    >
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-04 border-t-neutral-11" />
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      )}
      {done ? "Saved" : "Save order image"}
    </button>
  );
}
