<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            @enter="lockScroll"
            @leave="unlockScroll"
        >
            <div
                v-if="show"
                class="bg-page fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
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
                            :disabled="saving"
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

                        <!-- Inline form when active -->
                        <div v-if="activeForm" class="space-y-4">
                            <button
                                class="text-fg-muted hover:text-fg mb-2 flex items-center gap-1 text-[13px] transition-colors"
                                @click="activeForm = null"
                            >
                                <Icon name="lucide:arrow-left" class="h-3.5 w-3.5" />
                                {{ $t("onboarding.backToChecklist") }}
                            </button>

                            <!-- Create Enclosure Form -->
                            <form
                                v-if="activeForm === 'enclosure'"
                                class="space-y-4"
                                @submit.prevent="handleCreateEnclosure"
                            >
                                <UiTextInput
                                    v-model="enclosureForm.name"
                                    required
                                    :label="$t('pages.enclosures.fields.name')"
                                />
                                <UiSelect
                                    v-model="enclosureForm.type"
                                    :label="$t('pages.enclosures.fields.type')"
                                >
                                    <option v-for="et in ENCLOSURE_TYPES" :key="et" :value="et">
                                        {{ et }}
                                    </option>
                                </UiSelect>
                                <div class="flex justify-end gap-2 pt-2">
                                    <UiButton variant="ghost" @click="activeForm = null">
                                        {{ $t("common.cancel") }}
                                    </UiButton>
                                    <UiButton type="submit" :loading="formSaving">
                                        {{ $t("common.save") }}
                                    </UiButton>
                                </div>
                            </form>

                            <!-- Create Pet Form -->
                            <form
                                v-if="activeForm === 'pet'"
                                class="space-y-4"
                                @submit.prevent="handleCreatePet"
                            >
                                <UiTextInput
                                    v-model="petForm.name"
                                    required
                                    :label="$t('pages.pets.fields.name')"
                                />
                                <UiTextInput
                                    v-model="petForm.species"
                                    required
                                    :label="$t('pages.pets.fields.species')"
                                />
                                <UiSelect
                                    v-if="enclosureOptions.length"
                                    v-model="petForm.enclosureId"
                                    :label="$t('pages.pets.fields.enclosure')"
                                >
                                    <option value="">—</option>
                                    <option
                                        v-for="enc in enclosureOptions"
                                        :key="enc.id"
                                        :value="enc.id"
                                    >
                                        {{ enc.name }}
                                    </option>
                                </UiSelect>
                                <div class="flex justify-end gap-2 pt-2">
                                    <UiButton variant="ghost" @click="activeForm = null">
                                        {{ $t("common.cancel") }}
                                    </UiButton>
                                    <UiButton type="submit" :loading="formSaving">
                                        {{ $t("common.save") }}
                                    </UiButton>
                                </div>
                            </form>
                        </div>

                        <!-- Step checklist items -->
                        <div v-else class="space-y-3">
                            <component
                                :is="item.action ? 'button' : 'div'"
                                v-for="item in activeStep.items"
                                :key="item.label"
                                class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors"
                                :class="
                                    item.action
                                        ? 'bg-surface-raised/50 hover:bg-surface-raised cursor-pointer'
                                        : 'bg-surface-raised/30'
                                "
                                @click="item.action?.()"
                            >
                                <Icon :name="item.icon" class="text-fg-faint h-5 w-5 shrink-0" />
                                <span class="text-fg-muted text-[13px]">{{ item.label }}</span>
                                <Icon
                                    v-if="item.done"
                                    name="lucide:check-circle"
                                    class="ml-auto h-4 w-4 shrink-0 text-green-400"
                                />
                                <Icon
                                    v-else-if="item.action"
                                    name="lucide:plus"
                                    class="text-fg-faint ml-auto h-4 w-4 shrink-0"
                                />
                            </component>
                        </div>

                        <!-- Navigation -->
                        <div v-if="!activeForm" class="mt-8 flex items-center justify-between">
                            <UiButton v-if="currentStep > 0" variant="ghost" @click="currentStep--">
                                {{ $t("onboarding.back") }}
                            </UiButton>
                            <div v-else />

                            <UiButton v-if="currentStep < steps.length - 1" @click="currentStep++">
                                {{ $t("onboarding.next") }}
                            </UiButton>
                            <UiButton v-else :loading="saving" @click="complete">
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
import { useQueryClient } from "@tanstack/vue-query";
import { ENCLOSURE_TYPES } from "@cold-blood-cast/shared";

type FormType = "enclosure" | "pet" | null;

const { t } = useI18n();
const api = useApi();
const toast = useAppToast();
const authStore = useAuthStore();
const queryClient = useQueryClient();
const hasSensorsFeature = useFeatureAccess("sensors");

const show = computed(
    () => authStore.isAuthenticated && authStore.user?.onboardingCompleted === false,
);

const currentStep = ref(0);
const saving = ref(false);
const formSaving = ref(false);
const activeForm = ref<FormType>(null);

// Real completion status from user data
const hasEnclosure = ref(false);
const hasPet = ref(false);
const hasFeeding = ref(false);
const hasWeight = ref(false);
const hasShedding = ref(false);

// Enclosure list for pet form dropdown
const enclosureOptions = ref<{ id: string; name: string }[]>([]);

interface PaginatedResponse<T> {
    items: T[];
    nextCursor: string | null;
}

async function refreshStatus() {
    try {
        const [enclosures, pets, feedings, weights, sheddings] = await Promise.all([
            api.get<{ id: string; name: string }[]>("/api/enclosures"),
            api.get<{ id: string }[]>("/api/pets"),
            api.get<PaginatedResponse<{ id: string }>>("/api/feedings?limit=1"),
            api.get<PaginatedResponse<{ id: string }>>("/api/weights?limit=1"),
            api.get<PaginatedResponse<{ id: string }>>("/api/sheddings?limit=1"),
        ]);
        enclosureOptions.value = enclosures.map((e) => ({ id: e.id, name: e.name }));
        hasEnclosure.value = enclosures.length > 0;
        hasPet.value = pets.length > 0;
        hasFeeding.value = feedings.items.length > 0;
        hasWeight.value = weights.items.length > 0;
        hasShedding.value = sheddings.items.length > 0;
    } catch {
        // Non-blocking — wizard still works with all false
    }
}

watch(
    show,
    (visible) => {
        if (visible) refreshStatus();
    },
    { immediate: true },
);

// Reset active form when step changes
watch(currentStep, () => {
    activeForm.value = null;
});

// ── Inline forms ─────────────────────────────────────────
const enclosureForm = reactive({ name: "", type: "TERRARIUM" });
const petForm = reactive({ name: "", species: "", enclosureId: "" });

function openEnclosureForm() {
    enclosureForm.name = "";
    enclosureForm.type = "TERRARIUM";
    activeForm.value = "enclosure";
}

function openPetForm() {
    petForm.name = "";
    petForm.species = "";
    petForm.enclosureId = "";
    activeForm.value = "pet";
}

async function handleCreateEnclosure() {
    if (formSaving.value) return;
    formSaving.value = true;
    try {
        await api.post("/api/enclosures", {
            name: enclosureForm.name,
            type: enclosureForm.type,
        });
        toast.success(t("pages.enclosures.created"));
        queryClient.invalidateQueries({ queryKey: ["enclosures"] });
        activeForm.value = null;
        await refreshStatus();
    } catch {
        toast.error(t("common.error"));
    } finally {
        formSaving.value = false;
    }
}

async function handleCreatePet() {
    if (formSaving.value) return;
    formSaving.value = true;
    try {
        await api.post("/api/pets", {
            name: petForm.name,
            species: petForm.species,
            enclosureId: petForm.enclosureId || undefined,
        });
        toast.success(t("pages.pets.created"));
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        activeForm.value = null;
        await refreshStatus();
    } catch {
        toast.error(t("common.error"));
    } finally {
        formSaving.value = false;
    }
}

function goToPage(path: string) {
    completeOnboarding();
    navigateTo(path);
}

// ── Steps ────────────────────────────────────────────────
const steps = computed(() => [
    {
        icon: "lucide:box",
        title: t("onboarding.steps.enclosure.title"),
        desc: t("onboarding.steps.enclosure.desc"),
        items: [
            {
                icon: "lucide:box",
                label: t("onboarding.steps.enclosure.item1"),
                done: hasEnclosure.value,
                action: openEnclosureForm,
            },
            ...(hasSensorsFeature.value
                ? [
                      {
                          icon: "lucide:thermometer",
                          label: t("onboarding.steps.enclosure.item2"),
                          done: false,
                          action: null as (() => void) | null,
                      },
                  ]
                : []),
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
                done: hasPet.value,
                action: openPetForm,
            },
            {
                icon: "lucide:camera",
                label: t("onboarding.steps.pet.item2"),
                done: false,
                action: null,
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
                done: hasFeeding.value,
                action: () => goToPage("/feedings"),
            },
            {
                icon: "lucide:scale",
                label: t("onboarding.steps.care.item2"),
                done: hasWeight.value,
                action: () => goToPage("/weights"),
            },
            {
                icon: "lucide:layers",
                label: t("onboarding.steps.care.item3"),
                done: hasShedding.value,
                action: () => goToPage("/sheddings"),
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
                action: null,
            },
            {
                icon: "lucide:calendar-days",
                label: t("onboarding.steps.ready.item2"),
                done: false,
                action: null,
            },
            {
                icon: "lucide:bell",
                label: t("onboarding.steps.ready.item3"),
                done: false,
                action: null,
            },
        ],
    },
]);

const activeStep = computed(() => steps.value[currentStep.value]);

// ── Scroll lock ──────────────────────────────────────────
function lockScroll() {
    document.body.style.overflow = "hidden";
}

function unlockScroll() {
    document.body.style.overflow = "";
}

onUnmounted(() => {
    unlockScroll();
});

// ── Complete / Skip ──────────────────────────────────────
async function completeOnboarding() {
    if (saving.value) return;
    saving.value = true;
    try {
        await api.patch("/api/auth/profile", { onboardingCompleted: true });
        await authStore.fetchMe();
    } catch {
        toast.error(t("common.error"));
    } finally {
        saving.value = false;
    }
}

async function skip() {
    await completeOnboarding();
}

async function complete() {
    await completeOnboarding();
    if (authStore.user?.onboardingCompleted) {
        navigateTo("/dashboard");
    }
}
</script>
