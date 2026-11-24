"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  mobileIconOnly?: boolean;
}

export function LogoutButton({
  className,
  mobileIconOnly = false,
}: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) setOpen(nextOpen);
      }}
    >
      <Button
        type="button"
        variant="destructive"
        size={mobileIconOnly ? "icon" : undefined}
        className={cn("min-h-11 sm:min-h-9", className)}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            <span className={mobileIconOnly ? "sr-only" : undefined}>
              Đang đăng xuất...
            </span>
          </>
        ) : (
          <>
            <LogOut aria-hidden="true" />
            <span className={mobileIconOnly ? "sr-only" : undefined}>
              Đăng xuất
            </span>
          </>
        )}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Đăng xuất khỏi tài khoản?</AlertDialogTitle>
          <AlertDialogDescription>
            Phiên làm việc hiện tại sẽ kết thúc và bạn cần đăng nhập lại để tiếp
            tục sử dụng hệ thống.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleLogout();
            }}
          >
            {pending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Đang đăng xuất...
              </>
            ) : (
              "Đăng xuất"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
