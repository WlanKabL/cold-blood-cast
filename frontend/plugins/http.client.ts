import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import axios, { type AxiosInstance } from "axios";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const http: AxiosInstance = axios.create({
        baseURL: config.public.apiBaseUrl,
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
    });

    http.interceptors.request.use((req) => {
        if (process.client) {
            const token = useCookie("auth_token").value;
            if (token) {
                req.headers.Authorization = `Bearer ${token}`;
            }
        }
        return req;
    });

    nuxtApp.provide("http", http);
});
