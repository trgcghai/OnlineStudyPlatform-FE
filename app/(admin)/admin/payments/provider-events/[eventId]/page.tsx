"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentDetailSection } from "@/components/admin/payments/payment-detail-section";
import { PaymentStatusBadge } from "@/components/admin/payments/payment-status-badge";
import { ProviderEventResultBadge } from "@/components/admin/payments/provider-event-result-badge";
import { useAdminPaymentProviderEventDetail } from "@/hooks/usePayment";
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

export default function AdminProviderEventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const { data, isError, isPending, refetch } =
    useAdminPaymentProviderEventDetail(eventId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không thể tải chi tiết sự kiện</AlertTitle>
        <AlertDescription>
          Sự kiện không tồn tại hoặc bạn không có quyền truy cập.
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
          <p className="text-sm font-medium text-primary">Provider Event</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {data.providerTransactionId}
          </h1>
          <p className="text-sm text-muted-foreground">{data.id}</p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/admin/payments?tab=provider-events" />}
        >
          Quay lại ledger
        </Button>
      </div>

      <PaymentDetailSection title="Thông tin sự kiện">
        <DetailGrid
          items={[
            {
              label: "Kết quả",
              value: <ProviderEventResultBadge result={data.result} />,
            },
            { label: "Provider", value: data.provider },
            { label: "Provider TX", value: data.providerTransactionId },
            {
              label: "Mã báo cáo",
              value: fieldValue(data.reportedPaymentCode),
            },
            { label: "Số tiền", value: formatVndAmount(data.transferAmount) },
            { label: "Loại", value: data.transferType },
            { label: "Gateway", value: fieldValue(data.gateway) },
            {
              label: "Reference",
              value: fieldValue(data.providerReferenceCode),
            },
            { label: "Lý do", value: fieldValue(data.reason) },
            { label: "Nhận lúc", value: formatDateTime(data.receivedAt) },
            {
              label: "Xử lý lúc",
              value: data.processedAt ? formatDateTime(data.processedAt) : "-",
            },
            { label: "Tạo lúc", value: formatDateTime(data.createdAt) },
          ]}
        />
      </PaymentDetailSection>

      <PaymentDetailSection title="Giao dịch liên kết">
        {data.paymentTransaction ? (
          <div className="flex flex-col gap-4">
            <DetailGrid
              items={[
                { label: "Transaction ID", value: data.paymentTransaction.id },
                {
                  label: "Mã thanh toán",
                  value: data.paymentTransaction.paymentCode,
                },
                {
                  label: "Trạng thái",
                  value: (
                    <PaymentStatusBadge
                      status={data.paymentTransaction.status}
                    />
                  ),
                },
                {
                  label: "Learner ID",
                  value: data.paymentTransaction.learnerId,
                },
                { label: "Course ID", value: data.paymentTransaction.courseId },
                {
                  label: "Số tiền",
                  value: formatVndAmount(data.paymentTransaction.amount),
                },
                { label: "Tiền tệ", value: data.paymentTransaction.currency },
              ]}
            />
            <div>
              <Button
                variant="outline"
                render={
                  <Link
                    href={`/admin/payments/transactions/${data.paymentTransaction.id}`}
                  />
                }
              >
                Mở chi tiết giao dịch
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Sự kiện này chưa khớp với giao dịch thanh toán nào.
          </div>
        )}
      </PaymentDetailSection>
    </div>
  );
}
