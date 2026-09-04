import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import type { WebStorage } from "redux-persist/lib/types";
import activeLearningLessonReducer from "@/lib/features/activeLearningLessonSlice";
import authReducer from "@/lib/features/authSlice";
import videoPlaybackReducer from "@/lib/features/videoPlaybackSlice";

const noopStorage: WebStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

const persistConfig = {
  key: "root",
  storage: typeof window === "undefined" ? noopStorage : storage,
  whitelist: ["auth", "activeLearningLesson", "videoPlayback"],
};

const rootReducer = combineReducers({
  activeLearningLesson: activeLearningLessonReducer,
  auth: authReducer,
  videoPlayback: videoPlaybackReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
