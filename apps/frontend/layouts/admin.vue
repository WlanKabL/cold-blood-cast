<template>
    <div class="bg-base flex h-dvh overflow-hidden">
        <!-- Admin Sidebar -->
        <aside
            class="border-line bg-base fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0"
            :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <!-- Brand -->
            <div class="flex h-15 items-center gap-3 px-5">
                <NuxtLink to="/admin" class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20">
                        <Icon name="lucide:shield" class="h-5 w-5 text-red-400" />
                    </div>
                    <span class="text-fg text-[15px] font-semibold tracking-tight">Admin</span>
                </NuxtLink>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto px-3 py-2">
                <p
                    class="text-fg-faint mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase"
                >
                    {{ $t("admin.nav.overview") }}
                </p>
                <ul class="space-y-0.5">
                    <li v-for="item in mainNav" :key="item.to">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200"
                            :class="
                                isActive(item.to)
                                    ? 'bg-surface-active text-fg'
                                    : 'text-fg-muted hover:bg-surface-raised hover:text-fg-soft'
                            "
                            @click="sidebarOpen = false"
                        >
                            <Icon
                                :name="item.icon"
                                class="h-4 w-4 shrink-0 transition-colors"
                                :class="
                                    isActive(item.to)
                                        ? 'text-red-400'
                                        : 'text-fg-faint group-hover:text-fg-muted'
                                "
                            />
                            <span>{{ $t(item.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <div class="border-line-faint my-4 border-t" />

                <p
                    class="text-fg-faint mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase"
                >
                    {{ $t("admin.nav.content") }}
                </p>
                <ul class="space-y-0.5">
                    <li v-for="item in contentNav" :key="item.to">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200"
                            :class="
                                isActive(item.to)
                                    ? 'bg-surface-active text-fg'
                                    : 'text-fg-muted hover:bg-surface-raised hover:text-fg-soft'
                            "
                            @click="sidebarOpen = false"
                        >
                            <Icon
                                :name="item.icon"
                                class="h-4 w-4 shrink-0 transition-colors"
                                :class="
                                    isActive(item.to)
                                        ? 'text-red-400'
                                        : 'text-fg-faint group-hover:text-fg-muted'
                                "
                            />
                            <span>{{ $t(item.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>

                <div class="border-line-faint my-4 border-t" />

                <p
                    class="text-fg-faint mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase"
                >
                    {{ $t("admin.nav.system") }}
                </p>
                <ul class="space-y-0.5">
                    <li v-for="item in systemNav" :key="item.to">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200"
                            :class="
                                isActive(item.to)
                                    ? 'bg-surface-active text-fg'
                                    : 'text-fg-muted hover:bg-surface-raised hover:text-fg-soft'
                            "
                            @click="sidebarOpen = false"
                        >
                            <Icon
                                :name="item.icon"
                                class="h-4 w-4 shrink-0 transition-colors"
                                :class="
                                    isActive(item.to)
                                        ? 'text-red-400'
                                        : 'text-fg-faint group-hover:text-fg-muted'
                                "
                            />
                            <span>{{ $t(item.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>
            </nav>

            <!-- Back to App -->
            <div class="border-line border-t p-4">
                <NuxtLink
                    to="/dashboard"
                    class="text-fg-muted hover:bg-surface-raised hover:text-fg flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all"
                >
                    <Icon name="lucide:arrow-left" class="h-4 w-4" />
                    <span>{{ $t("admin.backToApp") }}</span>
                </NuxtLink>
            </div>
        </aside>

        <!-- Mobile backdrop -->
        <Transition
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-300"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="sidebarOpen"
                class="bg-base-translucent fixed inset-0 z-20 backdrop-blur-sm lg:hidden"
                @click="sidebarOpen = false"
            />
        </Transition>

        <!-- Main content -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <!-- Top bar -->
            <header
                class="border-line flex h-15 items-center justify-between border-b px-4 lg:px-8"
            >
                <div class="flex items-center gap-3">
                    <button
                        class="text-fg-faint hover:bg-surface-hover hover:text-fg rounded-lg p-2 lg:hidden"
                        @click="sidebarOpen = !sidebarOpen"
                    >
                        <Icon name="lucide:menu" class="h-5 w-5" />
                    </button>
                    <span class="text-fg-muted hidden text-[13px] font-medium lg:block">
                        {{ $t("admin.title") }}
                    </span>
                </div>

                <!-- Impersonation Banner -->
                <div
                    v-if="authStore.isImpersonating"
                    class="flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-1.5 text-[12px] font-medium text-amber-300"
                >
                    <Icon name="lucide:eye" class="h-4 w-4" />
                    <span>{{ $t("admin.impersonating") }}</span>
                </div>

                <div class="flex items-center gap-2">
                    <span class="text-fg-faint text-[12px]">
                        {{ authStore.user?.username }}
                    </span>
                </div>
            </header>

            <!-- Page content -->
            <main class="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
                <div class="mx-auto max-w-7xl">
                    <slot />
                </div>
            </main>
        </div>

        <LayoutAppToast />
    </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const route = useRoute();
const sidebarOpen = ref(false);

const mainNav = [
    { to: "/admin", icon: "lucide:layout-dashboard", label: "admin.nav.dashboard" },
    { to: "/admin/users", icon: "lucide:users", label: "admin.nav.users" },
    { to: "/admin/roles", icon: "lucide:shield-check", label: "admin.nav.roles" },
    { to: "/admin/feature-flags", icon: "lucide:toggle-left", label: "admin.nav.featureFlags" },
    { to: "/admin/invites", icon: "lucide:ticket", label: "admin.nav.invites" },
    { to: "/admin/access-requests", icon: "lucide:inbox", label: "admin.nav.accessRequests" },
];

const contentNav = [
    { to: "/admin/announcements", icon: "lucide:megaphone", label: "admin.nav.announcements" },
    { to: "/admin/legal", icon: "lucide:scale", label: "admin.nav.legal" },
];

const systemNav = [
    { to: "/admin/notifications", icon: "lucide:bell", label: "admin.nav.notifications" },
    { to: "/admin/settings", icon: "lucide:settings", label: "admin.nav.settings" },
    { to: "/admin/emails", icon: "lucide:mail", label: "admin.nav.emails" },
    { to: "/admin/audit-log", icon: "lucide:scroll-text", label: "admin.nav.auditLog" },
];

function isActive(path: string): boolean {
    if (path === "/admin") return route.path === "/admin";
    return route.path.startsWith(path);
}
</script>
