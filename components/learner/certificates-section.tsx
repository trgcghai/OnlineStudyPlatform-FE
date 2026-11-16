"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearnerDashboard } from "@/hooks/useLearnerDashboard";
import { useLearnerCertificates } from "@/hooks/useLearnerCertificates";
import {
  downloadCertificate,
  type LearnerCertificate,
} from "@/services/api/certificates";
import { formatDate } from "@/utils/dateTimeUtil";

function CertificateCard({ certificate }: { certificate: LearnerCertificate }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);
    try {
      await downloadCertificate(certificate.id);
    } catch {
      setError("Không tải được chứng chỉ. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{certificate.courseTitle}</CardTitle>
        <CardDescription>
          {certificate.learnerName} · Cấp ngày{" "}
          {formatDate(certificate.issuedAt)}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label={`Tải chứng chỉ PDF: ${certificate.courseTitle}`}
        >
          <HugeiconsIcon
            icon={Download01Icon}
            data-icon="inline-start"
            aria-hidden="true"
          />
          {isDownloading ? "Đang tải…" : "Tải chứng chỉ PDF"}
        </Button>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export function CertificatesSection() {
  const dashboardQuery = useLearnerDashboard();
  const completedCourseIds =
    dashboardQuery.data?.courses
      .filter((course) => course.status === "completed")
      .map((course) => course.courseId) ?? [];
  const certificatesQuery = useLearnerCertificates(completedCourseIds);
  const certificates = certificatesQuery.data ?? [];
  const issuedIds = new Set(
    certificates.map((certificate) => certificate.courseId),
  );
  const isIssuing = completedCourseIds.some((id) => !issuedIds.has(id));

  return (
    <section
      aria-labelledby="certificates-heading"
      className="flex flex-col gap-4"
    >
      {dashboardQuery.isLoading || certificatesQuery.isLoading ? (
        <Skeleton className="h-32 w-full" aria-label="Đang tải chứng chỉ" />
      ) : dashboardQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được trạng thái khóa học</AlertTitle>
          <AlertDescription>
            <Button
              variant="outline"
              onClick={() => dashboardQuery.refetch()}
              disabled={dashboardQuery.isFetching}
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : certificatesQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được danh sách chứng chỉ</AlertTitle>
          <AlertDescription>
            <Button
              variant="outline"
              onClick={() => certificatesQuery.refetch()}
              disabled={certificatesQuery.isFetching}
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {isIssuing && (
            <p role="status" className="text-sm text-muted-foreground">
              Chứng chỉ cho khóa học đã hoàn thành đang được xử lý. Trang sẽ tự
              cập nhật khi sẵn sàng.
            </p>
          )}
          {certificates.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Chưa có chứng chỉ</EmptyTitle>
                <EmptyDescription>
                  Bạn chưa hoàn thành khóa học nào hoặc chứng chỉ chưa được cấp.
                  Hãy tiếp tục học để nhận chứng chỉ khi hoàn thành khóa học.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {certificates.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
