<template>
    <div class="public-page-bg bg-base" :class="themeClass">
        <LayoutGuestControls variant="dark" />

        <!-- Loading -->
        <div v-if="loading" class="flex min-h-dvh items-center justify-center">
            <Icon name="lucide:loader-2" class="text-fg-faint h-8 w-8 animate-spin" />
        </div>

        <!-- Not Found -->
        <div
            v-else-if="!userData"
            class="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 text-center"
        >
            <Icon name="lucide:shield-x" class="text-fg-faint mb-4 h-16 w-16" />
            <h1 class="text-fg mb-2 text-2xl font-bold">{{ $t("publicProfile.notFound") }}</h1>
            <p class="text-fg-muted text-sm">{{ $t("publicProfile.notFoundHint") }}</p>
            <NuxtLink to="/" class="text-primary-400 mt-6 text-sm font-medium">
                {{ $t("publicProfile.backToHome") }}
            </NuxtLink>
        </div>

        <!-- Profile -->
        <div v-else class="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
            <!-- Hero -->
            <div class="profile-hero-card animate-fade-in-up mb-8 p-6 sm:p-8">
                <div
                    class="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-start"
                >
                    <img
                        v-if="userData.hasAvatar"
                        :src="avatarUrl"
                        :alt="userData.displayName"
                        class="h-28 w-28 rounded-full object-cover shadow-xl ring-2 shadow-black/20 ring-white/10 sm:h-32 sm:w-32"
                    />
                    <div
                        v-else
                        class="bg-surface-raised flex h-28 w-28 items-center justify-center rounded-full shadow-xl ring-2 shadow-black/20 ring-white/10 sm:h-32 sm:w-32"
                    >
                        <Icon name="lucide:user" class="text-fg-faint h-10 w-10" />
                    </div>
                    <div class="min-w-0 flex-1 text-center sm:pt-1 sm:text-left">
                        <h1 class="text-fg text-2xl font-bold tracking-tight sm:text-3xl">
                            {{ userData.displayName || userData.username }}
                        </h1>
                        <p v-if="userData.tagline" class="text-fg-muted mt-1 text-sm italic">
                            {{ userData.tagline }}
                        </p>
                        <div
                            class="text-fg-muted mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:justify-start"
                        >
                            <span v-if="userData.location" class="flex items-center gap-1">
                                <Icon name="lucide:map-pin" class="h-3.5 w-3.5" />
                                {{ userData.location }}
                            </span>
                            <span v-if="userData.keeperSince" class="flex items-center gap-1">
                                <Icon name="lucide:calendar" class="h-3.5 w-3.5" />
                                {{
                                    $t("userProfile.keeperSinceLabel", {
                                        date: keeperSinceFormatted,
                                    })
                                }}
                            </span>
                        </div>
                        <p
                            v-if="userData.bio"
                            class="text-fg-muted mt-3 text-sm leading-relaxed whitespace-pre-line"
                        >
                            {{ userData.bio }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <section v-if="userData.stats" class="animate-fade-in-up mb-8 delay-100">
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div
                        v-for="stat in statsItems"
                        :key="stat.label"
                        class="public-card rounded-xl p-4 text-center"
                    >
                        <Icon :name="stat.icon" class="text-primary-400 mx-auto mb-1 h-5 w-5" />
                        <p class="text-fg text-xl font-bold">{{ stat.value }}</p>
                        <p class="text-fg-faint text-xs">{{ stat.label }}</p>
                    </div>
                </div>
            </section>

            <!-- Badges -->
            <section v-if="userData.badges.length" class="animate-fade-in-up mb-8 delay-150">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:award" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("badges.title") }}
                </h2>
                <div class="flex flex-wrap gap-2">
                    <div
                        v-for="badge in userData.badges"
                        :key="badge.key"
                        class="public-card flex items-center gap-2 rounded-xl px-3 py-2"
                    >
                        <Icon :name="badge.icon" class="text-primary-400 h-4 w-4" />
                        <span class="text-fg text-xs font-medium">{{ $t(badge.nameKey) }}</span>
                    </div>
                </div>
            </section>

            <!-- Pets -->
            <section v-if="userData.pets.length" class="animate-fade-in-up mb-8 delay-200">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:paw-print" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("userProfile.petsSection") }}
                </h2>
                <div class="grid gap-4 sm:grid-cols-2">
                    <NuxtLink
                        v-for="pet in userData.pets"
                        :key="pet.id"
                        :to="pet.petSlug ? `/keeper/${userData.slug}/p/${pet.petSlug}` : undefined"
                        class="public-card group flex items-center gap-4 rounded-xl p-4 transition-all"
                        :class="
                            pet.petSlug ? 'cursor-pointer hover:ring-1 hover:ring-white/20' : ''
                        "
                    >
                        <img
                            v-if="pet.profilePhotoId"
                            :src="petPhotoUrl(pet)"
                            :alt="pet.name"
                            class="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10"
                            loading="lazy"
                        />
                        <div
                            v-else
                            class="bg-surface-sunken flex h-16 w-16 items-center justify-center rounded-xl ring-1 ring-white/10"
                        >
                            <Icon name="lucide:paw-print" class="text-fg-faint h-6 w-6" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-fg font-semibold">{{ pet.name }}</p>
                            <p v-if="pet.species" class="text-fg-muted text-xs">
                                {{ pet.species }}
                                <span v-if="pet.morph" class="text-fg-faint"
                                    >· {{ pet.morph }}</span
                                >
                            </p>
                            <p v-if="pet.bio" class="text-fg-faint mt-1 line-clamp-1 text-xs">
                                {{ pet.bio }}
                            </p>
                        </div>
                        <Icon
                            v-if="pet.petSlug"
                            name="lucide:chevron-right"
                            class="text-fg-faint h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        />
                    </NuxtLink>
                </div>
            </section>

            <!-- Social Links -->
            <section v-if="userData.socialLinks.length" class="animate-fade-in-up mb-8 delay-300">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:link" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("userProfile.socialLinks") }}
                </h2>
                <div class="flex flex-wrap gap-2">
                    <a
                        v-for="link in userData.socialLinks"
                        :key="link.url"
                        :href="link.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="public-card flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all hover:ring-1 hover:ring-white/20"
                    >
                        <Icon :name="socialIcon(link.platform)" class="h-4 w-4" />
                        <span class="text-fg text-sm font-medium">
                            {{ link.label || link.platform }}
                        </span>
                    </a>
                </div>
            </section>

            <!-- Like + Comment Section -->
            <section class="animate-fade-in-up mb-8 delay-400">
                <div class="flex items-center gap-4">
                    <button
                        class="public-card flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all hover:ring-1 hover:ring-white/20"
                        :disabled="liking"
                        :aria-label="liked ? $t('community.unlike') : $t('community.like')"
                        @click="handleToggleLike"
                    >
                        <Icon
                            :name="liked ? 'lucide:heart' : 'lucide:heart'"
                            class="h-5 w-5 transition-colors"
                            :class="liked ? 'text-red-400' : 'text-fg-faint'"
                        />
                        <span class="text-fg text-sm">{{ likeCount }}</span>
                    </button>
                </div>
            </section>

            <!-- Comments -->
            <section class="animate-fade-in-up mb-8 delay-500">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:message-circle" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("community.comments") }}
                </h2>

                <!-- Add Comment -->
                <div class="public-card mb-4 rounded-xl p-4">
                    <template v-if="authStore.isAuthenticated">
                        <div class="text-fg-faint mb-2 flex items-center gap-2 text-xs">
                            <Icon name="lucide:user" class="h-3.5 w-3.5" />
                            {{
                                $t("community.commentingAs", {
                                    name: authStore.user?.displayName || authStore.user?.username,
                                })
                            }}
                        </div>
                        <textarea
                            v-model="commentText"
                            :placeholder="$t('community.writePlaceholder')"
                            rows="2"
                            maxlength="500"
                            class="bg-surface-sunken border-line text-fg w-full rounded-lg border px-3 py-2 text-sm"
                        />
                        <div class="mt-2 flex justify-end">
                            <button
                                class="bg-primary-500 hover:bg-primary-400 rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                                :disabled="!commentText.trim() || submittingComment"
                                @click="handleAddComment"
                            >
                                {{ $t("community.send") }}
                            </button>
                        </div>
                    </template>
                    <div v-else class="flex items-center justify-between">
                        <p class="text-fg-faint text-sm">{{ $t("community.loginToComment") }}</p>
                        <NuxtLink
                            :to="`/login?redirect=${encodeURIComponent($route.fullPath)}`"
                            class="bg-primary-500 hover:bg-primary-400 rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-colors"
                        >
                            {{ $t("community.login") }}
                        </NuxtLink>
                    </div>
                </div>

                <!-- Comment List -->
                <div v-if="comments.length" class="space-y-3">
                    <div
                        v-for="comment in comments"
                        :key="comment.id"
                        class="public-card rounded-xl px-4 py-3"
                    >
                        <div class="flex items-center justify-between">
                            <span class="text-fg text-sm font-medium">{{
                                comment.authorName
                            }}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-fg-faint text-xs">
                                    {{ new Date(comment.createdAt).toLocaleDateString() }}
                                </span>
                                <button
                                    v-if="
                                        authStore.isAuthenticated &&
                                        authStore.user?.id === comment.authorId
                                    "
                                    class="text-fg-faint transition-colors hover:text-red-400"
                                    :disabled="deletingCommentId === comment.id"
                                    :aria-label="$t('community.deleteComment')"
                                    @click="handleDeleteOwnComment(comment.id)"
                                >
                                    <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                                </button>
                                <button
                                    class="text-fg-faint transition-colors hover:text-red-400"
                                    :aria-label="$t('report.reportComment')"
                                    @click="openReportModal('comment', comment.id)"
                                >
                                    <Icon name="lucide:flag" class="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                        <p class="text-fg-muted mt-1 text-sm">{{ comment.content }}</p>
                    </div>
                </div>
                <p v-else class="text-fg-faint text-sm">{{ $t("community.noComments") }}</p>
            </section>

            <!-- Report Profile Button -->
            <section class="animate-fade-in-up mb-8 delay-500">
                <button
                    class="text-fg-faint flex items-center gap-1.5 text-xs transition-colors hover:text-red-400"
                    @click="openReportModal('user_profile', slug)"
                >
                    <Icon name="lucide:flag" class="h-3.5 w-3.5" />
                    {{ $t("report.reportProfile") }}
                </button>
            </section>

            <!-- Footer -->
            <footer
                class="animate-fade-in-up border-line-faint border-t pt-8 text-center delay-500"
            >
                <div class="public-card inline-flex items-center gap-1.5 rounded-full px-5 py-2.5">
                    <Icon name="lucide:paw-print" class="text-primary-400 h-3.5 w-3.5" />
                    <span class="text-fg-faint text-xs">{{ $t("publicProfile.poweredBy") }}</span>
                    <NuxtLink
                        to="/"
                        class="text-primary-400 hover:text-primary-300 text-xs font-semibold tracking-tight transition-colors"
                    >
                        KeeperLog
                    </NuxtLink>
                </div>
            </footer>
        </div>

        <!-- Report Modal -->
        <ReportModal
            :open="reportModalOpen"
            :target-type="reportTarget.type"
            :target-id="reportTarget.id"
            :target-url="reportTarget.url"
            @close="reportModalOpen = false"
            @submitted="reportModalOpen = false"
        />
    </div>
</template>

<script setup lang="ts">
interface PublicUserData {
    slug: string;
    displayName: string | null;
    username: string;
    bio: string | null;
    tagline: string | null;
    location: string | null;
    keeperSince: string | null;
    hasAvatar: boolean;
    themePreset: string;
    views: number;
    createdAt: string;
    socialLinks: Array<{ platform: string; url: string; label: string | null }>;
    stats: {
        petCount: number;
        totalPhotos: number;
        totalFeedings: number;
        totalWeightRecords: number;
    } | null;
    badges: Array<{ key: string; nameKey: string; icon: string; earnedAt: string }>;
    pets: Array<{
        id: string;
        name: string;
        species: string;
        morph: string | null;
        profilePhotoId: string | null;
        petSlug: string | null;
        bio: string | null;
    }>;
}

definePageMeta({ layout: false });

const route = useRoute();
const { t } = useI18n();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const slug = route.params.slug as string;

const apiBase = config.public.apiBaseURL;

const loading = ref(true);
const userData = ref<PublicUserData | null>(null);
const liked = ref(false);
const likeCount = ref(0);
const liking = ref(false);
const submittingComment = ref(false);
const commentText = ref("");
const deletingCommentId = ref<string | null>(null);

const comments = ref<
    Array<{
        id: string;
        authorId: string | null;
        authorName: string;
        content: string;
        createdAt: string;
    }>
>([]);

// ─── Report Modal ────────────────────────────────────────
const reportModalOpen = ref(false);
const reportTarget = reactive({
    type: "comment" as "comment" | "user_profile" | "pet_profile",
    id: "",
    url: "",
});

function openReportModal(type: "comment" | "user_profile" | "pet_profile", id: string) {
    reportTarget.type = type;
    reportTarget.id = id;
    reportTarget.url = window.location.href;
    reportModalOpen.value = true;
}

// ─── Fetch Data ──────────────────────────────────────────

async function fetchProfile() {
    try {
        const res = await fetch(`${apiBase}/api/public/users/${encodeURIComponent(slug)}`);
        if (!res.ok) {
            userData.value = null;
            return;
        }
        const json = await res.json();
        if (json.success) {
            userData.value = json.data;
        }
    } catch {
        userData.value = null;
    } finally {
        loading.value = false;
    }
}

async function fetchLikeStatus() {
    try {
        const res = await fetch(
            `${apiBase}/api/public/community/user/${encodeURIComponent(slug)}/like`,
        );
        if (res.ok) {
            const json = await res.json();
            if (json.success) {
                liked.value = json.data.liked;
                likeCount.value = json.data.count;
            }
        }
    } catch {
        // Ignore
    }
}

async function fetchComments() {
    try {
        const res = await fetch(
            `${apiBase}/api/public/community/user/${encodeURIComponent(slug)}/comments`,
        );
        if (res.ok) {
            const json = await res.json();
            if (json.success) {
                comments.value = json.data;
            }
        }
    } catch {
        // Ignore
    }
}

onMounted(async () => {
    if (!authStore.isAuthenticated) {
        await authStore.init();
    }
    await fetchProfile();
    await Promise.all([fetchLikeStatus(), fetchComments()]);
});

// ─── Actions ─────────────────────────────────────────────

async function handleToggleLike() {
    if (liking.value) return;
    liking.value = true;
    try {
        const res = await fetch(
            `${apiBase}/api/public/community/user/${encodeURIComponent(slug)}/like`,
            {
                method: "POST",
            },
        );
        if (res.ok) {
            const json = await res.json();
            if (json.success) {
                liked.value = json.data.liked;
                likeCount.value = json.data.count;
            }
        }
    } catch {
        // Ignore
    } finally {
        liking.value = false;
    }
}

async function handleAddComment() {
    if (!commentText.value.trim() || !authStore.isAuthenticated) return;
    submittingComment.value = true;
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authStore.accessToken) {
            headers.Authorization = `Bearer ${authStore.accessToken}`;
        }
        const res = await fetch(
            `${apiBase}/api/public/community/user/${encodeURIComponent(slug)}/comments`,
            {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify({
                    content: commentText.value.trim(),
                }),
            },
        );
        if (res.ok) {
            commentText.value = "";
            await fetchComments();
        }
    } catch {
        // Ignore
    } finally {
        submittingComment.value = false;
    }
}

async function handleDeleteOwnComment(commentId: string) {
    deletingCommentId.value = commentId;
    try {
        const headers: Record<string, string> = {};
        if (authStore.accessToken) {
            headers.Authorization = `Bearer ${authStore.accessToken}`;
        }
        const res = await fetch(
            `${apiBase}/api/public/community/user/${encodeURIComponent(slug)}/comments/${commentId}`,
            {
                method: "DELETE",
                headers,
                credentials: "include",
            },
        );
        if (res.ok) {
            await fetchComments();
        }
    } catch {
        // Ignore
    } finally {
        deletingCommentId.value = null;
    }
}

// ─── Computed ────────────────────────────────────────────

const avatarUrl = computed(() => `${apiBase}/api/public/users/${encodeURIComponent(slug)}/avatar`);

const themeClass = computed(() => (userData.value ? `theme-${userData.value.themePreset}` : ""));

const keeperSinceFormatted = computed(() => {
    if (!userData.value?.keeperSince) return "";
    return new Date(userData.value.keeperSince).toLocaleDateString();
});

const statsItems = computed(() => {
    const s = userData.value?.stats;
    if (!s) return [];
    return [
        { icon: "lucide:paw-print", value: s.petCount, label: t("userProfile.statPets") },
        { icon: "lucide:image", value: s.totalPhotos, label: t("userProfile.statPhotos") },
        { icon: "lucide:utensils", value: s.totalFeedings, label: t("userProfile.statFeedings") },
        { icon: "lucide:scale", value: s.totalWeightRecords, label: t("userProfile.statWeights") },
    ];
});

function socialIcon(platform: string): string {
    const map: Record<string, string> = {
        instagram: "lucide:instagram",
        youtube: "lucide:youtube",
        tiktok: "lucide:music",
        twitter: "lucide:twitter",
        facebook: "lucide:facebook",
        website: "lucide:globe",
        discord: "lucide:message-circle",
        custom: "lucide:link",
    };
    return map[platform] ?? "lucide:link";
}

function petPhotoUrl(pet: PublicUserData["pets"][number]): string {
    if (!pet.profilePhotoId || !pet.petSlug) return "";
    return `${apiBase}/api/public/pets/${encodeURIComponent(slug)}/${encodeURIComponent(pet.petSlug)}/photos/${pet.profilePhotoId}`;
}

// ─── SEO ─────────────────────────────────────────────────

useHead({
    title: () =>
        userData.value
            ? `${userData.value.displayName || userData.value.username} — KeeperLog`
            : "KeeperLog",
});

useSeoMeta({
    ogTitle: () => userData.value?.displayName || userData.value?.username || "KeeperLog",
    ogDescription: () => userData.value?.tagline || userData.value?.bio || "",
    ogImage: () => (userData.value?.hasAvatar ? avatarUrl.value : undefined),
    ogUrl: () => `${config.public.baseURL}/keeper/${encodeURIComponent(slug)}`,
    ogType: "profile",
    twitterCard: "summary_large_image",
});

useHead({
    script: [
        {
            type: "application/ld+json",
            innerHTML: () => {
                if (!userData.value) return "{}";
                const d = userData.value;
                return JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "ProfilePage",
                    mainEntity: {
                        "@type": "Person",
                        name: d.displayName || d.username,
                        url: `${config.public.baseURL}/keeper/${encodeURIComponent(slug)}`,
                        ...(d.hasAvatar ? { image: avatarUrl.value } : {}),
                        ...(d.tagline || d.bio ? { description: d.tagline || d.bio } : {}),
                        ...(d.location
                            ? { address: { "@type": "PostalAddress", addressLocality: d.location } }
                            : {}),
                    },
                });
            },
        },
    ],
});
</script>
