import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface LearnerCertificate {
  id: string;
  courseId: string;
  learnerName: string;
  courseTitle: string;
  issuedAt: string;
  certificateUrl: string;
  verificationUrl: string;
}

export async function getLearnerCertificates(): Promise<LearnerCertificate[]> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<LearnerCertificate[]>
  >("/learner/certificates");
  return data.data;
}

export async function downloadCertificate(id: string): Promise<void> {
  const { data } = await axiosClient.get<Blob>(
    `/learner/certificates/${id}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `certificate-${id}.pdf`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
