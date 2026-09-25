"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  toggleAdminStatus,
  deleteAdminUser,
} from "@/lib/server/actions/admin-auth-actions";
import {
  AdminAlertDialog,
  AdminAlertDialogContent,
  AdminAlertDialogHeader,
  AdminAlertDialogTitle,
  AdminAlertDialogDescription,
  AdminAlertDialogFooter,
  AdminAlertDialogCancel,
  AdminAlertDialogAction,
} from "@/components/admin";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

export function AdminUsersTable({
  admins,
  currentAdminId,
}: {
  admins: AdminUser[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    const res = await toggleAdminStatus(id);
    setTogglingId(null);
    if (!res.success) {
      toast.error(res.error || "Failed to update admin status");
      return;
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    const res = await deleteAdminUser(confirmDeleteId);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (!res.success) {
      toast.error(res.error || "Failed to delete admin");
      return;
    }
    router.refresh();
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold">
            Admin Users ({admins.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {admin.name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      admin.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </span>
                  {!admin.isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      Disabled
                    </span>
                  )}
                  {admin.id === currentAdminId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{admin.email}</p>
              </div>

              {admin.id !== currentAdminId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(admin.id)}
                    disabled={togglingId === admin.id}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      admin.isActive
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {togglingId === admin.id
                      ? "..."
                      : admin.isActive
                        ? "Disable"
                        : "Enable"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(admin.id)}
                    disabled={deletingId === admin.id}
                    className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {admins.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              No admin users found.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AdminAlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AdminAlertDialogContent>
          <AdminAlertDialogHeader>
            <AdminAlertDialogTitle>Delete Admin User</AdminAlertDialogTitle>
            <AdminAlertDialogDescription>
              Are you sure you want to delete this admin? This action cannot be
              undone.
            </AdminAlertDialogDescription>
          </AdminAlertDialogHeader>
          <AdminAlertDialogFooter>
            <AdminAlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AdminAlertDialogCancel>
            <AdminAlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AdminAlertDialogAction>
          </AdminAlertDialogFooter>
        </AdminAlertDialogContent>
      </AdminAlertDialog>
    </>
  );
}
