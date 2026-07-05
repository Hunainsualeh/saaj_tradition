"use client";

import { useState } from "react";

type LocationCardProps = {
  storeName?: string;
  address?: string;
  hoursDays?: string;
  hoursTime?: string;
  hoursNote?: string;
  phone?: string;
  email?: string;
  mapQuery?: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="text-[11px] font-medium tracking-wide text-neutral-08 hover:text-neutral-11 transition-colors underline underline-offset-2 cursor-pointer"
    >
      {copied ? "Copied ✓" : "Copy address"}
    </button>
  );
}

export function LocationCard({
  storeName = "Saaj Tradition",
  address = "47PF+R29, Ahmedpur East, Punjab, Pakistan",
  hoursDays = "Mon – Sat",
  hoursTime = "10:00 AM – 8:00 PM",
  hoursNote = "Closed Sundays",
  phone = "+923106040861",
  email = "saajtraditionbahawalpur@gmail.com",
  mapQuery = "47PF+R29 Ahmedpur East Pakistan",
}: LocationCardProps) {
  const encodedQuery = encodeURIComponent(mapQuery);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedQuery}&hl=en&z=18&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`;
  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <div className="w-full flex flex-col gap-5">

      {/* ── MAP HERO ─────────────────────────────────────────────────── */}
      <div className="relative w-full rounded-xl overflow-hidden border border-neutral-04 shadow-sm"
        style={{ height: "clamp(360px, 52vw, 560px)" }}
      >
        {/* Real map iframe */}
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${storeName} — map`}
        />

        {/* Bottom gradient so the card reads over the map */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "45%",
            background:
              "linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* ── Floating info card ──────────────────────────────────── */}
        <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-[320px] bg-white/95 backdrop-blur-sm rounded-xl border border-neutral-04 shadow-lg px-5 py-4 flex flex-col gap-3">

          {/* Store identity */}
          <div className="flex items-start gap-2.5">
            <span className="mt-1 shrink-0 w-7 h-7 rounded-full bg-[#a39191]/10 border border-[#a39191]/20 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#a39191" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-12 tracking-tight leading-tight">
                {storeName}
              </p>
              <p className="text-[11px] text-neutral-08 mt-0.5 leading-snug">
                {address}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-03" />

          {/* Quick details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[12px] text-neutral-10">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden>
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              </svg>
              {hoursDays} &nbsp;{hoursTime}
            </div>
            <div className="flex items-center gap-2 text-[12px] text-neutral-10">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden>
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              {phone}
            </div>
          </div>

          {/* CTA */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-neutral-12 text-white text-[12px] font-medium tracking-wide hover:bg-neutral-10 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
            </svg>
            Get Directions
          </a>
        </div>
      </div>

      {/* ── DETAILS ROW ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Address */}
        <div className="bg-neutral-01 rounded-xl border border-neutral-03 px-5 py-4 flex gap-3 items-start">
          <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-[#a39191]/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#a39191" aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-neutral-08 uppercase tracking-widest mb-1">
              Address
            </p>
            <p className="text-sm text-neutral-11 leading-relaxed">
              {address}
            </p>
            <CopyButton text={address} />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-neutral-01 rounded-xl border border-neutral-03 px-5 py-4 flex gap-3 items-start">
          <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-[#a39191]/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#a39191" aria-hidden>
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-neutral-08 uppercase tracking-widest mb-1">
              Contact
            </p>
            <a href={telHref} className="block text-sm text-neutral-11 hover:text-neutral-09 transition-colors">
              {phone}
            </a>
            <a href={`mailto:${email}`} className="block text-xs text-neutral-09 hover:text-neutral-11 transition-colors mt-0.5 truncate">
              {email}
            </a>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-neutral-01 rounded-xl border border-neutral-03 px-5 py-4 flex gap-3 items-start">
          <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-[#a39191]/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#a39191" aria-hidden>
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-medium text-neutral-08 uppercase tracking-widest mb-1">
              Hours
            </p>
            <p className="text-sm text-neutral-11">{hoursDays}</p>
            <p className="text-sm text-neutral-11">{hoursTime}</p>
            {hoursNote && (
              <p className="text-xs text-neutral-09 mt-0.5">{hoursNote}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
