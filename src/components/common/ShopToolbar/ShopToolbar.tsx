"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn, routes } from "@/lib";

type NavItem = { name: string; slug: string };

type ShopToolbarProps = {
  title: string;
  collections: NavItem[];
  categories: NavItem[];
};

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
] as const;

/** Close a dropdown when the user clicks outside it or presses Escape. */
function useDismiss<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onDismiss: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onDismiss, enabled]);
}

export function ShopToolbar({
  title,
  collections,
  categories,
}: ShopToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentSort = searchParams.get("sort") || "";

  const [search, setSearch] = useState(currentSearch);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [priceOpen, setPriceOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useDismiss(priceRef, () => setPriceOpen(false), priceOpen);
  useDismiss(sortRef, () => setSortOpen(false), sortOpen);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  // Live search: debounce 350ms after each keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (search) params.set("q", search);
      else params.delete("q");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, pathname, router]);

  const handlePriceApply = () => {
    updateParams({ minPrice, maxPrice });
    setPriceOpen(false);
  };

  const handlePriceReset = () => {
    setMinPrice("");
    setMaxPrice("");
    updateParams({ minPrice: "", maxPrice: "" });
    setPriceOpen(false);
  };

  const handleSortChange = (sort: string) => {
    updateParams({ sort });
    setSortOpen(false);
  };

  const handleClearAll = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  const priceActive = Boolean(currentMinPrice || currentMaxPrice);
  const hasActiveFilters = Boolean(
    currentSearch || currentMinPrice || currentMaxPrice || currentSort,
  );
  // Count of active facets shown as a badge on the mobile Filters button.
  const activeFilterCount =
    (priceActive ? 1 : 0) + (currentSort ? 1 : 0);
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Newest";
  const priceLabel = priceActive
    ? `Rs.${currentMinPrice || "0"} – ${currentMaxPrice ? `Rs.${currentMaxPrice}` : "∞"}`
    : "Price";

  const chipBase =
    "flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors cursor-pointer shrink-0 select-none";
  const panelBase =
    "absolute right-0 top-full z-30 mt-2 rounded-xl border border-neutral-04 bg-white p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] animate-in fade-in-0 slide-in-from-top-1 duration-150";

  const isNavActive = (href: string) =>
    href === routes.shop ? pathname === routes.shop : pathname === href;

  const searchField = (
    <div className="relative min-w-0 flex-1 md:w-72 md:flex-none">
      {isPending && search !== "" ? (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-neutral-04 border-t-neutral-11 animate-spin" />
      ) : (
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-09 pointer-events-none" />
      )}
      <input
        ref={searchInputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        className="w-full h-11 pl-10.5 pr-9 text-sm text-neutral-11 border border-neutral-05 rounded-full bg-white focus:outline-none focus:border-neutral-11 focus:ring-2 focus:ring-neutral-11/10 transition-colors placeholder:text-neutral-08"
      />
      {search && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            searchInputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-08 hover:text-neutral-11 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full mb-6">
      {/* Header: responsive title + controls. On mobile the title sits on its
          own compact line above the search/filter row; on desktop it moves
          inline to the left with the controls pushed to the right. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <h1 className="text-2xl leading-tight md:text-3xl font-medium tracking-tight text-neutral-11 md:mr-auto md:truncate">
          {title}
        </h1>

        {/* Search + filter controls */}
        <div className="flex items-center gap-2.5">
          {searchField}

        {/* Desktop: inline Sort + Price */}
        <div className="relative hidden md:block" ref={sortRef}>
          <button
            type="button"
            onClick={() => {
              setSortOpen((v) => !v);
              setPriceOpen(false);
            }}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
            className={cn(
              chipBase,
              currentSort || sortOpen
                ? "border-neutral-11 text-neutral-11 bg-white"
                : "border-neutral-05 bg-white text-neutral-11 hover:border-neutral-11",
            )}
          >
            <span className="text-neutral-09 font-normal">Sort:</span>
            <span className="whitespace-nowrap">{activeSortLabel}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 shrink-0 text-neutral-09 transition-transform",
                sortOpen && "rotate-180",
              )}
            />
          </button>
          {sortOpen && (
            <div className={cn(panelBase, "w-56")} role="listbox" aria-label="Sort products">
              {SORT_OPTIONS.map((option) => {
                const isSelected = currentSort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSortChange(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer text-left",
                      isSelected
                        ? "bg-neutral-02 text-neutral-11 font-medium"
                        : "text-neutral-10 hover:bg-neutral-02 hover:text-neutral-11",
                    )}
                  >
                    {option.label}
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative hidden md:block" ref={priceRef}>
          <button
            type="button"
            onClick={() => {
              setPriceOpen((v) => !v);
              setSortOpen(false);
            }}
            aria-expanded={priceOpen}
            aria-haspopup="dialog"
            className={cn(
              chipBase,
              priceActive || priceOpen
                ? "border-neutral-11 bg-neutral-11 text-white"
                : "border-neutral-05 bg-white text-neutral-11 hover:border-neutral-11",
            )}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{priceLabel}</span>
          </button>
          {priceOpen && (
            <div className={cn(panelBase, "w-72 p-4")} role="dialog" aria-label="Filter by price">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-10 mb-3">
                Price range
              </p>
              <PriceInputs
                minPrice={minPrice}
                maxPrice={maxPrice}
                setMinPrice={setMinPrice}
                setMaxPrice={setMaxPrice}
                onApply={handlePriceApply}
              />
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handlePriceApply}
                  disabled={isPending}
                  className="flex-1 h-10 text-sm font-medium bg-neutral-11 text-white rounded-lg hover:bg-neutral-12 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handlePriceReset}
                  className="h-10 px-4 text-sm font-medium text-neutral-10 border border-neutral-05 rounded-lg hover:border-neutral-11 hover:text-neutral-11 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: single Filters button → bottom sheet */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Open filters and categories"
          aria-haspopup="dialog"
          className={cn(
            "md:hidden relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors",
            activeFilterCount > 0
              ? "border-neutral-11 bg-neutral-11 text-white"
              : "border-neutral-05 bg-white text-neutral-11",
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        </div>
      </div>

      {/* The result count is intentionally NOT shown to customers (a small
          catalogue reads better without "8 products"); the grid itself surfaces
          a "No products found" empty state when a search/filter matches nothing.
          Only an active-filter reset is offered here. */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-neutral-10 hover:text-neutral-11 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      )}

      {/* ===== Mobile bottom sheet: browse + sort + price ===== */}
      {/* Backdrop */}
      <div
        onClick={() => setSheetOpen(false)}
        aria-hidden={!sheetOpen}
        className={cn(
          "md:hidden fixed inset-0 z-[80] bg-black/40 transition-opacity duration-300",
          sheetOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters and categories"
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-[90] flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out",
          sheetOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-03 px-5 py-4">
          <span className="text-base font-semibold text-neutral-11">
            Filters &amp; Categories
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-10 hover:bg-neutral-02"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Browse */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-09">
            Browse
          </p>
          <div className="flex flex-col">
            <SheetNavLink
              href={routes.shop}
              label="All"
              active={isNavActive(routes.shop)}
              onNavigate={() => setSheetOpen(false)}
            />
            <SheetNavLink
              href={`${routes.shop}/new-arrivals`}
              label="New Arrivals"
              active={isNavActive(`${routes.shop}/new-arrivals`)}
              onNavigate={() => setSheetOpen(false)}
            />
          </div>

          {categories.length > 0 && (
            <>
              <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-09">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <SheetChipLink
                    key={c.slug}
                    href={`${routes.shop}/categories/${c.slug}`}
                    label={c.name}
                    active={isNavActive(`${routes.shop}/categories/${c.slug}`)}
                    onNavigate={() => setSheetOpen(false)}
                  />
                ))}
              </div>
            </>
          )}

          {collections.length > 0 && (
            <>
              <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-09">
                Collections
              </p>
              <div className="flex flex-wrap gap-2">
                {collections.map((c) => (
                  <SheetChipLink
                    key={c.slug}
                    href={`${routes.shopCollections}/${c.slug}`}
                    label={c.name}
                    active={isNavActive(`${routes.shopCollections}/${c.slug}`)}
                    onNavigate={() => setSheetOpen(false)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Sort */}
          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-09">
            Sort by
          </p>
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map((option) => {
              const isSelected = currentSort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortChange(option.value)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                    isSelected
                      ? "bg-neutral-02 font-medium text-neutral-11"
                      : "text-neutral-10 hover:bg-neutral-02",
                  )}
                >
                  {option.label}
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Price */}
          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-09">
            Price range
          </p>
          <PriceInputs
            minPrice={minPrice}
            maxPrice={maxPrice}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            onApply={handlePriceApply}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-neutral-03 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              handleClearAll();
              setSheetOpen(false);
            }}
            className="h-11 flex-1 rounded-full border border-neutral-05 text-sm font-medium text-neutral-11 transition-colors hover:border-neutral-11"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => {
              handlePriceApply();
              setSheetOpen(false);
            }}
            className="h-11 flex-[1.4] rounded-full bg-neutral-11 text-sm font-medium text-white transition-colors hover:bg-neutral-12"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Small shared pieces ----

function PriceInputs({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  onApply,
}: {
  minPrice: string;
  maxPrice: string;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  onApply: () => void;
}) {
  const field =
    "w-full h-10 pl-8 pr-2 text-sm text-neutral-11 border border-neutral-05 rounded-lg bg-white focus:outline-none focus:border-neutral-11 focus:ring-2 focus:ring-neutral-11/10 transition-colors placeholder:text-neutral-08";
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-09 pointer-events-none">
          Rs.
        </span>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          placeholder="Min"
          min="0"
          step="1"
          className={field}
        />
      </div>
      <span className="text-neutral-07 shrink-0">–</span>
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-09 pointer-events-none">
          Rs.
        </span>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          placeholder="Max"
          min="0"
          step="1"
          className={field}
        />
      </div>
    </div>
  );
}

function SheetNavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-neutral-02 font-medium text-neutral-11"
          : "text-neutral-11 hover:bg-neutral-02",
      )}
    >
      {label}
      {active && <Check className="w-4 h-4 shrink-0" />}
    </Link>
  );
}

function SheetChipLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-neutral-11 bg-neutral-11 text-white"
          : "border-neutral-05 text-neutral-11 hover:border-neutral-11",
      )}
    >
      {label}
    </Link>
  );
}
