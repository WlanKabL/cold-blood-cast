import { defineNuxtPlugin, useRuntimeConfig } from "#app";
import axios, { type AxiosInstance } from "axios";

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig();
    const http: AxiosInstance = axios.create({
        baseURL: config.public.apiBaseUrl,
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
    });

    nuxtApp.provide("http", http);
});
