"use client";

import { usePathname } from "next/navigation";
import { AdminNavbar, AdminToaster } from "@/components/admin";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/admin/login");

  if (isLoginPage) {
    return (
      <>
        {children}
        <AdminToaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNavbar />
      <main className="flex-1 min-w-0 px-5 md:px-8 xl:px-10 py-6 pt-20 md:pt-6 bg-gray-50 overflow-auto">
        {children}
      </main>
      <AdminToaster position="top-right" />
    </div>
  );
}
