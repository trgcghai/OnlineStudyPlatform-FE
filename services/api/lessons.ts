import axiosClient, { type ApiSuccessResponse } from "@/services/axios";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string | null;
  materialUrl: string | null;
  duration: number;
  position: number;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonListResult {
  items: Lesson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLessonPayload {
  title: string;
  description?: string;
  duration?: number;
}

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

export type LessonImportStatus =
  "uploading" | "queued" | "processing" | "completed" | "failed" | "aborted";

export interface LessonImportResult {
  importId: string;
  status: LessonImportStatus;
  progress: number;
  errorDetails: string[];
  createdLessonCount: number;
  failedRowCount: 0;
  firstPosition: number | null;
  lastPosition: number | null;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
}

export interface LessonImportUploadSession {
  importId: string;
  partSize: number;
  parts: { partNumber: number; url: string }[];
  expiresAt: string;
}

export async function listLessons(courseId: string): Promise<LessonListResult> {
  const { data } = await axiosClient.get<ApiSuccessResponse<LessonListResult>>(
    `/courses/${courseId}/lessons`,
  );

  return data.data;
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const { data } = await axiosClient.get<ApiSuccessResponse<Lesson>>(
    `/lessons/${lessonId}`,
  );

  return data.data;
}

export async function createLesson(
  courseId: string,
  payload: CreateLessonPayload,
  video?: File | null,
  material?: File | null,
): Promise<Lesson> {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  if (payload.duration !== undefined)
    formData.append("duration", String(payload.duration));
  if (video) formData.append("video", video);
  if (material) formData.append("material", material);

  const { data } = await axiosClient.post<ApiSuccessResponse<Lesson>>(
    `/courses/${courseId}/lessons`,
    formData,
  );

  return data.data;
}

export async function updateLesson(
  lessonId: string,
  payload: UpdateLessonPayload,
  video?: File | null,
  material?: File | null,
): Promise<Lesson> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.description !== undefined)
    formData.append("description", payload.description);
  if (payload.duration !== undefined)
    formData.append("duration", String(payload.duration));
  if (video) formData.append("video", video);
  if (material) formData.append("material", material);

  const { data } = await axiosClient.patch<ApiSuccessResponse<Lesson>>(
    `/lessons/${lessonId}`,
    formData,
  );

  return data.data;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await axiosClient.delete(`/lessons/${lessonId}`);
}

export async function reorderLessons(
  courseId: string,
  orderedIds: string[],
): Promise<Lesson[]> {
  const { data } = await axiosClient.patch<ApiSuccessResponse<Lesson[]>>(
    `/courses/${courseId}/lessons/reorder`,
    { orderedIds },
  );

  return data.data;
}

export async function initiateLessonImport(
  courseId: string,
  file: File,
): Promise<LessonImportUploadSession> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<LessonImportUploadSession>
  >(`/courses/${courseId}/lessons/imports/initiate`, {
    fileName: file.name,
    fileSize: file.size,
  });

  return data.data;
}

export async function completeLessonImport(
  courseId: string,
  importId: string,
): Promise<LessonImportResult> {
  const { data } = await axiosClient.post<
    ApiSuccessResponse<LessonImportResult>
  >(`/courses/${courseId}/lessons/imports/${importId}/complete`);

  return data.data;
}

export async function getLessonImport(
  courseId: string,
  importId: string,
): Promise<LessonImportResult> {
  const { data } = await axiosClient.get<
    ApiSuccessResponse<LessonImportResult>
  >(`/courses/${courseId}/lessons/imports/${importId}`);

  return data.data;
}

export async function abortLessonImport(
  courseId: string,
  importId: string,
): Promise<void> {
  await axiosClient.delete(`/courses/${courseId}/lessons/imports/${importId}`);
}

export async function uploadLessonImportParts(
  file: File,
  session: LessonImportUploadSession,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<void> {
  const uploadedBytes = new Map<number, number>();
  let nextPartIndex = 0;
  const emitProgress = () => {
    const total = [...uploadedBytes.values()].reduce(
      (sum, value) => sum + value,
      0,
    );
    onProgress(Math.min(100, Math.round((total / file.size) * 100)));
  };

  const uploadPart = async (partIndex: number): Promise<void> => {
    const part = session.parts[partIndex];
    const start = partIndex * session.partSize;
    const blob = file.slice(
      start,
      Math.min(start + session.partSize, file.size),
    );
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await uploadBlob(part.url, blob, signal, (loaded) => {
          uploadedBytes.set(part.partNumber, loaded);
          emitProgress();
        });
        uploadedBytes.set(part.partNumber, blob.size);
        emitProgress();
        return;
      } catch (error) {
        if (signal.aborted || attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  };

  const worker = async () => {
    while (nextPartIndex < session.parts.length) {
      const current = nextPartIndex;
      nextPartIndex += 1;
      await uploadPart(current);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(3, session.parts.length) }, worker),
  );
}

function uploadBlob(
  url: string,
  blob: Blob,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });
    request.open("PUT", url);
    request.upload.onprogress = (event) => onProgress(event.loaded);
    request.onload = () => {
      signal.removeEventListener("abort", abort);
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`MinIO upload failed (${request.status})`));
    };
    request.onerror = () => {
      signal.removeEventListener("abort", abort);
      reject(new Error("Could not upload ZIP to MinIO"));
    };
    request.onabort = () => {
      signal.removeEventListener("abort", abort);
      reject(new DOMException("Upload aborted", "AbortError"));
    };
    request.send(blob);
  });
}
