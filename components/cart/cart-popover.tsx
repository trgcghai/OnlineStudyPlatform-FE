"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, LoaderCircle, ShoppingCart, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCart, useRemoveCartItem } from "@/hooks/useCart";
import { formatCoursePrice } from "@/lib/schemas/course";
import { cn } from "@/lib/utils";

const CART_PREVIEW_LIMIT = 5;

export function CartPopover() {
  const cartQuery = useCart({ page: 1, limit: CART_PREVIEW_LIMIT });
  const removeCartItem = useRemoveCartItem();
  const cart = cartQuery.data;
  const count = cart?.summary.totalItems ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Giỏ hàng"
            className="relative"
          >
            <ShoppingCart />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] gap-3 p-0"
      >
        <PopoverHeader className="p-4 pb-0">
          <PopoverTitle>Giỏ hàng</PopoverTitle>
          <PopoverDescription>
            {count > 0
              ? `${count} khóa học · ${formatCoursePrice(cart?.summary.totalPrice ?? 0)}`
              : "Chưa có khóa học nào trong giỏ hàng"}
          </PopoverDescription>
        </PopoverHeader>

        <div className="max-h-[24rem] overflow-y-auto">
          {cartQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            </div>
          ) : null}

          {cartQuery.isError ? (
            <div className="p-4 text-sm text-destructive">
              Không thể tải giỏ hàng. Vui lòng thử lại sau.
            </div>
          ) : null}

          {!cartQuery.isLoading && !cartQuery.isError && count === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <BookOpen className="size-8" aria-hidden="true" />
              Hãy thêm khóa học trả phí vào giỏ hàng.
            </div>
          ) : null}

          {cart?.items.map((item) => (
            <div key={item.id} className="flex gap-3 border-t p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.course.thumbnail ? (
                  <Image
                    src={item.course.thumbnail}
                    alt={item.course.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <BookOpen
                    className="m-4 size-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">
                  {item.course.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCoursePrice(item.course.price)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Xóa ${item.course.title} khỏi giỏ hàng`}
                disabled={removeCartItem.isPending}
                onClick={() => removeCartItem.mutate(item.courseId)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t p-3">
          <Link
            href="/learner/cart"
            className={cn(buttonVariants({ size: "sm" }), "w-full")}
          >
            Xem giỏ hàng
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
