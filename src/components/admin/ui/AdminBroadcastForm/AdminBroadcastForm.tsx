"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, Users } from "lucide-react";
import { AdminButton } from "../AdminButton";
import { BroadcastImageField } from "./BroadcastImageField";
import {
  sendBroadcastNewsletter,
  sendProductUpdateBroadcast,
  sendCollectionUpdateBroadcast,
} from "@/lib/server/actions/email-actions";

type BroadcastType = "newsletter" | "product" | "collection";

type Props = {
  subscriberCount: number;
};

export function AdminBroadcastForm({ subscriberCount }: Props) {
  const [type, setType] = useState<BroadcastType>("newsletter");
  const [sending, setSending] = useState(false);

  // Newsletter fields
  const [heading, setHeading] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaUrl, setCtaUrl] = useState("");

  // Product fields
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productUrl, setProductUrl] = useState("");

  // Collection fields
  const [collectionName, setCollectionName] = useState("");
  const [collectionDesc, setCollectionDesc] = useState("");
  const [collectionImage, setCollectionImage] = useState("");
  const [collectionUrl, setCollectionUrl] = useState("");

  const handleSend = async () => {
    setSending(true);
    try {
      let result;

      if (type === "newsletter") {
        if (!heading || !subject || !body) {
          toast.error("Heading, subject, and body are required");
          return;
        }
        result = await sendBroadcastNewsletter({
          emailHeading: heading,
          subject,
          body,
          imageUrl: imageUrl || undefined,
          ctaText: ctaText || "Shop Now",
          ctaUrl: ctaUrl || undefined,
        });
      } else if (type === "product") {
        if (!productName || !productDesc || !productPrice || !productUrl) {
          toast.error("All product fields are required");
          return;
        }
        result = await sendProductUpdateBroadcast({
          productName,
          productDescription: productDesc,
          productPrice: parseFloat(productPrice),
          productImageUrl: productImage || undefined,
          productUrl,
        });
      } else {
        if (!collectionName || !collectionDesc || !collectionUrl) {
          toast.error("All collection fields are required");
          return;
        }
        result = await sendCollectionUpdateBroadcast({
          collectionName,
          collectionDescription: collectionDesc,
          collectionImageUrl: collectionImage || undefined,
          collectionUrl,
        });
      }

      if (result?.success && result.data) {
        toast.success(`Sent to ${result.data.sent}/${result.data.total} subscribers`);
      } else {
        toast.error("Failed to send broadcast");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Subscriber count */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
        <div className="p-2.5 rounded-lg bg-green-50">
          <Users className="text-green-600" size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Active Subscribers</p>
          <p className="text-2xl font-bold text-gray-900">{subscriberCount}</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Broadcast Type</p>
        <div className="flex gap-2 flex-wrap">
          {(["newsletter", "product", "collection"] as BroadcastType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                type === t
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "newsletter" ? "Newsletter" : t === "product" ? "Product Update" : "Collection Update"}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        {type === "newsletter" && (
          <>
            <Field label="Email Heading" required>
              <Input value={heading} onChange={setHeading} placeholder="e.g. Exclusive Offer for You!" />
            </Field>
            <Field label="Subject Line" required>
              <Input value={subject} onChange={setSubject} placeholder="e.g. Don't miss this week's picks" />
            </Field>
            <Field label="Body Content (HTML supported)" required>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your newsletter content here. HTML is supported."
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none font-mono"
              />
            </Field>
            <BroadcastImageField label="Banner Image (optional)" value={imageUrl} onChange={setImageUrl} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="CTA Button Text">
                <Input value={ctaText} onChange={setCtaText} placeholder="Shop Now" />
              </Field>
              <Field label="CTA Button URL">
                <Input value={ctaUrl} onChange={setCtaUrl} placeholder="https://..." />
              </Field>
            </div>
          </>
        )}

        {type === "product" && (
          <>
            <Field label="Product Name" required>
              <Input value={productName} onChange={setProductName} placeholder="e.g. Embroidered Kameez" />
            </Field>
            <Field label="Description" required>
              <textarea
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
              />
            </Field>
            <Field label="Price (Rs.)" required>
              <Input type="number" value={productPrice} onChange={setProductPrice} placeholder="2500" />
            </Field>
            <BroadcastImageField label="Product Image" value={productImage} onChange={setProductImage} />
            <Field label="Product Page URL" required>
              <Input value={productUrl} onChange={setProductUrl} placeholder="https://..." />
            </Field>
          </>
        )}

        {type === "collection" && (
          <>
            <Field label="Collection Name" required>
              <Input value={collectionName} onChange={setCollectionName} placeholder="e.g. Eid Collection 2026" />
            </Field>
            <Field label="Description" required>
              <textarea
                value={collectionDesc}
                onChange={(e) => setCollectionDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
              />
            </Field>
            <BroadcastImageField label="Collection Image" value={collectionImage} onChange={setCollectionImage} />
            <Field label="Collection Page URL" required>
              <Input value={collectionUrl} onChange={setCollectionUrl} placeholder="https://..." />
            </Field>
          </>
        )}
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <AdminButton
          onClick={handleSend}
          disabled={sending || subscriberCount === 0}
          className="flex items-center gap-2"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? "Sending…" : `Send to ${subscriberCount} Subscriber${subscriberCount !== 1 ? "s" : ""}`}
        </AdminButton>
      </div>
    </div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
    />
  );
}
