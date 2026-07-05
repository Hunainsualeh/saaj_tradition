import {
  AnimatedHeadingText,
  BaseSection,
  BreadCrumb,
  ProductTile,
  ProductImageGallery,
} from "@/components";
import type { Metadata } from "next";
import { ProductPurchasePanel } from "@/components/common/ProductPurchasePanel/ProductPurchasePanel";
import {
  SHOP_NAVBAR_TEXT,
} from "@/components/layout/Navbar/lib";
import { routes } from "@/lib";
import { getProductBySlug, getThreeRandomProducts } from "@/lib/server/queries";
import Script from "next/script";

// ISR: product pages are cached and refreshed at most every 5 minutes; product
// edits invalidate the CACHE_TAG_PRODUCT tag for immediate updates.
export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata(
  props: ProductPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProductBySlug(id);

  if (!product.success || !product.data) {
    return {
      title: "Product",
    };
  }

  const p = product.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saajtradition.com";
  const url = `${siteUrl}/product/${p.slug}`;
  // Trim to a clean meta-description length; strip newlines from the DB text.
  const description =
    (p.description ?? "").replace(/\s+/g, " ").trim().slice(0, 160) ||
    "Traditional Bahawalpuri dresses from Saaj Tradition.";
  const image = p.images?.[0];

  return {
    title: p.name,
    description,
    // Canonical points at the clean product URL so filtered/duplicate paths
    // don't split ranking signals.
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      url,
      type: "website",
      siteName: "Saaj Tradition",
      // Use the product's own image so WhatsApp/Instagram/Facebook shares show
      // the actual dress instead of the site logo.
      images: image ? [{ url: image, alt: p.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage(props: ProductPageProps) {
  // === PROPS ===
  const { params } = props;

  // === PARAMS ===
  const { id } = await params;

  // === FETCHES (parallel) ===
  const [productData, threeRandomProductsData] = await Promise.all([
    getProductBySlug(id),
    getThreeRandomProducts(id),
  ]);

  if (!productData.success || !productData.data) {
    return (
      <main>
        <section className="pb-16 md:pb-25 px-5 md:px-0 w-100 md:w-75 xl:w-60">
          <BreadCrumb
            items={[{ label: SHOP_NAVBAR_TEXT, href: routes.shop }]}
          />
        </section>
      </main>
    );
  }

  // === PREPARE DATA ===
  const product = productData.data;
  const threeRandomProducts = threeRandomProductsData.success
    ? threeRandomProductsData.data
    : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saajtradition.com";
  const isAvailable = product.stockStatus !== "OUT_OF_STOCK";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    url: `${siteUrl}/product/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Saaj Tradition",
      },
    },
  };

  return (
    <main>
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <BaseSection id="support-section" className="pb-16 xl:pb-20">
        <div className="flex flex-col gap-1 pt-6 md:pt-10 ">
          <div className="pb-4">
            <BreadCrumb
              items={[
                { label: SHOP_NAVBAR_TEXT, href: routes.shop },
                { label: product.name },
              ]}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 xl:gap-24 relative justify-center">
            {/* Image Gallery */}
            <div className="w-full lg:w-1/2">
              <ProductImageGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            {/* Purchase Panel */}
            <ProductPurchasePanel
              product={product}
              // Auto-select when there's a single size (One Size or a product
              // that only comes in one size) so it's purchasable without a picker.
              defaultSize={
                product.sizes.length === 1 ? product.sizes[0]?.id : ""
              }
            />
          </div>
        </div>
      </BaseSection>
      <BaseSection
        id="related-products-section"
        className="pt-10 pb-16 xl:pb-20 flex flex-col gap-8"
      >
        <AnimatedHeadingText text="Browse more" variant="product-page-title" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full relative">
          {threeRandomProducts.length === 0 && (
            <p>No other products available</p>
          )}
          {threeRandomProducts.length > 0 &&
            threeRandomProducts.map((product) => (
              <ProductTile
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                primaryImageUrl={product.images[0] ?? ""}
                hoverImageUrl={product.images[1] ?? ""}
              />
            ))}
        </div>
      </BaseSection>
    </main>
  );
}
