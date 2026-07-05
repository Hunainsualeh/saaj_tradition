import { AdminHeading, AdminProductsForm } from "@/components/admin";
import type { Metadata } from "next";
import { getProductById, getCollections, getAllCategories } from "@/lib/server/queries";

type AdminProductPageProps = { params: { id: string } };

export async function generateMetadata(
  props: AdminProductPageProps,
): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product.success || !product.data) {
    return {
      title: "Edit Product",
    };
  }

  return {
    title: `Edit ${product.data.name}`,
  };
}

export default async function Page({ params }: AdminProductPageProps) {
  // === PARAMS ===
  const { id } = await params;

  // === QUERIES ===
  const [product, collectionsResponse, categoriesResponse] = await Promise.all([
    getProductById(id),
    getCollections(),
    getAllCategories(),
  ]);

  if (!product.success || !product.data) {
    return <p>Product not found.</p>;
  }

  const collections = collectionsResponse.success
    ? collectionsResponse.data
    : [];
  const categories = categoriesResponse.success
    ? categoriesResponse.data
    : [];

  // === PREPARE DATA ===
  const productData = {
    ...product.data,
    compareAtPrice: product.data.compareAtPrice ?? undefined,
    collectionIds: product.data.collections.map((c) => c.id),
    existingSizes: product.data.existingSizes,
  };

  return (
    <div>
      <AdminHeading heading="Edit Product" />
      <AdminProductsForm
        isEditMode={true}
        productData={productData}
        availableCollections={collections}
        availableCategories={categories}
      />
    </div>
  );
}
