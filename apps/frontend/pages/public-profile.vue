<template>
    <div class="mx-auto max-w-4xl space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="animate-fade-in-up text-fg text-2xl font-bold tracking-tight">
                    {{ $t("userProfile.title") }}
                </h1>
                <p class="text-fg-muted mt-1 text-[13px]">
                    {{ $t("userProfile.description") }}
                </p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="glass-card flex items-center justify-center p-12">
            <Icon name="lucide:loader-2" class="text-primary-400 h-6 w-6 animate-spin" />
        </div>

        <!-- Create Profile -->
        <div v-else-if="!profile" class="glass-card p-8 text-center">
            <Icon name="lucide:globe" class="text-fg-faint mx-auto mb-4 h-12 w-12" />
            <h2 class="text-fg mb-2 text-lg font-semibold">
                {{ $t("userProfile.createProfile") }}
            </h2>
            <p class="text-fg-muted mb-6 text-[13px]">
                {{ $t("userProfile.createHint") }}
            </p>
            <div class="mx-auto mb-4 max-w-xs">
                <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                    {{ $t("userProfile.slug") }}
                </label>
                <input
                    v-model="createSlug"
                    type="text"
                    :placeholder="authStore.user?.username"
                    class="bg-surface-sunken border-line text-fg w-full rounded-xl border px-3 py-2 text-[13px]"
                />
            </div>
            <button
                class="bg-primary-500 hover:bg-primary-400 rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-colors"
                :disabled="isCreating"
                @click="handleCreate"
            >
                {{ $t("userProfile.createProfile") }}
            </button>
        </div>

        <!-- Profile Management -->
        <template v-else>
            <!-- Draft Banner (when inactive) -->
            <div
                v-if="!form.active"
                class="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4"
            >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10"
                        >
                            <Icon name="lucide:eye-off" class="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                            <p class="text-[13px] font-semibold text-amber-300">
                                {{ $t("userProfile.profileDraft") }}
                            </p>
                            <p class="text-[12px] text-amber-400/70">
                                {{ $t("userProfile.profileDraftHint") }}
                            </p>
                        </div>
                    </div>
                    <button
                        class="rounded-xl bg-amber-500 px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-amber-400"
                        @click="form.active = true"
                    >
                        <Icon name="lucide:globe" class="mr-1.5 inline h-3.5 w-3.5" />
                        {{ $t("userProfile.publishNow") }}
                    </button>
                </div>
            </div>

            <!-- Published Banner (when active) -->
            <div v-else class="rounded-xl border border-green-500/30 bg-green-500/5 px-5 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10"
                        >
                            <Icon name="lucide:globe" class="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                            <p class="text-[13px] font-semibold text-green-300">
                                {{ $t("userProfile.profilePublished") }}
                            </p>
                            <p class="text-fg-faint text-[12px]">
                                {{ $t("userProfile.views", { count: profile.views }) }}
                            </p>
                        </div>
                    </div>
                    <button
                        class="text-fg-faint text-[12px] transition-colors hover:text-red-400"
                        @click="form.active = false"
                    >
                        {{ $t("userProfile.unpublish") }}
                    </button>
                </div>
            </div>

            <!-- Unsaved state change hint -->
            <div
                v-if="form.active !== profile.active"
                class="text-primary-400 -mt-3 text-center text-[12px]"
            >
                <Icon name="lucide:info" class="mr-1 inline h-3.5 w-3.5" />
                {{ $t("userProfile.unsavedStateHint") }}
            </div>

            <!-- Quick Actions + Visibility Toggles -->
            <div class="glass-card space-y-4 p-6">
                <div class="flex flex-wrap gap-2">
                    <button
                        class="border-line text-fg-dim hover:bg-surface-hover rounded-lg border px-3 py-1.5 text-[12px] transition-colors"
                        @click="copyProfileLink"
                    >
                        <Icon name="lucide:link" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("userProfile.copyLink") }}
                    </button>
                    <button
                        class="border-line text-fg-dim hover:bg-surface-hover rounded-lg border px-3 py-1.5 text-[12px] transition-colors"
                        @click="showQr = !showQr"
                    >
                        <Icon name="lucide:qr-code" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("userProfile.qrCode") }}
                    </button>
                    <button
                        class="border-line text-fg-dim hover:bg-surface-hover rounded-lg border px-3 py-1.5 text-[12px] transition-colors"
                        @click="copyEmbedCode"
                    >
                        <Icon name="lucide:code" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("userProfile.embed") }}
                    </button>
                    <NuxtLink
                        v-if="profile"
                        :to="`/keeper/${profile.slug}`"
                        target="_blank"
                        class="border-line text-fg-dim hover:bg-surface-hover flex items-center rounded-lg border px-3 py-1.5 text-[12px] transition-colors"
                    >
                        <Icon name="lucide:external-link" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("userProfile.preview") }}
                    </NuxtLink>
                </div>

                <!-- Visibility Toggles (compact row) -->
                <div class="border-line border-t pt-4">
                    <button
                        class="text-fg-dim mb-3 flex w-full items-center justify-between text-[12px] font-medium"
                        @click="showVisibility = !showVisibility"
                    >
                        <span class="flex items-center gap-1.5">
                            <Icon name="lucide:eye" class="h-3.5 w-3.5" />
                            {{ $t("userProfile.visibility") }}
                        </span>
                        <Icon
                            name="lucide:chevron-down"
                            class="h-3.5 w-3.5 transition-transform"
                            :class="showVisibility ? 'rotate-180' : ''"
                        />
                    </button>
                    <div v-if="showVisibility" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div
                            v-for="toggle in visibilityToggles"
                            :key="toggle.key"
                            class="flex items-center justify-between rounded-lg px-3 py-2"
                            :class="form[toggle.key] ? 'bg-primary-500/5' : 'bg-surface-sunken/50'"
                        >
                            <span class="text-fg text-[12px]">
                                {{ $t(`userProfile.${toggle.label}`) }}
                            </span>
                            <button
                                class="relative ml-2 h-5 w-9 shrink-0 rounded-full transition-colors"
                                :class="form[toggle.key] ? 'bg-primary-500' : 'bg-surface-sunken'"
                                @click="form[toggle.key] = !form[toggle.key]"
                            >
                                <span
                                    class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                                    :class="form[toggle.key] ? 'translate-x-4' : ''"
                                />
                            </button>
                        </div>
                    </div>

                    <!-- Notify on Comment Toggle -->
                    <div class="border-line mt-3 border-t pt-3">
                        <div
                            class="flex items-center justify-between rounded-lg px-3 py-2"
                            :class="form.notifyOnComment ? 'bg-cyan-500/5' : 'bg-surface-sunken/50'"
                        >
                            <div>
                                <span class="text-fg text-[12px]">
                                    {{ $t("community.notifyOnComment") }}
                                </span>
                                <p class="text-fg-faint text-[11px]">
                                    {{ $t("community.notifyOnCommentHint") }}
                                </p>
                            </div>
                            <button
                                class="relative ml-2 h-5 w-9 shrink-0 rounded-full transition-colors"
                                :class="form.notifyOnComment ? 'bg-cyan-500' : 'bg-surface-sunken'"
                                @click="form.notifyOnComment = !form.notifyOnComment"
                            >
                                <span
                                    class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                                    :class="form.notifyOnComment ? 'translate-x-4' : ''"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- QR Code Panel -->
            <div v-if="showQr" class="glass-card p-6 text-center">
                <div class="mx-auto inline-block rounded-xl bg-white p-4">
                    <canvas ref="qrCanvas" />
                </div>
                <div class="mt-3">
                    <button
                        class="text-primary-400 hover:text-primary-300 text-[12px]"
                        @click="downloadQr"
                    >
                        {{ $t("userProfile.downloadQr") }}
                    </button>
                </div>
            </div>

            <!-- Profile Form -->
            <div class="glass-card space-y-6 p-6">
                <h2 class="text-fg text-[15px] font-semibold">
                    {{ $t("userProfile.editProfile") }}
                </h2>

                <!-- Avatar -->
                <div class="flex items-center gap-4">
                    <div
                        class="from-primary-500/20 to-primary-700/20 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br ring-1 ring-white/10"
                    >
                        <img
                            v-if="profile.hasAvatar"
                            :src="`${apiBase}/api/public/users/${profile.slug}/avatar`"
                            class="h-16 w-16 rounded-full object-cover"
                            alt="Avatar"
                        />
                        <Icon v-else name="lucide:user" class="text-fg-faint h-8 w-8" />
                    </div>
                    <div class="flex gap-2">
                        <label
                            class="bg-primary-500 hover:bg-primary-400 cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-medium text-white transition-colors"
                        >
                            {{ $t("userProfile.uploadAvatar") }}
                            <input
                                type="file"
                                accept="image/*"
                                class="hidden"
                                @change="handleAvatarUpload"
                            />
                        </label>
                        <button
                            v-if="profile.hasAvatar"
                            class="border-line text-fg-dim hover:bg-surface-hover rounded-lg border px-3 py-1.5 text-[12px] transition-colors"
                            @click="handleRemoveAvatar"
                        >
                            {{ $t("userProfile.removeAvatar") }}
                        </button>
                    </div>
                </div>

                <!-- Slug -->
                <div>
                    <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                        {{ $t("userProfile.slug") }}
                    </label>
                    <div class="flex gap-2">
                        <input
                            v-model="form.slug"
                            type="text"
                            class="bg-surface-sunken border-line text-fg flex-1 rounded-xl border px-3 py-2 text-[13px]"
                        />
                    </div>
                    <p class="text-fg-faint mt-1 text-[11px]">
                        {{ $t("userProfile.slugHint", { slug: form.slug }) }}
                    </p>
                </div>

                <!-- Tagline -->
                <div>
                    <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                        {{ $t("userProfile.tagline") }}
                    </label>
                    <input
                        v-model="form.tagline"
                        type="text"
                        maxlength="100"
                        :placeholder="$t('userProfile.taglinePlaceholder')"
                        class="bg-surface-sunken border-line text-fg w-full rounded-xl border px-3 py-2 text-[13px]"
                    />
                </div>

                <!-- Bio -->
                <div>
                    <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                        {{ $t("userProfile.bio") }}
                    </label>
                    <textarea
                        v-model="form.bio"
                        maxlength="1000"
                        rows="4"
                        :placeholder="$t('userProfile.bioPlaceholder')"
                        class="bg-surface-sunken border-line text-fg w-full rounded-xl border px-3 py-2 text-[13px]"
                    />
                    <p class="text-fg-faint mt-1 text-right text-[11px]">
                        {{ (form.bio || "").length }}/1000
                    </p>
                </div>

                <!-- Location (only when showLocation) -->
                <div v-if="form.showLocation">
                    <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                        {{ $t("userProfile.location") }}
                    </label>
                    <input
                        v-model="form.location"
                        type="text"
                        maxlength="100"
                        :placeholder="$t('userProfile.locationPlaceholder')"
                        class="bg-surface-sunken border-line text-fg w-full rounded-xl border px-3 py-2 text-[13px]"
                    />
                </div>

                <!-- Keeper Since (only when showKeeperSince) -->
                <div v-if="form.showKeeperSince">
                    <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                        {{ $t("userProfile.keeperSince") }}
                    </label>
                    <input
                        v-model="form.keeperSince"
                        type="date"
                        class="bg-surface-sunken border-line text-fg rounded-xl border px-3 py-2 text-[13px]"
                    />
                </div>
            </div>

            <!-- Theme Preview -->
            <div class="glass-card space-y-4 p-6">
                <h2 class="text-fg text-[15px] font-semibold">
                    {{ $t("userProfile.themePreset") }}
                </h2>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="theme in themePresets"
                        :key="theme"
                        class="rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors"
                        :class="
                            form.themePreset === theme
                                ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                : 'border-line text-fg-dim hover:bg-surface-hover'
                        "
                        @click="form.themePreset = theme"
                    >
                        <span
                            class="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                            :style="{ background: themeAccentColor(theme) }"
                        />
                        {{ $t(`userProfile.themes.${theme}`) }}
                    </button>
                </div>

                <!-- Live Mini Preview -->
                <div
                    class="public-page-bg relative overflow-hidden rounded-xl border border-white/10"
                    :class="`theme-${form.themePreset}`"
                    style="min-height: auto; height: 180px"
                >
                    <div class="relative z-10 flex h-full items-center justify-center p-4">
                        <div class="profile-hero-card w-full max-w-sm p-4">
                            <div class="relative z-10 flex items-center gap-3">
                                <div
                                    class="bg-surface-raised flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/10"
                                >
                                    <Icon name="lucide:user" class="text-fg-faint h-5 w-5" />
                                </div>
                                <div>
                                    <p class="text-fg text-[13px] font-semibold">
                                        {{
                                            authStore.user?.displayName ||
                                            authStore.user?.username ||
                                            "Keeper"
                                        }}
                                    </p>
                                    <p v-if="form.tagline" class="text-fg-muted text-[11px] italic">
                                        {{ form.tagline }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Social Links (only when showSocialLinks) -->
            <div v-if="form.showSocialLinks" class="glass-card space-y-4 p-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-fg text-[15px] font-semibold">
                        {{ $t("userProfile.socialLinks") }}
                    </h2>
                    <button
                        v-if="socialLinks.length < 10"
                        class="text-primary-400 hover:text-primary-300 text-[12px]"
                        @click="addSocialLink"
                    >
                        + {{ $t("userProfile.addSocialLink") }}
                    </button>
                </div>
                <div
                    v-for="(link, i) in socialLinks"
                    :key="i"
                    class="border-line flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center"
                >
                    <select
                        v-model="link.platform"
                        class="bg-surface-sunken border-line text-fg rounded-lg border px-2 py-1.5 text-[12px]"
                    >
                        <option v-for="p in platforms" :key="p" :value="p">
                            {{ p }}
                        </option>
                    </select>
                    <input
                        v-model="link.url"
                        type="url"
                        :placeholder="$t('userProfile.url')"
                        class="bg-surface-sunken border-line text-fg flex-1 rounded-lg border px-2 py-1.5 text-[12px]"
                    />
                    <input
                        v-model="link.label"
                        type="text"
                        :placeholder="$t('userProfile.label')"
                        class="bg-surface-sunken border-line text-fg w-32 rounded-lg border px-2 py-1.5 text-[12px]"
                    />
                    <button
                        class="p-1 text-red-400 hover:text-red-300"
                        @click="socialLinks.splice(i, 1)"
                    >
                        <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <!-- Badges (only when showBadges) -->
            <div v-if="form.showBadges" class="glass-card space-y-4 p-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-fg text-[15px] font-semibold">
                        {{ $t("badges.title") }}
                    </h2>
                    <button
                        class="text-primary-400 hover:text-primary-300 text-[12px]"
                        :disabled="isCheckingBadges"
                        @click="handleCheckBadges"
                    >
                        {{ $t("badges.checkNew") }}
                    </button>
                </div>
                <div v-if="badges.length === 0" class="text-fg-faint text-[13px]">
                    {{ $t("badges.noNewBadges") }}
                </div>
                <div v-else class="flex flex-wrap gap-3">
                    <div
                        v-for="ub in badges"
                        :key="ub.badge.key"
                        class="border-line flex items-center gap-2 rounded-xl border px-3 py-2"
                    >
                        <Icon :name="ub.badge.icon" class="text-primary-400 h-5 w-5" />
                        <div>
                            <p class="text-fg text-[12px] font-medium">
                                {{ $t(ub.badge.nameKey) }}
                            </p>
                            <p class="text-fg-faint text-[11px]">
                                {{ $t(ub.badge.descKey) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pending Comments -->
            <div v-if="pendingComments.length > 0" class="glass-card space-y-4 p-6">
                <h2 class="text-fg text-[15px] font-semibold">
                    {{ $t("community.pendingComments") }}
                    <span
                        class="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400"
                    >
                        {{ pendingComments.length }}
                    </span>
                </h2>
                <div
                    v-for="comment in pendingComments"
                    :key="comment.id"
                    class="border-line rounded-xl border p-4"
                >
                    <div class="flex items-center justify-between">
                        <span class="text-fg text-[13px] font-medium">
                            {{ comment.authorName }}
                        </span>
                        <span class="text-fg-faint text-[11px]">
                            {{ new Date(comment.createdAt).toLocaleDateString() }}
                        </span>
                    </div>
                    <p class="text-fg-muted mt-1 text-[13px]">{{ comment.content }}</p>
                </div>
            </div>

            <!-- Comment Management -->
            <div v-if="approvedComments.length > 0" class="glass-card space-y-4 p-6">
                <h2 class="text-fg text-[15px] font-semibold">
                    {{ $t("community.comments") }}
                    <span
                        class="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] text-green-400"
                    >
                        {{ approvedComments.length }}
                    </span>
                </h2>
                <div
                    v-for="comment in approvedComments"
                    :key="comment.id"
                    class="border-line rounded-xl border p-4"
                >
                    <div class="flex items-center justify-between">
                        <span class="text-fg text-[13px] font-medium">
                            {{ comment.authorName }}
                        </span>
                        <div class="flex items-center gap-2">
                            <span class="text-fg-faint text-[11px]">
                                {{ new Date(comment.createdAt).toLocaleDateString() }}
                            </span>
                            <button
                                class="text-red-400/60 transition-colors hover:text-red-400"
                                :title="$t('community.deleteComment')"
                                @click="handleDeleteComment(comment.id)"
                            >
                                <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    <p class="text-fg-muted mt-1 text-[13px]">{{ comment.content }}</p>
                </div>
            </div>

            <!-- Save / Delete -->
            <div class="flex items-center justify-between">
                <button class="text-[13px] text-red-400 hover:text-red-300" @click="handleDelete">
                    {{ $t("userProfile.deleteProfile") }}
                </button>
                <button
                    class="bg-primary-500 hover:bg-primary-400 rounded-xl px-6 py-2.5 text-[13px] font-medium text-white transition-colors"
                    :disabled="isSaving"
                    @click="handleSave"
                >
                    {{ $t("common.save") }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ["feature-gate"],
    requiredFeature: "user_public_profiles",
});

const { t } = useI18n();
const { get, post, patch, del, put } = useApi();
const toast = useAppToast();
const authStore = useAuthStore();
const config = useRuntimeConfig();
const apiBase = config.public.apiBaseURL as string;

const themePresets = ["default", "ocean", "forest", "sunset", "midnight", "desert", "arctic"];
const platforms = [
    "instagram",
    "youtube",
    "tiktok",
    "twitter",
    "facebook",
    "website",
    "discord",
    "custom",
];

const visibilityToggles = [
    { key: "showStats" as const, label: "showStats" },
    { key: "showPets" as const, label: "showPets" },
    { key: "showSocialLinks" as const, label: "showSocialLinks" },
    { key: "showLocation" as const, label: "showLocation" },
    { key: "showKeeperSince" as const, label: "showKeeperSince" },
    { key: "showBadges" as const, label: "showBadges" },
];

// ─── State ───────────────────────────────────────────────────

const isLoading = ref(true);
const isCreating = ref(false);
const isSaving = ref(false);
const isCheckingBadges = ref(false);
const showQr = ref(false);
const showVisibility = ref(false);
const qrCanvas = ref<HTMLCanvasElement | null>(null);
const createSlug = ref("");

const profile = ref<{
    slug: string;
    active: boolean;
    bio: string | null;
    tagline: string | null;
    location: string | null;
    keeperSince: string | null;
    hasAvatar: boolean;
    avatarUploadId: string | null;
    themePreset: string;
    views: number;
    showStats: boolean;
    showPets: boolean;
    showSocialLinks: boolean;
    showLocation: boolean;
    showKeeperSince: boolean;
    showBadges: boolean;
    notifyOnComment: boolean;
    petOrder: Array<{
        petId: string;
        petName: string;
        hasPublicProfile: boolean;
        sortOrder: number;
    }>;
} | null>(null);

const form = reactive({
    slug: "",
    active: false,
    bio: "" as string | null,
    tagline: "" as string | null,
    location: "" as string | null,
    keeperSince: "" as string | null,
    themePreset: "default",
    showStats: true,
    showPets: true,
    showSocialLinks: true,
    showLocation: true,
    showKeeperSince: true,
    showBadges: true,
    notifyOnComment: false,
});

const socialLinks = ref<Array<{ platform: string; url: string; label: string }>>([]);
const badges = ref<
    Array<{ badge: { key: string; nameKey: string; descKey: string; icon: string } }>
>([]);
const approvedComments = ref<
    Array<{ id: string; authorName: string; content: string; createdAt: string }>
>([]);
const pendingComments = ref<
    Array<{ id: string; authorName: string; content: string; createdAt: string }>
>([]);

const THEME_COLORS: Record<string, string> = {
    default: "rgb(138, 156, 74)",
    ocean: "rgb(56, 189, 248)",
    forest: "rgb(34, 197, 94)",
    sunset: "rgb(251, 146, 60)",
    midnight: "rgb(139, 92, 246)",
    desert: "rgb(245, 158, 11)",
    arctic: "rgb(186, 230, 253)",
};

function themeAccentColor(theme: string): string {
    return THEME_COLORS[theme] ?? THEME_COLORS.default;
}

// ─── Load Profile ────────────────────────────────────────────

async function loadProfile() {
    isLoading.value = true;
    try {
        const res = await get<typeof profile.value>("/api/user-profile");
        profile.value = res;
        if (res) {
            syncFormFromProfile(res);
        }
    } catch {
        profile.value = null;
    }
    isLoading.value = false;
}

function syncFormFromProfile(p: NonNullable<typeof profile.value>) {
    form.slug = p.slug;
    form.active = p.active;
    form.bio = p.bio;
    form.tagline = p.tagline;
    form.location = p.location;
    form.keeperSince = p.keeperSince ? p.keeperSince.split("T")[0] : null;
    form.themePreset = p.themePreset;
    form.showStats = p.showStats;
    form.showPets = p.showPets;
    form.showSocialLinks = p.showSocialLinks;
    form.showLocation = p.showLocation;
    form.showKeeperSince = p.showKeeperSince;
    form.showBadges = p.showBadges;
    form.notifyOnComment = p.notifyOnComment;
}

async function loadBadges() {
    try {
        const res = await get<typeof badges.value>("/api/badges");
        badges.value = res ?? [];
    } catch {
        badges.value = [];
    }
}

async function loadApprovedComments() {
    try {
        const res = await get<typeof approvedComments.value>("/api/comments/approved");
        approvedComments.value = res ?? [];
    } catch {
        approvedComments.value = [];
    }
}

async function loadPendingComments() {
    try {
        const res = await get<typeof pendingComments.value>("/api/comments/pending");
        pendingComments.value = res ?? [];
    } catch {
        pendingComments.value = [];
    }
}

async function loadSocialLinks() {
    // Loaded as part of the profile, but if we need separate:
    // Social links come from the profile GET already
}

onMounted(async () => {
    await loadProfile();
    await Promise.all([loadBadges(), loadApprovedComments(), loadPendingComments()]);
});

// ─── Actions ─────────────────────────────────────────────────

async function handleCreate() {
    isCreating.value = true;
    try {
        const body: Record<string, string> = {};
        if (createSlug.value) body.slug = createSlug.value.toLowerCase();

        await post("/api/user-profile", body);
        toast.success(t("userProfile.created"));
        await loadProfile();
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
    isCreating.value = false;
}

async function handleSave() {
    isSaving.value = true;
    try {
        await patch("/api/user-profile", {
            slug: form.slug,
            active: form.active,
            bio: form.bio || null,
            tagline: form.tagline || null,
            location: form.location || null,
            keeperSince: form.keeperSince || null,
            themePreset: form.themePreset,
            showStats: form.showStats,
            showPets: form.showPets,
            showSocialLinks: form.showSocialLinks,
            showLocation: form.showLocation,
            showKeeperSince: form.showKeeperSince,
            showBadges: form.showBadges,
            notifyOnComment: form.notifyOnComment,
        });

        // Save social links
        await put("/api/user-profile/social-links", {
            links: socialLinks.value.filter((l) => l.url),
        });

        toast.success(t("userProfile.saved"));
        await loadProfile();
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
    isSaving.value = false;
}

async function handleDelete() {
    if (!confirm(t("userProfile.deleteConfirm"))) return;
    try {
        await del("/api/user-profile");
        profile.value = null;
        toast.success(t("userProfile.deleted"));
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
}

async function handleAvatarUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await post<{ id: string }>("/api/user-profile/avatar", formData);
        toast.success(t("userProfile.saved"));
        await loadProfile();
    } catch (err: unknown) {
        toast.error((err as Error).message);
    }
}

async function handleRemoveAvatar() {
    try {
        await del("/api/user-profile/avatar");
        toast.success(t("userProfile.saved"));
        await loadProfile();
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
}

function addSocialLink() {
    socialLinks.value.push({ platform: "website", url: "", label: "" });
}

async function handleCheckBadges() {
    isCheckingBadges.value = true;
    try {
        const res = await post<{ newBadges: string[]; badges: typeof badges.value }>(
            "/api/badges/check",
            {},
        );
        badges.value = res?.badges ?? [];
        const count = res?.newBadges?.length ?? 0;
        if (count > 0) {
            toast.success(t("badges.newBadgesEarned", { count }));
        } else {
            toast.info(t("badges.noNewBadges"));
        }
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
    isCheckingBadges.value = false;
}

async function handleDeleteComment(commentId: string) {
    if (!confirm(t("community.deleteConfirm"))) return;
    try {
        await del(`/api/comments/${commentId}`);
        toast.success(t("community.commentDeleted"));
        await loadApprovedComments();
    } catch (e: unknown) {
        toast.error((e as Error).message);
    }
}

function copyProfileLink() {
    if (!profile.value) return;
    const url = `${window.location.origin}/keeper/${profile.value.slug}`;
    navigator.clipboard.writeText(url);
    toast.success(t("userProfile.linkCopied"));
}

function copyEmbedCode() {
    if (!profile.value) return;
    const url = `${window.location.origin}/keeper/${profile.value.slug}/embed`;
    const code = `<iframe src="${url}" width="400" height="600" frameborder="0" style="border-radius:12px;"></iframe>`;
    navigator.clipboard.writeText(code);
    toast.success(t("userProfile.embedCopied"));
}

async function downloadQr() {
    if (!qrCanvas.value) return;
    const link = document.createElement("a");
    link.download = `keeperlog-${profile.value?.slug || "profile"}-qr.png`;
    link.href = qrCanvas.value.toDataURL("image/png");
    link.click();
}

// Generate QR code when panel opens
watch(showQr, async (val) => {
    if (!val || !profile.value) return;
    await nextTick();
    if (!qrCanvas.value) return;

    const url = `${window.location.origin}/keeper/${profile.value.slug}`;
    try {
        const QRCode = await import("qrcode");
        QRCode.toCanvas(qrCanvas.value, url, {
            width: 200,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
        });
    } catch {
        // qrcode package not available — show text fallback
    }
});
</script>
