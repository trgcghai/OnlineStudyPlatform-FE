"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { CircleUserRound, GraduationCap, LogIn, UserPlus } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { buttonVariants } from "@/components/ui/button";
import { selectAuthUser, selectIsAuthenticated } from "@/lib/features/authSlice";
import { cn } from "@/lib/utils";

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <span>LMS AI</span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:flex">
              <Link href="/courses" className="hover:text-foreground">
                Khóa học
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {isAuthenticated ? (
              <>
                <NotificationPopover />
                <Link
                  href="/profile"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "hidden sm:inline-flex",
                  )}
                >
                  <CircleUserRound aria-hidden="true" />
                  {user?.name ?? "Hồ sơ"}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <LogIn aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </Link>
                <Link href="/register" className={buttonVariants()}>
                  <UserPlus aria-hidden="true" />
                  <span className="hidden sm:inline">Tạo tài khoản</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">LMS AI</p>
            <p className="mt-1">
              Nền tảng học trực tuyến thông minh cho người học và giảng viên.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/courses" className="hover:text-foreground">
              Khám phá khóa học
            </Link>
            <Link href="/signin" className="hover:text-foreground">
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
