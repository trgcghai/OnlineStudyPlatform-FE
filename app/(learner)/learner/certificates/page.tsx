import { Award01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CertificatesSection } from "@/components/learner/certificates-section";

export default function LearnerCertificatesPage() {
  return (
    <div className="w-full space-y-6">
      <header className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <HugeiconsIcon
              icon={Award01Icon}
              className="size-7"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">
              Thành quả học tập
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Chứng chỉ của tôi
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Xem các chứng chỉ đã được cấp và tải bản PDF sau khi hoàn thành
              khóa học.
            </p>
          </div>
        </div>
      </header>

      <CertificatesSection />
    </div>
  );
}
