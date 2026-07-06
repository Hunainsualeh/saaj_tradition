"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { cn, routes } from "@/lib";
import { useCartSidebar } from "@/providers";

import { NavbarMobileMenu } from "./NavbarMobileMenu";
import { NavbarSubMenu } from "./NavbarSubMenu";
import { getNavItems } from "./lib";
import type { NavItemType } from "./types";

import { CheckoutIcon, MenuBarIcon, CloseIcon } from "@/components";

export type NavbarUIProps = {
  itemCount: number;
  collections?: { id: string; name: string; slug: string }[];
  categories?: { id: string; name: string; slug: string }[];
};

export function NavbarUI({ itemCount, collections = [], categories = [] }: NavbarUIProps) {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [lastPath, setLastPath] = useState("");

  const pathName = usePathname();
  const navItems: NavItemType[] = useMemo(
    () => getNavItems(collections, categories),
    [collections, categories],
  );
  const { openSidebar } = useCartSidebar();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Scroll detection — throttled with rAF
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  if (pathName !== lastPath) {
    setLastPath(pathName);
    if (showMobileMenu) {
      setShowMobileMenu(false);
      setActiveSubMenu(null);
    }
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMobileMenu]);

  const isActive = useCallback(
    (href: string) => {
      if (href === routes.home) return pathName === href;
      return pathName.startsWith(href);
    },
    [pathName],
  );

  const handleSubMenuEnter = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    setShowSubMenu(true);
  }, []);

  const handleSubMenuLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setShowSubMenu(false), 150);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 w-full z-50 transition-[background-color,box-shadow] duration-300 ease-out",
          scrolled
            ? "bg-white/85 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_0_rgba(0,0,0,0.03)]"
            : "bg-white",
        )}
      >
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />

        <nav className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12 flex items-center justify-between h-[52px] md:h-[58px]">
          {/* Logo */}
          <Link href={routes.home} className="flex items-center shrink-0 group select-none">
            <div className="flex flex-col items-start">
              <span
                className="text-[17px] md:text-[19px] font-semibold tracking-[0.02em] text-neutral-12 transition-colors duration-200 group-hover:text-[#c9a84c]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                SAAJ
              </span>
              <span className="text-[8px] md:text-[9px] font-medium tracking-[0.28em] uppercase text-neutral-10 -mt-0.5">
                Tradition
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map((item) => {
              if (item.subItems) {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={handleSubMenuEnter}
                    onMouseLeave={handleSubMenuLeave}
                  >
                    <button
                      onClick={() => setShowSubMenu((s) => !s)}
                      className={cn(
                        "relative px-3 lg:px-3.5 py-1.5 text-[12.5px] lg:text-[13px] tracking-[0.01em] rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1",
                        isActive(item.href)
                          ? "text-neutral-12 font-semibold"
                          : "text-neutral-08 hover:text-neutral-12 font-medium hover:bg-neutral-02",
                      )}
                    >
                      {item.text}
                      <svg className={cn("w-3 h-3 transition-transform duration-200", showSubMenu && "rotate-180")} fill="none" viewBox="0 0 12 12">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      className={cn(
                        "absolute top-full left-1/2 -translate-x-1/2 pt-2",
                        showSubMenu ? "pointer-events-auto" : "pointer-events-none",
                      )}
                    >
                      <NavbarSubMenu
                        show={showSubMenu}
                        subItems={item.subItems}
                        onClose={() => setShowSubMenu(false)}
                      />
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative px-3 lg:px-3.5 py-1.5 text-[12.5px] lg:text-[13px] tracking-[0.01em] rounded-md transition-all duration-200",
                    isActive(item.href)
                      ? "text-neutral-12 font-semibold"
                      : "text-neutral-08 hover:text-neutral-12 font-medium hover:bg-neutral-02",
                  )}
                >
                  {item.text}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-[#c9a84c]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Cart + Mobile Toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={openSidebar}
              aria-label="Cart"
              className={cn(
                "relative p-2 rounded-lg transition-all duration-200 hover:bg-neutral-02 cursor-pointer",
                showMobileMenu && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
              )}
            >
              <CheckoutIcon />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#c9a84c] text-neutral-12 text-[9px] font-bold leading-none shadow-sm">
                  {itemCount < 99 ? itemCount : "99+"}
                </span>
              )}
            </button>

            <button
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              onClick={() => { setShowMobileMenu(!showMobileMenu); setActiveSubMenu(null); }}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-neutral-02 cursor-pointer md:hidden"
            >
              {showMobileMenu
                ? <CloseIcon className="w-5 h-5" />
                : <MenuBarIcon className="w-5 h-5" />
              }
            </button>
          </div>
        </nav>
      </header>

      <NavbarMobileMenu
        activeSubMenu={activeSubMenu}
        setActiveSubMenu={setActiveSubMenu}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        navItems={navItems}
        isActive={isActive}
        openSidebar={openSidebar}
        itemCount={itemCount}
      />
    </>
  );
}
