<template>
    <div class="bg-base flex h-dvh overflow-hidden">
        <LayoutAppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

        <!-- Main area -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <LayoutAppTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

            <!-- Maintenance Mode Banner -->
            <div
                v-if="maintenanceMode"
                class="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[12px] font-semibold text-amber-300"
            >
                <Icon name="lucide:alert-triangle" class="h-4 w-4" />
                <span>{{ $t("common.maintenanceMode") }}</span>
            </div>

            <!-- Announcement Banner -->
            <div
                v-for="ann in unreadAnnouncements"
                :key="ann.id"
                class="flex items-center justify-between border-b px-4 py-2 text-[12px]"
                :class="announcementClass(ann.type)"
            >
                <div class="flex items-center gap-2">
                    <Icon :name="announcementIcon(ann.type)" class="h-4 w-4" />
                    <span class="font-medium">{{ ann.title }}</span>
                    <span class="text-fg-muted hidden sm:inline">{{ ann.content }}</span>
                </div>
                <button
                    class="rounded-lg p-2 opacity-60 hover:opacity-100 sm:p-1"
                    @click="dismissAnnouncement(ann.id)"
                >
                    <Icon name="lucide:x" class="h-3.5 w-3.5" />
                </button>
            </div>

            <!-- Impersonation Banner -->
            <div
                v-if="authStore.isImpersonating"
                class="flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[12px] font-medium text-amber-300"
            >
                <Icon name="lucide:eye" class="h-4 w-4" />
                <span>{{ $t("admin.impersonatingBanner") }}</span>
            </div>

            <!-- Page content -->
            <main class="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
                <div class="mx-auto max-w-7xl">
                    <slot />
                </div>
            </main>
        </div>

        <!-- Toast notifications -->
        <LayoutAppToast />

        <!-- Keyboard shortcut help overlay -->
        <LayoutKeyboardShortcutHelp />
    </div>
</template>

<script setup lang="ts">
import type { Announcement } from "~/types/api";

const authStore = useAuthStore();

// ── Global keyboard shortcuts ────────────────
useGlobalKeyboardShortcuts();

const sidebarOpen = ref(false);
const { get, post } = useApi();
const unreadAnnouncements = ref<Announcement[]>([]);
const maintenanceMode = ref(false);

function announcementClass(type: string) {
    switch (type) {
        case "warning":
            return "border-amber-500/20 bg-amber-500/10 text-amber-300";
        case "error":
            return "border-red-500/20 bg-red-500/10 text-red-300";
        case "success":
            return "border-green-500/20 bg-green-500/10 text-green-300";
        default:
            return "border-primary-500/20 bg-primary-500/10 text-primary-300";
    }
}

function announcementIcon(type: string) {
    switch (type) {
        case "warning":
            return "lucide:alert-triangle";
        case "error":
            return "lucide:alert-circle";
        case "success":
            return "lucide:check-circle";
        default:
            return "lucide:info";
    }
}

async function dismissAnnouncement(id: string) {
    try {
        await post(`/api/announcements/${id}/read`);
    } catch {
        /* best effort */
    }
    unreadAnnouncements.value = unreadAnnouncements.value.filter((a) => a.id !== id);
}

onMounted(async () => {
    // Check maintenance mode (public endpoint)
    try {
        const status = await get<{ maintenance: boolean }>("/api/auth/platform-status");
        maintenanceMode.value = !!status.maintenance;
    } catch {
        /* silent */
    }

    if (authStore.isAuthenticated) {
        try {
            const all = await get<Announcement[]>("/api/announcements");
            unreadAnnouncements.value = all.filter((a) => !a.isRead);
        } catch {
            /* silent */
        }
    }
});
</script>
