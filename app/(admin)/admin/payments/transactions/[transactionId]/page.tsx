"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Hash,
  History,
  Landmark,
  RadioTower,
  ReceiptText,
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
      <Card className="bg-linear-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                <ReceiptText className="size-4" aria-hidden="true" />
                Chi tiết giao dịch thanh toán
              </p>
              <CardTitle className="break-all text-2xl font-semibold tracking-tight">
                {data.paymentCode}
              </CardTitle>
              <CardDescription className="break-all font-mono">
                {data.id}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/payments" />}
            >
              <ArrowLeft />
              Quay lại danh sách
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={CircleDollarSign}
              label="Số tiền"
              value={formatVndAmount(data.amount)}
            />
            <SummaryCard
              icon={History}
              label="Trạng thái"
              value={<PaymentStatusBadge status={data.status} />}
            />
            <SummaryCard
              icon={UserRound}
              label="Học viên"
              value={data.learner?.name ?? "-"}
            />
            <SummaryCard
              icon={BookOpen}
              label="Khóa học"
              value={data.order?.items[0]?.courseTitle ?? "-"}
            />
          </div>
        </CardContent>
      </Card>

      <PaymentDetailSection
        title="Thông tin giao dịch"
        description="Thông tin chính của checkout, học viên, khóa học và provider."
      >
        <DetailGrid
          items={[
            {
              icon: History,
              label: "Trạng thái",
              value: <PaymentStatusBadge status={data.status} />,
            },
            {
              icon: CircleDollarSign,
              label: "Số tiền",
              value: formatVndAmount(data.amount),
            },
            { icon: Hash, label: "Tiền tệ", value: data.currency },
            {
              icon: UserRound,
              label: "Học viên",
              value: data.learner
                ? `${data.learner.name} (${data.learner.email})`
                : "-",
            },
            { icon: GraduationCap, label: "Learner ID", value: data.learnerId },
            {
              icon: BookOpen,
              label: "Courses",
              value:
                data.order?.items.map((item) => item.courseTitle).join(", ") ??
                "-",
            },
            { icon: Landmark, label: "Provider", value: data.provider },
            {
              icon: RadioTower,
              label: "Provider TX",
              value: fieldValue(data.providerTransactionId),
            },
            {
              icon: Landmark,
              label: "Gateway",
              value: fieldValue(data.providerGateway),
            },
            {
              icon: Hash,
              label: "Reference",
              value: fieldValue(data.providerReferenceCode),
            },
            {
              icon: CalendarClock,
              label: "Tạo lúc",
              value: formatDateTime(data.createdAt),
            },
            {
              icon: Clock3,
              label: "Hết hạn",
              value: formatDateTime(data.expiresAt),
            },
            {
              icon: CalendarClock,
              label: "Thanh toán lúc",
              value: data.paidAt ? formatDateTime(data.paidAt) : "-",
            },
            {
              icon: Clock3,
              label: "Cập nhật",
              value: formatDateTime(data.updatedAt),
            },
          ]}
        />
      </PaymentDetailSection>

      <PaymentDetailSection
        title="Lịch sử trạng thái"
        description="Các chuyển trạng thái đã được ghi nhận cho giao dịch này."
      >
        <div className="overflow-hidden rounded-2xl border bg-card">
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
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                        <History className="size-8" aria-hidden="true" />
                        Chưa có lịch sử trạng thái.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>{formatDateTime(audit.createdAt)}</TableCell>
                      <TableCell>
                        {audit.fromStatus && (
                          <PaymentStatusBadge status={audit.fromStatus} />
                        )}
                        {!audit.fromStatus && "-"}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={audit.toStatus} />
                      </TableCell>
                      <TableCell className="capitalize">
                        {audit.actorType}
                      </TableCell>
                      <TableCell>
                        {audit.providerTransactionId ?? "-"}
                      </TableCell>
                      <TableCell>{audit.reason ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </PaymentDetailSection>

      <PaymentDetailSection
        title="Sự kiện nhà cung cấp liên quan"
        description="Ledger webhook/provider đã khớp với giao dịch này."
      >
        <div className="overflow-hidden rounded-2xl border bg-card">
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
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                        <RadioTower className="size-8" aria-hidden="true" />
                        Chưa có sự kiện liên quan.
                      </div>
                    </TableCell>
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
                          nativeButton={false}
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
        </div>
      </PaymentDetailSection>
    </div>
  );
}
