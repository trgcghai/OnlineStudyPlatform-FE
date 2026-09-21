"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  Hash,
  Landmark,
  Link2,
  RadioTower,
  ReceiptText,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  items: Array<{
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
  }>;
}) {
  return (
    <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/30"
          >
            <dt className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
              {item.label}
            </dt>
            <dd className="mt-2 break-all text-sm font-medium">{item.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {label}
          </p>
          <div className="mt-1 truncate text-sm font-semibold">{value}</div>
        </div>
      </div>
    </div>
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
      <Card className="bg-linear-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                <RadioTower className="size-4" aria-hidden="true" />
                Chi tiết sự kiện nhà cung cấp
              </p>
              <CardTitle className="break-all text-2xl font-semibold tracking-tight">
                {data.providerTransactionId}
              </CardTitle>
              <CardDescription className="break-all font-mono">
                {data.id}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/payments?tab=provider-events" />}
            >
              <ArrowLeft />
              Quay lại ledger
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={ShieldAlert}
              label="Kết quả"
              value={<ProviderEventResultBadge result={data.result} />}
            />
            <SummaryCard
              icon={CircleDollarSign}
              label="Số tiền"
              value={formatVndAmount(data.transferAmount)}
            />
            <SummaryCard
              icon={Landmark}
              label="Gateway"
              value={data.gateway ?? "-"}
            />
            <SummaryCard
              icon={Link2}
              label="Liên kết"
              value={data.paymentTransaction ? "Đã khớp" : "Chưa khớp"}
            />
          </div>
        </CardContent>
      </Card>

      <PaymentDetailSection
        title="Thông tin sự kiện"
        description="Thông tin đã nhận từ provider và kết quả xử lý nội bộ."
      >
        <DetailGrid
          items={[
            {
              icon: ShieldAlert,
              label: "Kết quả",
              value: <ProviderEventResultBadge result={data.result} />,
            },
            { icon: Landmark, label: "Provider", value: data.provider },
            {
              icon: RadioTower,
              label: "Provider TX",
              value: data.providerTransactionId,
            },
            {
              icon: ReceiptText,
              label: "Mã báo cáo",
              value: fieldValue(data.reportedPaymentCode),
            },
            {
              icon: CircleDollarSign,
              label: "Số tiền",
              value: formatVndAmount(data.transferAmount),
            },
            { icon: RadioTower, label: "Loại", value: data.transferType },
            {
              icon: Landmark,
              label: "Gateway",
              value: fieldValue(data.gateway),
            },
            {
              icon: Hash,
              label: "Reference",
              value: fieldValue(data.providerReferenceCode),
            },
            {
              icon: ShieldAlert,
              label: "Lý do",
              value: fieldValue(data.reason),
            },
            {
              icon: CalendarClock,
              label: "Nhận lúc",
              value: formatDateTime(data.receivedAt),
            },
            {
              icon: CalendarClock,
              label: "Xử lý lúc",
              value: data.processedAt ? formatDateTime(data.processedAt) : "-",
            },
            {
              icon: CalendarClock,
              label: "Tạo lúc",
              value: formatDateTime(data.createdAt),
            },
          ]}
        />
      </PaymentDetailSection>

      <PaymentDetailSection
        title="Giao dịch liên kết"
        description="Thông tin giao dịch thanh toán đã khớp với sự kiện provider, nếu có."
        action={
          data.paymentTransaction ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/admin/payments/transactions/${data.paymentTransaction.id}`}
                />
              }
            >
              <Link2 />
              Mở giao dịch
            </Button>
          ) : null
        }
      >
        {data.paymentTransaction ? (
          <DetailGrid
            items={[
              {
                icon: Hash,
                label: "Transaction ID",
                value: data.paymentTransaction.id,
              },
              {
                icon: ReceiptText,
                label: "Mã thanh toán",
                value: data.paymentTransaction.paymentCode,
              },
              {
                icon: ShieldAlert,
                label: "Trạng thái",
                value: (
                  <PaymentStatusBadge status={data.paymentTransaction.status} />
                ),
              },
              {
                icon: UserRound,
                label: "Learner ID",
                value: data.paymentTransaction.learnerId,
              },
              {
                icon: BookOpen,
                label: "Course ID",
                value: data.paymentTransaction.orderItems
                  .map((item) => item.courseId)
                  .join(", "),
              },
              {
                icon: CircleDollarSign,
                label: "Số tiền",
                value: formatVndAmount(data.paymentTransaction.amount),
              },
              {
                icon: Hash,
                label: "Tiền tệ",
                value: data.paymentTransaction.currency,
              },
            ]}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            <span className="flex size-12 items-center justify-center rounded-full bg-background">
              <Link2 className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium text-foreground">Chưa khớp giao dịch</p>
              <p className="mt-1">
                Sự kiện này chưa khớp với giao dịch thanh toán nào.
              </p>
            </div>
          </div>
        )}
      </PaymentDetailSection>
    </div>
  );
}
