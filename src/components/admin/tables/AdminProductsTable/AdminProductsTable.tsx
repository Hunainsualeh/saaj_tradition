"use client";

import { useState } from "react";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  AdminBaseTable,
  AdminButton,
  AdminDropdownMenu,
  AdminDropdownMenuTrigger,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuSeparator,
  AdminTooltip,
  AdminTooltipTrigger,
  AdminAlertDialog,
  AdminAlertDialogContent,
  AdminAlertDialogTitle,
  AdminAlertDialogDescription,
  AdminAlertDialogCancel,
  AdminAlertDialogAction,
  AdminAlertDialogHeader,
  AdminAlertDialogFooter,
  AdminInput,
  AdminDropdownMenuLabel,
  AdminDropdownMenuCheckboxItem,
  buttonVariants,
} from "@/components/admin";
import { useRouter } from "next/navigation";
import {
  adminRoutes,
  cn,
  formatDateToYYYYMMDD,
} from "@/lib";
import { productColumns, defaultVisibleProductColumnIds } from "./columns";
import { ProductGetAllCounts } from "@/types/client";
import { deleteProductById, deleteProductsByIds, toggleProductFeatured } from "@/lib/server/actions";

export function AdminProductsTable({
  products,
}: {
  products: ProductGetAllCounts[];
}) {
  const ITEMS_PER_PAGE = 10;

  // === HOOKS ===
  const router = useRouter();

  // === STATE ===
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deletingIds, setDeletingIds] = useState<boolean>(false);
  const [columnsVisible, setColumnsVisible] = useState<Set<string>>(
    defaultVisibleProductColumnIds,
  );
  const [productsState, setProductsState] = useState(products);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // === FUNCTIONS ===
  const deleteProduct = async (id: string) => {
    const deleted = await deleteProductById(id);

    if (!deleted.success) {
      console.error("Error deleting product:", deleted.error);
      toast.error("Failed to delete product. Please try again.");
      return;
    }

    setPendingDeleteId(null);
    setProductsState((prev) => prev.filter((product) => product.id !== id));
    toast.success("Product deleted successfully.");
  };

  const deleteProducts = async (ids: string[]) => {
    const deleted = await deleteProductsByIds(ids);

    if (!deleted.success) {
      console.error("Error deleting products:", deleted.error);
      toast.error("Failed to delete products. Please try again.");
      return;
    }

    setPendingDeleteIds(null);
    setProductsState((prev) => prev.filter((product) => !ids.includes(product.id)));
    setSelectedIds(new Set());
    toast.success(`${ids.length} product(s) deleted successfully.`);
  };

  const toggleAllSelected = (allPaginatedIds: string[]) => {
    if (selectedIds.size === allPaginatedIds.length) {
      // All selected, deselect all
      setSelectedIds(new Set());
    } else {
      // Select all on current page
      setSelectedIds(new Set(allPaginatedIds));
    }
  };

  const toggleSelectId = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatProducts = (products: ProductGetAllCounts[]) => {
    return products.map((product) => ({
      ...product,
      categoryName: product.categoryName,
      price: `${product.price.toFixed(2)}`,
      isActive: product.isActive ? "Yes" : "No",
      isFeatured: product.isFeatured ? "Yes" : "No",
      createdAt: formatDateToYYYYMMDD(product.createdAt),
      updatedAt: formatDateToYYYYMMDD(product.updatedAt),
    }));
  };

  // === MEMO ===
  const searchLower = searchTerm.toLowerCase();
  const filteredProducts = formatProducts(
    productsState.filter((product) => {
      if (!searchTerm) return true;
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.slug?.toLowerCase().includes(searchLower) ||
        product.categoryName?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }),
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const paginatedProductIds = paginatedProducts.map((p) => p.id);
  const allAreSelected = paginatedProductIds.length > 0 && paginatedProductIds.every((id) => selectedIds.has(id));

  return (
    <>
      <div className="flex justify-between items-center">
        <AdminInput
          type="text"
          placeholder="Search by name, category, slug or description…"
          className="my-3 max-w-lg"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <Link
          href={adminRoutes.productsCreate}
          className={cn(
            "ms-auto me-3",
            buttonVariants({ variant: "default", size: "default" }),
          )}
        >
          Add Product
        </Link>
        {selectedIds.size > 0 && (
          <AdminButton
            variant="destructive"
            onClick={() => setPendingDeleteIds(Array.from(selectedIds))}
            className="me-3"
          >
            Delete Selected ({selectedIds.size})
          </AdminButton>
        )}
        <div className="flex justify-end">
          {/* === COLUMN TOGGLER === */}
          <AdminDropdownMenu>
            <AdminDropdownMenuTrigger asChild>
              <AdminButton variant="outline">Columns</AdminButton>
            </AdminDropdownMenuTrigger>
            <AdminDropdownMenuContent>
              <AdminDropdownMenuLabel>Show/Hide Columns</AdminDropdownMenuLabel>
              {productColumns.map((column) => (
                <AdminDropdownMenuCheckboxItem
                  key={column.accessorKey}
                  checked={columnsVisible.has(column.accessorKey)}
                  onCheckedChange={(checked) =>
                    setColumnsVisible((prev) => {
                      const newSet = new Set(prev);
                      if (checked) {
                        newSet.add(column.accessorKey);
                      } else {
                        newSet.delete(column.accessorKey);
                      }
                      return newSet;
                    })
                  }
                >
                  {column.header}
                </AdminDropdownMenuCheckboxItem>
              ))}
            </AdminDropdownMenuContent>
          </AdminDropdownMenu>
        </div>
      </div>
      <AdminBaseTable
        data={paginatedProducts}
        onRowClick={(row) => router.push(`${adminRoutes.products}/${row.id}/view`)}
        columns={[
          {
            id: "select",
            enableHiding: false,
            header: () => (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                <input
                  type="checkbox"
                  checked={allAreSelected}
                  onChange={() => toggleAllSelected(paginatedProductIds)}
                  aria-label="Select all products"
                  className="cursor-pointer"
                />
              </div>
            ),
            cell: (cell) => {
              const product = cell.row.original;
              return (
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelectId(product.id)}
                    aria-label={`Select ${product.name}`}
                    className="cursor-pointer"
                  />
                </div>
              );
            },
          },
          ...productColumns.filter((column) =>
            columnsVisible.has(column.accessorKey),
          ),
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const product = cell.row.original;

              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <AdminDropdownMenu>
                    <AdminDropdownMenuTrigger asChild>
                      <AdminButton variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </AdminButton>
                    </AdminDropdownMenuTrigger>

                    <AdminDropdownMenuContent align="end">
                      <Link href={`${adminRoutes.products}/${product.id}/view`}>
                        <AdminDropdownMenuItem>View Details</AdminDropdownMenuItem>
                      </Link>
                      <Link href={`${adminRoutes.products}/${product.id}`}>
                        <AdminDropdownMenuItem>Edit</AdminDropdownMenuItem>
                      </Link>
                      <AdminDropdownMenuSeparator />

                      <AdminDropdownMenuItem
                        onSelect={async () => {
                          const result = await toggleProductFeatured(product.id);
                          if (result.success) {
                            setProductsState((prev) =>
                              prev.map((p) =>
                                p.id === product.id
                                  ? { ...p, isFeatured: result.data.isFeatured }
                                  : p,
                              ),
                            );
                            toast.success(
                              result.data.isFeatured
                                ? "Product added to New Arrivals"
                                : "Product removed from New Arrivals",
                            );
                          } else {
                            toast.error("Failed to update featured status");
                          }
                        }}
                      >
                        {product.isFeatured === "Yes"
                          ? "Remove from New Arrivals"
                          : "Add to New Arrivals"}
                      </AdminDropdownMenuItem>

                      <AdminDropdownMenuSeparator />

                      <AdminDropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setPendingDeleteId(product.id);
                        }}
                      >
                        <AdminTooltip>
                          <AdminTooltipTrigger asChild>
                            <span className="w-full flex items-center">
                              Delete
                            </span>
                          </AdminTooltipTrigger>
                        </AdminTooltip>
                      </AdminDropdownMenuItem>
                    </AdminDropdownMenuContent>
                  </AdminDropdownMenu>
                </div>
              );
            },
          },
        ]}
      />

      {/* === PAGINATION === */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </span>
          <div className="flex items-center gap-1">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </AdminButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <AdminButton
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </AdminButton>
            ))}
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </AdminButton>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      <AdminAlertDialog
        open={!!pendingDeleteId}
        onOpenChange={() => setPendingDeleteId(null)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>
              Are you sure you want to delete this product?
            </AdminAlertDialogTitle>
            <AdminAlertDialogDescription>
              This action cannot be undone.
            </AdminAlertDialogDescription>
          </AdminAlertDialogHeader>

          <AdminAlertDialogFooter>
            <AdminAlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AdminAlertDialogCancel>

            <AdminAlertDialogAction
              disabled={!!deletingId}
              onClick={() => {
                setDeletingId(pendingDeleteId);
                if (pendingDeleteId) {
                  deleteProduct(pendingDeleteId);
                }
              }}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AdminAlertDialogAction>
          </AdminAlertDialogFooter>
        </AdminAlertDialogContent>
      </AdminAlertDialog>

      {/* === BULK DELETE CONFIRMATION MODAL === */}
      <AdminAlertDialog
        open={!!pendingDeleteIds}
        onOpenChange={() => setPendingDeleteIds(null)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>
              Are you sure you want to delete {pendingDeleteIds?.length} product(s)?
            </AdminAlertDialogTitle>
            <AdminAlertDialogDescription>
              This action cannot be undone.
            </AdminAlertDialogDescription>
          </AdminAlertDialogHeader>

          <AdminAlertDialogFooter>
            <AdminAlertDialogCancel disabled={deletingIds}>
              Cancel
            </AdminAlertDialogCancel>

            <AdminAlertDialogAction
              disabled={deletingIds}
              onClick={() => {
                setDeletingIds(true);
                if (pendingDeleteIds) {
                  deleteProducts(pendingDeleteIds);
                  setDeletingIds(false);
                }
              }}
            >
              {deletingIds ? "Deleting..." : "Delete"}
            </AdminAlertDialogAction>
          </AdminAlertDialogFooter>
        </AdminAlertDialogContent>
      </AdminAlertDialog>
    </>
  );
}
