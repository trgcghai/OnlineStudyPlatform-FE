import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface EnrollmentCourseInstructor {
  id: string;
  name: string;
}

export interface EnrollmentCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  instructorId: string;
  instructor?: EnrollmentCourseInstructor;
}

export interface Enrollment {
  id: string;
  learnerId: string;
  courseId: string;
  progress: string;
  completedAt: string | null;
  enrolledAt: string;
  course?: EnrollmentCourse;
}

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  const { data } = await axiosClient.post<ApiSuccessResponse<Enrollment>>(
    `/courses/${courseId}/enrollments`,
  );

  return data.data;
}

export async function listMyEnrollments(): Promise<Enrollment[]> {
  const { data } =
    await axiosClient.get<ApiSuccessResponse<Enrollment[]>>("/enrollments/me");

  return data.data;
}
