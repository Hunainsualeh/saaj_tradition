"use client";

import Image from "next/image";
import Link from "next/link";
import { adminRoutes, formatDateToYYYYMMDD } from "@/lib";
import { AdminButton } from "../AdminButton";

type ProductSize = {
  id: string;
  label: string;
  stockTotal: number;
  stockReserved: number;
};

type AdminProductViewProps = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    images: string[];
    slug: string;
    categories: { name: string; slug: string }[];
    sizeType: string | null;
    sizes: ProductSize[];
    collections: { id: string; name: string }[];
  };
};

export function AdminProductView(props: AdminProductViewProps) {
  const { product } = props;

  return (
    <div className="bg-white rounded-lg border border-neutral-04 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-neutral-04 pb-4">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-11">
            {product.name}
          </h2>
          <p className="text-xs md:text-sm text-neutral-09 mt-1">
            Created: {formatDateToYYYYMMDD(product.createdAt)} · Updated:{" "}
            {formatDateToYYYYMMDD(product.updatedAt)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={`${adminRoutes.products}/${product.id}`}>
            <AdminButton variant="default">Edit Product</AdminButton>
          </Link>
        </div>
      </div>

      {/* Status & Pricing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-01 p-4 rounded">
          <p className="text-sm text-neutral-09 mb-1">Price</p>
          <p className="font-semibold text-neutral-11 text-lg">
            Rs.{product.price.toFixed(2)}
          </p>
        </div>
        {product.compareAtPrice && (
          <div className="bg-neutral-01 p-4 rounded">
            <p className="text-sm text-neutral-09 mb-1">Compare At</p>
            <p className="font-semibold text-neutral-11 text-lg line-through">
              Rs.{product.compareAtPrice.toFixed(2)}
            </p>
          </div>
        )}
        <div className="bg-neutral-01 p-4 rounded">
          <p className="text-sm text-neutral-09 mb-1">Status</p>
          <p
            className={`font-semibold ${product.isActive ? "text-green-700" : "text-red-600"}`}
          >
            {product.isActive ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="bg-neutral-01 p-4 rounded">
          <p className="text-sm text-neutral-09 mb-1">Category</p>
          <p className="font-semibold text-neutral-11">
            {product.categories?.[0]?.name ?? "Uncategorized"}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-base font-semibold text-neutral-11 mb-2">
          Description
        </h3>
        <p className="text-sm text-neutral-10 leading-relaxed whitespace-pre-wrap">
          {product.description}
        </p>
      </div>

      {/* Slug & Size Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-01 p-4 rounded">
          <p className="text-sm text-neutral-09 mb-1">Slug</p>
          <p className="font-mono text-sm text-neutral-11">{product.slug}</p>
        </div>
        <div className="bg-neutral-01 p-4 rounded">
          <p className="text-sm text-neutral-09 mb-1">Size Type</p>
          <p className="text-sm text-neutral-11">
            {product.sizeType || "Not set"}
          </p>
        </div>
      </div>

      {/* Sizes / Stock */}
      {product.sizes.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-neutral-11 mb-3">
            Sizes & Stock
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-04">
                  <th className="text-left py-2 pr-4 text-neutral-09 font-medium">
                    Size
                  </th>
                  <th className="text-left py-2 pr-4 text-neutral-09 font-medium">
                    Total Stock
                  </th>
                  <th className="text-left py-2 pr-4 text-neutral-09 font-medium">
                    Reserved
                  </th>
                  <th className="text-left py-2 pr-4 text-neutral-09 font-medium">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.sizes.map((size) => {
                  const available = size.stockTotal - size.stockReserved;
                  return (
                    <tr
                      key={size.id}
                      className="border-b border-neutral-04 last:border-b-0"
                    >
                      <td className="py-2 pr-4 font-medium text-neutral-11">
                        {size.label}
                      </td>
                      <td className="py-2 pr-4 text-neutral-10">
                        {size.stockTotal}
                      </td>
                      <td className="py-2 pr-4 text-neutral-10">
                        {size.stockReserved}
                      </td>
                      <td
                        className={`py-2 pr-4 font-medium ${available <= 0 ? "text-red-600" : available <= 5 ? "text-amber-600" : "text-green-700"}`}
                      >
                        {available}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collections */}
      {product.collections.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-neutral-11 mb-3">
            Collections
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.collections.map((c) => (
              <span
                key={c.id}
                className="px-3 py-1 bg-neutral-02 border border-neutral-04 rounded-full text-sm text-neutral-11"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Product Images */}
      {product.images.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-neutral-11 mb-3">
            Images ({product.images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {product.images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] bg-neutral-02 rounded overflow-hidden"
              >
                <Image
                  src={image}
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
