import { CertificatesSection } from "@/components/learner/certificates-section";

export default function LearnerCertificatesPage() {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          Thành quả học tập
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Chứng chỉ của tôi</h1>
        <p className="max-w-3xl text-muted-foreground">
          Xem lại các chứng chỉ đã được cấp sau khi hoàn thành khóa học.
        </p>
      </div>

      <CertificatesSection />
    </div>
  );
}
