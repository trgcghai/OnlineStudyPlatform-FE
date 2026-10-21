import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface CourseAnalytics {
  courseId: string;
  generatedAt: string;
  progress: {
    enrollmentCount: number;
    averageProgressPercent: number;
    completedEnrollmentCount: number;
    completionRatePercent: number;
  };
  engagement: {
    periodStart: string;
    periodEndExclusive: string;
    activeLearnerCount: number;
    eventCount: number;
    engagementScorePercent: number;
  };
  quizPerformance: {
    gradedAttemptCount: number;
    averageScorePercent: number | null;
    passRatePercent: number | null;
  };
}

export interface AnalyticsRange {
  from: string;
  to: string;
}

export async function getCourseAnalytics(
  courseId: string,
  range: AnalyticsRange,
): Promise<CourseAnalytics> {
  const { data } = await axiosClient.get<ApiSuccessResponse<CourseAnalytics>>(
    `/courses/${courseId}/analytics`,
    { params: { from: range.from, to: range.to } },
  );

  return data.data;
}
