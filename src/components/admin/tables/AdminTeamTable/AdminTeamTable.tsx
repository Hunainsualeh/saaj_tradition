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
import { deleteTeamMemberById } from "@/lib/server/actions";
import { TeamMemberItem } from "@/types/client";
import { adminRoutes } from "@/lib";
import { teamColumns } from "./columns";

export function AdminTeamTable({
  members,
}: {
  members: TeamMemberItem[];
}) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [membersState, setMembersState] = useState(members);
  const [searchTerm, setSearchTerm] = useState("");

  const deleteMember = async (id: string) => {
    const deleted = await deleteTeamMemberById(id);
    setDeletingId(null);
    if (!deleted.success) {
      console.error("Error deleting team member:", deleted.error);
      toast.error("Failed to delete team member. Please try again.");
      return;
    }
    setPendingDeleteId(null);
    setMembersState((prev) => prev.filter((m) => m.id !== id));
    toast.success("Team member deleted successfully.");
  };

  const filteredMembers = membersState.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <AdminInput
        type="text"
        placeholder="Search for team member"
        className="my-3 max-w-lg"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <AdminBaseTable
        data={filteredMembers}
        onRowClick={(row) => router.push(`${adminRoutes.team}/${row.id}`)}
        columns={[
          ...teamColumns,
          {
            id: "actions",
            enableHiding: false,
            cell: (cell) => {
              const member = cell.row.original;
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
                      <Link href={`${adminRoutes.team}/${member.id}`}>
                        <AdminDropdownMenuItem>Edit</AdminDropdownMenuItem>
                      </Link>
                      <AdminDropdownMenuSeparator />
                      <AdminDropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDeleteId(member.id)}
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
              Are you sure you want to delete this team member?
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
                  deleteMember(pendingDeleteId);
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
