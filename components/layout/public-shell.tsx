"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/public-header";

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">E-Learning AI</p>
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
