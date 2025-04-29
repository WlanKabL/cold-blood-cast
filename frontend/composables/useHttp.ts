import { useNuxtApp } from "#app";
import type { AxiosInstance } from "axios";

export function useHttp(): AxiosInstance {
    const nuxt = useNuxtApp();
    return nuxt.$http as AxiosInstance;
}
