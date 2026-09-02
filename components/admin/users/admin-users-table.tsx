"use client";

import { PencilLine, UsersRound, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import RoleBadge from "@/components/admin/users/RoleBadge";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/admin/users/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserProfile } from "@/services/api/users";
import { formatDate } from "@/utils/dateTimeUtil";

function AdminUserRow({
  isPending,
  user,
  onDisable,
  onEdit,
}: {
  isPending: boolean;
  user: UserProfile;
  onDisable: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
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
                  onClick={() => onEdit(user)}
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
                  disabled={isPending || user.status === "Inactive"}
                  onClick={() => onDisable(user)}
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
  );
}

export function AdminUsersTable({
  isError,
  isPending,
  items,
  onDisable,
  onEdit,
  onRefetch,
}: {
  isError: boolean;
  isPending: boolean;
  items: UserProfile[];
  onDisable: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onRefetch: () => void;
}) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải danh sách người dùng</AlertTitle>
        <AlertDescription>
          Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
        </AlertDescription>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={onRefetch}
        >
          Thử lại
        </Button>
      </Alert>
    );
  }

  return (
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
                    <p className="font-medium">Không có người dùng nào</p>
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy tài khoản phù hợp với bộ lọc.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => (
                <AdminUserRow
                  key={user.id}
                  isPending={isPending}
                  user={user}
                  onDisable={onDisable}
                  onEdit={onEdit}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
