import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { isApiErrorResponse } from "@/services/axios";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} from "@/constants/constants";
import type { QuestionFormValues, QuizFormValues } from "@/lib/schemas/quiz";
import { instructorQuizKeys } from "@/lib/query-keys";
import {
  addQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  getQuiz,
  listQuizzes,
  reorderQuestions,
  updateQuestion,
  updateQuiz,
  type CreateQuestionPayload,
  type Quiz,
  type QuizQuestion,
  type QuizSummary,
} from "@/services/api/quizzes";

export function mapQuizError(error: unknown): string {
  if (!isAxiosError(error) || !error.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const { status, data } = error.response;

  if (!isApiErrorResponse(data)) {
    return GENERIC_ERROR_MESSAGE;
  }

  if (status === 403) return "Bạn không có quyền quản lý bài kiểm tra này.";
  if (status === 404) return "Bài kiểm tra không tồn tại hoặc đã bị xóa.";
  if (status === 409)
    return (
      data.error.message || "Không thể thay đổi vì bài kiểm tra đã có bài làm."
    );
  if (status === 400) {
    return data.error.message || "Thông tin bài kiểm tra không hợp lệ.";
  }

  return data.error.message || GENERIC_ERROR_MESSAGE;
}

export function useInstructorQuizzes(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: instructorQuizKeys.list(courseId, lessonId),
    queryFn: () => listQuizzes(courseId, lessonId),
    enabled: courseId.trim().length > 0 && lessonId.trim().length > 0,
  });
}

export function useInstructorQuiz(quizId: string) {
  return useQuery({
    queryKey: instructorQuizKeys.detail(quizId),
    queryFn: () => getQuiz(quizId),
    enabled: quizId.trim().length > 0,
  });
}

interface QuizMutationResult {
  ok: boolean;
  data?: Quiz | QuizSummary | QuizQuestion;
  message?: string;
}

function invalidateQuizzes(queryClient: ReturnType<typeof useQueryClient>) {
  return async (courseId: string, lessonId: string) => {
    await queryClient.invalidateQueries({
      queryKey: instructorQuizKeys.list(courseId, lessonId),
    });
  };
}

function invalidateQuizDetail(queryClient: ReturnType<typeof useQueryClient>) {
  return async (quizId: string) => {
    await queryClient.invalidateQueries({
      queryKey: instructorQuizKeys.detail(quizId),
    });
  };
}

export function useCreateInstructorQuiz() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Quiz,
    unknown,
    { courseId: string; lessonId: string; values: QuizFormValues }
  >({
    mutationFn: ({ courseId, lessonId, values }) =>
      createQuiz(courseId, lessonId, {
        title: values.title,
        description: values.description ?? "",
        timeLimitMinutes: values.timeLimitMinutes
          ? Number(values.timeLimitMinutes)
          : null,
        passScore: Number(values.passScore),
      }),
    onSuccess: async (_, variables) => {
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
      toast.add({ title: "Đã tạo bài kiểm tra thành công.", type: "success" });
    },
  });

  async function createInstructorQuiz(
    courseId: string,
    lessonId: string,
    values: QuizFormValues,
  ): Promise<QuizMutationResult> {
    try {
      const quiz = await mutation.mutateAsync({ courseId, lessonId, values });
      return { ok: true, data: quiz };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    createInstructorQuiz,
    isPending: mutation.isPending,
  };
}

export function useUpdateInstructorQuiz() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Quiz,
    unknown,
    {
      quizId: string;
      courseId: string;
      lessonId: string;
      values: QuizFormValues;
    }
  >({
    mutationFn: ({ quizId, values }) =>
      updateQuiz(quizId, {
        title: values.title,
        description: values.description ?? "",
        timeLimitMinutes: values.timeLimitMinutes
          ? Number(values.timeLimitMinutes)
          : null,
        passScore: Number(values.passScore),
      }),
    onSuccess: async (quiz, variables) => {
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
      await invalidateQuizDetail(queryClient)(quiz.id);
      toast.add({ title: "Đã cập nhật bài kiểm tra.", type: "success" });
    },
  });

  async function updateInstructorQuiz(
    quizId: string,
    courseId: string,
    lessonId: string,
    values: QuizFormValues,
  ): Promise<QuizMutationResult> {
    try {
      const quiz = await mutation.mutateAsync({
        quizId,
        courseId,
        lessonId,
        values,
      });
      return { ok: true, data: quiz };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    updateInstructorQuiz,
    isPending: mutation.isPending,
  };
}

export function useDeleteInstructorQuiz() {
  const queryClient = useQueryClient();
  const mutation = useMutation<
    void,
    unknown,
    { quizId: string; courseId: string; lessonId: string }
  >({
    mutationFn: async ({ quizId }) => {
      await deleteQuiz(quizId);
    },
    onSuccess: async (_result, variables) => {
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
      toast.add({ title: "Đã xóa bài kiểm tra.", type: "success" });
    },
  });

  async function deleteInstructorQuiz(
    quizId: string,
    courseId: string,
    lessonId: string,
  ): Promise<QuizMutationResult> {
    try {
      await mutation.mutateAsync({ quizId, courseId, lessonId });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    deleteInstructorQuiz,
    isPending: mutation.isPending,
  };
}

export function useAddInstructorQuestion() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    QuizQuestion,
    unknown,
    {
      quizId: string;
      courseId: string;
      lessonId: string;
      values: QuestionFormValues;
    }
  >({
    mutationFn: ({ quizId, values }) =>
      addQuestion(quizId, toCreateQuestionPayload(values)),
    onSuccess: async (_question, variables) => {
      await invalidateQuizDetail(queryClient)(variables.quizId);
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
    },
  });

  async function addInstructorQuestion(
    quizId: string,
    courseId: string,
    lessonId: string,
    values: QuestionFormValues,
  ): Promise<QuizMutationResult> {
    try {
      const question = await mutation.mutateAsync({
        quizId,
        courseId,
        lessonId,
        values,
      });
      return { ok: true, data: question };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    addInstructorQuestion,
    isPending: mutation.isPending,
  };
}

export function useUpdateInstructorQuestion() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    QuizQuestion,
    unknown,
    {
      question: QuizQuestion;
      courseId: string;
      lessonId: string;
      values: QuestionFormValues;
    }
  >({
    mutationFn: ({ question, values }) =>
      updateQuestion(question.id, toUpdateQuestionPayload(question, values)),
    onSuccess: async (_question, variables) => {
      await invalidateQuizDetail(queryClient)(variables.question.quizId);
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
    },
  });

  async function updateInstructorQuestion(
    question: QuizQuestion,
    courseId: string,
    lessonId: string,
    values: QuestionFormValues,
  ): Promise<QuizMutationResult> {
    try {
      const updated = await mutation.mutateAsync({
        question,
        courseId,
        lessonId,
        values,
      });
      return { ok: true, data: updated };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    updateInstructorQuestion,
    isPending: mutation.isPending,
  };
}

export function useDeleteInstructorQuestion() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    unknown,
    {
      question: QuizQuestion;
      courseId: string;
      lessonId: string;
    }
  >({
    mutationFn: async ({ question }) => {
      await deleteQuestion(question.id);
    },
    onSuccess: async (_result, variables) => {
      await invalidateQuizDetail(queryClient)(variables.question.quizId);
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
      toast.add({ title: "Đã xóa câu hỏi.", type: "success" });
    },
  });

  async function deleteInstructorQuestion(
    question: QuizQuestion,
    courseId: string,
    lessonId: string,
  ): Promise<QuizMutationResult> {
    try {
      await mutation.mutateAsync({ question, courseId, lessonId });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    deleteInstructorQuestion,
    isPending: mutation.isPending,
  };
}

export function useReorderInstructorQuestions() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    QuizQuestion[],
    unknown,
    { quizId: string; courseId: string; lessonId: string; orderedIds: string[] }
  >({
    mutationFn: ({ quizId, orderedIds }) =>
      reorderQuestions(quizId, orderedIds),
    onSuccess: async (_result, variables) => {
      await invalidateQuizDetail(queryClient)(variables.quizId);
      await invalidateQuizzes(queryClient)(
        variables.courseId,
        variables.lessonId,
      );
    },
  });

  async function reorderInstructorQuestions(
    quizId: string,
    courseId: string,
    lessonId: string,
    orderedIds: string[],
  ): Promise<QuizMutationResult> {
    try {
      await mutation.mutateAsync({ quizId, courseId, lessonId, orderedIds });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: mapQuizError(error) };
    }
  }

  return {
    reorderInstructorQuestions,
    isPending: mutation.isPending,
  };
}

function toCreateQuestionPayload(
  values: QuestionFormValues,
): CreateQuestionPayload {
  if (values.type === "MCQ") {
    return {
      type: values.type,
      content: values.content,
      points: Number(values.points),
      options: values.options,
      correctAnswers: values.correctAnswers,
    };
  }
  return {
    type: values.type,
    content: values.content,
    points: Number(values.points),
  };
}

function toUpdateQuestionPayload(
  question: QuizQuestion,
  values: QuestionFormValues,
): CreateQuestionPayload {
  if (values.type === "MCQ") {
    return {
      type: values.type,
      content: values.content,
      points: Number(values.points),
      options: values.options,
      correctAnswers: values.correctAnswers,
    };
  }
  if (question.type === "ESSAY") {
    return {
      type: values.type,
      content: values.content,
      points: Number(values.points),
    };
  }
  return {
    type: values.type,
    content: values.content,
    points: Number(values.points),
  };
}
