"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { PaymentDetailSection } from "@/components/admin/payments/payment-detail-section";
import { PaymentStatusBadge } from "@/components/admin/payments/payment-status-badge";
import { ProviderEventResultBadge } from "@/components/admin/payments/provider-event-result-badge";
import { useAdminPaymentTransactionDetail } from "@/hooks/usePayment";
import { formatVndAmount } from "@/lib/schemas/payment-config";
import { formatDateTime } from "@/utils/dateTimeUtil";

function fieldValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";

  return String(value);
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border bg-muted/20 p-4">
          <dt className="text-xs font-medium uppercase text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 break-all text-sm font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminPaymentTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const transactionId = params.transactionId;
  const { data, isError, isPending, refetch } =
    useAdminPaymentTransactionDetail(transactionId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải chi tiết giao dịch</AlertTitle>
        <AlertDescription>
          Giao dịch không tồn tại hoặc bạn không có quyền truy cập.
        </AlertDescription>
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => void refetch()}
        >
          Thử lại
        </Button>
      </Alert>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Payment Detail</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {data.paymentCode}
          </h1>
          <p className="text-sm text-muted-foreground">{data.id}</p>
        </div>
        <Button variant="outline" render={<Link href="/admin/payments" />}>
          Quay lại danh sách
        </Button>
      </div>

      <PaymentDetailSection title="Thông tin giao dịch">
        <DetailGrid
          items={[
            {
              label: "Trạng thái",
              value: <PaymentStatusBadge status={data.status} />,
            },
            { label: "Số tiền", value: formatVndAmount(data.amount) },
            { label: "Tiền tệ", value: data.currency },
            {
              label: "Học viên",
              value: data.learner
                ? `${data.learner.name} (${data.learner.email})`
                : "-",
            },
            { label: "Learner ID", value: data.learnerId },
            { label: "Khóa học", value: data.course?.title ?? "-" },
            { label: "Course ID", value: data.courseId },
            { label: "Provider", value: data.provider },
            {
              label: "Provider TX",
              value: fieldValue(data.providerTransactionId),
            },
            { label: "Gateway", value: fieldValue(data.providerGateway) },
            {
              label: "Reference",
              value: fieldValue(data.providerReferenceCode),
            },
            { label: "Tạo lúc", value: formatDateTime(data.createdAt) },
            { label: "Hết hạn", value: formatDateTime(data.expiresAt) },
            {
              label: "Thanh toán lúc",
              value: data.paidAt ? formatDateTime(data.paidAt) : "-",
            },
            { label: "Cập nhật", value: formatDateTime(data.updatedAt) },
          ]}
        />
      </PaymentDetailSection>

      <PaymentDetailSection title="Lịch sử trạng thái">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Từ</TableHead>
                <TableHead>Đến</TableHead>
                <TableHead>Tác nhân</TableHead>
                <TableHead>Provider TX</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.audits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Chưa có lịch sử trạng thái.</TableCell>
                </TableRow>
              ) : (
                data.audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>{formatDateTime(audit.createdAt)}</TableCell>
                    <TableCell>{audit.fromStatus ?? "-"}</TableCell>
                    <TableCell>{audit.toStatus}</TableCell>
                    <TableCell>{audit.actorType}</TableCell>
                    <TableCell>{audit.providerTransactionId ?? "-"}</TableCell>
                    <TableCell>{audit.reason ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PaymentDetailSection>

      <PaymentDetailSection title="Sự kiện nhà cung cấp liên quan">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kết quả</TableHead>
                <TableHead>Provider TX</TableHead>
                <TableHead>Mã báo cáo</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Nhận lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.providerEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>Chưa có sự kiện liên quan.</TableCell>
                </TableRow>
              ) : (
                data.providerEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <ProviderEventResultBadge result={event.result} />
                    </TableCell>
                    <TableCell>{event.providerTransactionId}</TableCell>
                    <TableCell>{event.reportedPaymentCode ?? "-"}</TableCell>
                    <TableCell>
                      {formatVndAmount(event.transferAmount)}
                    </TableCell>
                    <TableCell>{event.transferType}</TableCell>
                    <TableCell>{event.gateway ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(event.receivedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            href={`/admin/payments/provider-events/${event.id}`}
                          />
                        }
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PaymentDetailSection>
    </div>
  );
}
