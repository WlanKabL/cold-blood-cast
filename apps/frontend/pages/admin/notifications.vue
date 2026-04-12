<template>
    <div class="space-y-8">
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">Notifications</h1>
            <p class="text-fg-muted mt-1 text-[12px]">
                Configure Telegram and Discord webhook alerts for platform events.
            </p>
        </div>

        <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="glass-card flex items-center justify-between p-5">
                <div class="flex items-center gap-3">
                    <UiSkeleton width="36" height="36" rounded="xl" />
                    <div class="space-y-1">
                        <UiSkeleton width="100" height="14" />
                        <UiSkeleton width="140" height="11" />
                    </div>
                </div>
                <UiSkeleton width="44" height="24" rounded="full" />
            </div>
        </div>

        <template v-else>
            <!-- ── Channels ────────────────────── -->
            <section class="space-y-3">
                <h2 class="text-fg-faint text-[13px] font-semibold tracking-wider uppercase">
                    Channels
                </h2>

                <!-- Telegram -->
                <div class="glass-card p-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="bg-primary-500/15 flex h-9 w-9 items-center justify-center rounded-xl"
                            >
                                <Icon
                                    name="simple-icons:telegram"
                                    class="text-primary-400 h-4 w-4"
                                />
                            </div>
                            <div>
                                <p class="text-fg text-[14px] font-medium">Telegram</p>
                                <p class="text-fg-faint text-[11px]">
                                    Requires
                                    <code class="text-primary-400">TELEGRAM_BOT_TOKEN</code> +
                                    <code class="text-primary-400">TELEGRAM_CHAT_ID</code> in .env
                                </p>
                            </div>
                        </div>
                        <button
                            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                            :class="getSetting('telegram_enabled') ? 'bg-green-500' : 'bg-gray-600'"
                            role="switch"
                            :aria-checked="getSetting('telegram_enabled')"
                            @click="toggle('telegram_enabled')"
                        >
                            <span
                                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                                :class="
                                    getSetting('telegram_enabled')
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                "
                            />
                        </button>
                    </div>

                    <div
                        v-if="getSetting('telegram_enabled')"
                        class="bg-primary-500/8 text-primary-300 mt-4 rounded-xl px-3 py-2.5 text-[11px]"
                    >
                        <p class="mb-1 font-semibold">Setup instructions:</p>
                        <ol class="list-inside list-decimal space-y-1">
                            <li>
                                Message
                                <a href="https://t.me/BotFather" target="_blank" class="underline"
                                    >@BotFather</a
                                >
                                → create a bot → copy the token
                            </li>
                            <li>
                                Add the bot to your group/channel or start a DM → get the chat ID
                            </li>
                            <li>
                                Set <code>TELEGRAM_BOT_TOKEN=...</code> and
                                <code>TELEGRAM_CHAT_ID=...</code> in your .env and restart
                            </li>
                        </ol>
                    </div>
                </div>

                <!-- Discord -->
                <div class="glass-card p-5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15"
                            >
                                <Icon name="simple-icons:discord" class="h-4 w-4 text-indigo-400" />
                            </div>
                            <div>
                                <p class="text-fg text-[14px] font-medium">Discord</p>
                                <p class="text-fg-faint text-[11px]">
                                    Requires
                                    <code class="text-indigo-400">DISCORD_WEBHOOK_URL</code> in .env
                                </p>
                            </div>
                        </div>
                        <button
                            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                            :class="getSetting('discord_enabled') ? 'bg-green-500' : 'bg-gray-600'"
                            role="switch"
                            :aria-checked="getSetting('discord_enabled')"
                            @click="toggle('discord_enabled')"
                        >
                            <span
                                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                                :class="
                                    getSetting('discord_enabled')
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                "
                            />
                        </button>
                    </div>

                    <div
                        v-if="getSetting('discord_enabled')"
                        class="mt-4 rounded-xl bg-indigo-500/8 px-3 py-2.5 text-[11px] text-indigo-300"
                    >
                        <p class="mb-1 font-semibold">Setup instructions:</p>
                        <ol class="list-inside list-decimal space-y-1">
                            <li>
                                Open Discord → Server Settings → Integrations → Webhooks → New
                                Webhook
                            </li>
                            <li>Choose a channel, copy the webhook URL</li>
                            <li>
                                Set
                                <code
                                    >DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...</code
                                >
                                in your .env and restart
                            </li>
                        </ol>
                    </div>
                </div>
            </section>

            <!-- ── Events ─────────────────────── -->
            <section class="space-y-3">
                <h2 class="text-fg-faint text-[13px] font-semibold tracking-wider uppercase">
                    Events
                </h2>

                <div
                    v-for="event in EVENTS"
                    :key="event.key"
                    class="glass-card flex items-center justify-between p-4"
                >
                    <div class="flex items-center gap-3">
                        <Icon :name="event.icon" class="text-fg-faint h-4 w-4 shrink-0" />
                        <div>
                            <p class="text-fg text-[13px] font-medium">{{ event.label }}</p>
                            <p class="text-fg-faint text-[11px]">{{ event.description }}</p>
                        </div>
                    </div>
                    <button
                        class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                        :class="getSetting(event.key) ? 'bg-green-500' : 'bg-gray-600'"
                        role="switch"
                        :aria-checked="getSetting(event.key)"
                        @click="toggle(event.key)"
                    >
                        <span
                            class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200"
                            :class="getSetting(event.key) ? 'translate-x-5' : 'translate-x-0'"
                        />
                    </button>
                </div>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { SystemSettingEntry } from "~/types/api";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.nav.notifications")} — Admin` });

const admin = useAdminApi();
const toast = useAppToast();
const queryClient = useQueryClient();

const EVENTS = [
    {
        key: "notify_on_register",
        label: "New Registration",
        description: "Someone successfully registers an account",
        icon: "lucide:user-plus",
    },
    {
        key: "notify_on_pending",
        label: "Pending Approval",
        description: "A registration is waiting for admin approval",
        icon: "lucide:clock",
    },
    {
        key: "notify_on_first_login",
        label: "First Login",
        description: "A user logs in for the very first time",
        icon: "lucide:party-popper",
    },
    {
        key: "notify_on_login",
        label: "Every Login",
        description: "Any user login — can be noisy on active platforms",
        icon: "lucide:log-in",
    },
    {
        key: "notify_on_sensor_alert",
        label: "Sensor Alert",
        description: "A sensor reading exceeds a defined threshold",
        icon: "lucide:thermometer",
    },
    {
        key: "notify_on_new_comment",
        label: "New Comment",
        description: "Someone leaves a comment on a public profile",
        icon: "lucide:message-circle",
    },
    {
        key: "notify_on_new_report",
        label: "New Report",
        description: "A content report is submitted",
        icon: "lucide:flag",
    },
    {
        key: "notify_on_server_error",
        label: "Server Error",
        description: "An unhandled 500 error occurs on the backend",
        icon: "lucide:zap-off",
    },
] as const;

type NotificationKey = "telegram_enabled" | "discord_enabled" | (typeof EVENTS)[number]["key"];

const settings = ref<SystemSettingEntry[]>([]);

const NOTIFICATION_KEYS: NotificationKey[] = [
    "telegram_enabled",
    "discord_enabled",
    "notify_on_register",
    "notify_on_pending",
    "notify_on_first_login",
    "notify_on_login",
    "notify_on_sensor_alert",
    "notify_on_new_comment",
    "notify_on_new_report",
    "notify_on_server_error",
];

// ── Helpers ─────────────────────────────────
function getSetting(key: string): boolean {
    const entry = settings.value.find((s) => s.key === key);
    if (!entry) return false;
    try {
        return JSON.parse(entry.value) === true;
    } catch {
        return false;
    }
}

async function toggle(key: string) {
    const current = getSetting(key);
    await admin.updateSetting(key, !current);
    // Optimistic update for instant UI feedback
    const idx = settings.value.findIndex((s) => s.key === key);
    if (idx >= 0) {
        settings.value[idx]!.value = JSON.stringify(!current);
    } else {
        settings.value.push({
            id: key,
            key,
            value: JSON.stringify(!current),
            updatedAt: new Date().toISOString(),
        });
    }
    // Invalidate cache so it stays in sync
    queryClient.invalidateQueries({ queryKey: ["admin-notification-settings"] });
    toast.add({
        title: `${key.replace(/_/g, " ")} ${!current ? "enabled" : "disabled"}`,
        color: !current ? "green" : "amber",
        timeout: 2500,
    });
}

// ── Load ─────────────────────────────────────

const { data: allSettings, isLoading: loading } = useQuery({
    queryKey: ["admin-notification-settings"],
    queryFn: () => admin.getSettings(),
});

watchEffect(() => {
    if (allSettings.value) {
        settings.value = allSettings.value.filter((s) =>
            NOTIFICATION_KEYS.includes(s.key as NotificationKey),
        );
    }
});
</script>
