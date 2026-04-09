import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import axios, { type AxiosInstance } from "axios";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const http: AxiosInstance = axios.create({
        baseURL: config.public.apiBaseUrl,
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
    });

    let isRefreshing = false;
    let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> =
        [];

    function processQueue(error: unknown, token: string | null) {
        failedQueue.forEach((p) => {
            if (token) p.resolve(token);
            else p.reject(error);
        });
        failedQueue = [];
    }

    http.interceptors.request.use((req) => {
        const authStore = useAuthStore();
        if (authStore.accessToken) {
            req.headers.Authorization = `Bearer ${authStore.accessToken}`;
        }
        return req;
    });

    http.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Don't retry refresh or login requests
            if (
                error.response?.status !== 401 ||
                originalRequest._retry ||
                originalRequest.url?.includes("/api/auth/refresh") ||
                originalRequest.url?.includes("/api/auth/login")
            ) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(http(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const authStore = useAuthStore();
                const ok = await authStore.refresh();
                if (ok && authStore.accessToken) {
                    processQueue(null, authStore.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
                    return http(originalRequest);
                }
                processQueue(error, null);
                return Promise.reject(error);
            } catch (refreshError) {
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        },
    );

    nuxtApp.provide("http", http);
});
