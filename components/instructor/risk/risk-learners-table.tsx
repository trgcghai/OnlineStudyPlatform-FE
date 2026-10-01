"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Course } from "@/services/api/courses";
import type { RiskScore } from "@/services/api/risk";
import {
  formatRiskDate,
  formatRiskScore,
  getTopRiskFactor,
  RISK_BAND_BADGE_VARIANTS,
  RISK_BAND_LABELS,
} from "./risk-formatters";

interface RiskLearnersTableProps {
  course: Course;
  items: RiskScore[];
  isError: boolean;
  isPending: boolean;
  onOpenLearner: (learner: RiskScore) => void;
  onRefetch: () => void;
}

export function RiskLearnersTable({
  course,
  items,
  isError,
  isPending,
  onOpenLearner,
  onRefetch,
}: RiskLearnersTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Không thể tải danh sách rủi ro</AlertTitle>
        <AlertDescription>
          Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
        </AlertDescription>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={onRefetch}
        >
          Thử lại
        </Button>
      </Alert>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-14 w-full rounded-lg"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
        <ShieldCheck
          className="size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="font-medium">Không có học viên vượt ngưỡng rủi ro</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Thử giảm ngưỡng hoặc chọn mức rủi ro khác để kiểm tra thêm học viên.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học viên</TableHead>
              <TableHead>Khóa học</TableHead>
              <TableHead>Mức rủi ro</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Yếu tố chính</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const topFactor = getTopRiskFactor(item.factors);

              return (
                <TableRow
                  key={`${item.courseId}-${item.learnerId}-${item.calculatedAt}`}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.learnerId}</span>
                      <span className="text-xs text-muted-foreground">
                        Enrollment: {item.enrollmentId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 truncate">
                    {course.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={RISK_BAND_BADGE_VARIANTS[item.band]}>
                      {RISK_BAND_LABELS[item.band]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatRiskScore(item.score)}
                  </TableCell>
                  <TableCell>
                    {topFactor?.label ?? "Chưa có yếu tố nổi bật"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRiskDate(item.calculatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenLearner(item)}
                    >
                      Xem nhanh
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
