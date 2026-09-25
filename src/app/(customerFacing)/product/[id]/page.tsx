import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AnimatedHeadingText,
  BaseSection,
  BreadCrumb,
  ProductTile,
  ProductImageGallery,
} from "@/components";
import { ProductPurchasePanel } from "@/components/common/ProductPurchasePanel/ProductPurchasePanel";
import { JsonLd } from "@/components/seo/JsonLd";
import { SHOP_NAVBAR_TEXT } from "@/components/layout/Navbar/lib";
import { routes } from "@/lib";
import { getProductBySlug, getRelatedProducts } from "@/lib/server/queries";
import {
  SITE_NAME,
  STORE_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  clampDescription,
  pageMetadata,
} from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getVisibleProduct(slug: string) {
  const product = await getProductBySlug(slug);
  if (!product.success || !product.data || !product.data.isActive) {
    notFound();
  }
  return product.data;
}

function productDescription(name: string, description: string, category?: string) {
  const base = description.replace(/\s+/g, " ").trim();
  if (base.length >= 90) return clampDescription(base);
  const suffix = `${category ? `${category} ` : ""}from Saaj Tradition, Ahmedpur East. Cash on delivery across Pakistan.`;
  return clampDescription(base ? `${base} ${suffix}` : `Buy ${name}, ${suffix}`);
}

export async function generateMetadata(
  props: ProductPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const p = await getVisibleProduct(id);
  const category = p.categories[0]?.name;
  const image = p.images?.[0];

  return pageMetadata({
    title: category ? `${p.name} | ${category}` : p.name,
    description: productDescription(p.name, p.description ?? "", category),
    path: `${routes.product}/${p.slug}`,
    images: image ? [{ url: image, alt: p.name }] : undefined,
  });
}

export default async function ProductPage(props: ProductPageProps) {
  const { id } = await props.params;
  const product = await getVisibleProduct(id);
  const categorySlugs = product.categories.map((c) => c.slug);
  const relatedData = await getRelatedProducts(product.slug, categorySlugs);
  const relatedProducts = relatedData.success ? relatedData.data : [];

  const primaryCategory = product.categories[0];
  const productUrl = absoluteUrl(`${routes.product}/${product.slug}`);
  const isAvailable = product.stockStatus !== "OUT_OF_STOCK";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: product.description,
    image: product.images.map((src) => absoluteUrl(src)),
    url: productUrl,
    sku: product.slug,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(primaryCategory ? { category: primaryCategory.name } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "PKR",
      price: product.price.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": STORE_ID },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
  };

  const crumbs = [
    { name: SHOP_NAVBAR_TEXT, path: routes.shop },
    ...(primaryCategory
      ? [{ name: primaryCategory.name, path: `${routes.shopCategories}/${primaryCategory.slug}` }]
      : []),
    { name: product.name },
  ];

  return (
    <main>
      <JsonLd data={[productJsonLd, breadcrumbJsonLd(crumbs)]} />
      <BaseSection id="product-section" className="pb-16 xl:pb-20">
        <div className="flex flex-col gap-1 pt-6 md:pt-10 ">
          <div className="pb-4">
            <BreadCrumb
              items={crumbs.map((crumb) => ({ label: crumb.name, href: crumb.path }))}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 xl:gap-20 relative">
            <div className="w-full lg:w-[44%] xl:w-[42%] lg:shrink-0">
              <ProductImageGallery
                images={product.images}
                productName={product.name}
              />
            </div>

            <ProductPurchasePanel
              product={product}
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <AnimatedHeadingText
            text={primaryCategory ? `More ${primaryCategory.name}` : "Browse more"}
            variant="product-page-title"
          />
          <Link
            href={
              primaryCategory
                ? `${routes.shopCategories}/${primaryCategory.slug}`
                : routes.shop
            }
            className="text-sm text-neutral-10 underline underline-offset-4 hover:text-neutral-12"
          >
            {primaryCategory ? `View all ${primaryCategory.name}` : "View all products"}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full relative">
          {relatedProducts.length === 0 && (
            <p>No other products available</p>
          )}
          {relatedProducts.map((related) => (
            <ProductTile
              key={related.id}
              id={related.id}
              slug={related.slug}
              name={related.name}
              price={Number(related.price)}
              compareAtPrice={related.compareAtPrice ? Number(related.compareAtPrice) : null}
              primaryImageUrl={related.images[0] ?? ""}
              hoverImageUrl={related.images[1] ?? ""}
            />
          ))}
        </div>
      </BaseSection>
    </main>
  );
}
