import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type { InstructorRevenueCourseReport } from "@/services/api/payment";

export function RevenueCourseTable({
  courses,
  isLoading,
  isError,
  onRetry,
}: {
  courses?: InstructorRevenueCourseReport[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo khóa học</CardTitle>
        <CardDescription>
          Doanh thu được tổng hợp từ các giao dịch đã thanh toán thành công.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Không tải được báo cáo doanh thu.
            </p>
            <Button variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        ) : !courses?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có doanh thu trong khoảng thời gian này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Khóa học</th>
                  <th className="px-3 py-3 text-right font-medium">Lượt mua</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Doanh thu gộp
                  </th>
                  <th className="px-3 py-3 text-right font-medium">
                    Phí nền tảng
                  </th>
                  <th className="px-3 py-3 text-right font-medium">
                    Thực nhận
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.courseId} className="border-b last:border-0">
                    <td className="max-w-[280px] truncate px-3 py-4 font-medium">
                      {course.courseTitle}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {course.purchaseCount.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {formatVndAmount(course.grossRevenue)}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {formatVndAmount(course.platformFee)}
                    </td>
                    <td className="px-3 py-4 text-right font-semibold">
                      {formatVndAmount(course.netRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
