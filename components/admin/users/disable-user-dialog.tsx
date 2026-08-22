"use client";

import { LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDisableAdminUser } from "@/hooks/useAdminUsers";
import type { UserProfile } from "@/services/api/users";

interface DisableUserDialogProps {
  user: UserProfile | null;
  onOpenChange: (open: boolean) => void;
}

export function DisableUserDialog({
  user,
  onOpenChange,
}: DisableUserDialogProps) {
  const { disableUser, isPending } = useDisableAdminUser();

  async function handleConfirm() {
    if (!user) return;

    const result = await disableUser(user.id);

    if (result.ok) {
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!isPending) {
          onOpenChange(open);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vô hiệu hóa tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            Tài khoản{" "}
            <span className="font-medium text-foreground">
              {user?.name} ({user?.email})
            </span>{" "}
            sẽ không thể đăng nhập lại vào hệ thống. Thao tác này có thể được
            hoàn tác bằng cách chỉnh sửa lại trạng thái tài khoản.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              "Vô hiệu hóa"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
