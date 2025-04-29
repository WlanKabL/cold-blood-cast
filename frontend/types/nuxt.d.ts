import type { AxiosInstance } from "axios";

declare module "#app" {
    interface NuxtApp {
        $http: AxiosInstance;
    }
}

export {};
