"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { CircleUserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { buttonVariants } from "@/components/ui/button";
import { selectAuthUser } from "@/lib/features/authSlice";
import { cn } from "@/lib/utils";

export function InstructorTopbar() {
  const user = useSelector(selectAuthUser);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instructor console
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              Quản trị hệ thống học tập
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPopover />
          <Link
            href="/instructor/profile"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "max-w-44",
            )}
          >
            <CircleUserRound data-icon="inline-start" aria-hidden="true" />
            <span className="hidden truncate sm:inline">
              {user?.name ?? "Hồ sơ"}
            </span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
