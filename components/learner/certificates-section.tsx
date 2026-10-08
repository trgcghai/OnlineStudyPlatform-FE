"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, Award01Icon } from "@hugeicons/core-free-icons";
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

export function CertificatesSection({
  completedCourseIds,
}: {
  completedCourseIds: string[];
}) {
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
      <h2
        id="certificates-heading"
        className="flex items-center gap-2 text-xl font-semibold tracking-tight"
      >
        <HugeiconsIcon
          icon={Award01Icon}
          className="size-5 text-primary"
          aria-hidden="true"
        />
        Chứng chỉ của bạn
      </h2>
      {certificatesQuery.isLoading ? (
        <Skeleton className="h-32 w-full" aria-label="Đang tải chứng chỉ" />
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
                  Hoàn thành toàn bộ bài học và đạt các bài quiz để nhận chứng
                  chỉ Việt–Anh.
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
