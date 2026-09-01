import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import type { AuthUser } from "@/lib/features/authSlice";

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiError {
  code: number;
  message: string;
  details: string[];
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  data: null;
  error: ApiError;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  if (
    !data ||
    typeof data !== "object" ||
    !("success" in data) ||
    data.success !== false ||
    !("statusCode" in data) ||
    typeof data.statusCode !== "number" ||
    !("error" in data)
  ) {
    return false;
  }

  const { error } = data;

  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "number" &&
    "message" in error &&
    typeof error.message === "string" &&
    "details" in error &&
    Array.isArray(error.details)
  );
}

// Cấu hình mặc định cho các request
const axiosClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api$/, ""),
  withCredentials: true,
  timeout: 1000 * 60 * 10,
});

// Biến để track trạng thái refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

interface RefreshResult {
  accessToken: string;
  user: AuthUser;
}

class AuthSessionChangedError extends Error {
  constructor() {
    super("Auth session changed while refresh was in progress");
    this.name = "AuthSessionChangedError";
  }
}

async function getBrowserAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const [{ store }, authSlice] = await Promise.all([
    import("@/lib/store"),
    import("@/lib/features/authSlice"),
  ]);

  return {
    store,
    clearAuth: authSlice.clearAuth,
    setCredentials: authSlice.setCredentials,
  };
}

async function getCurrentAccessToken(): Promise<string | null> {
  const auth = await getBrowserAuth();
  const accessToken = auth?.store.getState().auth.accessToken?.trim();

  return accessToken || null;
}

export function getCurrentAccessTokenSnapshot(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const persistedRoot = window.localStorage.getItem("persist:root");
    if (!persistedRoot) return null;

    const parsedRoot = JSON.parse(persistedRoot) as { auth?: string };
    const parsedAuth = parsedRoot.auth
      ? (JSON.parse(parsedRoot.auth) as { accessToken?: string | null })
      : null;
    const accessToken = parsedAuth?.accessToken;

    return typeof accessToken === "string" && accessToken.trim()
      ? accessToken.trim()
      : null;
  } catch {
    return null;
  }
}

function redirectToSignIn(): void {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/signin");
  }
}

function setAuthorizationHeader(
  request: InternalAxiosRequestConfig,
  accessToken: string,
): void {
  request.headers.Authorization = `Bearer ${accessToken}`;
}

function getRequestAccessToken(
  request: InternalAxiosRequestConfig,
): string | null {
  const authorization = request.headers.Authorization;

  if (typeof authorization !== "string") {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
}

function getRequestPath(request: InternalAxiosRequestConfig): string | null {
  if (!request.url) {
    return null;
  }

  try {
    return new URL(request.url, request.baseURL ?? axiosClient.defaults.baseURL)
      .pathname;
  } catch {
    return request.url.split("?")[0] || null;
  }
}

function isAuthRefreshRequest(request: InternalAxiosRequestConfig): boolean {
  return getRequestPath(request) === "/auth/refresh";
}

function isAuthSessionRequest(request: InternalAxiosRequestConfig): boolean {
  const path = getRequestPath(request);

  return path === "/auth/login" || path === "/auth/logout";
}

// Hàm xử lý queue khi refresh token hoàn thành
const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    } else {
      reject(new Error("Missing refreshed access token"));
    }
  });

  failedQueue = [];
};

const refreshToken = async (): Promise<RefreshResult> => {
  const response =
    await axiosClient.post<ApiSuccessResponse<RefreshResult>>("/auth/refresh");
  const accessToken = response.data.data.accessToken.trim();

  if (!accessToken) {
    throw new Error("Refresh response did not include an access token");
  }

  return {
    ...response.data.data,
    accessToken,
  };
};

// Hàm logout redux state
const performLogout = async () => {
  const auth = await getBrowserAuth();

  auth?.store.dispatch(auth.clearAuth());
  isRefreshing = false;
  redirectToSignIn();
};

axiosClient.interceptors.request.use(async (request) => {
  const accessToken = await getCurrentAccessToken();

  if (accessToken) {
    setAuthorizationHeader(request, accessToken);
  }

  return request;
});

// Interceptor: Xử lý lỗi 401 và errorCode UNAUTHORIZED
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Nếu không có config, reject ngay
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    const isRefreshEndpoint = isAuthRefreshRequest(originalRequest);
    const isAuthSessionEndpoint = isAuthSessionRequest(originalRequest);

    // Nếu refresh token endpoint bị 401, logout ngay
    if (isUnauthorized && isRefreshEndpoint) {
      await performLogout();
      return Promise.reject(error);
    }

    const isRefreshTokenExpired =
      isApiErrorResponse(error.response?.data) &&
      error.response.data.error.message ===
        "Refresh token is invalid or expired";

    if (
      isUnauthorized &&
      !originalRequest._retry &&
      !isRefreshEndpoint &&
      !isAuthSessionEndpoint
    ) {
      const failedRequestToken = getRequestAccessToken(originalRequest);

      if (!failedRequestToken) {
        return Promise.reject(error);
      }

      // Nếu refresh token đã hết hạn, logout ngay
      if (isRefreshTokenExpired) {
        processQueue(error);
        await performLogout();
        return Promise.reject(error);
      }

      // Đánh dấu request này đã retry để tránh infinite loop
      originalRequest._retry = true;

      const currentAccessToken = await getCurrentAccessToken();

      if (currentAccessToken && currentAccessToken !== failedRequestToken) {
        setAuthorizationHeader(originalRequest, currentAccessToken);
        return axiosClient(originalRequest);
      }

      if (isRefreshing) {
        // Nếu đang refresh, đưa request vào queue
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(async (accessToken) => {
            const currentAccessToken = await getCurrentAccessToken();

            if (currentAccessToken !== accessToken) {
              throw new AuthSessionChangedError();
            }

            setAuthorizationHeader(originalRequest, accessToken);
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Gọi API refresh token
        const result = await refreshToken();
        const auth = await getBrowserAuth();
        const currentAccessToken =
          auth?.store.getState().auth.accessToken?.trim() || null;

        if (!auth || currentAccessToken !== failedRequestToken) {
          throw new AuthSessionChangedError();
        }

        auth.store.dispatch(auth.setCredentials(result));
        setAuthorizationHeader(originalRequest, result.accessToken);
        processQueue(null, result.accessToken);

        // Retry request gốc
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Xử lý queue với error
        processQueue(refreshError);

        if (refreshError instanceof AuthSessionChangedError) {
          return Promise.reject(refreshError);
        }

        // Logout
        await performLogout();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
