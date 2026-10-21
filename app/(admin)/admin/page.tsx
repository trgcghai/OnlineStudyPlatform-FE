"use client";

import { AlertCircle, BookOpen, GraduationCap, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const numberFormat = new Intl.NumberFormat("vi-VN");

export default function AdminDashboardPage() {
  const query = useAdminDashboard();

  if (query.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Không tải được dashboard</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Vui lòng kiểm tra kết nối rồi thử lại.</span>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Tải lại
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const data = query.data;
  const overview = [
    {
      title: "Người dùng",
      value: data.users.total,
      detail: `${numberFormat.format(data.users.learners)} học viên · ${numberFormat.format(data.users.instructors)} giảng viên`,
      icon: Users,
    },
    {
      title: "Khóa học",
      value: data.courses.total,
      detail: `${numberFormat.format(data.courses.published)} đã xuất bản · ${numberFormat.format(data.courses.pending)} chờ duyệt`,
      icon: BookOpen,
    },
    {
      title: "Lượt ghi danh",
      value: data.enrollments.total,
      detail: `${numberFormat.format(data.enrollments.completed)} đã hoàn thành`,
      icon: GraduationCap,
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: `${data.enrollments.completionRate.toFixed(1)}%`,
      detail: "Trên tổng lượt ghi danh",
      icon: GraduationCap,
    },
  ];
  const riskTotal = data.learningRisk.scoredEnrollments;
  const riskRows = [
    { label: "Thấp", count: data.learningRisk.low, color: "bg-emerald-500" },
    {
      label: "Trung bình",
      count: data.learningRisk.medium,
      color: "bg-amber-500",
    },
    { label: "Cao", count: data.learningRisk.high, color: "bg-rose-500" },
  ];

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Tổng quan hệ thống</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard quản trị
        </h1>
        <p className="text-sm text-muted-foreground">
          Tổng hợp người dùng, khóa học, kết quả học tập và Learning Risk.
        </p>
      </header>

      <section
        aria-label="Chỉ số tổng quan"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {overview.map(({ title, value, detail, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">
                {title}
              </CardTitle>
              <Icon aria-hidden="true" className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {typeof value === "number" ? numberFormat.format(value) : value}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Learning Risk</CardTitle>
          <p className="text-sm text-muted-foreground">
            Phân bố theo điểm đánh giá mới nhất của từng học viên trong mỗi khóa
            học.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-2xl font-semibold">
            {numberFormat.format(riskTotal)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              lượt ghi danh đã được đánh giá
            </span>
          </p>
          {riskRows.map((risk) => {
            const percent =
              riskTotal === 0 ? 0 : (risk.count / riskTotal) * 100;
            return (
              <div key={risk.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{risk.label}</span>
                  <span className="text-muted-foreground">
                    {numberFormat.format(risk.count)} · {percent.toFixed(1)}%
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`Learning Risk ${risk.label}`}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full ${risk.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
