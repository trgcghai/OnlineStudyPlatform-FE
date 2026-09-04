import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

const DEFAULT_PLAYBACK_RATE = 1;
const DEFAULT_VOLUME = 1;
const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 2;

export interface VideoPlaybackState {
  playbackRate: number;
  volume: number;
}

const initialState: VideoPlaybackState = {
  playbackRate: DEFAULT_PLAYBACK_RATE,
  volume: DEFAULT_VOLUME,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

const videoPlaybackSlice = createSlice({
  name: "videoPlayback",
  initialState,
  reducers: {
    setPlaybackRate(state, action: PayloadAction<number>) {
      state.playbackRate = clamp(
        action.payload,
        MIN_PLAYBACK_RATE,
        MAX_PLAYBACK_RATE,
      );
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = clamp(action.payload, 0, 1);
    },
    resetVideoPlayback() {
      return initialState;
    },
  },
});

export const { setPlaybackRate, setVolume, resetVideoPlayback } =
  videoPlaybackSlice.actions;

export const selectVideoPlayback = (state: RootState) => state.videoPlayback;

export const selectPlaybackRate = (state: RootState) =>
  state.videoPlayback.playbackRate;

export const selectVolume = (state: RootState) => state.videoPlayback.volume;

export default videoPlaybackSlice.reducer;
