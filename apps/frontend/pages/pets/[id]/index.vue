<template>
    <div class="mx-auto max-w-5xl space-y-6 p-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-3">
            <NuxtLink
                to="/pets"
                class="text-fg-faint hover:text-fg-muted rounded-lg p-1.5 transition-colors"
            >
                <Icon name="lucide:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h1 class="text-fg truncate text-2xl font-bold tracking-tight">
                        {{ pet?.name ?? "..." }}
                    </h1>
                    <span
                        v-if="pet?.gender && pet.gender !== 'UNKNOWN'"
                        class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ pet.gender }}
                    </span>
                </div>
                <p class="text-fg-faint text-sm">
                    {{ pet?.species }}
                    <template v-if="pet?.morph"> · {{ pet.morph }}</template>
                </p>
            </div>
            <div v-if="pet" class="flex items-center gap-2">
                <UiButton variant="ghost" icon="lucide:pencil" @click="openEditModal" />
                <UiButton
                    variant="danger"
                    icon="lucide:trash-2"
                    @click="showDeleteConfirm = true"
                />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-4">
            <div class="glass-card h-48 animate-pulse rounded-xl" />
            <div class="glass-card h-32 animate-pulse rounded-xl" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="glass-card flex flex-col items-center rounded-xl py-16">
            <Icon name="lucide:alert-triangle" class="mb-3 h-12 w-12 text-red-400" />
            <p class="text-fg-muted text-sm">{{ $t("common.error") }}</p>
            <UiButton class="mt-4" variant="ghost" @click="refetch">{{
                $t("common.retry")
            }}</UiButton>
        </div>

        <template v-else-if="pet">
            <!-- Info Card -->
            <div class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.details") }}</h2>
                    <span
                        v-if="pet.enclosure"
                        class="bg-primary-500/10 text-primary-400 rounded-md px-2 py-0.5 text-xs font-medium"
                    >
                        {{ pet.enclosure.name }}
                    </span>
                </div>
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.pets.fields.species") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.species }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.pets.fields.morph") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.morph || "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.pets.fields.gender") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.gender || "—" }}</dd>
                    </div>
                    <div>
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.pets.fields.birthDate") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">
                            {{ pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : "—" }}
                        </dd>
                    </div>
                    <div v-if="pet.notes" class="sm:col-span-2">
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.pets.fields.notes") }}
                        </dt>
                        <dd class="text-fg mt-1 text-sm">{{ pet.notes }}</dd>
                    </div>
                    <div
                        v-if="pet.feedingIntervalMinDays && pet.feedingIntervalMaxDays"
                        class="sm:col-span-2"
                    >
                        <dt class="text-fg-faint text-xs font-medium uppercase">
                            {{ $t("pages.pets.feedingSchedule") }}
                        </dt>
                        <dd class="text-fg mt-1 flex items-center gap-3 text-sm">
                            <span
                                >{{ pet.feedingIntervalMinDays }}–{{ pet.feedingIntervalMaxDays }}
                                {{
                                    $t("pages.pets.fields.feedingIntervalMinDays")
                                        .split("(")[1]
                                        ?.replace(")", "") || "days"
                                }}</span
                            >
                            <span
                                v-if="feedingStatus"
                                :class="feedingStatusBadgeClass(feedingStatus.status)"
                                class="rounded-md px-2 py-0.5 text-xs font-medium"
                            >
                                {{ feedingStatusLabel(feedingStatus.status) }}
                                <template v-if="feedingStatus.daysSinceLastFeeding !== null">
                                    · {{ feedingStatus.daysSinceLastFeeding }}d
                                </template>
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>

            <!-- Photos Preview -->
            <div v-if="authStore.hasFeature('photos')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">
                        {{ $t("pages.pets.photos.title") }}
                        <span
                            v-if="pet._count.photos"
                            class="text-fg-faint ml-1 text-sm font-normal"
                        >
                            ({{ pet._count.photos }})
                        </span>
                    </h2>
                    <NuxtLink
                        :to="`/pets/${petId}/photos`"
                        class="text-primary-400 text-sm font-medium"
                    >
                        {{ $t("pages.pets.photos.viewGallery") }}
                    </NuxtLink>
                </div>
                <div v-if="pet._count.photos" class="flex items-center gap-4">
                    <img
                        v-if="pet.photos.length"
                        :src="resolveUrl(pet.photos[0].upload.url)"
                        :alt="pet.name"
                        class="h-20 w-20 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div
                        v-else
                        class="bg-surface-raised flex h-20 w-20 items-center justify-center rounded-xl"
                    >
                        <Icon name="lucide:images" class="text-fg-faint h-8 w-8" />
                    </div>
                    <div>
                        <p class="text-fg text-sm">
                            {{ $t("pages.pets.photos.photoCount", { count: pet._count.photos }) }}
                        </p>
                        <NuxtLink
                            :to="`/pets/${petId}/photos`"
                            class="text-primary-400 mt-1 inline-flex items-center gap-1 text-xs"
                        >
                            <Icon name="lucide:images" class="h-3.5 w-3.5" />
                            {{ $t("pages.pets.photos.viewGallery") }}
                        </NuxtLink>
                    </div>
                </div>
                <div v-else class="flex items-center gap-3">
                    <div
                        class="bg-surface-raised flex h-20 w-20 items-center justify-center rounded-xl"
                    >
                        <Icon name="lucide:image" class="text-fg-faint h-8 w-8" />
                    </div>
                    <div>
                        <p class="text-fg-muted text-sm">{{ $t("pages.pets.photos.empty") }}</p>
                        <NuxtLink
                            :to="`/pets/${petId}/photos`"
                            class="text-primary-400 mt-1 inline-flex items-center gap-1 text-xs"
                        >
                            <Icon name="lucide:upload" class="h-3.5 w-3.5" />
                            {{ $t("pages.pets.photos.upload") }}
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Documents -->
            <div v-if="authStore.hasFeature('pet_documents')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">
                        {{ $t("pages.pets.documents.title") }}
                        <span
                            v-if="pet._count.documents"
                            class="text-fg-faint ml-1 text-sm font-normal"
                        >
                            ({{ pet._count.documents }})
                        </span>
                    </h2>
                    <NuxtLink
                        :to="`/pets/${petId}/documents`"
                        class="text-primary-400 text-sm font-medium"
                    >
                        {{ $t("pages.pets.documents.viewDocuments") }}
                    </NuxtLink>
                </div>
                <div v-if="pet._count.documents" class="flex items-center gap-3">
                    <div
                        class="bg-surface-raised flex h-12 w-12 items-center justify-center rounded-xl"
                    >
                        <Icon name="lucide:file-text" class="text-primary-400 h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg text-sm">
                            {{
                                $t("pages.pets.documents.documentCount", {
                                    count: pet._count.documents,
                                })
                            }}
                        </p>
                        <NuxtLink
                            :to="`/pets/${petId}/documents`"
                            class="text-primary-400 mt-1 inline-flex items-center gap-1 text-xs"
                        >
                            <Icon name="lucide:folder-open" class="h-3.5 w-3.5" />
                            {{ $t("pages.pets.documents.viewDocuments") }}
                        </NuxtLink>
                    </div>
                </div>
                <div v-else class="flex items-center gap-3">
                    <div
                        class="bg-surface-raised flex h-12 w-12 items-center justify-center rounded-xl"
                    >
                        <Icon name="lucide:file-text" class="text-fg-faint h-5 w-5" />
                    </div>
                    <div>
                        <p class="text-fg-muted text-sm">{{ $t("pages.pets.documents.empty") }}</p>
                        <NuxtLink
                            :to="`/pets/${petId}/documents`"
                            class="text-primary-400 mt-1 inline-flex items-center gap-1 text-xs"
                        >
                            <Icon name="lucide:upload" class="h-3.5 w-3.5" />
                            {{ $t("pages.pets.documents.upload") }}
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Recent Feedings -->
            <div v-if="authStore.hasFeature('feedings')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.recentFeedings") }}</h2>
                    <NuxtLink to="/feedings" class="text-primary-400 text-sm font-medium">{{
                        $t("pages.dashboard.viewAll")
                    }}</NuxtLink>
                </div>
                <div v-if="feedings?.length" class="space-y-2">
                    <div
                        v-for="feeding in feedings"
                        :key="feeding.id"
                        class="bg-surface-raised flex items-center justify-between rounded-lg p-3"
                    >
                        <div class="flex items-center gap-3">
                            <Icon name="lucide:utensils" class="h-4 w-4 text-amber-400" />
                            <span class="text-fg text-sm">{{ feeding.foodType }}</span>
                            <span v-if="feeding.foodSize" class="text-fg-faint text-xs"
                                >({{ feeding.foodSize }})</span
                            >
                        </div>
                        <span class="text-fg-faint text-xs">{{
                            new Date(feeding.fedAt).toLocaleDateString()
                        }}</span>
                    </div>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.noFeedings") }}</p>
            </div>

            <!-- Weight History -->
            <div v-if="authStore.hasFeature('weights')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.weightHistory") }}</h2>
                    <div class="flex items-center gap-3">
                        <select
                            v-model="weightRange"
                            class="bg-surface-raised text-fg-muted rounded-md border border-white/10 px-2 py-1 text-xs"
                        >
                            <option value="30">{{ $t("pages.weights.chart.last30d") }}</option>
                            <option value="90">{{ $t("pages.weights.chart.last90d") }}</option>
                            <option value="365">{{ $t("pages.weights.chart.last1y") }}</option>
                            <option value="0">{{ $t("pages.weights.chart.allTime") }}</option>
                        </select>
                        <NuxtLink to="/weights" class="text-primary-400 text-sm font-medium">{{
                            $t("pages.dashboard.viewAll")
                        }}</NuxtLink>
                    </div>
                </div>

                <!-- Growth Rate Indicator -->
                <div v-if="growthRate" class="mb-4 flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2">
                        <Icon
                            :name="
                                growthRate.trend === 'up'
                                    ? 'lucide:trending-up'
                                    : growthRate.trend === 'down'
                                      ? 'lucide:trending-down'
                                      : 'lucide:minus'
                            "
                            :class="
                                growthRate.trend === 'up'
                                    ? 'text-green-400'
                                    : growthRate.trend === 'down'
                                      ? 'text-red-400'
                                      : 'text-fg-faint'
                            "
                            class="h-4 w-4"
                        />
                        <span
                            :class="
                                growthRate.trend === 'up'
                                    ? 'text-green-400'
                                    : growthRate.trend === 'down'
                                      ? 'text-red-400'
                                      : 'text-fg-faint'
                            "
                            class="text-xs font-medium"
                        >
                            {{
                                $t(
                                    `pages.weights.chart.trend${growthRate.trend.charAt(0).toUpperCase() + growthRate.trend.slice(1)}`,
                                )
                            }}
                        </span>
                    </div>
                    <span class="text-fg-faint text-xs">
                        {{
                            $t("pages.weights.chart.perMonth", {
                                rate: growthRate.avgGramsPerMonth,
                            })
                        }}
                    </span>
                    <span class="text-fg-faint text-xs">
                        {{
                            $t("pages.weights.chart.totalGain", { gain: growthRate.totalGainGrams })
                        }}
                    </span>
                    <span class="text-fg-faint text-xs">
                        {{ $t("pages.weights.chart.records", { count: growthRate.recordCount }) }}
                    </span>
                </div>

                <div v-if="chartSeries?.length">
                    <ChartsWeightLineChart
                        :series="chartSeries"
                        :height="250"
                        :show-legend="false"
                    />
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.noWeights") }}</p>
            </div>

            <!-- Shedding Cycle Analysis -->
            <div v-if="authStore.hasFeature('sheddings')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">
                        {{ $t("pages.pets.sheddingCycle") }}
                        <span
                            v-if="sheddingAnalysis?.isAnomaly"
                            class="ml-2 inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400"
                        >
                            <Icon name="lucide:alert-triangle" class="h-3 w-3" />
                            {{ $t("pages.sheddings.analysis.warning") }}
                        </span>
                    </h2>
                    <NuxtLink to="/sheddings" class="text-primary-400 text-sm font-medium">{{
                        $t("pages.dashboard.viewAll")
                    }}</NuxtLink>
                </div>
                <template v-if="sheddingAnalysis && sheddingAnalysis.sheddingCount >= 2">
                    <div class="mb-4 flex flex-wrap items-center gap-4">
                        <div class="flex items-center gap-2">
                            <Icon name="lucide:calendar-clock" class="text-primary-400 h-4 w-4" />
                            <span class="text-fg-faint text-xs font-medium uppercase">{{
                                $t("pages.sheddings.analysis.averageCycle")
                            }}</span>
                            <span class="text-fg text-sm font-semibold">{{
                                $t("pages.sheddings.analysis.averageCycleDays", {
                                    days: sheddingAnalysis.averageIntervalDays,
                                })
                            }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Icon
                                :name="
                                    sheddingAnalysis.trend === 'shortening'
                                        ? 'lucide:trending-down'
                                        : sheddingAnalysis.trend === 'lengthening'
                                          ? 'lucide:trending-up'
                                          : 'lucide:minus'
                                "
                                :class="
                                    sheddingAnalysis.trend === 'shortening'
                                        ? 'text-green-400'
                                        : sheddingAnalysis.trend === 'lengthening'
                                          ? 'text-amber-400'
                                          : 'text-fg-faint'
                                "
                                class="h-4 w-4"
                            />
                            <span
                                :class="
                                    sheddingAnalysis.trend === 'shortening'
                                        ? 'text-green-400'
                                        : sheddingAnalysis.trend === 'lengthening'
                                          ? 'text-amber-400'
                                          : 'text-fg-faint'
                                "
                                class="text-xs font-medium"
                            >
                                {{
                                    $t(
                                        `pages.sheddings.analysis.trend${sheddingAnalysis.trend.charAt(0).toUpperCase() + sheddingAnalysis.trend.slice(1)}`,
                                    )
                                }}
                            </span>
                        </div>
                        <span v-if="sheddingAnalysis.lastShedDate" class="text-fg-faint text-xs">
                            {{ $t("pages.sheddings.analysis.lastShed") }}:
                            {{ new Date(sheddingAnalysis.lastShedDate).toLocaleDateString() }}
                        </span>
                        <span
                            v-if="sheddingAnalysis.predictedNextDate"
                            class="text-fg-faint text-xs"
                        >
                            {{ $t("pages.sheddings.analysis.predicted") }}:
                            {{ new Date(sheddingAnalysis.predictedNextDate).toLocaleDateString() }}
                        </span>
                        <span class="text-fg-faint text-xs">
                            {{
                                $t("pages.sheddings.analysis.records", {
                                    count: sheddingAnalysis.sheddingCount,
                                })
                            }}
                        </span>
                    </div>
                    <ChartsSheddingIntervalChart
                        :intervals="sheddingAnalysis.intervals"
                        :average-days="sheddingAnalysis.averageIntervalDays"
                        :height="200"
                    />
                </template>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.noSheddingData") }}</p>
            </div>

            <!-- Recent Vet Visits -->
            <div v-if="authStore.hasFeature('vet_visits')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">{{ $t("pages.pets.recentVetVisits") }}</h2>
                    <NuxtLink to="/vet-visits" class="text-primary-400 text-sm font-medium">{{
                        $t("pages.dashboard.viewAll")
                    }}</NuxtLink>
                </div>
                <div v-if="vetVisits?.length" class="space-y-2">
                    <div
                        v-for="visit in vetVisits"
                        :key="visit.id"
                        class="bg-surface-raised flex items-center justify-between rounded-lg p-3"
                    >
                        <div class="flex items-center gap-3">
                            <Icon name="lucide:stethoscope" class="h-4 w-4 text-teal-400" />
                            <span class="text-fg text-sm">{{
                                visit.reason || $t(`pages.vetVisits.types.${visit.visitType}`)
                            }}</span>
                            <span v-if="visit.veterinarian" class="text-fg-faint text-xs"
                                >({{ visit.veterinarian.name }})</span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <span v-if="visit.costCents" class="text-fg-faint text-xs">{{
                                formatVetCost(visit.costCents)
                            }}</span>
                            <span class="text-fg-faint text-xs">{{
                                new Date(visit.visitDate).toLocaleDateString()
                            }}</span>
                        </div>
                    </div>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.noVetVisits") }}</p>
            </div>

            <!-- Recent Activity / Timeline -->
            <div v-if="authStore.hasFeature('timeline')" class="glass-card rounded-xl p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-fg font-semibold">
                        {{ $t("pages.pets.timeline.recentActivity") }}
                    </h2>
                    <NuxtLink
                        :to="`/pets/${petId}/timeline`"
                        class="text-primary-400 text-sm font-medium"
                    >
                        {{ $t("pages.pets.timeline.viewTimeline") }}
                    </NuxtLink>
                </div>
                <div v-if="recentActivity?.length" class="space-y-2">
                    <div
                        v-for="event in recentActivity"
                        :key="event.id"
                        class="bg-surface-raised flex items-center gap-3 rounded-lg p-3"
                    >
                        <Icon
                            :name="event.icon"
                            :class="timelineIconClass(event.type)"
                            class="h-4 w-4"
                        />
                        <span class="text-fg min-w-0 flex-1 truncate text-sm">{{
                            event.title
                        }}</span>
                        <span class="text-fg-faint flex-shrink-0 text-xs">{{
                            new Date(event.date).toLocaleDateString()
                        }}</span>
                    </div>
                </div>
                <p v-else class="text-fg-muted text-sm">{{ $t("pages.pets.timeline.empty") }}</p>
            </div>

            <!-- Public Profile / Sharing -->
            <PetPublicProfileCard :pet-id="petId" />
        </template>

        <!-- Edit Modal -->
        <UiModal
            :show="showEdit"
            :title="$t('pages.pets.edit')"
            width="lg"
            @close="showEdit = false"
        >
            <form class="space-y-4" @submit.prevent="handleUpdate">
                <UiTextInput
                    v-model="editForm.name"
                    :label="$t('pages.pets.fields.name')"
                    required
                />
                <UiSelect v-model="editForm.enclosureId" :label="$t('pages.pets.fields.enclosure')">
                    <option value="NONE">—</option>
                    <option v-for="enc in enclosures" :key="enc.id" :value="enc.id">
                        {{ enc.name }}
                    </option>
                </UiSelect>
                <UiTextInput
                    v-model="editForm.species"
                    :label="$t('pages.pets.fields.species')"
                    required
                />
                <UiTextInput v-model="editForm.morph" :label="$t('pages.pets.fields.morph')" />
                <UiSelect v-model="editForm.gender" :label="$t('pages.pets.fields.gender')">
                    <option v-for="g in genderOptions" :key="g" :value="g">{{ g }}</option>
                </UiSelect>
                <UiTextInput
                    v-model="editForm.birthDate"
                    :label="$t('pages.pets.fields.birthDate')"
                    type="date"
                />
                <UiTextarea v-model="editForm.notes" :label="$t('pages.pets.fields.notes')" />

                <!-- Feeding Schedule -->
                <div class="border-t border-white/5 pt-4">
                    <p class="text-fg-muted mb-1 text-sm font-medium">
                        {{ $t("pages.pets.feedingSchedule") }}
                    </p>
                    <p class="text-fg-faint mb-3 text-xs">
                        {{ $t("pages.pets.feedingScheduleHint") }}
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        <UiTextInput
                            v-model="editForm.feedingIntervalMinDays"
                            type="number"
                            :label="$t('pages.pets.fields.feedingIntervalMinDays')"
                            min="1"
                            max="365"
                        />
                        <UiTextInput
                            v-model="editForm.feedingIntervalMaxDays"
                            type="number"
                            :label="$t('pages.pets.fields.feedingIntervalMaxDays')"
                            min="1"
                            max="365"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <UiButton variant="ghost" @click="showEdit = false">{{
                        $t("common.cancel")
                    }}</UiButton>
                    <UiButton type="submit" :loading="updating">{{ $t("common.save") }}</UiButton>
                </div>
            </form>
        </UiModal>

        <!-- Delete Confirmation -->
        <UiConfirmDialog
            :show="showDeleteConfirm"
            :title="$t('common.confirmDelete')"
            :message="$t('pages.pets.confirmDelete')"
            variant="danger"
            :confirm-label="$t('common.delete')"
            :cancel-label="$t('common.cancel')"
            :loading="deleting"
            @confirm="handleDelete"
            @cancel="showDeleteConfirm = false"
        />
    </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient, useMutation } from "@tanstack/vue-query";

interface Pet {
    id: string;
    name: string;
    species: string;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    notes: string | null;
    enclosureId: string | null;
    enclosure: { id: string; name: string } | null;
    feedingIntervalMinDays: number | null;
    feedingIntervalMaxDays: number | null;
    photos: { id: string; uploadId: string; upload: { url: string } }[];
    _count: { photos: number; documents: number };
}

interface Feeding {
    id: string;
    foodType: string;
    foodSize: string | null;
    fedAt: string;
}

interface WeightRecord {
    id: string;
    weightGrams: number;
    measuredAt: string;
}

interface WeightChartPoint {
    date: string;
    weightGrams: number;
}

interface WeightChartSeries {
    petId: string;
    petName: string;
    points: WeightChartPoint[];
}

interface GrowthRateResult {
    petId: string;
    petName: string;
    firstRecord: { date: string; weightGrams: number } | null;
    latestRecord: { date: string; weightGrams: number } | null;
    totalGainGrams: number;
    avgGramsPerMonth: number;
    trend: "up" | "stable" | "down";
    recordCount: number;
}

interface Enclosure {
    id: string;
    name: string;
}

interface FeedingStatusItem {
    petId: string;
    petName: string;
    species: string;
    intervalMinDays: number | null;
    intervalMaxDays: number | null;
    lastFedAt: string | null;
    daysSinceLastFeeding: number | null;
    status: "ok" | "due" | "overdue" | "critical" | "no_schedule";
}

interface PetVetVisit {
    id: string;
    visitDate: string;
    visitType: string;
    reason: string | null;
    costCents: number | null;
    veterinarian: { id: string; name: string; clinicName: string | null } | null;
}

interface SheddingInterval {
    fromDate: string;
    toDate: string;
    days: number;
}

interface SheddingAnalysisResult {
    petId: string;
    petName: string;
    sheddingCount: number;
    averageIntervalDays: number;
    trend: "shortening" | "stable" | "lengthening";
    predictedNextDate: string | null;
    lastShedDate: string | null;
    intervals: SheddingInterval[];
    isAnomaly: boolean;
    anomalyMessage: string | null;
}

interface TimelineEvent {
    id: string;
    type: "feeding" | "shedding" | "weight" | "vet_visit" | "photo";
    date: string;
    title: string;
    detail: string | null;
    icon: string;
    meta: Record<string, unknown>;
}

interface TimelineResult {
    events: TimelineEvent[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const api = useApi();
const queryClient = useQueryClient();
const toast = useAppToast();
const authStore = useAuthStore();
const resolveUrl = useResolveUrl();

const petId = route.params.id as string;
const genderOptions = ["MALE", "FEMALE", "UNKNOWN"];

definePageMeta({ layout: "default", middleware: ["feature-gate"], requiredFeature: "pets" });

// ── Data ─────────────────────────────────────────────────
const {
    data: pet,
    isLoading: loading,
    error,
    refetch,
} = useQuery({
    queryKey: ["pets", petId],
    queryFn: () => api.get<Pet>(`/api/pets/${petId}`),
});

const { data: feedings } = useQuery({
    queryKey: ["feedings", { petId }],
    queryFn: () => api.get<Feeding[]>(`/api/feedings?petId=${petId}&limit=10`),
});

const weightRange = ref("0");

const chartFromParam = computed(() => {
    const days = Number(weightRange.value);
    if (days <= 0) return "";
    const d = new Date();
    d.setDate(d.getDate() - days);
    return `&from=${d.toISOString()}`;
});

const { data: chartSeries } = useQuery({
    queryKey: ["weights-chart", petId, weightRange],
    queryFn: () =>
        api.get<WeightChartSeries[]>(`/api/weights/chart?petIds=${petId}${chartFromParam.value}`),
});

const { data: growthRates } = useQuery({
    queryKey: ["weights-growth-rate", petId],
    queryFn: () => api.get<GrowthRateResult[]>(`/api/weights/growth-rate?petIds=${petId}`),
});

const growthRate = computed(() => growthRates.value?.[0] ?? null);

const { data: feedingStatuses } = useQuery({
    queryKey: ["feeding-reminders"],
    queryFn: () => api.get<FeedingStatusItem[]>("/api/feeding-reminders"),
});

const { data: vetVisits } = useQuery({
    queryKey: ["vet-visits", { petId }],
    queryFn: () => api.get<PetVetVisit[]>(`/api/vet-visits?petId=${petId}`),
});

const { data: sheddingAnalysisData } = useQuery({
    queryKey: ["shedding-analysis", petId],
    queryFn: () => api.get<SheddingAnalysisResult>(`/api/sheddings/analysis/${petId}`),
});

const sheddingAnalysis = computed(() => sheddingAnalysisData.value ?? null);

const { data: timelineData } = useQuery({
    queryKey: ["timeline", petId, "preview"],
    queryFn: () => api.get<TimelineResult>(`/api/pets/${petId}/timeline?page=1&limit=5`),
});

const recentActivity = computed(() => timelineData.value?.events ?? []);

function timelineIconClass(type: string): string {
    switch (type) {
        case "feeding":
            return "text-orange-400";
        case "shedding":
            return "text-purple-400";
        case "weight":
            return "text-blue-400";
        case "vet_visit":
            return "text-teal-400";
        case "photo":
            return "text-pink-400";
        default:
            return "text-fg-faint";
    }
}

function formatVetCost(cents: number): string {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
        cents / 100,
    );
}

const feedingStatus = computed(() => feedingStatuses.value?.find((s) => s.petId === petId) ?? null);

function feedingStatusBadgeClass(status: string): string {
    switch (status) {
        case "ok":
            return "bg-green-500/10 text-green-400";
        case "due":
            return "bg-amber-500/10 text-amber-400";
        case "critical":
            return "bg-red-500/10 text-red-400";
        default:
            return "bg-white/5 text-fg-faint";
    }
}

function feedingStatusLabel(status: string): string {
    switch (status) {
        case "ok":
            return t("pages.dashboard.feedingOk");
        case "due":
            return t("pages.dashboard.feedingDue");
        case "critical":
            return t("pages.dashboard.feedingCritical");
        default:
            return t("pages.dashboard.feedingNoSchedule");
    }
}

const { data: enclosures } = useQuery({
    queryKey: ["enclosures"],
    queryFn: () => api.get<Enclosure[]>("/api/enclosures"),
});

useHead({ title: () => pet.value?.name ?? t("pages.pets.title") });

// ── Edit ─────────────────────────────────────────────────
const showEdit = ref(false);
const editForm = reactive({
    name: "",
    enclosureId: "NONE",
    species: "",
    morph: "",
    gender: "UNKNOWN",
    birthDate: "",
    notes: "",
    feedingIntervalMinDays: "",
    feedingIntervalMaxDays: "",
});

function openEditModal() {
    if (!pet.value) return;
    Object.assign(editForm, {
        name: pet.value.name,
        enclosureId: pet.value.enclosureId ?? "NONE",
        species: pet.value.species,
        morph: pet.value.morph ?? "",
        gender: pet.value.gender ?? "UNKNOWN",
        birthDate: pet.value.birthDate ? pet.value.birthDate.split("T")[0] : "",
        notes: pet.value.notes ?? "",
        feedingIntervalMinDays: pet.value.feedingIntervalMinDays?.toString() ?? "",
        feedingIntervalMaxDays: pet.value.feedingIntervalMaxDays?.toString() ?? "",
    });
    showEdit.value = true;
}

const { mutate: updateMutation, isPending: updating } = useMutation({
    mutationFn: () =>
        api.put(`/api/pets/${petId}`, {
            name: editForm.name,
            enclosureId: editForm.enclosureId === "NONE" ? undefined : editForm.enclosureId,
            species: editForm.species,
            morph: editForm.morph || undefined,
            gender: editForm.gender,
            birthDate: editForm.birthDate || undefined,
            notes: editForm.notes || undefined,
            feedingIntervalMinDays: editForm.feedingIntervalMinDays
                ? Number(editForm.feedingIntervalMinDays)
                : null,
            feedingIntervalMaxDays: editForm.feedingIntervalMaxDays
                ? Number(editForm.feedingIntervalMaxDays)
                : null,
        }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.saved"));
        showEdit.value = false;
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleUpdate() {
    updateMutation();
}

// ── Delete ───────────────────────────────────────────────
const showDeleteConfirm = ref(false);

const { mutate: deleteMutation, isPending: deleting } = useMutation({
    mutationFn: () => api.del(`/api/pets/${petId}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pets"] });
        toast.success(t("pages.pets.deleted"));
        router.push("/pets");
    },
    onError: () => {
        toast.error(t("common.error"));
    },
});

function handleDelete() {
    deleteMutation();
}
</script>
