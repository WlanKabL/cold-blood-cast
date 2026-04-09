import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(() => {
    const settingsStore = useSettingsStore();
    settingsStore.init();
});
