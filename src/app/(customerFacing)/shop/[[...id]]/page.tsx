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
import { breadcrumbJsonLd, clampDescription, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProductsByCategorySlug, getProductsByCollectionSlug, getCollections, getAllCategories } from "@/lib/server/queries";
import type { ProductQueryFilters } from "@/lib/server/queries/product-queries";
import { notFound } from "next/navigation";

const PRODUCTS_PER_PAGE = 12;

// The only single-segment shop sub-pages that exist. Anything else
// (/shop/whatever) must 404 instead of rendering the full catalogue at a
// duplicate URL — an unbounded soft-404/duplicate-content space otherwise.
const VALID_SHOP_SUBPAGES = ["collections", "categories", "new-arrivals"];

type ShopPageMeta = {
  title: string;
  heading: string;
  description: string;
  intro: string;
  path: string;
  crumbs: { name: string; path?: string }[];
};

const getShopPageMeta = (
  id?: string[],
  collections?: { name: string; tagline: string | null; slug: string }[],
  categories?: { name: string; tagline?: string | null; slug: string }[],
): ShopPageMeta => {
  if (id && id.length === 2) {
    const [type, slug] = id;

    if (type === "categories") {
      const category = categories?.find((c) => c.slug === slug);
      const name = category?.name ?? "Shop";
      const tagline = category?.tagline?.trim();
      return {
        title: `${name} for Women | Buy Online in Pakistan`,
        heading: name,
        description: clampDescription(
          `Shop ${name.toLowerCase()} for women at Saaj Tradition.${tagline ? ` ${tagline}.` : ""} Ladies boutique in Ahmedpur East, Bahawalpur with cash on delivery across Pakistan.`,
        ),
        intro:
          tagline ||
          `Browse ${name.toLowerCase()} from our Ahmedpur East boutique, delivered to Bahawalpur and across Pakistan.`,
        path: `${routes.shopCategories}/${slug}`,
        crumbs: [
          { name: "Shop", path: routes.shop },
          { name: "Categories", path: routes.shopCategories },
          { name },
        ],
      };
    }

    const collection = collections?.find((c) => c.slug === slug);
    const name = collection?.name ?? "Collection";
    const tagline = collection?.tagline?.trim();
    return {
      title: `${name} | Ladies Suits & Dresses`,
      heading: name,
      description: clampDescription(
        `${tagline ? `${tagline}. ` : ""}Shop the ${name} at Saaj Tradition, a ladies boutique in Ahmedpur East, District Bahawalpur. Cash on delivery across Pakistan.`,
      ),
      intro:
        tagline ||
        `Pieces from the ${name}, delivered from Ahmedpur East to Bahawalpur and across Pakistan.`,
      path: `${routes.shopCollections}/${slug}`,
      crumbs: [
        { name: "Shop", path: routes.shop },
        { name: "Collections", path: routes.shopCollections },
        { name },
      ],
    };
  }

  if (id && id.length === 1) {
    const [subpage] = id;

    if (subpage === "collections") {
      return {
        title: "Collections: Eid, Summer & Festive Wear",
        heading: "Shop Collections",
        description:
          "Explore Saaj Tradition collections of Eid, summer lawn and festive ladies suits, curated at our Ahmedpur East boutique and delivered across Pakistan.",
        intro:
          "Explore our curated collections, featuring seasonal and themed selections.",
        path: routes.shopCollections,
        crumbs: [{ name: "Shop", path: routes.shop }, { name: "Collections" }],
      };
    }

    if (subpage === "categories") {
      return {
        title: "Shop by Category: Ladies Suits & Dresses",
        heading: "Shop Categories",
        description:
          "Browse women's suits and dresses by category at Saaj Tradition, from lawn and cotton to embroidered Bahawalpuri and Eid wear. Cash on delivery in Pakistan.",
        intro: "Browse women's suits and dresses by category.",
        path: routes.shopCategories,
        crumbs: [{ name: "Shop", path: routes.shop }, { name: "Categories" }],
      };
    }

    return {
      title: "New Arrivals: Latest Ladies Suits & Dresses",
      heading: "New Arrivals",
      description:
        "The newest ladies suits and dresses at Saaj Tradition, Ahmedpur East. Fresh Bahawalpuri, lawn and festive designs added weekly with delivery across Pakistan.",
      intro: "Discover the latest additions to our collection.",
      path: routes.shopNewArrivals,
      crumbs: [{ name: "Shop", path: routes.shop }, { name: "New Arrivals" }],
    };
  }

  return {
    title: "Shop Ladies Suits & Bahawalpuri Dresses Online",
    heading: "Shop All",
    description:
      "Shop women's suits online: traditional Bahawalpuri, embroidered lawn, cotton and Eid dresses from our Ahmedpur East boutique. Cash on delivery in Pakistan.",
    intro:
      "Traditional Bahawalpuri, lawn and festive ladies suits from our boutique in Ahmedpur East.",
    path: routes.shop,
    crumbs: [{ name: "Shop" }],
  };
};

type ShopSearchParams = {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string[] }>;
  searchParams: Promise<ShopSearchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const query = await searchParams;

  if (id && id.length === 1 && !VALID_SHOP_SUBPAGES.includes(id[0])) {
    notFound();
  }
  if (id && id.length === 2 && id[0] !== "categories" && id[0] !== "collections") {
    notFound();
  }
  if (id && id.length > 2) {
    notFound();
  }

  const [collectionsRes, categoriesRes] = await Promise.all([getCollections(), getAllCategories()]);
  const collections = collectionsRes.success ? collectionsRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  if (id && id.length === 2) {
    const [type, slug] = id;
    if (type === "categories" && categoriesRes.success && !categories.some((c) => c.slug === slug)) {
      notFound();
    }
    if (type === "collections" && collectionsRes.success && !collections.some((c) => c.slug === slug)) {
      notFound();
    }
  }

  const meta = getShopPageMeta(id, collections, categories);
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const isFiltered = Boolean(query.q || query.minPrice || query.maxPrice || query.sort);
  const canonical = page > 1 && !isFiltered ? `${meta.path}?page=${page}` : meta.path;

  return pageMetadata({
    title: page > 1 ? `${meta.title} - Page ${page}` : meta.title,
    description: meta.description,
    path: canonical,
    noindex: isFiltered,
  });
}

// === PAGE ===
export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ id?: string[] }>;
  searchParams: Promise<ShopSearchParams>;
}) {
  // === PARAMS ===
  const { id } = await params;
  const rawFilters = await searchParams;
  const currentPage = Math.max(1, parseInt(rawFilters.page ?? "1", 10) || 1);

  // Reject URL shapes that can never resolve to a real page (see
  // VALID_SHOP_SUBPAGES). Unknown category/collection SLUGS are validated
  // further down, after the lists have been fetched.
  if (id && id.length === 1 && !VALID_SHOP_SUBPAGES.includes(id[0])) {
    notFound();
  }
  if (id && id.length === 2 && id[0] !== "categories" && id[0] !== "collections") {
    notFound();
  }
  if (id && id.length > 2) {
    notFound();
  }

  // === COLLECTIONS INDEX (/shop/collections) ===
  // Render a grid of collection cards — mirroring the home page's collections
  // section — instead of a flat product list. Each card links to its own
  // /shop/collections/[slug] page, which lists that collection's products.
  if (id && id.length === 1 && id[0] === "collections") {
    const collectionsRes = await getCollections();
    const collections = collectionsRes.success ? collectionsRes.data : [];
    const meta = getShopPageMeta(id);

    return (
      <main>
        <JsonLd data={breadcrumbJsonLd(meta.crumbs)} />
        <BaseSection id="shop-section" className="pb-6 xl:pb-8">
          <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-6">
            <AnimatedHeadingText
              disableIsInView
              text={meta.heading}
              variant="page-title"
              className="pb-1"
            />
            <p className="text-neutral-10 text-base">{meta.intro}</p>
          </div>
        </BaseSection>

        <BaseSection id="collections-grid" className="pb-16 xl:pb-20">
          {collections.length === 0 ? (
            <p className="text-neutral-8 text-center">No collections available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <CollectionTile
                  headingLevel="h2"
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
    const meta = getShopPageMeta(id);

    return (
      <main>
        <JsonLd data={breadcrumbJsonLd(meta.crumbs)} />
        <BaseSection id="shop-section" className="pb-6 xl:pb-8">
          <div className="flex flex-col gap-1 pt-6 md:pt-10 pb-6">
            <AnimatedHeadingText
              disableIsInView
              text={meta.heading}
              variant="page-title"
              className="pb-1"
            />
            <p className="text-neutral-10 text-base">{meta.intro}</p>
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
                    headingLevel="h2"
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
                    <h2 className="text-xl font-medium text-neutral-12">
                      {category.name}
                    </h2>
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

  // Unknown category/collection slug → real 404. Only when the lookup list
  // actually loaded (success) — a transient DB error must not 404 a real page.
  if (id && id.length === 2) {
    const [type, slug] = id;
    if (type === "categories" && categoriesRes.success && !categories.some((c) => c.slug === slug)) {
      notFound();
    }
    if (type === "collections" && collectionsRes.success && !collections.some((c) => c.slug === slug)) {
      notFound();
    }
  }

  const meta = getShopPageMeta(id, collections, categories);

  // === EXTRACT DATA ===
  const filteredProducts = productsResult.success ? productsResult.data.products : [];
  const totalProducts = productsResult.success ? productsResult.data.total : 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  if (productsResult.success && totalPages > 0 && currentPage > totalPages) {
    notFound();
  }

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
      <JsonLd data={breadcrumbJsonLd(meta.crumbs)} />
      <BaseSection id="products-section" className="pt-6 md:pt-10 pb-16 xl:pb-20">
        <ShopToolbar
          title={meta.heading}
          collections={collections}
          categories={categories}
        />
        {currentPage === 1 && !rawFilters.q && (
          <p className="-mt-2 mb-6 max-w-3xl text-sm md:text-base text-neutral-10">
            {meta.intro}
          </p>
        )}

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
                    <div className="col-span-full flex flex-col items-center gap-4 py-12 text-center">
                      <p className="text-neutral-10">
                        {rawFilters.q || rawFilters.minPrice || rawFilters.maxPrice
                          ? "No products match your search or filters."
                          : "No products here yet. New pieces are added every week."}
                      </p>
                      <Link
                        href={routes.shop}
                        className="rounded-full border border-neutral-05 px-5 py-2 text-sm text-neutral-11 transition-colors hover:border-neutral-11"
                      >
                        View all products
                      </Link>
                    </div>
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
