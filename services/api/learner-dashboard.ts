import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export type LearnerDashboardCourseStatus = "in_progress" | "completed";

export interface LearnerDashboard {
  summary: LearnerDashboardSummary;
  courses: LearnerDashboardCourse[];
  recentActivities: LearnerDashboardRecentActivity[];
}

export interface LearnerDashboardSummary {
  enrolledCourseCount: number;
  completedCourseCount: number;
  averageProgressPercent: number;
  averageQuizScorePercent: number | null;
}

export interface LearnerDashboardCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  thumbnail: string | null;
  category: string;
  instructorName: string | null;
  progressPercent: number;
  status: LearnerDashboardCourseStatus;
  bestQuizScorePercent: number | null;
  bestQuizAttempt: LearnerDashboardBestQuizAttempt | null;
  continueLearning: LearnerDashboardContinueLearning;
}

export interface LearnerDashboardBestQuizAttempt {
  quizId: string;
  attemptId: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  passed: boolean;
}

export interface LearnerDashboardContinueLearning {
  courseId: string;
  lessonId: string | null;
  href: string;
}

export interface LearnerDashboardRecentActivity {
  id: string;
  courseId: string;
  lessonId: string | null;
  courseTitle: string;
  lessonTitle: string | null;
  eventType: string;
  occurredAt: string;
}

export async function getLearnerDashboard(): Promise<LearnerDashboard> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<LearnerDashboard>>(
      "/learner/dashboard",
    );

  return data.data;
}
