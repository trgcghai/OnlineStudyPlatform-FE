"use client";

import { LogoutButton } from "@/components/auth/logout-button";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin console
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              Quản trị hệ thống học tập
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <NotificationPopover />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
