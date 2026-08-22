"use client";

import { useMemo, useState } from "react";
import { PencilLine, Search, UsersRound, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DisableUserDialog } from "@/components/admin/users/disable-user-dialog";
import { UserFormDialog } from "@/components/admin/users/user-form-dialog";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  type AssignableRole,
} from "@/lib/schemas/admin-user";
import {
  useAdminUsersList,
} from "@/hooks/useAdminUsers";
import type {
  AdminUserFilters,
  UserProfile,
  UserRole,
  UserStatus,
} from "@/services/api/users";

const PAGE_SIZE = 10;

type RoleFilter = "" | AssignableRole;
type StatusFilter = "" | UserStatus;

const ALL_OPTION = "";

const ROLE_FILTER_ITEMS: Record<RoleFilter, string> = {
  [ALL_OPTION]: "Tất cả vai trò",
  Instructor: ROLE_LABELS.Instructor,
  Learner: ROLE_LABELS.Learner,
};

const STATUS_FILTER_ITEMS: Record<StatusFilter, string> = {
  [ALL_OPTION]: "Tất cả trạng thái",
  Active: STATUS_LABELS.Active,
  Inactive: STATUS_LABELS.Inactive,
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "Instructor") {
    return <Badge variant="secondary">{ROLE_LABELS.Instructor}</Badge>;
  }

  if (role === "Learner") {
    return <Badge variant="outline">{ROLE_LABELS.Learner}</Badge>;
  }

  return <Badge>{role}</Badge>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  return status === "Active" ? (
    <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
      {STATUS_LABELS.Active}
    </Badge>
  ) : (
    <Badge variant="destructive">{STATUS_LABELS.Inactive}</Badge>
  );
}

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(ALL_OPTION);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_OPTION);
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [disablingUser, setDisablingUser] = useState<UserProfile | null>(null);

  const filters = useMemo<AdminUserFilters>(
    () => ({
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      q: appliedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [appliedSearch, page, roleFilter, statusFilter],
  );

  const { data, isPending, isError, refetch } = useAdminUsersList(filters);

  function applySearch() {
    setPage(1);
    setAppliedSearch(searchDraft.trim());
  }

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

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="w-full max-w-6xl space-y-6 py-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tài khoản Giảng viên và Học viên của hệ thống.
          </p>
        </div>
        <Button onClick={openCreateDialog}>Tạo tài khoản</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          className="sm:min-w-64 sm:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            handleFilterChange(applySearch);
          }}
        >
          <InputGroup>
            <InputGroupInput
              placeholder="Tìm theo tên hoặc email..."
              aria-label="Tìm kiếm người dùng"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
            <Button type="submit" variant="ghost" size="icon-xs" aria-label="Tìm kiếm">
              <Search />
            </Button>
          </InputGroup>
        </form>

        <div className="flex gap-3">
          <Select
            value={roleFilter}
            onValueChange={(value) =>
              handleFilterChange(() => setRoleFilter(value as RoleFilter))
            }
            items={ROLE_FILTER_ITEMS}
          >
            <SelectTrigger
              className="w-44"
              aria-label="Lọc theo vai trò"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_FILTER_ITEMS) as RoleFilter[]).map((value) => (
                <SelectItem key={value || "all"} value={value}>
                  {ROLE_FILTER_ITEMS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              handleFilterChange(() => setStatusFilter(value as StatusFilter))
            }
            items={STATUS_FILTER_ITEMS}
          >
            <SelectTrigger
              className="w-48"
              aria-label="Lọc theo trạng thái"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(STATUS_FILTER_ITEMS) as StatusFilter[]
              ).map((value) => (
                <SelectItem key={value || "all"} value={value}>
                  {STATUS_FILTER_ITEMS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải danh sách người dùng</AlertTitle>
          <AlertDescription>
            Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
          </AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <UsersRound
                        className="size-10 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="font-medium">Không có người dùng nào</p>
                      <p className="text-sm text-muted-foreground">
                        Không tìm thấy tài khoản phù hợp với bộ lọc.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Chỉnh sửa ${user.name}`}
                          disabled={isPending}
                          onClick={() => openEditDialog(user)}
                        >
                          <PencilLine />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Vô hiệu hóa ${user.name}`}
                          disabled={isPending || user.status === "Inactive"}
                          onClick={() => setDisablingUser(user)}
                        >
                          <UserX />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isError && !isPending && totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {data?.page} / {totalPages} · {data?.total} tài khoản
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      {formDialogOpen ? (
        <UserFormDialog
          key={editingUser?.id ?? "create"}
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          user={editingUser}
        />
      ) : null}

      <DisableUserDialog
        user={disablingUser}
        onOpenChange={(open) => {
          if (!open) {
            setDisablingUser(null);
          }
        }}
      />
    </div>
  );
}
