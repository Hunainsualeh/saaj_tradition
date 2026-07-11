import React from "react";
import type { Metadata } from "next";

import { Footer, Navbar } from "@/components";
import { CartCountProvider, CartDialogProvider, CartSidebarProvider } from "@/providers";
import { getCartItemCount, getCartAction } from "@/lib/server/actions";
import { AddToCartDialog } from "@/components/common/AddToCartDialog/AddToCartDialog";
import { CartSidebar } from "@/components/common/CartSidebar/CartSidebar";
import { getCollections, getAllCategories, getSiteContentMap } from "@/lib/server/queries";
import { STORE_EMAIL, STORE_PHONE, STORE_INSTAGRAM, STORE_FACEBOOK } from "@/lib/constants/store-information";
import { WhatsAppChatButton } from "@/components/common/WhatsAppChatButton/WhatsAppChatButton";

export const metadata: Metadata = {
  title: {
    default: "Store",
    template: "%s | Saaj Tradition",
  },
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collectionsResponse, categoriesResponse, contentMapRes] = await Promise.all([
    getCollections(),
    getAllCategories(),
    getSiteContentMap(),
  ]);
  const collections = collectionsResponse.success
    ? collectionsResponse.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))
    : [];
  const categories = categoriesResponse.success
    ? categoriesResponse.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))
    : [];

  const cm = contentMapRes.success ? contentMapRes.data : {};
  const footerEmail = cm.social_email || STORE_EMAIL;
  const footerPhone = cm.social_phone || STORE_PHONE;
  const footerInstagram = cm.social_instagram || STORE_INSTAGRAM;
  const footerFacebook = cm.social_facebook || STORE_FACEBOOK;
  const footerWhatsapp = cm.social_whatsapp || undefined;
  const footerTwitter = cm.social_twitter || undefined;
  const footerTiktok = cm.social_tiktok || undefined;

  const whatsappChatEnabled = cm.whatsapp_chat_enabled === "true";
  const whatsappChatNumber = cm.whatsapp_chat_number || "";

  return (
    <CartCountProvider fetchCartItemCount={getCartItemCount}>
      <CartSidebarProvider fetchCart={getCartAction}>
        <CartDialogProvider>
          <div className="min-h-screen flex flex-col">
            {/* WCAG 2.4.1: lets keyboard/screen-reader users jump past the
                navbar. Visually hidden until focused. */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-neutral-12 focus:px-4 focus:py-2 focus:text-white"
            >
              Skip to main content
            </a>
            <Navbar collections={collections} categories={categories} />
            <div id="main-content" className="flex-1">{children}</div>
            <Footer
              email={footerEmail}
              phone={footerPhone}
              instagram={footerInstagram}
              facebook={footerFacebook}
              whatsapp={footerWhatsapp}
              twitter={footerTwitter}
              tiktok={footerTiktok}
            />
          </div>
          <AddToCartDialog />
          <CartSidebar />
          {whatsappChatEnabled && whatsappChatNumber && (
            <WhatsAppChatButton phoneNumber={whatsappChatNumber} />
          )}
        </CartDialogProvider>
      </CartSidebarProvider>
    </CartCountProvider>
  );
}
