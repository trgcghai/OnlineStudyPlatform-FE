"use client";

import { useMemo, useState } from "react";
import {
  GraduationCap,
  PencilLine,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
  UserX,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAdminUsersList } from "@/hooks/useAdminUsers";
import type {
  AdminUserFilters,
  UserProfile,
  UserStatus,
} from "@/services/api/users";
import { formatDate } from "@/utils/dateTimeUtil";
import StatCard from "@/components/admin/users/StatCard";
import StatusBadge from "@/components/admin/users/StatusBadge";
import RoleBadge from "@/components/admin/users/RoleBadge";
import { Pagination } from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const USER_LIST_PAGE_SIZE = 10;

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

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(ALL_OPTION);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_OPTION);
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(USER_LIST_PAGE_SIZE);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [disablingUser, setDisablingUser] = useState<UserProfile | null>(null);

  const filters = useMemo<AdminUserFilters>(
    () => ({
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      q: appliedSearch || undefined,
      page,
      limit: pageSize,
    }),
    [appliedSearch, page, roleFilter, statusFilter, pageSize],
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
  const totalUsers = data?.total ?? items.length;
  const activeUsersOnPage = items.filter(
    (user) => user.status === "Active",
  ).length;
  const instructorsOnPage = items.filter(
    (user) => user.role === "Instructor",
  ).length;
  const learnersOnPage = items.filter((user) => user.role === "Learner").length;

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng tài khoản"
          value={totalUsers}
          description="Theo bộ lọc hiện tại"
          icon={UsersRound}
        />
        <StatCard
          title="Đang hoạt động"
          value={activeUsersOnPage}
          description="Trên trang hiện tại"
          icon={UserCheck}
        />
        <StatCard
          title="Giảng viên"
          value={instructorsOnPage}
          description="Trên trang hiện tại"
          icon={ShieldCheck}
        />
        <StatCard
          title="Học viên"
          value={learnersOnPage}
          description="Trên trang hiện tại"
          icon={GraduationCap}
        />
      </section>

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
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
            <form
              className="xl:min-w-80 xl:flex-1"
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
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Tìm kiếm"
                >
                  <Search />
                </Button>
              </InputGroup>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={roleFilter}
                onValueChange={(value) =>
                  handleFilterChange(() => setRoleFilter(value as RoleFilter))
                }
                items={ROLE_FILTER_ITEMS}
              >
                <SelectTrigger
                  className="w-full sm:w-44"
                  aria-label="Lọc theo vai trò"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_FILTER_ITEMS) as RoleFilter[]).map(
                    (value) => (
                      <SelectItem key={value || "all"} value={value}>
                        {ROLE_FILTER_ITEMS[value]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  handleFilterChange(() =>
                    setStatusFilter(value as StatusFilter),
                  )
                }
                items={STATUS_FILTER_ITEMS}
              >
                <SelectTrigger
                  className="w-full sm:w-48"
                  aria-label="Lọc theo trạng thái"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_FILTER_ITEMS) as StatusFilter[]).map(
                    (value) => (
                      <SelectItem key={value || "all"} value={value}>
                        {STATUS_FILTER_ITEMS[value]}
                      </SelectItem>
                    ),
                  )}
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
            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
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
                            <p className="font-medium">
                              Không có người dùng nào
                            </p>
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
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Chỉnh sửa ${user.name}`}
                                      disabled={isPending}
                                      onClick={() => openEditDialog(user)}
                                    >
                                      <PencilLine />
                                    </Button>
                                  }
                                />
                                <TooltipContent>
                                  <p>Chỉnh sửa người dùng</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-destructive hover:text-destructive"
                                      aria-label={`Vô hiệu hóa ${user.name}`}
                                      disabled={
                                        isPending || user.status === "Inactive"
                                      }
                                      onClick={() => setDisablingUser(user)}
                                    >
                                      <UserX />
                                    </Button>
                                  }
                                />
                                <TooltipContent>
                                  <p>Vô hiệu hóa người dùng</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

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
