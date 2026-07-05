"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { Search, X, SlidersHorizontal, ChevronDown, Check, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib";

type ShopFilterBarProps = {
  totalProducts: number;
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

export function ShopFilterBar({ totalProducts }: ShopFilterBarProps) {
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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useDismiss(priceRef, () => setPriceOpen(false), priceOpen);
  useDismiss(sortRef, () => setSortOpen(false), sortOpen);

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

  // Live search: debounce 350ms after each keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Read current URL at fire-time to avoid stale closure on searchParams
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
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Newest";
  const priceLabel = priceActive
    ? `Rs.${currentMinPrice || "0"} – ${currentMaxPrice ? `Rs.${currentMaxPrice}` : "∞"}`
    : "Price";

  const chipBase =
    "flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors cursor-pointer shrink-0 select-none";
  const panelBase =
    "absolute right-0 top-full z-30 mt-2 rounded-xl border border-neutral-04 bg-white p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] animate-in fade-in-0 slide-in-from-top-1 duration-150";

  return (
    <div className="w-full mb-8 flex flex-col gap-3">
      {/* Row 1: Search + Price + Sort */}
      <div className="flex items-stretch gap-2.5">
        {/* Live Search */}
        <div className="relative flex-1 min-w-0">
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
            className="w-full h-11 pl-10.5 pr-9 text-sm text-neutral-11 border border-neutral-05 rounded-xl bg-white focus:outline-none focus:border-neutral-11 focus:ring-2 focus:ring-neutral-11/10 transition-colors placeholder:text-neutral-08"
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

        {/* Price filter (popover) */}
        <div className="relative" ref={priceRef}>
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
            <span className="hidden sm:inline whitespace-nowrap">{priceLabel}</span>
            {priceActive && (
              <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>

          {priceOpen && (
            <div className={cn(panelBase, "w-72 p-4")} role="dialog" aria-label="Filter by price">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-10 mb-3">
                Price range
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-09 pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                    placeholder="Min"
                    min="0"
                    step="1"
                    className="w-full h-10 pl-8 pr-2 text-sm text-neutral-11 border border-neutral-05 rounded-lg bg-white focus:outline-none focus:border-neutral-11 focus:ring-2 focus:ring-neutral-11/10 transition-colors placeholder:text-neutral-08"
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
                    onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                    placeholder="Max"
                    min="0"
                    step="1"
                    className="w-full h-10 pl-8 pr-2 text-sm text-neutral-11 border border-neutral-05 rounded-lg bg-white focus:outline-none focus:border-neutral-11 focus:ring-2 focus:ring-neutral-11/10 transition-colors placeholder:text-neutral-08"
                  />
                </div>
              </div>
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

        {/* Sort (custom dropdown) */}
        <div className="relative" ref={sortRef}>
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
            <ArrowUpDown className="w-4 h-4 shrink-0 sm:hidden" />
            <span className="hidden sm:inline text-neutral-09 font-normal">Sort:</span>
            <span className="hidden sm:inline whitespace-nowrap">{activeSortLabel}</span>
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
      </div>

      {/* Row 2: Count + clear */}
      <div className="flex items-center justify-between min-h-5">
        <span className="text-xs text-neutral-10">
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-neutral-04 border-t-neutral-11 animate-spin inline-block" />
              Loading...
            </span>
          ) : (
            <>
              <span className="font-medium text-neutral-11">{totalProducts}</span>{" "}
              {totalProducts === 1 ? "product" : "products"}
            </>
          )}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-neutral-10 hover:text-neutral-11 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
