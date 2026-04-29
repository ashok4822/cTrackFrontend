import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

//Request interceptor: add auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: Error | AxiosError | unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (
  error: Error | AxiosError | unknown | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor: handle 401s and other global errors
api.interceptors.response.use(
  (response) => {
    // If the response has the ApiResponse structure, unwrap it
    const apiRes = response.data;
    if (
      apiRes &&
      typeof apiRes === "object" &&
      "success" in apiRes &&
      "data" in apiRes
    ) {
      // If data is present and not null/undefined, return just the data
      // This matches the expectations of most frontend services and thunks
      if (apiRes.data !== null && apiRes.data !== undefined) {
        let unwrappedData = apiRes.data;

        // Also unwrap collection-style responses (items + total)
        // Many thunks expect an array directly instead of the collection object
        if (
          unwrappedData &&
          typeof unwrappedData === "object" &&
          "items" in unwrappedData &&
          Array.isArray(unwrappedData.items)
        ) {
          unwrappedData = unwrappedData.items;
        }

        return {
          ...response,
          data: unwrappedData,
        };
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.GOOGLE) &&
      !originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)
    ) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Don't send the expired access token with the refresh request
        const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, null, {
          headers: { Authorization: "" },
        });
        const { accessToken } = response.data;

        localStorage.setItem("accessToken", accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // If refresh fails, clear auth state
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    if (error.response?.status === 403) {
      window.location.href = "/unauthorized";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
