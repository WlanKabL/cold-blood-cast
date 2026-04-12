<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                @click.self="emit('close')"
            >
                <div class="bg-surface border-line mx-4 w-full max-w-md rounded-2xl border p-6 shadow-2xl">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-fg text-[15px] font-semibold">
                            {{ $t("report.title") }}
                        </h3>
                        <button
                            class="text-fg-faint hover:text-fg p-1 transition-colors"
                            @click="emit('close')"
                        >
                            <Icon name="lucide:x" class="h-4 w-4" />
                        </button>
                    </div>

                    <p class="text-fg-muted mb-4 text-[13px]">
                        {{ $t("report.description") }}
                    </p>

                    <!-- Reason Selection -->
                    <div class="mb-3">
                        <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                            {{ $t("report.reason") }}
                        </label>
                        <select
                            v-model="reason"
                            class="bg-surface-sunken border-line text-fg w-full rounded-lg border px-3 py-2 text-[13px]"
                        >
                            <option value="" disabled>{{ $t("report.selectReason") }}</option>
                            <option v-for="r in reasons" :key="r.value" :value="r.value">
                                {{ r.label }}
                            </option>
                        </select>
                    </div>

                    <!-- Optional Description -->
                    <div class="mb-3">
                        <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                            {{ $t("report.details") }}
                        </label>
                        <textarea
                            v-model="description"
                            rows="3"
                            maxlength="1000"
                            :placeholder="$t('report.detailsPlaceholder')"
                            class="bg-surface-sunken border-line text-fg w-full rounded-lg border px-3 py-2 text-[13px]"
                        />
                        <p class="text-fg-faint mt-1 text-right text-[11px]">
                            {{ description.length }}/1000
                        </p>
                    </div>

                    <!-- Optional Reporter Name -->
                    <div class="mb-4">
                        <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                            {{ $t("report.yourName") }}
                        </label>
                        <input
                            v-model="reporterName"
                            type="text"
                            maxlength="50"
                            :placeholder="$t('report.yourNamePlaceholder')"
                            class="bg-surface-sunken border-line text-fg w-full rounded-lg border px-3 py-2 text-[13px]"
                        />
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end gap-2">
                        <button
                            class="border-line text-fg-dim hover:bg-surface-hover rounded-lg border px-4 py-2 text-[12px] transition-colors"
                            @click="emit('close')"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            class="rounded-lg bg-red-500 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-red-400 disabled:opacity-50"
                            :disabled="!reason || submitting"
                            @click="handleSubmit"
                        >
                            {{ $t("report.submit") }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
interface Props {
    open: boolean;
    targetType: "comment" | "user_profile" | "pet_profile";
    targetId: string;
    targetUrl?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
    submitted: [];
}>();

const { t } = useI18n();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseURL;

const reason = ref("");
const description = ref("");
const reporterName = ref("");
const submitting = ref(false);

const reasons = computed(() => [
    { value: "spam", label: t("report.reasons.spam") },
    { value: "harassment", label: t("report.reasons.harassment") },
    { value: "inappropriate", label: t("report.reasons.inappropriate") },
    { value: "misinformation", label: t("report.reasons.misinformation") },
    { value: "other", label: t("report.reasons.other") },
]);

async function handleSubmit() {
    if (!reason.value || submitting.value) return;
    submitting.value = true;
    try {
        const res = await fetch(`${apiBase}/api/public/reports`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                targetType: props.targetType,
                targetId: props.targetId,
                targetUrl: props.targetUrl,
                reason: reason.value,
                description: description.value || undefined,
                reporterName: reporterName.value || undefined,
            }),
        });
        if (res.ok) {
            emit("submitted");
            emit("close");
            reason.value = "";
            description.value = "";
            reporterName.value = "";
        }
    } catch {
        // Ignore
    } finally {
        submitting.value = false;
    }
}
</script>
