"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib";
import type { NavItemType } from "./types";

import { CheveronRightIcon, CheveronLeftIcon, CheckoutIcon } from "@/components";

type NavbarMobileMenuProps = {
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  activeSubMenu?: string | null;
  setActiveSubMenu: (subMenu: string | null) => void;
  navItems: NavItemType[];
  isActive: (href: string) => boolean;
  openSidebar: () => void;
  itemCount: number;
};

export function NavbarMobileMenu({
  showMobileMenu,
  setShowMobileMenu,
  activeSubMenu,
  setActiveSubMenu,
  navItems,
  isActive,
  openSidebar,
  itemCount,
}: NavbarMobileMenuProps) {
  const isSubMenuActive = activeSubMenu !== null;
  const activeSubItem = navItems.find((item) => item.id === activeSubMenu);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          showMobileMenu
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => { setShowMobileMenu(false); setActiveSubMenu(null); }}
      />

      {/* Mobile menu panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full max-w-[320px] bg-white md:hidden",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          showMobileMenu ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-[54px] border-b border-neutral-03">
            {isSubMenuActive ? (
              <button
                onClick={() => setActiveSubMenu(null)}
                className="flex items-center gap-1.5 text-[13px] text-neutral-09 hover:text-neutral-12 transition-colors cursor-pointer"
              >
                <CheveronLeftIcon />
                <span>Back</span>
              </button>
            ) : (
              <Image
                src="/assets/logo/Saaj Tradition Golden.png"
                alt="Saaj Tradition"
                width={44}
                height={44}
                className="h-[38px] w-auto object-contain"
              />
            )}
            <button
              onClick={() => { setShowMobileMenu(false); setActiveSubMenu(null); }}
              className="text-[12px] font-medium text-neutral-08 hover:text-neutral-12 transition-colors cursor-pointer uppercase tracking-wider"
            >
              Close
            </button>
          </div>

          {/* Nav content */}
          <div className="flex-1 overflow-y-auto py-3">
            {/* Root menu */}
            {!isSubMenuActive && (
              <div className="flex flex-col">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  if (item.subItems) {
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between w-full px-5 py-3.5 transition-all cursor-pointer",
                          active
                            ? "text-neutral-12 bg-neutral-02"
                            : "text-neutral-09 hover:text-neutral-12 hover:bg-neutral-01",
                        )}
                        onClick={() => setActiveSubMenu(item.id)}
                      >
                        <span className="text-[15px] tracking-[0.01em] font-medium">
                          {item.text}
                        </span>
                        <CheveronRightIcon />
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={cn(
                        "flex items-center px-5 py-3.5 transition-all",
                        active
                          ? "text-neutral-12 bg-neutral-02"
                          : "text-neutral-09 hover:text-neutral-12 hover:bg-neutral-01",
                      )}
                    >
                      {active && (
                        <span className="w-[3px] h-4 rounded-full bg-[#c9a84c] mr-3 shrink-0" />
                      )}
                      <span className="text-[15px] tracking-[0.01em] font-medium">
                        {item.text}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Submenu */}
            {isSubMenuActive && activeSubItem?.subItems && (
              <div className="flex flex-col">
                {activeSubItem.subItems.map((subItem, index) => (
                  <div key={subItem.id} className="flex flex-col">
                    {index > 0 && (
                      <div className="mx-5 border-t border-neutral-03" />
                    )}
                    <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#c9a84c]">
                      {subItem.text}
                    </p>
                    {subItem.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setShowMobileMenu(false)}
                        className="px-5 py-3 text-[15px] tracking-[0.01em] text-neutral-09 hover:text-neutral-12 hover:bg-neutral-01 transition-all"
                      >
                        {item.text}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom: Cart button */}
          <div className="border-t border-neutral-03 px-5 py-4">
            <button
              onClick={() => { setShowMobileMenu(false); openSidebar(); }}
              className="w-full flex items-center justify-center gap-2.5 bg-neutral-12 text-white rounded-lg py-3 text-[13px] font-semibold tracking-wide hover:bg-neutral-11 transition-colors cursor-pointer"
            >
              <CheckoutIcon />
              <span>View Cart</span>
              {itemCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#c9a84c] text-[10px] font-bold">
                  {itemCount < 99 ? itemCount : "99+"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

