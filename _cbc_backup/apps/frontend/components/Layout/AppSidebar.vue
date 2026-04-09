<template>
    <aside
        class="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-sidebar-bg backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
        <!-- Brand -->
        <div class="flex h-16 items-center gap-3 border-b border-line px-5">
            <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
            >
                🐍
            </div>
            <span class="text-lg font-bold tracking-tight text-fg">Cold Blood Cast</span>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-4">
            <ul class="space-y-1">
                <li v-for="item in navItems" :key="item.to">
                    <NuxtLink
                        :to="item.to"
                        class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                        :class="
                            isActive(item.to)
                                ? 'bg-active text-fg'
                                : 'text-fg-muted hover:bg-hover hover:text-fg'
                        "
                        @click="emit('close')"
                    >
                        <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
                        <span>{{ $t(item.label) }}</span>
                    </NuxtLink>
                </li>
            </ul>

            <!-- Separator -->
            <div class="my-4 border-t border-line" />

            <!-- Secondary nav -->
            <ul class="space-y-1">
                <li v-for="item in secondaryNavItems" :key="item.to">
                    <NuxtLink
                        :to="item.to"
                        class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                        :class="
                            isActive(item.to)
                                ? 'bg-active text-fg'
                                : 'text-fg-muted hover:bg-hover hover:text-fg'
                        "
                        @click="emit('close')"
                    >
                        <Icon :name="item.icon" class="h-5 w-5 shrink-0" />
                        <span>{{ $t(item.label) }}</span>
                    </NuxtLink>
                </li>
            </ul>

            <!-- Admin link (only for admins) -->
            <template v-if="authStore.isAdmin">
                <div class="my-4 border-t border-line" />
                <ul class="space-y-1">
                    <li>
                        <NuxtLink
                            to="/admin"
                            class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-fg-muted hover:bg-hover hover:text-fg"
                            @click="emit('close')"
                        >
                            <Icon name="lucide:shield" class="h-5 w-5 shrink-0" />
                            <span>{{ $t("nav.admin") }}</span>
                        </NuxtLink>
                    </li>
                </ul>
            </template>
        </nav>

        <!-- User section -->
        <div v-if="authStore.isLoggedIn" class="border-t border-line p-4">
            <div class="flex items-center gap-3">
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-active text-sm font-medium text-fg"
                >
                    {{ authStore.userInitial }}
                </div>
                <div class="flex-1 truncate">
                    <p class="truncate text-sm font-medium text-fg">
                        {{ authStore.user?.displayName || authStore.user?.username }}
                    </p>
                    <p class="truncate text-xs text-fg-muted">{{ authStore.user?.email }}</p>
                </div>
                <button
                    class="rounded-lg p-1.5 text-fg-muted transition hover:bg-hover hover:text-fg"
                    :title="$t('nav.logout')"
                    @click="handleLogout"
                >
                    <Icon name="lucide:log-out" class="h-4 w-4" />
                </button>
            </div>
        </div>

        <!-- Login link when not authenticated -->
        <div v-else class="border-t border-line p-4">
            <NuxtLink
                to="/login"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-hover hover:text-fg"
                @click="emit('close')"
            >
                <Icon name="lucide:log-in" class="h-5 w-5 shrink-0" />
                <span>{{ $t("nav.login") }}</span>
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
        <div v-if="isOpen" class="fixed inset-0 z-20 bg-overlay lg:hidden" @click="emit('close')" />
    </Transition>
</template>

<script setup lang="ts">
interface Props {
    isOpen: boolean;
}

defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const route = useRoute();
const authStore = useAuthStore();
const router = useRouter();

const navItems = [
    { to: "/dashboard", icon: "lucide:layout-dashboard", label: "nav.dashboard" },
    { to: "/enclosures", icon: "lucide:box", label: "nav.enclosures" },
    { to: "/pets", icon: "lucide:heart", label: "nav.pets" },
    { to: "/sensors", icon: "lucide:thermometer", label: "nav.sensors" },
];

const secondaryNavItems = [
    { to: "/settings", icon: "lucide:settings", label: "nav.settings" },
    { to: "/about", icon: "lucide:info", label: "nav.about" },
    { to: "/contact", icon: "lucide:mail", label: "nav.contact" },
];

function isActive(path: string): boolean {
    if (path === "/dashboard") return route.path === "/dashboard";
    return route.path.startsWith(path);
}

async function handleLogout() {
    await authStore.logout();
    router.push("/");
}
</script>
