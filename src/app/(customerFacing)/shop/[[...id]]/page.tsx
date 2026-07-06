import {
  AnimatedHeadingText,
  BaseSection,
  ProductTile,
  ShopSidebar,
  ShopToolbar,
  CollectionTile,
} from "@/components";
import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/lib";
import { getProductsByCategorySlug, getProductsByCollectionSlug, getCollections, getAllCategories } from "@/lib/server/queries";
import type { ProductQueryFilters } from "@/lib/server/queries/product-queries";

const PRODUCTS_PER_PAGE = 12;

const getShopPageMeta = (
  id?: string[],
  collections?: { name: string; tagline: string | null; slug: string }[],
  categories?: { name: string; slug: string }[],
): { title: string; description: string } => {
  const DEFAULT_TITLE = "Explore Our Shop";
  const DEFAULT_DESCRIPTION =
    "Discover handpicked products crafted with care and passion.";

  if (id && id.length === 2) {
    const [type, slug] = id;

    if (type === "categories") {
      const category = categories?.find((c) => c.slug === slug);
      return {
        title: category?.name ?? DEFAULT_TITLE,
        description: category ? `Browse our ${category.name} collection.` : DEFAULT_DESCRIPTION,
      };
    }

    const storeCollection = collections?.find(
      (collection) => slug === collection.slug,
    );

    return {
      title: storeCollection?.name ?? DEFAULT_TITLE,
      description: storeCollection?.tagline ?? DEFAULT_DESCRIPTION,
    };
  }

  if (id && id.length === 1) {
    const [subpage] = id;

    if (subpage === "collections") {
      return {
        title: "Shop Collections",
        description:
          "Explore our curated collections, featuring seasonal and themed selections.",
      };
    }

    if (subpage === "categories") {
      return {
        title: "Shop Categories",
        description: "Browse products by category.",
      };
    }

    return {
      title: "New Arrivals",
      description: "Discover the latest additions to our collection.",
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [collectionsRes, categoriesRes] = await Promise.all([getCollections(), getAllCategories()]);
  const collections = collectionsRes.success ? collectionsRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];
  const { title } = getShopPageMeta(id, collections, categories);

  return {
    title,
  };
}

// === PAGE ===
export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string[] }>;
  searchParams: Promise<{
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  // === PARAMS ===
  const { id } = await params;
  const rawFilters = await searchParams;
  const currentPage = Math.max(1, parseInt(rawFilters.page ?? "1", 10) || 1);

  // === COLLECTIONS INDEX (/shop/collections) ===
  // Render a grid of collection cards — mirroring the home page's collections
  // section — instead of a flat product list. Each card links to its own
  // /shop/collections/[slug] page, which lists that collection's products.
  if (id && id.length === 1 && id[0] === "collections") {
    const collectionsRes = await getCollections();
    const collections = collectionsRes.success ? collectionsRes.data : [];
    const { title, description } = getShopPageMeta(id);

    return (
      <main>
        <BaseSection id="shop-section" className="pb-6 xl:pb-8">
          <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-6">
            <AnimatedHeadingText
              disableIsInView
              text={title}
              variant="page-title"
              className="pb-1"
            />
            <p className="text-neutral-10 text-base">{description}</p>
          </div>
        </BaseSection>

        <BaseSection id="collections-grid" className="pb-16 xl:pb-20">
          {collections.length === 0 ? (
            <p className="text-neutral-8 text-center">No collections available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <CollectionTile
                  key={collection.slug}
                  title={collection.name}
                  description={collection.tagline}
                  imageUrl={collection.imageUrl}
                  href={`${routes.shopCollections}/${collection.slug}`}
                />
              ))}
            </div>
          )}
        </BaseSection>
      </main>
    );
  }

  // === CATEGORIES INDEX (/shop/categories) ===
  // Grid of category cards; each links to /shop/categories/[slug].
  if (id && id.length === 1 && id[0] === "categories") {
    const categoriesRes = await getAllCategories();
    const categoriesList = categoriesRes.success ? categoriesRes.data : [];
    const { title, description } = getShopPageMeta(id);

    return (
      <main>
        <BaseSection id="shop-section" className="pb-6 xl:pb-8">
          <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-6">
            <AnimatedHeadingText
              disableIsInView
              text={title}
              variant="page-title"
              className="pb-1"
            />
            <p className="text-neutral-10 text-base">{description}</p>
          </div>
        </BaseSection>

        <BaseSection id="categories-grid" className="pb-16 xl:pb-20">
          {categoriesList.length === 0 ? (
            <p className="text-neutral-8 text-center">No categories available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {categoriesList.map((category) =>
                category.imageUrl ? (
                  <CollectionTile
                    key={category.slug}
                    title={category.name}
                    description={category.tagline}
                    imageUrl={category.imageUrl}
                    href={`${routes.shop}/categories/${category.slug}`}
                  />
                ) : (
                  <Link
                    key={category.slug}
                    href={`${routes.shop}/categories/${category.slug}`}
                    className="group flex aspect-4/3 flex-col items-center justify-center rounded-sm border border-neutral-03 bg-neutral-01 p-6 text-center transition-colors hover:border-neutral-09"
                  >
                    <h4 className="text-xl font-medium text-neutral-12">
                      {category.name}
                    </h4>
                    {category.tagline && (
                      <p className="mt-1 text-sm text-neutral-09">
                        {category.tagline}
                      </p>
                    )}
                  </Link>
                ),
              )}
            </div>
          )}
        </BaseSection>
      </main>
    );
  }

  // Determine if this is a collection page (/shop/collections/slug)
  const isCollectionPage = id && id.length === 2 && id[0] === "collections";
  const collectionSlug = isCollectionPage ? id[1] : undefined;

  // Build DB-level filters — search, price, sort all go to the database
  const filters: ProductQueryFilters = {
    ...(rawFilters.q ? { q: rawFilters.q } : {}),
    ...(rawFilters.minPrice ? { minPrice: parseFloat(rawFilters.minPrice) } : {}),
    ...(rawFilters.maxPrice ? { maxPrice: parseFloat(rawFilters.maxPrice) } : {}),
    ...(rawFilters.sort ? { sort: rawFilters.sort as ProductQueryFilters["sort"] } : {}),
  };

  // === FETCHES (parallel) ===
  const [productsResult, collectionsRes, categoriesRes] = await Promise.all([
    collectionSlug
      ? getProductsByCollectionSlug(collectionSlug, currentPage, PRODUCTS_PER_PAGE, filters)
      : getProductsByCategorySlug(
          id && id.length === 2 && id[0] === "categories" ? id[1] : undefined,
          currentPage,
          PRODUCTS_PER_PAGE,
          filters,
        ),
    getCollections(),
    getAllCategories(),
  ]);
  const collections = collectionsRes.success ? collectionsRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  const { title } = getShopPageMeta(id, collections, categories);

  // === EXTRACT DATA ===
  const filteredProducts = productsResult.success ? productsResult.data.products : [];
  const totalProducts = productsResult.success ? productsResult.data.total : 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  // Build pagination href helper
  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (rawFilters.q) params.set("q", rawFilters.q);
    if (rawFilters.minPrice) params.set("minPrice", rawFilters.minPrice);
    if (rawFilters.maxPrice) params.set("maxPrice", rawFilters.maxPrice);
    if (rawFilters.sort) params.set("sort", rawFilters.sort);
    if (page > 1) params.set("page", String(page));
    const base = id ? `/shop/${id.join("/")}` : "/shop";
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <main>
      <BaseSection id="products-section" className="pt-6 md:pt-10 pb-16 xl:pb-20">
        <ShopToolbar
          title={title}
          collections={collections}
          categories={categories}
        />

        <div className="relative flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Desktop-only sidebar nav — on mobile this lives in the toolbar's
              bottom sheet so the product grid isn't pushed down the page. */}
          <ShopSidebar
            collections={collections}
            categories={categories}
            collectionsOpenByDefault={id && id.length === 2}
          />

          <div className="flex-1">
            {/* ERROR LOADING PRODUCTS */}
            {productsResult.success === false && (
              <p className="text-neutral-8 text-center col-span-full">
                Failed to load products.
              </p>
            )}

            {/* PRODUCTS GRID */}
            {productsResult.success && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
                  {filteredProducts.length === 0 && (
                    <p className="text-neutral-8 text-center col-span-full">
                      No products found.
                    </p>
                  )}
                  {filteredProducts.length > 0 &&
                    filteredProducts.map((product, index) => (
                      <ProductTile
                        priority={index < 3}
                        key={product.id}
                        id={product.id}
                        slug={product.slug}
                        name={product.name}
                        price={Number(product.price)}
                        compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
                        primaryImageUrl={product.images[0]}
                        hoverImageUrl={product.images[1]}
                      />
                    ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <nav className="flex items-center justify-center gap-2 pt-10" aria-label="Pagination">
                    {currentPage > 1 && (
                      <Link
                        href={buildPageHref(currentPage - 1)}
                        className="px-3 py-2 text-sm rounded-md border border-neutral-03 text-neutral-09 hover:bg-neutral-02 transition-colors"
                      >
                        Previous
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1,
                      )
                      .reduce<(number | "...")[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === "..." ? (
                          <span key={`dots-${i}`} className="px-2 text-neutral-07">
                            ...
                          </span>
                        ) : (
                          <Link
                            key={item}
                            href={buildPageHref(item as number)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                              item === currentPage
                                ? "bg-neutral-12 text-white"
                                : "border border-neutral-03 text-neutral-09 hover:bg-neutral-02"
                            }`}
                          >
                            {item}
                          </Link>
                        ),
                      )}
                    {currentPage < totalPages && (
                      <Link
                        href={buildPageHref(currentPage + 1)}
                        className="px-3 py-2 text-sm rounded-md border border-neutral-03 text-neutral-09 hover:bg-neutral-02 transition-colors"
                      >
                        Next
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </BaseSection>
    </main>
  );
}
