<template>
    <div class="public-page-bg bg-base">
        <LayoutGuestControls variant="dark" />

        <!-- Loading -->
        <div v-if="loading" class="flex min-h-dvh items-center justify-center">
            <Icon name="lucide:loader-2" class="text-fg-faint h-8 w-8 animate-spin" />
        </div>

        <!-- Not Found -->
        <div
            v-else-if="!petData"
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
            <!-- Back to User Profile -->
            <NuxtLink
                :to="`/keeper/${userSlug}`"
                class="text-primary-400 hover:text-primary-300 mb-6 inline-flex items-center gap-1 text-sm font-medium"
            >
                <Icon name="lucide:arrow-left" class="h-4 w-4" />
                {{ $t("publicProfile.backToKeeper") }}
            </NuxtLink>

            <!-- Hero Header Card -->
            <div class="profile-hero-card animate-fade-in-up mb-8 p-6 sm:p-8">
                <div class="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                    <img
                        v-if="profilePhotoUrl"
                        :src="profilePhotoUrl"
                        :alt="petData.name"
                        class="h-28 w-28 rounded-2xl object-cover shadow-xl ring-2 shadow-black/20 ring-white/10 sm:h-32 sm:w-32"
                    />
                    <div
                        v-else
                        class="bg-surface-raised flex h-28 w-28 items-center justify-center rounded-2xl shadow-xl ring-2 shadow-black/20 ring-white/10 sm:h-32 sm:w-32"
                    >
                        <Icon name="lucide:paw-print" class="text-fg-faint h-10 w-10" />
                    </div>
                    <div class="min-w-0 flex-1 text-center sm:pt-1 sm:text-left">
                        <h1 class="text-fg text-2xl font-bold tracking-tight sm:text-3xl">
                            {{ petData.name }}
                        </h1>
                        <div
                            class="text-fg-muted mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm sm:justify-start"
                        >
                            <span
                                v-if="petData.species"
                                class="bg-surface-raised rounded-full px-2.5 py-0.5 text-xs font-medium"
                            >
                                {{ petData.species }}
                            </span>
                            <span
                                v-if="petData.morph"
                                class="bg-surface-raised rounded-full px-2.5 py-0.5 text-xs font-medium"
                            >
                                {{ petData.morph }}
                            </span>
                            <span
                                v-if="petData.gender && petData.gender !== 'UNKNOWN'"
                                class="bg-surface-raised rounded-full px-2.5 py-0.5 text-xs font-medium"
                            >
                                {{ $t(`common.gender.${petData.gender}`) }}
                            </span>
                        </div>
                        <p v-if="age" class="text-fg-faint mt-2 text-sm">{{ age }}</p>
                        <p
                            v-if="petData.bio"
                            class="text-fg-muted mt-3 text-sm leading-relaxed whitespace-pre-line"
                        >
                            {{ petData.bio }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Photos Gallery -->
            <section v-if="petData.photos.length" class="animate-fade-in-up mb-8 delay-150">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:image" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("publicProfile.photos") }}
                </h2>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    <button
                        v-for="photo in petData.photos"
                        :key="photo.id"
                        class="group relative aspect-square overflow-hidden rounded-xl shadow-md ring-1 ring-white/10 transition-all hover:shadow-lg hover:ring-2 hover:ring-white/20"
                        @click="openLightbox(photo)"
                    >
                        <img
                            :src="photoUrl(photo.id)"
                            :alt="photo.caption || petData.name"
                            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div
                            v-if="photo.caption"
                            class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2.5"
                        >
                            <span class="text-xs font-medium text-white/90">{{ photo.caption }}</span>
                        </div>
                    </button>
                </div>
            </section>

            <!-- Weight Chart -->
            <section v-if="petData.weightRecords.length" class="animate-fade-in-up mb-8 delay-200">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:scale" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("publicProfile.weightHistory") }}
                </h2>
                <div class="public-card glow-brand rounded-xl p-5">
                    <div class="space-y-3">
                        <div class="flex items-baseline justify-between">
                            <span class="text-fg text-2xl font-bold">{{ latestWeight }}g</span>
                            <span
                                v-if="weightChange !== null"
                                :class="weightChange >= 0 ? 'text-green-400' : 'text-red-400'"
                                class="text-sm font-medium"
                            >
                                {{ weightChange >= 0 ? "+" : "" }}{{ weightChange.toFixed(1) }}g
                            </span>
                        </div>
                        <div class="flex h-20 items-end gap-0.5">
                            <div
                                v-for="(record, i) in weightSparkline"
                                :key="i"
                                class="bg-primary-500/50 hover:bg-primary-400/80 flex-1 rounded-t transition-all duration-200"
                                :style="{ height: `${record.pct}%` }"
                                :title="`${record.weight}g — ${new Date(record.date).toLocaleDateString()}`"
                            />
                        </div>
                        <p class="text-fg-faint text-xs">
                            {{ petData.weightRecords.length }} {{ $t("publicProfile.measurements") }}
                        </p>
                    </div>
                </div>
            </section>

            <!-- Recent Feedings -->
            <section v-if="petData.feedings.length" class="animate-fade-in-up mb-8 delay-300">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:utensils" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("publicProfile.recentFeedings") }}
                </h2>
                <div class="space-y-2">
                    <div
                        v-for="(feeding, i) in petData.feedings.slice(0, 10)"
                        :key="i"
                        class="public-card flex items-center justify-between rounded-xl px-4 py-3"
                    >
                        <div>
                            <span class="text-fg text-sm font-medium">
                                {{ feeding.feedItem || feeding.foodType }}
                            </span>
                            <span v-if="feeding.foodSize" class="text-fg-faint text-xs">
                                · {{ feeding.foodSize }}
                            </span>
                            <span v-if="feeding.quantity > 1" class="text-fg-faint text-xs">
                                × {{ feeding.quantity }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon
                                v-if="!feeding.accepted"
                                name="lucide:x-circle"
                                class="h-4 w-4 text-red-400"
                                :title="$t('publicProfile.feedingRefused')"
                            />
                            <span class="text-fg-faint text-xs">
                                {{ new Date(feeding.fedAt).toLocaleDateString() }}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Shedding History -->
            <section v-if="petData.sheddings.length" class="animate-fade-in-up mb-8 delay-400">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:layers" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("publicProfile.sheddingHistory") }}
                </h2>
                <div class="space-y-2">
                    <div
                        v-for="(shed, i) in petData.sheddings.slice(0, 10)"
                        :key="i"
                        class="public-card flex items-center justify-between rounded-xl px-4 py-3"
                    >
                        <div class="flex items-center gap-2">
                            <Icon
                                :name="shed.complete ? 'lucide:check-circle' : 'lucide:clock'"
                                :class="shed.complete ? 'text-green-400' : 'text-amber-400'"
                                class="h-4 w-4"
                            />
                            <span class="text-fg text-sm">
                                {{ new Date(shed.startedAt).toLocaleDateString() }}
                                <template v-if="shed.completedAt">
                                    → {{ new Date(shed.completedAt).toLocaleDateString() }}
                                </template>
                            </span>
                        </div>
                        <span
                            v-if="shed.quality"
                            class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                            {{ shed.quality }}
                        </span>
                    </div>
                </div>
            </section>

            <!-- Like + Comments -->
            <section class="animate-fade-in-up mb-8 delay-500">
                <div class="flex items-center gap-4">
                    <button
                        class="public-card flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all hover:ring-1 hover:ring-white/20"
                        :disabled="liking"
                        :aria-label="liked ? $t('community.unlike') : $t('community.like')"
                        @click="handleToggleLike"
                    >
                        <Icon
                            name="lucide:heart"
                            class="h-5 w-5 transition-colors"
                            :class="liked ? 'text-red-400' : 'text-fg-faint'"
                        />
                        <span class="text-fg text-sm">{{ likeCount }}</span>
                    </button>
                </div>
            </section>

            <section class="animate-fade-in-up mb-8 delay-500">
                <h2 class="section-heading text-fg mb-4 text-lg font-semibold">
                    <Icon name="lucide:message-circle" class="mr-1.5 inline h-4 w-4" />
                    {{ $t("community.comments") }}
                </h2>
                <div class="public-card mb-4 rounded-xl p-4">
                    <template v-if="authStore.isAuthenticated">
                        <div class="text-fg-faint mb-2 flex items-center gap-2 text-xs">
                            <Icon name="lucide:user" class="h-3.5 w-3.5" />
                            {{ $t("community.commentingAs", { name: authStore.user?.displayName || authStore.user?.username }) }}
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
                <div v-if="comments.length" class="space-y-3">
                    <div
                        v-for="comment in comments"
                        :key="comment.id"
                        class="public-card rounded-xl px-4 py-3"
                    >
                        <div class="flex items-center justify-between">
                            <span class="text-fg text-sm font-medium">{{ comment.authorName }}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-fg-faint text-xs">
                                    {{ new Date(comment.createdAt).toLocaleDateString() }}
                                </span>
                                <button
                                    v-if="authStore.isAuthenticated && authStore.user?.id === comment.authorId"
                                    class="text-fg-faint hover:text-red-400 transition-colors"
                                    :disabled="deletingCommentId === comment.id"
                                    :aria-label="$t('community.deleteComment')"
                                    @click="handleDeleteOwnComment(comment.id)"
                                >
                                    <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
                                </button>
                                <button
                                    class="text-fg-faint hover:text-red-400 transition-colors"
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
                    class="text-fg-faint hover:text-red-400 flex items-center gap-1.5 text-xs transition-colors"
                    @click="openReportModal('pet_profile', petSlug)"
                >
                    <Icon name="lucide:flag" class="h-3.5 w-3.5" />
                    {{ $t("report.reportProfile") }}
                </button>
            </section>

            <!-- Footer -->
            <footer class="animate-fade-in-up border-line-faint border-t pt-8 text-center delay-500">
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

        <!-- Lightbox -->
        <Teleport to="body">
            <div
                v-if="lightboxPhoto"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                @click.self="lightboxPhoto = null"
            >
                <button
                    class="absolute top-4 right-4 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:text-white active:bg-white/20"
                    @click="lightboxPhoto = null"
                >
                    <Icon name="lucide:x" class="h-6 w-6" />
                </button>
                <img
                    :src="photoUrl(lightboxPhoto.id)"
                    :alt="lightboxPhoto.caption || ''"
                    class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
                />
                <p
                    v-if="lightboxPhoto.caption"
                    class="absolute bottom-6 text-center text-sm text-white/80"
                >
                    {{ lightboxPhoto.caption }}
                </p>
            </div>
        </Teleport>

        <!-- ── Report Modal ── -->
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
interface PublicPetPhoto {
    id: string;
    caption: string | null;
    tags: string[];
    isProfilePicture: boolean;
    takenAt: string;
}

interface PublicFeeding {
    feedItem: string | null;
    foodType: string;
    foodSize: string | null;
    quantity: number;
    accepted: boolean;
    fedAt: string;
    notes: string | null;
}

interface PublicShedding {
    startedAt: string;
    completedAt: string | null;
    complete: boolean;
    quality: string | null;
    notes: string | null;
}

interface PublicWeightRecord {
    weightGrams: number;
    measuredAt: string;
}

interface PublicPetData {
    name: string;
    bio: string | null;
    species: string | null;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    acquisitionDate: string | null;
    profilePhotoId: string | null;
    photos: PublicPetPhoto[];
    feedings: PublicFeeding[];
    sheddings: PublicShedding[];
    weightRecords: PublicWeightRecord[];
    views: number;
    slug: string;
    createdAt: string;
}

definePageMeta({ layout: false });

const route = useRoute();
const { t } = useI18n();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const userSlug = route.params.slug as string;
const petSlug = route.params.petSlug as string;

const apiBase = config.public.apiBaseURL;

const loading = ref(true);
const petData = ref<PublicPetData | null>(null);
const lightboxPhoto = ref<PublicPetPhoto | null>(null);
const liked = ref(false);
const likeCount = ref(0);
const liking = ref(false);
const submittingComment = ref(false);
const commentText = ref("");
const deletingCommentId = ref<string | null>(null);

const comments = ref<Array<{ id: string; authorId: string | null; authorName: string; content: string; createdAt: string }>>([]);

const reportModalOpen = ref(false);
const reportTarget = reactive({ type: "comment" as "comment" | "pet_profile", id: "", url: "" });

function openReportModal(type: "comment" | "pet_profile", id: string) {
    reportTarget.type = type;
    reportTarget.id = id;
    reportTarget.url = window.location.href;
    reportModalOpen.value = true;
}

// ─── Fetch ───────────────────────────────────────────────

async function fetchPublicPet() {
    try {
        const res = await fetch(
            `${apiBase}/api/public/pets/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}`,
        );
        if (!res.ok) {
            petData.value = null;
            return;
        }
        const json = await res.json();
        if (json.success) {
            petData.value = json.data;
        }
    } catch {
        petData.value = null;
    } finally {
        loading.value = false;
    }
}

async function fetchLikeStatus() {
    try {
        const res = await fetch(
            `${apiBase}/api/public/community/pet/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/like`,
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
            `${apiBase}/api/public/community/pet/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/comments`,
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
    await fetchPublicPet();
    await Promise.all([fetchLikeStatus(), fetchComments()]);
});

// ─── Actions ─────────────────────────────────────────────

async function handleToggleLike() {
    if (liking.value) return;
    liking.value = true;
    try {
        const res = await fetch(
            `${apiBase}/api/public/community/pet/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/like`,
            { method: "POST" },
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
            `${apiBase}/api/public/community/pet/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/comments`,
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
            `${apiBase}/api/public/community/pet/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/comments/${commentId}`,
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

function photoUrl(photoId: string): string {
    return `${apiBase}/api/public/pets/${encodeURIComponent(userSlug)}/${encodeURIComponent(petSlug)}/photos/${photoId}`;
}

const profilePhotoUrl = computed(() =>
    petData.value?.profilePhotoId ? photoUrl(petData.value.profilePhotoId) : null,
);

const age = computed(() => {
    if (!petData.value?.birthDate) return null;
    const birth = new Date(petData.value.birthDate);
    const now = new Date();
    const months =
        (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
    if (months < 12) {
        return t("publicProfile.ageMonths", { months });
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
        return t("publicProfile.ageYears", { years });
    }
    return t("publicProfile.ageYearsMonths", { years, months: remainingMonths });
});

const latestWeight = computed(() => {
    if (!petData.value?.weightRecords.length) return 0;
    return petData.value.weightRecords[0].weightGrams;
});

const weightChange = computed(() => {
    const records = petData.value?.weightRecords;
    if (!records || records.length < 2) return null;
    return records[0].weightGrams - records[1].weightGrams;
});

const weightSparkline = computed(() => {
    const records = petData.value?.weightRecords?.slice(0, 30).reverse() ?? [];
    if (!records.length) return [];
    const min = Math.min(...records.map((r) => r.weightGrams));
    const max = Math.max(...records.map((r) => r.weightGrams));
    const range = max - min || 1;
    return records.map((r) => ({
        weight: r.weightGrams,
        date: r.measuredAt,
        pct: 10 + ((r.weightGrams - min) / range) * 90,
    }));
});

function openLightbox(photo: PublicPetPhoto) {
    lightboxPhoto.value = photo;
}

// ─── SEO ─────────────────────────────────────────────────

useHead({
    title: () => (petData.value ? `${petData.value.name} — KeeperLog` : "KeeperLog"),
});

useSeoMeta({
    ogTitle: () => petData.value?.name ?? "KeeperLog",
    ogDescription: () =>
        petData.value?.bio ??
        (petData.value?.species
            ? t("publicProfile.ogDescription", {
                  name: petData.value.name,
                  species: petData.value.species,
              })
            : ""),
    ogImage: () =>
        petData.value?.profilePhotoId ? photoUrl(petData.value.profilePhotoId) : undefined,
    ogType: "profile",
    twitterCard: "summary_large_image",
});
</script>
