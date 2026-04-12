<template>
    <div class="glass-card rounded-xl p-6">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-fg font-semibold">
                <Icon name="lucide:share-2" class="mr-1.5 inline h-4 w-4" />
                {{ $t("pages.pets.publicProfile.title") }}
            </h2>
            <span
                v-if="profile"
                :class="
                    profile.active ? 'bg-green-500/10 text-green-400' : 'text-fg-faint bg-white/5'
                "
                class="rounded-md px-2 py-0.5 text-xs font-medium"
            >
                {{
                    profile.active
                        ? $t("pages.pets.publicProfile.active")
                        : $t("pages.pets.publicProfile.inactive")
                }}
            </span>
        </div>

        <!-- Not created yet -->
        <div v-if="!profile && !loading" class="text-center">
            <p class="text-fg-muted mb-4 text-sm">
                {{ $t("pages.pets.publicProfile.description") }}
            </p>
            <UiButton :loading="creating" icon="lucide:globe" @click="handleCreate">
                {{ $t("pages.pets.publicProfile.create") }}
            </UiButton>
        </div>

        <!-- Loading -->
        <div v-else-if="loading" class="flex justify-center py-8">
            <Icon name="lucide:loader-2" class="text-fg-faint h-6 w-6 animate-spin" />
        </div>

        <!-- Profile exists -->
        <div v-else-if="profile" class="space-y-5">
            <!-- URL + Copy -->
            <div>
                <label class="text-fg-faint mb-1.5 block text-xs font-medium uppercase">
                    {{ $t("pages.pets.publicProfile.url") }}
                </label>
                <div class="bg-surface-raised flex items-center gap-2 rounded-lg p-2">
                    <code class="text-primary-400 min-w-0 flex-1 truncate text-sm">
                        {{ publicUrl }}
                    </code>
                    <UiButton size="xs" variant="ghost" icon="lucide:copy" @click="copyUrl">
                        {{ copied ? $t("common.copied") : $t("common.copy") }}
                    </UiButton>
                    <UiButton
                        size="xs"
                        variant="ghost"
                        icon="lucide:external-link"
                        :href="publicUrl"
                        target="_blank"
                    />
                </div>
            </div>

            <!-- Toggle Active -->
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-fg text-sm font-medium">
                        {{ $t("pages.pets.publicProfile.profileActive") }}
                    </p>
                    <p class="text-fg-faint text-xs">
                        {{ $t("pages.pets.publicProfile.activeHint") }}
                    </p>
                </div>
                <UiToggle
                    :model-value="profile.active"
                    :loading="updating"
                    @update:model-value="(val: boolean) => handleUpdate({ active: val })"
                />
            </div>

            <!-- Custom Slug -->
            <div>
                <label class="text-fg-faint mb-1.5 block text-xs font-medium uppercase">
                    {{ $t("pages.pets.publicProfile.slug") }}
                </label>
                <div class="flex items-center gap-2">
                    <UiTextInput v-model="slugInput" class="flex-1" :placeholder="profile.slug" />
                    <UiButton
                        size="sm"
                        :loading="updating"
                        :disabled="!slugInput || slugInput === profile.slug"
                        @click="handleUpdateSlug"
                    >
                        {{ $t("common.save") }}
                    </UiButton>
                </div>
                <p v-if="slugError" class="mt-1 text-xs text-red-400">{{ slugError }}</p>
            </div>

            <!-- Bio -->
            <div>
                <label class="text-fg-faint mb-1.5 block text-xs font-medium uppercase">
                    {{ $t("pages.pets.publicProfile.bio") }}
                </label>
                <UiTextarea
                    v-model="bioInput"
                    :placeholder="$t('pages.pets.publicProfile.bioPlaceholder')"
                    rows="3"
                    :maxlength="500"
                />
                <div class="mt-1.5 flex justify-end">
                    <UiButton
                        size="xs"
                        :loading="updating"
                        :disabled="bioInput === (profile.bio ?? '')"
                        @click="handleUpdate({ bio: bioInput || null })"
                    >
                        {{ $t("common.save") }}
                    </UiButton>
                </div>
            </div>

            <!-- Visibility Toggles -->
            <div>
                <label class="text-fg-faint mb-2 block text-xs font-medium uppercase">
                    {{ $t("pages.pets.publicProfile.visibleData") }}
                </label>
                <div class="space-y-2.5">
                    <div
                        v-for="toggle in visibilityToggles"
                        :key="toggle.key"
                        class="flex items-center justify-between"
                    >
                        <div class="flex items-center gap-2">
                            <Icon :name="toggle.icon" class="text-fg-faint h-4 w-4" />
                            <span class="text-fg text-sm">{{ toggle.label }}</span>
                        </div>
                        <UiToggle
                            :model-value="
                                (profile as Record<string, unknown>)[toggle.key] as boolean
                            "
                            :loading="updating"
                            @update:model-value="
                                (val: boolean) => handleUpdate({ [toggle.key]: val })
                            "
                        />
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="border-t border-white/5 pt-4">
                <div class="flex items-center gap-4 text-xs">
                    <span class="text-fg-faint">
                        <Icon name="lucide:eye" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("pages.pets.publicProfile.views", { count: profile.views }) }}
                    </span>
                    <span class="text-fg-faint">
                        {{
                            $t("pages.pets.publicProfile.createdAt", {
                                date: new Date(profile.createdAt).toLocaleDateString(),
                            })
                        }}
                    </span>
                </div>
            </div>

            <!-- Embed Code + QR -->
            <div class="border-t border-white/5 pt-4">
                <div class="flex gap-2">
                    <UiButton
                        size="sm"
                        variant="ghost"
                        icon="lucide:code"
                        @click="showEmbed = true"
                    >
                        {{ $t("pages.pets.publicProfile.embedCode") }}
                    </UiButton>
                    <UiButton
                        size="sm"
                        variant="ghost"
                        icon="lucide:qr-code"
                        @click="showQr = true"
                    >
                        {{ $t("pages.pets.publicProfile.qrCode") }}
                    </UiButton>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="border-t border-white/5 pt-4">
                <UiButton
                    size="sm"
                    variant="danger"
                    icon="lucide:trash-2"
                    :loading="deleting"
                    @click="showDeleteConfirm = true"
                >
                    {{ $t("pages.pets.publicProfile.delete") }}
                </UiButton>
            </div>
        </div>

        <!-- Embed Code Modal -->
        <UiModal
            :show="showEmbed"
            :title="$t('pages.pets.publicProfile.embedCode')"
            @close="showEmbed = false"
        >
            <div class="space-y-4">
                <p class="text-fg-muted text-sm">
                    {{ $t("pages.pets.publicProfile.embedDescription") }}
                </p>
                <div class="bg-surface-raised rounded-lg p-3">
                    <code class="text-primary-400 text-xs break-all">{{ embedCode }}</code>
                </div>
                <UiButton icon="lucide:copy" @click="copyEmbed">
                    {{ embedCopied ? $t("common.copied") : $t("common.copy") }}
                </UiButton>
            </div>
        </UiModal>

        <!-- QR Code Modal -->
        <UiModal
            :show="showQr"
            :title="$t('pages.pets.publicProfile.qrCode')"
            @close="showQr = false"
        >
            <div class="flex flex-col items-center gap-4 py-4">
                <canvas ref="qrCanvas" class="rounded-xl" />
                <p class="text-fg-muted text-center text-sm">
                    {{ $t("pages.pets.publicProfile.qrHint") }}
                </p>
                <UiButton icon="lucide:download" @click="downloadQr">
                    {{ $t("common.download") }}
                </UiButton>
            </div>
        </UiModal>

        <!-- Delete Confirm -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('pages.pets.publicProfile.deleteConfirmTitle')"
            :message="$t('pages.pets.publicProfile.deleteConfirmMessage')"
            :loading="deleting"
            @confirm="handleDelete"
            @cancel="showDeleteConfirm = false"
        />
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface PublicProfile {
    id: string;
    petId: string;
    slug: string;
    active: boolean;
    bio: string | null;
    showPhotos: boolean;
    showWeight: boolean;
    showAge: boolean;
    showFeedings: boolean;
    showSheddings: boolean;
    showSpecies: boolean;
    showMorph: boolean;
    views: number;
    createdAt: string;
}

const props = defineProps<{
    petId: string;
}>();

const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();
const config = useRuntimeConfig();

const slugInput = ref("");
const slugError = ref("");
const bioInput = ref("");
const showEmbed = ref(false);
const showQr = ref(false);
const showDeleteConfirm = ref(false);
const copied = ref(false);
const embedCopied = ref(false);
const qrCanvas = ref<HTMLCanvasElement>();

const frontendUrl = config.public.appBaseURL || window.location.origin;

const publicUrl = computed(() => (profile.value ? `${frontendUrl}/p/${profile.value.slug}` : ""));

const embedUrl = computed(() =>
    profile.value ? `${frontendUrl}/p/${profile.value.slug}/embed` : "",
);

const embedCode = computed(
    () =>
        `<iframe src="${embedUrl.value}" width="400" height="600" frameborder="0" style="border-radius:12px;overflow:hidden;" loading="lazy"></iframe>`,
);

const visibilityToggles = computed(() => [
    {
        key: "showPhotos",
        icon: "lucide:image",
        label: t("pages.pets.publicProfile.togglePhotos"),
    },
    {
        key: "showWeight",
        icon: "lucide:scale",
        label: t("pages.pets.publicProfile.toggleWeight"),
    },
    {
        key: "showAge",
        icon: "lucide:cake",
        label: t("pages.pets.publicProfile.toggleAge"),
    },
    {
        key: "showFeedings",
        icon: "lucide:utensils",
        label: t("pages.pets.publicProfile.toggleFeedings"),
    },
    {
        key: "showSheddings",
        icon: "lucide:layers",
        label: t("pages.pets.publicProfile.toggleSheddings"),
    },
    {
        key: "showSpecies",
        icon: "lucide:tag",
        label: t("pages.pets.publicProfile.toggleSpecies"),
    },
    {
        key: "showMorph",
        icon: "lucide:palette",
        label: t("pages.pets.publicProfile.toggleMorph"),
    },
]);

// ── Data ─────────────────────────────────────────────────
const { data: profile, isLoading: loading } = useQuery({
    queryKey: ["public-profile", props.petId],
    queryFn: async () => {
        try {
            return await api.get<PublicProfile>(`/api/public-profiles/${props.petId}`);
        } catch {
            return null;
        }
    },
});

// ── Watchers ─────────────────────────────────────────────
watch(
    profile,
    (p) => {
        if (p) {
            slugInput.value = p.slug;
            bioInput.value = p.bio ?? "";
        }
    },
    { immediate: true },
);

// ── Create ───────────────────────────────────────────────
const { mutate: createMutation, isPending: creating } = useMutation({
    mutationFn: () => api.post<PublicProfile>("/api/public-profiles", { petId: props.petId }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["public-profile", props.petId] });
        toast.success(t("pages.pets.publicProfile.created"));
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleCreate() {
    createMutation();
}

// ── Update ───────────────────────────────────────────────
const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
        api.patch<PublicProfile>(`/api/public-profiles/${props.petId}`, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["public-profile", props.petId] });
        slugError.value = "";
    },
    onError: (err: unknown) => {
        const msg =
            err && typeof err === "object" && "message" in err
                ? (err as { message: string }).message
                : t("common.error");
        if (msg.includes("slug")) {
            slugError.value = msg;
        } else {
            toast.error(msg);
        }
    },
});

function handleUpdate(data: Record<string, unknown>) {
    updateMutation(data);
}

function handleUpdateSlug() {
    if (!slugInput.value || slugInput.value === profile.value?.slug) return;
    handleUpdate({ slug: slugInput.value.toLowerCase() });
}

// ── Delete ───────────────────────────────────────────────
const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/public-profiles/${props.petId}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["public-profile", props.petId] });
        showDeleteConfirm.value = false;
        toast.success(t("pages.pets.publicProfile.deleted"));
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}

// ── Clipboard ────────────────────────────────────────────
async function copyUrl() {
    await navigator.clipboard.writeText(publicUrl.value);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
}

async function copyEmbed() {
    await navigator.clipboard.writeText(embedCode.value);
    embedCopied.value = true;
    setTimeout(() => {
        embedCopied.value = false;
    }, 2000);
}

// ── QR Code ──────────────────────────────────────────────
async function renderQr() {
    if (!qrCanvas.value || !publicUrl.value) return;
    const { default: QRCode } = await import("qrcode");
    await QRCode.toCanvas(qrCanvas.value, publicUrl.value, {
        width: 256,
        margin: 2,
        color: { dark: "#e8e6dd", light: "#121208" },
    });
}

watch(showQr, (open) => {
    if (open) nextTick(renderQr);
});

function downloadQr() {
    if (!qrCanvas.value) return;
    const link = document.createElement("a");
    link.download = `${profile.value?.slug ?? "pet"}-qr.png`;
    link.href = qrCanvas.value.toDataURL("image/png");
    link.click();
}
</script>
