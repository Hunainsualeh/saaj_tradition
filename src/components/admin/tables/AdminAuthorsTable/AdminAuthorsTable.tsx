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
  AdminTooltip,
  AdminTooltipTrigger,
  AdminTooltipContent,
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
import { deleteAuthorById } from "@/lib/server/actions";
import { AuthorWithPostCount } from "@/types/client";
import { adminRoutes } from "@/lib";
import { authorColumns } from "./columns";

export function AdminAuthorsTable({
  authors,
}: {
  authors: AuthorWithPostCount[];
}) {
  // === HOOKS ===
  const router = useRouter();

  // === STATE ===
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [authorsState, setAuthorsState] = useState(authors);
  const [searchTerm, setSearchTerm] = useState("");

  // === FUNCTIONS ===
  const hasZeroPosts = (author: AuthorWithPostCount) =>
    author._count.posts === 0;

  const deleteAuthor = async (id: string) => {
    const deleted = await deleteAuthorById(id);
    setDeletingId(null);

    if (!deleted.success) {
      console.error("Error deleting author:", deleted.error);
      toast.error("Failed to delete author. Please try again.");
      return;
    }

    setPendingDeleteId(null);
    setAuthorsState((prev) => prev.filter((author) => author.id !== id));
    toast.success("Author deleted successfully.");
  };

  // === MEMO ===
  const filteredAuthors = authorsState.filter((author) =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <AdminInput
        type="text"
        placeholder="Search for author"
        className="my-3 max-w-lg"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <AdminBaseTable
        data={filteredAuthors}
        onRowClick={(row) => router.push(`${adminRoutes.authors}/${row.id}`)}
        columns={[
          ...authorColumns,
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const author = cell.row.original;
              const canDelete = hasZeroPosts(author);

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
                      <Link href={`${adminRoutes.authors}/${author.id}`}>
                        <AdminDropdownMenuItem>Edit</AdminDropdownMenuItem>
                      </Link>
                      <AdminDropdownMenuSeparator />

                      <AdminDropdownMenuItem
                        variant="destructive"
                        onSelect={(e) => {
                          if (!canDelete) {
                            e.preventDefault();
                            return;
                          }
                          setPendingDeleteId(author.id);
                        }}
                        className={
                          canDelete
                            ? ""
                            : "opacity-50 cursor-not-allowed pointer-events-auto"
                        }
                      >
                        <AdminTooltip>
                          <AdminTooltipTrigger asChild>
                            <span className="w-full flex items-center">
                              Delete
                            </span>
                          </AdminTooltipTrigger>

                          {!canDelete && (
                            <AdminTooltipContent className="text-sm">
                              Author cannot be deleted while they still have
                              blogs.
                            </AdminTooltipContent>
                          )}
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

      {/* === DELETE CONFIRMATION MODAL === */}
      <AdminAlertDialog
        open={!!pendingDeleteId}
        onOpenChange={() => setPendingDeleteId(null)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>
              Are you sure you want to delete this author?
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
                  deleteAuthor(pendingDeleteId);
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
