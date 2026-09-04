import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export interface ActiveLearningLessonState {
  activeLessonByCourseId: Record<string, string>;
}

interface SetActiveLessonPayload {
  courseId: string;
  lessonId: string;
}

const initialState: ActiveLearningLessonState = {
  activeLessonByCourseId: {},
};

const activeLearningLessonSlice = createSlice({
  name: "activeLearningLesson",
  initialState,
  reducers: {
    setActiveLesson(state, action: PayloadAction<SetActiveLessonPayload>) {
      const courseId = action.payload.courseId.trim();
      const lessonId = action.payload.lessonId.trim();

      if (!courseId || !lessonId) return;

      state.activeLessonByCourseId[courseId] = lessonId;
    },
    clearActiveLesson(state, action: PayloadAction<string>) {
      const courseId = action.payload.trim();
      if (!courseId) return;

      delete state.activeLessonByCourseId[courseId];
    },
    resetActiveLessons() {
      return initialState;
    },
  },
});

export const { setActiveLesson, clearActiveLesson, resetActiveLessons } =
  activeLearningLessonSlice.actions;

export const selectActiveLessonByCourseId = (state: RootState) =>
  state.activeLearningLesson.activeLessonByCourseId;

export const selectActiveLessonIdForCourse = (
  state: RootState,
  courseId: string,
) => state.activeLearningLesson.activeLessonByCourseId[courseId] ?? null;

export default activeLearningLessonSlice.reducer;
