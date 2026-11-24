"use client";

import Link from "next/link";
import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Menu,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type LearnerNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const LEARNER_NAVIGATION_ITEMS: LearnerNavigationItem[] = [
  { href: "/learner/dashboard", label: "Tổng quan", icon: CircleUserRound },
  { href: "/learner/notifications", label: "Thông báo", icon: Bell },
  { href: "/learner/courses", label: "Khóa học của tôi", icon: BookOpen },
  { href: "/learner/certificates", label: "Chứng chỉ", icon: Award },
  { href: "/learner/cart", label: "Giỏ hàng", icon: ShoppingCart },
  { href: "/learner/payments", label: "Thanh toán", icon: CreditCard },
  { href: "/profile", label: "Hồ sơ của tôi", icon: CircleUserRound },
];

function NavigationLink({
  item,
  mobile = false,
}: {
  item: LearnerNavigationItem;
  mobile?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        mobile && "min-h-11 w-full justify-start",
      )}
    >
      <Icon data-icon="inline-start" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function LearnerNavigation() {
  return (
    <>
      <nav
        aria-label="Điều hướng học viên"
        className="hidden items-center gap-2 sm:flex"
      >
        {LEARNER_NAVIGATION_ITEMS.map((item) => (
          <NavigationLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="sm:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="min-h-11 w-full justify-between"
                aria-label="Mở menu học viên"
              />
            }
          >
            <span className="inline-flex items-center gap-2">
              <Menu aria-hidden="true" />
              Menu học viên
            </span>
            <ChevronRight aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="max-h-dvh w-[min(88vw,22rem)] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Menu học viên</SheetTitle>
            </SheetHeader>
            <nav
              aria-label="Điều hướng học viên"
              className="flex flex-col gap-2 px-3 pb-6"
            >
              {LEARNER_NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;

                return (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "min-h-11 w-full justify-start",
                        )}
                      />
                    }
                  >
                    <Icon data-icon="inline-start" aria-hidden="true" />
                    {item.label}
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
