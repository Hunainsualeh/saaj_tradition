import React from "react";
import type { Metadata } from "next";

import AdminLayoutClient from "./AdminLayoutClient";

// The entire admin section is auth-gated and renders live, per-request data.
// It must never be statically prerendered — doing so hits the DB at build time
// (and fails the build when the DB is unreachable). Force dynamic for all
// nested admin pages. This cascades to child segments.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Saaj Tradition",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
