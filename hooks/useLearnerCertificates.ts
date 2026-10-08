import { useQuery } from "@tanstack/react-query";
import { certificateKeys } from "@/lib/query-keys";
import { getLearnerCertificates } from "@/services/api/certificates";

export function useLearnerCertificates(completedCourseIds: string[]) {
  return useQuery({
    queryKey: certificateKeys.mine(),
    queryFn: getLearnerCertificates,
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      const issuedCourseIds = new Set(
        query.state.data.map((certificate) => certificate.courseId),
      );
      return completedCourseIds.some((id) => !issuedCourseIds.has(id))
        ? 10_000
        : false;
    },
  });
}
