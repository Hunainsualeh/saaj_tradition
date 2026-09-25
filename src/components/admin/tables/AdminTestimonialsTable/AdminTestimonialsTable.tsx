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
import { deleteTestimonialById } from "@/lib/server/actions";
import { TestimonialItem } from "@/types/client";
import { adminRoutes } from "@/lib";
import { testimonialColumns } from "./columns";

export function AdminTestimonialsTable({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testimonialsState, setTestimonialsState] = useState(testimonials);
  const [searchTerm, setSearchTerm] = useState("");

  const deleteTestimonial = async (id: string) => {
    const deleted = await deleteTestimonialById(id);
    setDeletingId(null);
    if (!deleted.success) {
      toast.error("Failed to delete testimonial.");
      return;
    }
    setPendingDeleteId(null);
    setTestimonialsState((prev) => prev.filter((t) => t.id !== id));
    toast.success("Testimonial deleted successfully.");
  };

  const filteredTestimonials = testimonialsState.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <AdminInput
        type="text"
        placeholder="Search testimonials"
        className="my-3 max-w-lg"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <AdminBaseTable
        data={filteredTestimonials}
        onRowClick={(row) => router.push(`${adminRoutes.testimonials}/${row.id}`)}
        columns={[
          ...testimonialColumns,
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const testimonial = cell.row.original;
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
                        href={`${adminRoutes.testimonials}/${testimonial.id}`}
                      >
                        <AdminDropdownMenuItem>Edit</AdminDropdownMenuItem>
                      </Link>
                      <AdminDropdownMenuSeparator />
                      <AdminDropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDeleteId(testimonial.id)}
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
              Delete this testimonial?
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
                  deleteTestimonial(pendingDeleteId);
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
