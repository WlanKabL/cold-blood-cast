<template>
    <div class="flex h-screen overflow-hidden bg-base text-fg">
        <!-- Sidebar -->
        <aside
            class="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-sidebar-bg backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0"
            :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <!-- Brand -->
            <div class="flex h-16 items-center gap-3 border-b border-line px-5">
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white"
                >
                    <Icon name="lucide:shield" class="h-4 w-4" />
                </div>
                <span class="text-lg font-bold tracking-tight text-fg">{{ $t("nav.admin") }}</span>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto px-3 py-4">
                <!-- Overview -->
                <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-fg-soft">
                    {{ $t("admin.nav.overview") }}
                </p>
                <ul class="space-y-1">
                    <li v-for="item in mainNav" :key="item.to">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                            :class="
                                isActive(item.to)
                                    ? 'bg-active text-fg'
                                    : 'text-fg-muted hover:bg-hover hover:text-fg'
                            "
                            @click="sidebarOpen = false"
                        >
                            <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
                            <span>{{ $t(item.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <!-- Content -->
                <div class="my-4 border-t border-line" />
                <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-fg-soft">
                    {{ $t("admin.nav.content") }}
                </p>
                <ul class="space-y-1">
                    <li v-for="item in contentNav" :key="item.to">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                            :class="
                                isActive(item.to)
                                    ? 'bg-active text-fg'
                                    : 'text-fg-muted hover:bg-hover hover:text-fg'
                            "
                            @click="sidebarOpen = false"
                        >
                            <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
                            <span>{{ $t(item.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <!-- System -->
                <div class="my-4 border-t border-line" />
                <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-fg-soft">
                    {{ $t("admin.nav.system") }}
                </p>
                <ul class="space-y-1">
                    <li v-for="item in systemNav" :key="item.to">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                            :class="
                                isActive(item.to)
                                    ? 'bg-active text-fg'
                                    : 'text-fg-muted hover:bg-hover hover:text-fg'
                            "
                            @click="sidebarOpen = false"
                        >
                            <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
                            <span>{{ $t(item.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>
            </nav>

            <!-- Back to App -->
            <div class="border-t border-line p-4">
                <NuxtLink
                    to="/dashboard"
                    class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-hover hover:text-fg"
                >
                    <Icon name="lucide:arrow-left" class="h-5 w-5 shrink-0" />
                    <span>{{ $t("admin.nav.back_to_app") }}</span>
                </NuxtLink>
            </div>
        </aside>

        <!-- Backdrop (mobile) -->
        <Transition
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-300"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="sidebarOpen"
                class="fixed inset-0 z-20 bg-overlay lg:hidden"
                @click="sidebarOpen = false"
            />
        </Transition>

        <!-- Main content -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Top bar -->
            <header
                class="flex h-16 items-center gap-4 border-b border-line bg-topbar-bg px-4 backdrop-blur-xl lg:px-6"
            >
                <button
                    class="rounded-lg p-2 text-fg-muted transition hover:bg-hover hover:text-fg lg:hidden"
                    @click="sidebarOpen = !sidebarOpen"
                >
                    <Icon name="lucide:menu" class="h-5 w-5" />
                </button>
                <h1 class="text-lg font-semibold text-fg">{{ pageTitle }}</h1>
            </header>

            <main class="flex-1 overflow-y-auto p-4 lg:p-6">
                <NuxtPage />
            </main>
        </div>

        <CookieConsent />
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();

const sidebarOpen = ref(false);

const mainNav = [
    { to: "/admin", icon: "lucide:layout-dashboard", label: "nav.adminDashboard" },
    { to: "/admin/users", icon: "lucide:users", label: "nav.adminUsers" },
    { to: "/admin/roles", icon: "lucide:user-cog", label: "nav.adminRoles" },
    { to: "/admin/feature-flags", icon: "lucide:toggle-left", label: "nav.adminFeatureFlags" },
    { to: "/admin/invites", icon: "lucide:ticket", label: "nav.adminInvites" },
];

const contentNav = [
    { to: "/admin/announcements", icon: "lucide:megaphone", label: "nav.adminAnnouncements" },
    { to: "/admin/legal", icon: "lucide:file-text", label: "nav.adminLegal" },
];

const systemNav = [
    { to: "/admin/settings", icon: "lucide:sliders-horizontal", label: "nav.adminSettings" },
    { to: "/admin/audit-log", icon: "lucide:scroll-text", label: "nav.adminAuditLog" },
    { to: "/admin/access-requests", icon: "lucide:user-plus", label: "nav.adminAccessRequests" },
    { to: "/admin/emails", icon: "lucide:mail", label: "nav.adminEmails" },
];

const allNav = [...mainNav, ...contentNav, ...systemNav];

const pageTitle = computed(() => {
    const current = allNav.find((n) => isActive(n.to));
    return current ? t(current.label) : t("nav.admin");
});

function isActive(path: string): boolean {
    if (path === "/admin") return route.path === "/admin";
    return route.path.startsWith(path);
}
</script>
