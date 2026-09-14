import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import type {
  InstructorBalanceHistoryItem,
  InstructorBalanceHistoryList,
} from "@/services/api/payment";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTypeLabel(item: InstructorBalanceHistoryItem): string {
  return item.type === "earning_credit" ? "Ghi nhận doanh thu" : "Rút tiền";
}

function getSourceLabel(item: InstructorBalanceHistoryItem): string {
  if (item.course) return item.course.title;
  if (item.withdrawRequestId) {
    return `Yêu cầu rút tiền ${item.withdrawRequestId.slice(0, 8)}`;
  }

  return item.description;
}

function getAvailableLabel(item: InstructorBalanceHistoryItem): string {
  if (item.type !== "earning_credit") return "-";
  if (!item.availableAt) return "Có thể rút ngay";

  const availableAt = new Date(item.availableAt);
  if (availableAt.getTime() <= Date.now()) return "Đã khả dụng";

  return formatDateTime(item.availableAt);
}

export function BalanceHistoryTable({
  data,
  isLoading,
  isError,
  onRetry,
  page,
  limit,
  onPageChange,
  onPageSizeChange,
}: {
  data?: InstructorBalanceHistoryList;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}) {
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử số dư</CardTitle>
        <CardDescription>
          Lịch sử được tạo khi học viên mua khóa học hoặc yêu cầu rút tiền xử lý
          thành công.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">Không tải được lịch sử số dư</p>
            <p className="text-sm text-muted-foreground">
              Vui lòng kiểm tra kết nối và thử lại.
            </p>
            <Button type="button" variant="outline" onClick={onRetry}>
              Tải lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">Chưa có biến động số dư</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lịch sử sẽ xuất hiện khi học viên mua khóa học hoặc yêu cầu rút
              tiền được xử lý thành công.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Doanh thu gốc</TableHead>
                  <TableHead>Phí nền tảng</TableHead>
                  <TableHead>Khả dụng</TableHead>
                  <TableHead>Thay đổi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell>{getTypeLabel(item)}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                      {getSourceLabel(item)}
                    </TableCell>
                    <TableCell>
                      {item.grossAmount === null
                        ? "-"
                        : formatVndAmount(item.grossAmount)}
                    </TableCell>
                    <TableCell>
                      {item.platformFeeAmount === null
                        ? "-"
                        : formatVndAmount(item.platformFeeAmount)}
                    </TableCell>
                    <TableCell>{getAvailableLabel(item)}</TableCell>
                    <TableCell
                      className={
                        item.amountDelta >= 0
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-rose-600"
                      }
                    >
                      {item.amountDelta >= 0 ? "+" : "-"}
                      {formatVndAmount(Math.abs(item.amountDelta))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={data?.page ?? page}
              totalPages={data?.totalPages ?? 1}
              totalItems={data?.total ?? 0}
              pageSize={data?.limit ?? limit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
