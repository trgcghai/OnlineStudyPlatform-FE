import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
import type { UserRole, UserStatus } from "@/services/api/users";

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
}

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface SetCredentialsPayload {
  accessToken: string;
  user: AuthUser;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

const isValidAuthState = (
  state: Partial<AuthState> | null | undefined,
): state is AuthState =>
  Boolean(
    state?.isAuthenticated &&
      typeof state.accessToken === "string" &&
      state.accessToken.trim() &&
      state.user &&
      typeof state.user === "object",
  );

const normalizeAuthState = (
  state: Partial<AuthState> | null | undefined,
): AuthState => {
  if (!isValidAuthState(state)) {
    return initialState;
  }

  return state;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<SetCredentialsPayload>) {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      if (!state.user) {
        return;
      }

      state.user = action.payload;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      const accessToken = action.payload.trim();

      if (!accessToken || !state.user) {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
        return;
      }

      state.accessToken = accessToken;
      state.isAuthenticated = true;
    },
    setIsAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        state.accessToken = null;
        state.user = null;
      }
    },
    clearAuth() {
      return initialState;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  setUser,
  setIsAuthenticated,
  clearAuth,
} = authSlice.actions;

export const selectAuth = (state: RootState) => normalizeAuthState(state.auth);

export const selectAccessToken = (state: RootState) => selectAuth(state).accessToken;

export const selectAuthUser = (state: RootState) => selectAuth(state).user;

export const selectUserRole = (state: RootState) => selectAuth(state).user?.role ?? null;

export const selectIsAuthenticated = (state: RootState) =>
  selectAuth(state).isAuthenticated;

export default authSlice.reducer;
