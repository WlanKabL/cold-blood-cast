<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="show"
                class="bg-base fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
            >
                <div class="w-full max-w-lg">
                    <!-- Progress -->
                    <div class="mb-6 flex items-center justify-between">
                        <div class="flex gap-1.5">
                            <div
                                v-for="(_, idx) in steps"
                                :key="idx"
                                class="h-1.5 w-8 rounded-full transition-colors"
                                :class="idx <= currentStep ? 'bg-primary-500' : 'bg-surface-raised'"
                            />
                        </div>
                        <button
                            class="text-fg-faint hover:text-fg text-[12px] font-medium transition-colors"
                            @click="skip"
                        >
                            {{ $t("onboarding.skip") }}
                        </button>
                    </div>

                    <!-- Step Content -->
                    <div class="glass-card rounded-2xl p-8">
                        <div class="mb-6 flex items-center gap-4">
                            <div
                                class="bg-primary-500/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                            >
                                <Icon :name="activeStep.icon" class="text-primary-400 h-7 w-7" />
                            </div>
                            <div>
                                <h2 class="text-fg text-xl font-bold">
                                    {{ activeStep.title }}
                                </h2>
                                <p class="text-fg-muted mt-0.5 text-[13px]">
                                    {{ activeStep.desc }}
                                </p>
                            </div>
                        </div>

                        <!-- Step-specific content -->
                        <div class="space-y-3">
                            <div
                                v-for="item in activeStep.items"
                                :key="item.label"
                                class="bg-surface-raised/50 flex items-center gap-3 rounded-xl px-4 py-3"
                            >
                                <Icon :name="item.icon" class="text-fg-faint h-5 w-5 shrink-0" />
                                <span class="text-fg-muted text-[13px]">{{ item.label }}</span>
                                <Icon
                                    v-if="item.done"
                                    name="lucide:check-circle"
                                    class="ml-auto h-4 w-4 text-green-400"
                                />
                            </div>
                        </div>

                        <!-- Navigation -->
                        <div class="mt-8 flex items-center justify-between">
                            <UiButton v-if="currentStep > 0" variant="ghost" @click="currentStep--">
                                {{ $t("onboarding.back") }}
                            </UiButton>
                            <div v-else />

                            <UiButton v-if="currentStep < steps.length - 1" @click="currentStep++">
                                {{ $t("onboarding.next") }}
                            </UiButton>
                            <UiButton v-else @click="complete">
                                {{ $t("onboarding.getStarted") }}
                            </UiButton>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const { t } = useI18n();
const api = useApi();
const authStore = useAuthStore();

const show = computed(
    () => authStore.isAuthenticated && authStore.user?.onboardingCompleted === false,
);

const currentStep = ref(0);

const steps = computed(() => [
    {
        icon: "lucide:box",
        title: t("onboarding.steps.enclosure.title"),
        desc: t("onboarding.steps.enclosure.desc"),
        items: [
            {
                icon: "lucide:box",
                label: t("onboarding.steps.enclosure.item1"),
                done: false,
            },
            {
                icon: "lucide:thermometer",
                label: t("onboarding.steps.enclosure.item2"),
                done: false,
            },
        ],
    },
    {
        icon: "lucide:heart",
        title: t("onboarding.steps.pet.title"),
        desc: t("onboarding.steps.pet.desc"),
        items: [
            {
                icon: "lucide:heart",
                label: t("onboarding.steps.pet.item1"),
                done: false,
            },
            {
                icon: "lucide:camera",
                label: t("onboarding.steps.pet.item2"),
                done: false,
            },
        ],
    },
    {
        icon: "lucide:utensils",
        title: t("onboarding.steps.care.title"),
        desc: t("onboarding.steps.care.desc"),
        items: [
            {
                icon: "lucide:utensils",
                label: t("onboarding.steps.care.item1"),
                done: false,
            },
            {
                icon: "lucide:scale",
                label: t("onboarding.steps.care.item2"),
                done: false,
            },
            {
                icon: "lucide:layers",
                label: t("onboarding.steps.care.item3"),
                done: false,
            },
        ],
    },
    {
        icon: "lucide:sparkles",
        title: t("onboarding.steps.ready.title"),
        desc: t("onboarding.steps.ready.desc"),
        items: [
            {
                icon: "lucide:layout-dashboard",
                label: t("onboarding.steps.ready.item1"),
                done: false,
            },
            {
                icon: "lucide:calendar-days",
                label: t("onboarding.steps.ready.item2"),
                done: false,
            },
            {
                icon: "lucide:bell",
                label: t("onboarding.steps.ready.item3"),
                done: false,
            },
        ],
    },
]);

const activeStep = computed(() => steps.value[currentStep.value]);

async function completeOnboarding() {
    try {
        await api.patch("/api/auth/profile", { onboardingCompleted: true });
        await authStore.fetchMe();
    } catch {
        // Best effort
    }
}

async function skip() {
    await completeOnboarding();
}

async function complete() {
    await completeOnboarding();
    navigateTo("/enclosures");
}
</script>
