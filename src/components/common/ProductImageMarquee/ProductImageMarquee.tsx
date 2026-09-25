"use client";

import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib";
import { useState, useCallback } from "react";

type MarqueeProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  primaryImageUrl: string;
};

type ProductImageMarqueeProps = {
  isActive: boolean;
  products: MarqueeProduct[];
};

export function ProductImageMarquee({
  isActive,
  products,
}: ProductImageMarqueeProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  const handleError = useCallback((id: string) => {
    setFailedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  if (!isActive || products.length === 0) return null;

  const validProducts = products.filter((p) => p.primaryImageUrl && !failedIds.has(p.id));
  if (validProducts.length === 0) return null;

  return (
    <div className="overflow-hidden py-16 sm:py-24 bg-stone-50 border-b border-stone-200 relative">
      <div className="animate-marquee flex items-end gap-6 sm:gap-8">
        {/* Group 1 */}
        <div className="flex gap-6 sm:gap-8 items-end shrink-0">
          {validProducts.map((product) => (
            <Link
              key={`p1-${product.id}`}
              href={`${routes.product}/${product.slug}`}
              className="w-[200px] sm:w-[260px] md:w-[300px] flex-shrink-0 group block"
            >
              <div className="overflow-hidden mb-3 bg-stone-200 aspect-[4/5] relative">
                <Image
                  src={product.primaryImageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 200px, (max-width: 768px) 260px, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  onError={() => handleError(product.id)}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-sm font-medium text-stone-900 truncate max-w-[60%]">
                  {product.name}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {product.compareAtPrice && (
                    <span className="text-xs text-stone-400 line-through">
                      Rs. {product.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm text-stone-600">
                    Rs. {product.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Group 2 — exact duplicate for seamless loop */}
        <div className="flex gap-6 sm:gap-8 items-end shrink-0">
          {validProducts.map((product) => (
            <Link
              key={`p2-${product.id}`}
              href={`${routes.product}/${product.slug}`}
              className="w-[200px] sm:w-[260px] md:w-[300px] flex-shrink-0 group block"
            >
              <div className="overflow-hidden mb-3 bg-stone-200 aspect-[4/5] relative">
                <Image
                  src={product.primaryImageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 200px, (max-width: 768px) 260px, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  onError={() => handleError(product.id)}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-sm font-medium text-stone-900 truncate max-w-[60%]">
                  {product.name}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {product.compareAtPrice && (
                    <span className="text-xs text-stone-400 line-through">
                      Rs. {product.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm text-stone-600">
                    Rs. {product.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
