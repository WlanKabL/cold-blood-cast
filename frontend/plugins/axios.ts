// plugins/axios.ts
import axios from "axios";

export default defineNuxtPlugin((nuxtApp) => {
    const instance = axios.create({
        baseURL: "http://localhost:3000", // oder env-basierend
        withCredentials: true, // falls nötig
    });

    nuxtApp.provide("axios", instance);
});
