"use client";

import { useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
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
import { useAdminUsersList } from "@/hooks/useAdminUsers";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import {
  limitParser,
  pageParser,
  searchParser,
  URL_FILTER_HISTORY,
  userRoleFilterParser,
  userStatusFilterParser,
} from "@/lib/search-params/filter-parsers";
import type { AdminUserFilters, UserProfile } from "@/services/api/users";

const USER_LIST_PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [disablingUser, setDisablingUser] = useState<UserProfile | null>(null);
  const [filtersState, setFiltersState] = useQueryStates(
    {
      q: searchParser,
      role: userRoleFilterParser,
      status: userStatusFilterParser,
      page: pageParser,
      limit: limitParser(USER_LIST_PAGE_SIZE),
    },
    { history: URL_FILTER_HISTORY },
  );

  const filters = useMemo<AdminUserFilters>(
    () => ({
      role: filtersState.role || undefined,
      status: filtersState.status || undefined,
      q: filtersState.q || undefined,
      page: filtersState.page,
      limit: filtersState.limit,
    }),
    [filtersState],
  );

  const { data, isPending, isError, refetch } = useAdminUsersList(filters);
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalUsers = data?.total ?? items.length;

  useClampUrlPage({
    page: filtersState.page,
    totalPages,
    enabled: !isPending && !isError,
    onPageChange: (nextPage) => {
      void setFiltersState({ page: nextPage });
    },
  });

  function openCreateDialog() {
    setEditingUser(null);
    setFormDialogOpen(true);
  }

  function openEditDialog(user: UserProfile) {
    setEditingUser(user);
    setFormDialogOpen(true);
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
            roleFilter={filtersState.role as RoleFilter}
            search={filtersState.q}
            statusFilter={filtersState.status as StatusFilter}
            onRoleChange={(value) => {
              void setFiltersState({ role: value, page: 1 });
            }}
            onSearchChange={(value) => {
              void setFiltersState({ q: value, page: 1 });
            }}
            onStatusChange={(value) => {
              void setFiltersState({ status: value, page: 1 });
            }}
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
              page={filtersState.page}
              totalPages={totalPages}
              totalItems={totalUsers}
              pageSize={filtersState.limit}
              onPageChange={(nextPage) => {
                void setFiltersState({ page: nextPage });
              }}
              onPageSizeChange={(size) => {
                void setFiltersState({ limit: size, page: 1 });
              }}
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
