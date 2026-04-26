<template>
    <aside
        class="border-line bg-page fixed inset-y-0 left-0 z-30 flex w-65 flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
        <!-- Brand -->
        <div class="flex h-15 items-center gap-3 px-5">
            <NuxtLink to="/" class="flex items-center gap-3">
                <img
                    src="/cbc.png"
                    alt="KeeperLog"
                    class="shadow-primary-500/20 h-8 w-8 rounded-xl shadow-lg"
                />
                <span class="text-fg text-[17px] font-semibold tracking-tight">KeeperLog</span>
            </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto px-3 py-2">
            <template v-for="(section, sIdx) in navSections" :key="section.label">
                <div v-if="sIdx > 0" class="border-line-faint my-3 border-t" />
                <p
                    class="text-fg-faint mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase"
                >
                    {{ $t(section.label) }}
                </p>
                <ul class="space-y-0.5">
                    <li v-for="item in section.items.value" :key="item.to + item.label">
                        <NuxtLink
                            :to="item.to"
                            class="group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200"
                            :class="
                                item.locked
                                    ? 'text-fg-faint hover:bg-surface-raised/50'
                                    : isActive(item.to)
                                      ? 'bg-surface-active text-fg'
                                      : 'text-fg-muted hover:bg-surface-raised hover:text-fg-soft'
                            "
                            @click="emit('close')"
                        >
                            <Icon
                                :name="item.icon"
                                class="h-4.5 w-4.5 shrink-0 transition-colors duration-200"
                                :class="
                                    item.locked
                                        ? 'text-fg-faint/50'
                                        : isActive(item.to)
                                          ? 'text-primary-400'
                                          : 'text-fg-faint group-hover:text-fg-muted'
                                "
                            />
                            <span :class="item.locked ? 'opacity-50' : ''">{{
                                $t(item.label)
                            }}</span>
                            <span
                                v-if="item.locked && item.tiers?.length"
                                class="ml-auto flex items-center gap-1"
                            >
                                <span
                                    v-for="tier in item.tiers"
                                    :key="tier.role"
                                    class="rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
                                    :style="{
                                        backgroundColor: tier.color + '22',
                                        color: tier.color,
                                    }"
                                    >{{ tier.displayName.charAt(0) }}</span
                                >
                            </span>
                            <kbd
                                v-if="item.shortcut && !item.locked"
                                class="border-line text-fg-faint ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[10px] lg:inline-block"
                            >
                                {{ item.shortcut }}
                            </kbd>
                        </NuxtLink>
                    </li>
                </ul>
            </template>

            <!-- Admin Link -->
            <template v-if="authStore.isAdmin">
                <div class="border-line-faint my-3 border-t" />
                <ul class="space-y-0.5">
                    <li>
                        <NuxtLink
                            :to="adminNavItem.to"
                            class="group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200"
                            :class="
                                isActive(adminNavItem.to)
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'text-fg-muted hover:bg-red-500/5 hover:text-red-300'
                            "
                            @click="emit('close')"
                        >
                            <Icon
                                :name="adminNavItem.icon"
                                class="h-4.5 w-4.5 shrink-0 transition-colors duration-200"
                                :class="
                                    isActive(adminNavItem.to)
                                        ? 'text-red-400'
                                        : 'text-fg-faint group-hover:text-red-300'
                                "
                            />
                            <span>{{ $t(adminNavItem.label) }}</span>
                        </NuxtLink>
                    </li>
                </ul>
            </template>
        </nav>

        <!-- User section -->
        <div class="border-line border-t p-4">
            <div class="flex items-center gap-3">
                <div
                    class="from-primary-500/20 to-primary-700/20 text-primary-300 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold ring-1 ring-white/8"
                >
                    {{ userInitial }}
                </div>
                <div class="flex-1 truncate">
                    <p class="text-fg truncate text-[13px] font-medium">
                        {{ authStore.user?.displayName || authStore.user?.username }}
                    </p>
                    <p class="text-fg-faint truncate text-[11px]">{{ authStore.user?.email }}</p>
                </div>
                <button
                    class="text-fg-faint hover:bg-surface-hover hover:text-fg-dim rounded-lg p-2.5 transition-all duration-200 sm:p-1.5"
                    :title="$t('nav.logout')"
                    @click="handleLogout"
                >
                    <Icon name="lucide:log-out" class="h-4 w-4" />
                </button>
            </div>
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
            v-if="isOpen"
            class="bg-page-translucent fixed inset-0 z-20 backdrop-blur-sm lg:hidden"
            @click="emit('close')"
        />
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

const overviewNavItems = [
    {
        to: "/dashboard",
        icon: "lucide:layout-dashboard",
        label: "nav.dashboard",
        feature: "dashboard",
        shortcut: "D",
    },
    {
        to: "/planner",
        icon: "lucide:calendar-days",
        label: "nav.planner",
        feature: "weekly_planner",
    },
];

const terrariumNavItems = [
    {
        to: "/enclosures",
        icon: "lucide:box",
        label: "nav.enclosures",
        feature: "enclosures",
        shortcut: "E",
    },
    {
        to: "/pets",
        icon: "lucide:heart",
        label: "nav.pets",
        feature: "pets",
        shortcut: "P",
    },
    {
        to: "/sensors",
        icon: "lucide:thermometer",
        label: "nav.sensors",
        feature: "sensors",
        shortcut: "N",
    },
];

const careLogNavItems = [
    {
        to: "/feedings",
        icon: "lucide:utensils",
        label: "nav.feedings",
        feature: "feedings",
    },
    {
        to: "/feed-items",
        icon: "lucide:rat",
        label: "nav.feedItems",
        feature: "feedings",
    },
    {
        to: "/sheddings",
        icon: "lucide:layers",
        label: "nav.sheddings",
        feature: "sheddings",
    },
    {
        to: "/weights",
        icon: "lucide:scale",
        label: "nav.weights",
        feature: "weights",
    },
    {
        to: "/vet-visits",
        icon: "lucide:stethoscope",
        label: "nav.vetVisits",
        feature: "vet_visits",
    },
    {
        to: "/veterinarians",
        icon: "lucide:building-2",
        label: "nav.veterinarians",
        feature: "vet_visits",
    },
    {
        to: "/maintenance",
        icon: "lucide:wrench",
        label: "nav.maintenance",
        feature: "enclosure_maintenance",
    },
    {
        to: "/husbandry-notes",
        icon: "lucide:clipboard-list",
        label: "nav.husbandryNotes",
    },
];

type NavItem = {
    to: string;
    icon: string;
    label: string;
    feature?: string;
    locked?: boolean;
    shortcut?: string;
    tiers?: Array<{ role: string; displayName: string; color: string }>;
};

/**
 * Build nav items with dynamic tier badges from featureTiers.
 * - No feature gate → always show
 * - User has access → show normally
 * - Feature globally enabled + featureTiers has entries → show locked with badges
 * - Feature globally disabled or no tiers → hide
 */
function buildNavItems(
    items: Array<{ to: string; icon: string; label: string; feature?: string; shortcut?: string }>,
): ComputedRef<NavItem[]> {
    return computed(() =>
        items
            .filter((item) => {
                if (!item.feature) return true;
                if (authStore.hasFeature(item.feature)) return true;
                // Globally enabled + at least one role can unlock it = show locked
                const tiers = authStore.getFeatureTier(item.feature);
                return authStore.isFeatureEnabled(item.feature) && tiers.length > 0;
            })
            .map((item) => {
                if (!item.feature || authStore.hasFeature(item.feature)) return item;
                const tiers = authStore.getFeatureTier(item.feature);
                return {
                    ...item,
                    locked: true,
                    to: "/pricing",
                    tiers: tiers.map((t) => ({
                        role: t.role,
                        displayName: t.displayName,
                        color: t.color,
                    })),
                };
            }),
    );
}

const generalNavItems = [
    {
        to: "/public-profile",
        icon: "lucide:globe",
        label: "nav.publicProfile",
        feature: "user_public_profiles",
    },
    {
        to: "/api-keys",
        icon: "lucide:key",
        label: "nav.apiKeys",
        feature: "api_access",
    },
    { to: "/settings", icon: "lucide:settings", label: "nav.settings", shortcut: "S" },
];

const navSections = [
    { label: "nav.overview", items: buildNavItems(overviewNavItems) },
    { label: "nav.terrarium", items: buildNavItems(terrariumNavItems) },
    { label: "nav.careLog", items: buildNavItems(careLogNavItems) },
    { label: "nav.general", items: buildNavItems(generalNavItems) },
];

const adminNavItem = { to: "/admin", icon: "lucide:shield", label: "nav.admin" };

const userInitial = computed(() => {
    const name = authStore.user?.displayName || authStore.user?.username || "?";
    return name.charAt(0).toUpperCase();
});

function isActive(path: string): boolean {
    return route.path === path || (path !== "/dashboard" && route.path.startsWith(path));
}

async function handleLogout() {
    await authStore.logout();
    router.push("/");
}
</script>
