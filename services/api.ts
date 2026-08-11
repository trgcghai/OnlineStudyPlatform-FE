const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

type QueryParams = Record<string, string | number | boolean | undefined | null>;

type ApiOptions = Omit<RequestInit, "method" | "body"> & {
  params?: QueryParams;
  body?: unknown;
};

function buildUrl(path: string, params?: QueryParams) {
  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL in your environment variables.",
    );
  }

  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url;
}

async function request<T>(
  method: string,
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { params, body, headers, ...init } = options;
  const response = await fetch(buildUrl(path, params), {
    ...init,
    method,
    credentials: "include",
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function get<T>(path: string, options?: ApiOptions) {
  return request<T>("GET", path, options);
}

export function post<T>(path: string, options?: ApiOptions) {
  return request<T>("POST", path, options);
}

export function put<T>(path: string, options?: ApiOptions) {
  return request<T>("PUT", path, options);
}

export function patch<T>(path: string, options?: ApiOptions) {
  return request<T>("PATCH", path, options);
}

export function del<T>(path: string, options?: ApiOptions) {
  return request<T>("DELETE", path, options);
}
