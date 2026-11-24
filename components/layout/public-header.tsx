"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import {
  Bell,
  CircleUserRound,
  GraduationCap,
  LogIn,
  Menu,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { CartPopover } from "@/components/cart/cart-popover";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  selectAuthUser,
  selectIsAuthenticated,
  selectUserRole,
} from "@/lib/features/authSlice";
import { cn } from "@/lib/utils";
import { USER_ROLES } from "@/services/api/users";

export function PublicHeader() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);
  const userRole = useSelector(selectUserRole);
  const isLearner = userRole === USER_ROLES.LEARNER;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="truncate max-[374px]:hidden sm:inline">
              E-Learning AI
            </span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/courses" className="hover:text-foreground">
              Khóa học
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <ModeToggle />
          {isAuthenticated ? (
            <>
              {isLearner ? (
                <span className="hidden sm:block">
                  <CartPopover />
                </span>
              ) : null}
              <span className="hidden sm:block">
                <NotificationPopover />
              </span>
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
              <span className="hidden sm:block">
                <LogoutButton />
              </span>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "hidden sm:inline-flex",
                )}
              >
                <LogIn aria-hidden="true" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants(), "hidden sm:inline-flex")}
              >
                <UserPlus aria-hidden="true" />
                <span className="hidden sm:inline">Tạo tài khoản</span>
              </Link>
            </>
          )}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    aria-label="Mở menu điều hướng"
                  />
                }
              >
                <Menu aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="max-h-dvh w-[min(88vw,22rem)] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 px-3 pb-6">
                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href="/courses"
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "min-h-11 w-full justify-start",
                        )}
                      />
                    }
                  >
                    <GraduationCap aria-hidden="true" />
                    Khóa học
                  </SheetClose>
                  {isAuthenticated ? (
                    <>
                      {isLearner ? (
                        <>
                          <SheetClose
                            nativeButton={false}
                            render={
                              <Link
                                href="/learner/cart"
                                className={cn(
                                  buttonVariants({ variant: "ghost" }),
                                  "min-h-11 w-full justify-start",
                                )}
                              />
                            }
                          >
                            <ShoppingCart aria-hidden="true" />
                            Giỏ hàng
                          </SheetClose>
                          <SheetClose
                            nativeButton={false}
                            render={
                              <Link
                                href="/learner/notifications"
                                className={cn(
                                  buttonVariants({ variant: "ghost" }),
                                  "min-h-11 w-full justify-start",
                                )}
                              />
                            }
                          >
                            <Bell aria-hidden="true" />
                            Thông báo
                          </SheetClose>
                        </>
                      ) : null}
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href="/profile"
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              "min-h-11 w-full justify-start",
                            )}
                          />
                        }
                      >
                        <CircleUserRound aria-hidden="true" />
                        Hồ sơ
                      </SheetClose>
                      <LogoutButton className="w-full justify-start" />
                    </>
                  ) : (
                    <>
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href="/signin"
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "min-h-11 w-full",
                            )}
                          />
                        }
                      >
                        <LogIn aria-hidden="true" />
                        Đăng nhập
                      </SheetClose>
                      <SheetClose
                        render={
                          <Link
                            href="/register"
                            className={cn(buttonVariants(), "min-h-11 w-full")}
                          />
                        }
                      >
                        <UserPlus aria-hidden="true" />
                        Tạo tài khoản
                      </SheetClose>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
