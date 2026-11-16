"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, ShoppingCart, Trash2 } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart, useRemoveCartItem } from "@/hooks/useCart";
import { useClampUrlPage } from "@/hooks/useClampUrlPage";
import { formatCoursePrice } from "@/lib/schemas/course";
import {
  pageParser,
  URL_FILTER_HISTORY,
} from "@/lib/search-params/filter-parsers";

const CART_PAGE_LIMIT = 10;

export default function LearnerCartPage() {
  const [filters, setFilters] = useQueryStates(
    { page: pageParser },
    { history: URL_FILTER_HISTORY },
  );
  const cartQuery = useCart({ page: filters.page, limit: CART_PAGE_LIMIT });
  const removeCartItem = useRemoveCartItem();
  const cart = cartQuery.data;
  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;
  const totalPages = cart?.totalPages ?? 1;

  useClampUrlPage({
    page: filters.page,
    totalPages,
    enabled: !cartQuery.isLoading && !cartQuery.isError,
    onPageChange: (nextPage) => {
      void setFilters({ page: nextPage });
    },
  });

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:gap-4">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            Giỏ hàng của tôi
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Khóa học đã chọn
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Xem lại các khóa học bạn đã thêm vào giỏ hàng.
          </p>
        </div>
        <div className="w-full shrink-0 rounded-2xl bg-muted p-4 text-sm sm:w-auto">
          <p className="text-muted-foreground">Tổng tạm tính</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCoursePrice(cart?.summary.totalPrice ?? 0)}
          </p>
          {items.length > 0 ? (
            <Link
              href="/learner/checkout"
              className={buttonVariants({
                className: "mt-4 w-full sm:min-w-48",
              })}
            >
              Xem lại đơn hàng
            </Link>
          ) : null}
        </div>
      </div>

      {cartQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {cartQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Không thể tải giỏ hàng. Vui lòng thử lại.
        </div>
      ) : null}

      {!cartQuery.isLoading && !cartQuery.isError && items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border bg-card px-4 py-12 text-center sm:px-6 sm:py-16">
          <ShoppingCart
            className="size-12 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-xl font-semibold">Giỏ hàng đang trống</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Hãy khám phá danh mục khóa học và thêm khóa học trả phí bạn muốn
            mua.
          </p>
          <Link
            href="/courses"
            className={buttonVariants({ className: "mt-6" })}
          >
            Tiếp tục xem khóa học
          </Link>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex sm:gap-4 sm:p-4"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24 sm:rounded-2xl">
                {item.course.thumbnail ? (
                  <Image
                    src={item.course.thumbnail}
                    unoptimized
                    alt={item.course.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 640px) 96px, 80px"
                  />
                ) : (
                  <BookOpen
                    className="m-6 size-8 text-muted-foreground sm:m-8"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/courses/${item.courseId}`}
                  className="line-clamp-2 text-base font-semibold hover:text-primary sm:text-lg"
                >
                  {item.course.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.course.instructor?.name ?? "Giảng viên đang cập nhật"}
                </p>
                <p className="mt-3 font-semibold">
                  {formatCoursePrice(item.course.price)}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="self-start"
                aria-label={`Xóa ${item.course.title} khỏi giỏ hàng`}
                disabled={removeCartItem.isPending}
                onClick={() => removeCartItem.mutate(item.courseId)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </article>
          ))}

          <Pagination
            page={filters.page}
            pageSize={CART_PAGE_LIMIT}
            totalItems={total}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              void setFilters({ page: nextPage });
            }}
            allowPageSizeChange={false}
          />
        </div>
      ) : null}
    </section>
  );
}
