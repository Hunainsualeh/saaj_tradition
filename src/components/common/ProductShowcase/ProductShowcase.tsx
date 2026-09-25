import Link from "next/link";

import { ProductTile } from "@/components/common/ProductTile";
import { routes } from "@/lib";
import { getFeaturedProducts, getProductsByCategorySlug } from "@/lib/server/queries";

type ProductShowcaseProps = {
  heading: string;
  intro?: string;
  count?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export async function ProductShowcase({
  heading,
  intro,
  count = 8,
  viewAllHref = routes.shop,
  viewAllLabel = "Shop all suits",
}: ProductShowcaseProps) {
  const featured = await getFeaturedProducts();
  let products = featured.success ? featured.data.slice(0, count) : [];
  if (products.length < 4) {
    const latest = await getProductsByCategorySlug(undefined, 1, count);
    if (latest.success && latest.data.products.length > products.length) {
      products = latest.data.products;
    }
  }

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-medium">{heading}</h2>
          {intro && <p className="text-base text-neutral-10">{intro}</p>}
        </div>
        <Link
          href={viewAllHref}
          className="text-sm text-neutral-10 underline underline-offset-4 hover:text-neutral-12"
        >
          {viewAllLabel}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <ProductTile
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name}
            price={Number(product.price)}
            compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
            primaryImageUrl={product.images[0] ?? ""}
            hoverImageUrl={product.images[1] ?? ""}
          />
        ))}
      </div>
    </div>
  );
}
