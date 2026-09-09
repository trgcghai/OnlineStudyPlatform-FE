"use client";

import { useMemo, useState } from "react";
import { DisableUserDialog } from "@/components/admin/users/disable-user-dialog";
import { AdminUsersStats } from "@/components/admin/users/admin-users-stats";
import { AdminUsersTable } from "@/components/admin/users/admin-users-table";
import {
  AdminUsersToolbar,
  type RoleFilter,
  type StatusFilter,
} from "@/components/admin/users/admin-users-toolbar";
import { UserFormDialog } from "@/components/admin/users/user-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminUsersList } from "@/hooks/useAdminUsers";
import type { AdminUserFilters, UserProfile } from "@/services/api/users";

const USER_LIST_PAGE_SIZE = 10;
const ALL_OPTION = "";

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(ALL_OPTION);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_OPTION);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(USER_LIST_PAGE_SIZE);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [disablingUser, setDisablingUser] = useState<UserProfile | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 500);

  const filters = useMemo<AdminUserFilters>(
    () => ({
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      q: debouncedSearch || undefined,
      page,
      limit: pageSize,
    }),
    [debouncedSearch, page, pageSize, roleFilter, statusFilter],
  );

  const { data, isPending, isError, refetch } = useAdminUsersList(filters);
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalUsers = data?.total ?? items.length;

  function openCreateDialog() {
    setEditingUser(null);
    setFormDialogOpen(true);
  }

  function openEditDialog(user: UserProfile) {
    setEditingUser(user);
    setFormDialogOpen(true);
  }

  function handleFilterChange(apply: () => void) {
    apply();
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <AdminUsersStats items={items} totalUsers={totalUsers} />

      <Card>
        <CardHeader>
          <CardTitle>Quản lý người dùng</CardTitle>
          <CardDescription>
            Tìm kiếm, lọc và quản lý tài khoản Giảng viên hoặc Học viên.
          </CardDescription>
          <CardAction>
            <Button onClick={openCreateDialog}>Tạo tài khoản</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AdminUsersToolbar
            roleFilter={roleFilter}
            search={search}
            statusFilter={statusFilter}
            onRoleChange={(value) =>
              handleFilterChange(() => setRoleFilter(value))
            }
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onStatusChange={(value) =>
              handleFilterChange(() => setStatusFilter(value))
            }
          />

          <AdminUsersTable
            isError={isError}
            isPending={isPending}
            items={items}
            onDisable={setDisablingUser}
            onEdit={openEditDialog}
            onRefetch={() => refetch()}
          />

          {!isError && !isPending && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalUsers}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>

      {formDialogOpen && (
        <UserFormDialog
          key={editingUser?.id ?? "create"}
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          user={editingUser}
        />
      )}

      <DisableUserDialog
        user={disablingUser}
        onOpenChange={(open) => {
          if (!open) setDisablingUser(null);
        }}
      />
    </div>
  );
}
