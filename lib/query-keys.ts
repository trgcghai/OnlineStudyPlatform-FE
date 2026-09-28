import type { CartFilters } from "@/services/api/cart";
import type { CourseListFilters } from "@/services/api/courses";
import type { CourseEnrollmentListFilters } from "@/services/api/enrollments";
import type { EssayGradingSubmissionListFilters } from "@/services/api/essay-grading";
import type {
  AdminPaymentTransactionFilters,
  AdminProviderEventFilters,
  AdminWithdrawRequestFilters,
  InstructorBalanceHistoryFilters,
  LearnerPaymentTransactionFilters,
  PaymentConfigAuditFilters,
  WithdrawRequestFilters,
} from "@/services/api/payment";
import type { PublicCourseListFilters } from "@/services/api/public-courses";
import type { AdminUserFilters } from "@/services/api/users";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  banks: () => [...userKeys.all, "banks"] as const,
};

export const instructorAccountKeys = {
  all: ["instructor-account"] as const,
  me: () => [...instructorAccountKeys.all, "me"] as const,
  adminDetail: (instructorId: string) =>
    [...instructorAccountKeys.all, "admin-detail", instructorId] as const,
};

export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (filters: AdminUserFilters) =>
    [...adminUserKeys.all, "list", filters] as const,
};

export const adminCourseApprovalKeys = {
  all: ["admin-course-approvals"] as const,
  list: (filters: CourseListFilters) =>
    [...adminCourseApprovalKeys.all, "list", filters] as const,
};

export const adminCourseContentKeys = {
  all: ["admin-course-content"] as const,
  lessons: (courseId: string) =>
    [...adminCourseContentKeys.all, "lessons", courseId] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  config: () => [...paymentKeys.all, "config"] as const,
  configAudits: (filters: PaymentConfigAuditFilters) =>
    [...paymentKeys.all, "config-audits", filters] as const,
  pricing: () => [...paymentKeys.all, "pricing"] as const,
  transaction: (transactionId: string) =>
    [...paymentKeys.all, "transaction", transactionId] as const,
  learnerTransactions: (filters: LearnerPaymentTransactionFilters) =>
    [...paymentKeys.all, "learner-transactions", filters] as const,
  instructorBalanceSummary: () =>
    [...paymentKeys.all, "instructor-balance-summary"] as const,
  instructorBalanceHistory: (filters: InstructorBalanceHistoryFilters) =>
    [...paymentKeys.all, "instructor-balance-history", filters] as const,
  adminTransactions: (filters: AdminPaymentTransactionFilters) =>
    [...paymentKeys.all, "admin-transactions", filters] as const,
  adminTransactionDetail: (transactionId: string) =>
    [...paymentKeys.all, "admin-transaction-detail", transactionId] as const,
  adminProviderEvents: (filters: AdminProviderEventFilters) =>
    [...paymentKeys.all, "admin-provider-events", filters] as const,
  adminProviderEventDetail: (eventId: string) =>
    [...paymentKeys.all, "admin-provider-event-detail", eventId] as const,
};

export const withdrawKeys = {
  all: ["withdraw"] as const,
  meAll: () => [...withdrawKeys.all, "me"] as const,
  me: (filters: WithdrawRequestFilters) =>
    [...withdrawKeys.meAll(), filters] as const,
  adminAll: () => [...withdrawKeys.all, "admin"] as const,
  admin: (filters: AdminWithdrawRequestFilters) =>
    [...withdrawKeys.adminAll(), filters] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
  list: (filters: CartFilters) => [...cartKeys.all, "list", filters] as const,
};

export const instructorCourseKeys = {
  all: ["instructor-courses"] as const,
  list: (filters: CourseListFilters) =>
    [...instructorCourseKeys.all, "list", filters] as const,
  detail: (courseId: string) =>
    [...instructorCourseKeys.all, "detail", courseId] as const,
};

export const instructorLessonKeys = {
  all: ["instructor-lessons"] as const,
  list: (courseId: string) =>
    [...instructorLessonKeys.all, "list", courseId] as const,
  detail: (lessonId: string) =>
    [...instructorLessonKeys.all, "detail", lessonId] as const,
};

export const instructorQuizKeys = {
  all: ["instructor-quizzes"] as const,
  list: (courseId: string, lessonId: string) =>
    [...instructorQuizKeys.all, "list", courseId, lessonId] as const,
  detail: (quizId: string) =>
    [...instructorQuizKeys.all, "detail", quizId] as const,
};

export const instructorEssayGradingKeys = {
  all: ["instructor-essay-grading"] as const,
  list: (filters: EssayGradingSubmissionListFilters) =>
    [...instructorEssayGradingKeys.all, "list", filters] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const publicCourseKeys = {
  all: ["public-courses"] as const,
  list: (filters: PublicCourseListFilters) =>
    [...publicCourseKeys.all, "list", filters] as const,
  suggestion: (limit: number) =>
    [...publicCourseKeys.all, "suggestion", limit] as const,
  latest: (limit: number) =>
    [...publicCourseKeys.all, "latest", limit] as const,
  detail: (courseId: string) =>
    [...publicCourseKeys.all, "detail", courseId] as const,
};

export const recommendationKeys = {
  all: ["recommendations"] as const,
  mine: (limit: number) => [...recommendationKeys.all, "mine", limit] as const,
};

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  mine: () => [...enrollmentKeys.all, "mine"] as const,
};

export const courseEnrollmentKeys = {
  all: ["course-enrollments"] as const,
  list: (courseId: string, filters: CourseEnrollmentListFilters) =>
    [...courseEnrollmentKeys.all, "list", courseId, filters] as const,
};

export const learnerDashboardKeys = {
  all: ["learner-dashboard"] as const,
  detail: () => [...learnerDashboardKeys.all, "detail"] as const,
};

export const learningKeys = {
  all: ["learning"] as const,
  course: (courseId: string) =>
    [...learningKeys.all, "course", courseId] as const,
  lesson: (courseId: string, lessonId: string) =>
    [...learningKeys.all, "lesson", courseId, lessonId] as const,
  chat: (courseId: string) => [...learningKeys.all, "chat", courseId] as const,
};

export const learnerQuizKeys = {
  all: ["learner-quizzes"] as const,
  detail: (courseId: string, lessonId: string) =>
    [...learnerQuizKeys.all, "detail", courseId, lessonId] as const,
  attempts: (courseId: string, lessonId: string, quizId: string) =>
    [...learnerQuizKeys.all, "attempts", courseId, lessonId, quizId] as const,
};
