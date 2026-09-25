"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  AdminBaseTable,
  AdminButton,
  AdminDropdownMenu,
  AdminDropdownMenuTrigger,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuSeparator,
  AdminAlertDialog,
  AdminAlertDialogContent,
  AdminAlertDialogTitle,
  AdminAlertDialogDescription,
  AdminAlertDialogCancel,
  AdminAlertDialogAction,
  AdminAlertDialogHeader,
  AdminAlertDialogFooter,
  AdminInput,
} from "@/components/admin";
import { useRouter } from "next/navigation";
import { deleteCollectionById } from "@/lib/server/actions";
import { CollectionItem } from "@/types/client";
import { adminRoutes } from "@/lib";
import { collectionColumns } from "./columns";

export function AdminCollectionsTable({
  collections,
}: {
  collections: CollectionItem[];
}) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [collectionsState, setCollectionsState] = useState(collections);
  const [searchTerm, setSearchTerm] = useState("");

  const deleteCollection = async (id: string) => {
    const deleted = await deleteCollectionById(id);
    setDeletingId(null);
    if (!deleted.success) {
      console.error("Error deleting collection:", deleted.error);
      toast.error("Failed to delete collection. Please try again.");
      return;
    }
    setPendingDeleteId(null);
    setCollectionsState((prev) => prev.filter((c) => c.id !== id));
    toast.success("Collection deleted successfully.");
  };

  const filteredCollections = collectionsState.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <AdminInput
        type="text"
        placeholder="Search for collection"
        className="my-3 max-w-lg"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <AdminBaseTable
        data={filteredCollections}
        onRowClick={(row) => router.push(`${adminRoutes.collections}/${row.id}`)}
        columns={[
          ...collectionColumns,
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const collection = cell.row.original;
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
                      <Link
                        href={`${adminRoutes.collections}/${collection.id}`}
                      >
                        <AdminDropdownMenuItem>Edit</AdminDropdownMenuItem>
                      </Link>
                      <AdminDropdownMenuSeparator />
                      <AdminDropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDeleteId(collection.id)}
                      >
                        Delete
                      </AdminDropdownMenuItem>
                    </AdminDropdownMenuContent>
                  </AdminDropdownMenu>
                </div>
              );
            },
          },
        ]}
      />

      <AdminAlertDialog
        open={!!pendingDeleteId}
        onOpenChange={() => setPendingDeleteId(null)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>
              Are you sure you want to delete this collection?
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
                  deleteCollection(pendingDeleteId);
                }
              }}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AdminAlertDialogAction>
          </AdminAlertDialogFooter>
        </AdminAlertDialogContent>
      </AdminAlertDialog>
    </>
  );
}
