"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  FileText,
  Users,
  Layers,
  Users2,
  MessageSquare,
  Ticket,
  PenSquare,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Truck,
  Megaphone,
  Mail,
  CreditCard,
} from "lucide-react";

import { adminRoutes } from "@/lib";
import { AdminNavbarItem } from "./AdminNavbarItem";
import { adminLogout } from "@/lib/server/actions/admin-auth-actions";
import {
  AdminAlertDialog,
  AdminAlertDialogContent,
  AdminAlertDialogHeader,
  AdminAlertDialogTitle,
  AdminAlertDialogDescription,
  AdminAlertDialogFooter,
  AdminAlertDialogCancel,
  AdminAlertDialogAction,
} from "@/components/admin";

const navGroups = [
  {
    label: "Commerce",
    items: [
      { href: adminRoutes.home, text: "Dashboard", icon: LayoutDashboard },
      { href: adminRoutes.orders, text: "Orders", icon: ShoppingCart },
      { href: adminRoutes.payments, text: "Payments", icon: CreditCard },
      { href: adminRoutes.products, text: "Products", icon: Package },
      { href: adminRoutes.categories, text: "Categories", icon: Tag },
      { href: adminRoutes.collections, text: "Collections", icon: Layers },
      { href: adminRoutes.coupons, text: "Coupons", icon: Ticket },
      { href: adminRoutes.shipping, text: "Shipping", icon: Truck },
    ]
  },
  {
    label: "Content",
    items: [
      { href: adminRoutes.marquee, text: "Announcement", icon: Megaphone },
      { href: adminRoutes.blogs, text: "Blog", icon: FileText },
      { href: adminRoutes.siteContent, text: "Site Content", icon: PenSquare },
      { href: adminRoutes.testimonials, text: "Testimonials", icon: MessageSquare },
    ]
  },
  {
    label: "Users",
    items: [
      { href: adminRoutes.customers, text: "Customers", icon: Users },
      { href: adminRoutes.authors, text: "Authors", icon: Users2 },
      { href: adminRoutes.team, text: "Team", icon: Users2 },
    ]
  },
  {
    label: "System",
    items: [
      { href: adminRoutes.emails, text: "Emails", icon: Mail },
      { href: adminRoutes.admins, text: "Admins", icon: ShieldCheck },
      { href: adminRoutes.settings, text: "Settings", icon: Settings },
    ]
  }
];

export function AdminNavbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isMobileNavigating, startMobileTransition] = useTransition();

  const pathName = usePathname();
  const router = useRouter();

  const isNavigating = navigatingTo !== null && navigatingTo !== pathName;
  const isActive = (href: string) => pathName === href;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await adminLogout();
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-100 transition-[width] duration-300 ease-in-out overflow-hidden shrink-0 ${
          collapsed ? "w-[64px]" : "w-[220px]"
        }`}
      >
        {/* Header: brand + collapse toggle */}
        <div
          className={`flex items-center border-b border-gray-100 h-14 shrink-0 ${
            collapsed ? "justify-center px-2" : "px-4 gap-3"
          }`}
        >
          <Image
            src="/assets/logo/Saaj Tradition Golden.png"
            alt="Saaj Tradition"
            width={36}
            height={36}
            className="h-8 w-8 object-contain shrink-0"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate leading-tight">Saaj Tradition</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-tight">Admin</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="cursor-pointer p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* Loading bar */}
        {(isNavigating || isMobileNavigating) && (
          <div className="h-0.5 bg-gray-100 overflow-hidden shrink-0">
            <div className="h-full bg-gray-800 animate-[loading-bar_1.5s_ease-in-out_infinite] w-1/3" />
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-3 space-y-4 ${collapsed ? "px-2" : "px-3"}`}>
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-0.5">
              {!collapsed && (
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <AdminNavbarItem
                  key={item.href}
                  isActive={isActive(item.href)}
                  href={item.href}
                  text={item.text}
                  icon={item.icon}
                  collapsed={collapsed}
                  onNavigating={(href) => setNavigatingTo(href)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className={`border-t border-gray-100 py-3 shrink-0 ${collapsed ? "px-2" : "px-3"}`}>
          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            title={collapsed ? "Logout" : undefined}
            className={`cursor-pointer flex items-center rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ${
              collapsed ? "w-full justify-center p-2.5" : "w-full gap-3 px-3 py-2.5"
            }`}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* --- MOBILE TOPBAR --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Image
            src="/assets/logo/Saaj Tradition Golden.png"
            alt="Saaj Tradition"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <p className="font-semibold text-sm text-gray-900">Saaj Tradition</p>
        </div>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/40 z-50 md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* --- MOBILE DRAWER --- */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/logo/Saaj Tradition Golden.png"
              alt="Saaj Tradition"
              width={32}
              height={32}
              className="h-8 w-8 object-contain shrink-0"
            />
            <div>
              <p className="font-semibold text-sm text-gray-900 leading-tight">Saaj Tradition</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 leading-tight">Admin</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <X size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (!isActive(item.href)) {
                        e.preventDefault();
                        setMobileOpen(false);
                        startMobileTransition(() => router.push(item.href));
                      } else {
                        setMobileOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="flex-1">{item.text}</span>
                    {isActive(item.href) && <span className="h-1.5 w-1.5 rounded-full bg-white/50 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => { setMobileOpen(false); setShowLogoutDialog(true); }}
            className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={15} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* â”€â”€ LOGOUT DIALOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AdminAlertDialog
        open={showLogoutDialog}
        onOpenChange={(open) => !isLoggingOut && setShowLogoutDialog(open)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>Confirm Logout</AdminAlertDialogTitle>
            <AdminAlertDialogDescription>
              Are you sure you want to log out of the admin panel?
            </AdminAlertDialogDescription>
          </AdminAlertDialogHeader>
          <AdminAlertDialogFooter>
            <AdminAlertDialogCancel disabled={isLoggingOut}>
              Cancel
            </AdminAlertDialogCancel>
            <AdminAlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </AdminAlertDialogAction>
          </AdminAlertDialogFooter>
        </AdminAlertDialogContent>
      </AdminAlertDialog>
    </>
  );
}
