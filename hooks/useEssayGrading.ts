import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import {
  instructorEssayGradingKeys,
  instructorQuizKeys,
  learnerQuizKeys,
} from "@/lib/query-keys";
import { isApiErrorResponse } from "@/services/axios";
import {
  gradeEssayAnswer,
  listEssayGradingSubmissions,
  type EssayGradingStatusFilter,
  type GradeEssayAnswerPayload,
} from "@/services/api/essay-grading";

export function mapEssayGradingError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 400) {
    return data.error.message || "Điểm hoặc phản hồi không hợp lệ.";
  }
  if (status === 403) return "Bạn không có quyền chấm bài kiểm tra này.";
  if (status === 404) {
    return "Bài kiểm tra, lượt làm bài hoặc câu hỏi không tồn tại.";
  }
  if (status === 409) {
    return data.error.message || "Lượt làm bài chưa sẵn sàng để chấm.";
  }

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useEssayGradingSubmissions(
  courseId: string | null,
  lessonId: string | null,
  status: EssayGradingStatusFilter,
  page: number,
  limit: number,
) {
  const filters = {
    ...(courseId?.trim() ? { courseId } : {}),
    ...(lessonId?.trim() ? { lessonId } : {}),
    status,
    page,
    limit,
  };

  return useQuery({
    queryKey: instructorEssayGradingKeys.list(filters),
    queryFn: () => listEssayGradingSubmissions(filters),
  });
}

interface GradeEssayVariables {
  courseId: string;
  lessonId: string;
  quizId: string;
  attemptId: string;
  questionId: string;
  payload: GradeEssayAnswerPayload;
}

export function useGradeEssayAnswer() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      courseId,
      quizId,
      attemptId,
      questionId,
      payload,
    }: GradeEssayVariables) =>
      gradeEssayAnswer(courseId, quizId, attemptId, questionId, payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: instructorEssayGradingKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: instructorQuizKeys.list(
            variables.courseId,
            variables.lessonId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: instructorQuizKeys.detail(variables.quizId),
        }),
        queryClient.invalidateQueries({
          queryKey: learnerQuizKeys.attempts(
            variables.courseId,
            variables.lessonId,
            variables.quizId,
          ),
        }),
      ]);
      toast.add({ title: "Đã lưu điểm tự luận.", type: "success" });
    },
  });

  async function gradeEssay(
    variables: GradeEssayVariables,
  ): Promise<{ ok: boolean; message?: string }> {
    try {
      await mutation.mutateAsync(variables);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapEssayGradingError(error) };
    }
  }

  return {
    gradeEssay,
    isPending: mutation.isPending,
  };
}
