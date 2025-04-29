import { ref } from "vue";
import { defineStore } from "pinia";
import { configService } from "@/services/configService";
import type { AppConfig } from "../../snake-link-raspberry/src/types/config";

export const useAppConfigStore = defineStore("appConfig", () => {
    const config = ref<AppConfig | null>(null);
    const loading = ref(false);
    const error = ref("");

    async function fetchConfig() {
        loading.value = true;
        error.value = "";
        try {
            config.value = await configService.getAppConfig();
        } catch (err: unknown) {
            error.value = (err as Error).message;
        } finally {
            loading.value = false;
        }
    }

    async function saveConfig(update: Partial<AppConfig>) {
        loading.value = true;
        error.value = "";
        try {
            await configService.updateAppConfig(update);
            config.value = await configService.getAppConfig();
        } catch (err: unknown) {
            error.value = (err as Error).message;
        } finally {
            loading.value = false;
        }
    }

    return {
        config,
        loading,
        error,
        fetchConfig,
        saveConfig,
    };
});
