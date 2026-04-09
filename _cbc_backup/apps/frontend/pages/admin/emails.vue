<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h2 class="text-fg text-lg font-semibold">{{ $t("admin.emails.title") }}</h2>
            <UButton icon="i-lucide-send" @click="showSend = true">
                {{ $t("admin.emails.send") }}
            </UButton>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="text-fg-muted h-6 w-6 animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="logs.length === 0" class="text-fg-muted py-12 text-center text-sm">
            {{ $t("admin.emails.empty") }}
        </div>

        <!-- Table -->
        <div v-else class="glass-card overflow-x-auto">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="border-line text-fg-muted border-b text-xs uppercase tracking-wider">
                        <th class="px-4 py-3">{{ $t("admin.emails.to") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.emails.subject") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.emails.template") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.emails.status") }}</th>
                        <th class="px-4 py-3">{{ $t("admin.emails.date") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="log in logs"
                        :key="log.id"
                        class="border-line hover:bg-hover border-b transition last:border-b-0"
                    >
                        <td class="text-fg px-4 py-3">{{ log.to }}</td>
                        <td class="text-fg-muted max-w-xs truncate px-4 py-3">{{ log.subject }}</td>
                        <td class="text-fg-muted px-4 py-3">
                            <UBadge variant="subtle">{{ log.template || "—" }}</UBadge>
                        </td>
                        <td class="px-4 py-3">
                            <UBadge
                                :color="log.status === 'sent' ? 'green' : 'red'"
                                variant="subtle"
                            >
                                {{ log.status }}
                            </UBadge>
                        </td>
                        <td class="text-fg-muted px-4 py-3 text-xs">
                            {{ formatDateShort(log.sentAt) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="total > limit" class="flex items-center justify-center gap-2">
            <UButton variant="ghost" size="sm" :disabled="page <= 1" @click="page--">
                {{ $t("common.prev") }}
            </UButton>
            <span class="text-fg-muted text-sm">{{ page }} / {{ Math.ceil(total / limit) }}</span>
            <UButton
                variant="ghost"
                size="sm"
                :disabled="page >= Math.ceil(total / limit)"
                @click="page++"
            >
                {{ $t("common.next") }}
            </UButton>
        </div>

        <!-- Send Email Modal -->
        <UModal v-model:open="showSend">
            <template #content>
                <div class="p-6">
                    <h2 class="text-fg mb-4 text-lg font-semibold">
                        {{ $t("admin.emails.sendTitle") }}
                    </h2>
                    <form class="space-y-4" @submit.prevent="handleSend">
                        <UFormField :label="$t('admin.emails.to')">
                            <UInput v-model="sendTo" type="email" required class="w-full" />
                        </UFormField>
                        <UFormField :label="$t('admin.emails.subject')">
                            <UInput v-model="sendSubject" required class="w-full" />
                        </UFormField>
                        <UFormField :label="$t('admin.emails.body')">
                            <UTextarea v-model="sendBody" required :rows="5" class="w-full" />
                        </UFormField>
                        <div class="flex justify-end gap-2">
                            <UButton variant="outline" @click="showSend = false">
                                {{ $t("common.cancel") }}
                            </UButton>
                            <UButton type="submit" :loading="sending">
                                {{ $t("admin.emails.send") }}
                            </UButton>
                        </div>
                    </form>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const { t } = useI18n();
useHead({ title: () => t("admin.emails.title") });

const admin = useAdmin();
const { formatDateShort } = useFormatters();
const toast = useAppToast();

interface EmailLog {
    id: string;
    to: string;
    subject: string;
    template: string | null;
    status: string;
    sentAt: string;
}

const logs = ref<EmailLog[]>([]);
const loading = ref(true);
const page = ref(1);
const limit = ref(20);
const total = ref(0);

const showSend = ref(false);
const sendTo = ref("");
const sendSubject = ref("");
const sendBody = ref("");
const sending = ref(false);

async function loadLogs() {
    loading.value = true;
    try {
        const res = await admin.listEmails({ page: page.value, limit: limit.value });
        logs.value = res.emails ?? [];
        total.value = res.total ?? 0;
    } catch {
        // ignore
    } finally {
        loading.value = false;
    }
}

async function handleSend() {
    sending.value = true;
    try {
        await admin.sendEmail({
            to: sendTo.value,
            subject: sendSubject.value,
            body: sendBody.value,
        });
        toast.success(t("admin.emails.sentSuccess"));
        showSend.value = false;
        sendTo.value = "";
        sendSubject.value = "";
        sendBody.value = "";
        await loadLogs();
    } catch {
        toast.error(t("admin.emails.sendError"));
    } finally {
        sending.value = false;
    }
}

watch(page, () => loadLogs());
onMounted(loadLogs);
</script>
