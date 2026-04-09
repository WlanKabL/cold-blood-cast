<template>
    <PageContainer :title="$t('contact.title')" hide-back-button>
        <p class="mb-10 -mt-8 text-center text-fg-muted">{{ $t("contact.subtitle") }}</p>

        <div class="mx-auto max-w-lg">
            <!-- Contact form -->
            <form class="space-y-4" @submit.prevent="submit">
                <div>
                    <label class="mb-1 block text-sm font-medium text-fg">{{
                        $t("contact.form_name")
                    }}</label>
                    <input
                        v-model="form.name"
                        type="text"
                        required
                        :placeholder="$t('contact.form_name_placeholder')"
                        class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-fg">{{
                        $t("contact.form_email")
                    }}</label>
                    <input
                        v-model="form.email"
                        type="email"
                        required
                        :placeholder="$t('contact.form_email_placeholder')"
                        class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-fg">{{
                        $t("contact.form_message")
                    }}</label>
                    <textarea
                        v-model="form.message"
                        required
                        rows="5"
                        :placeholder="$t('contact.form_message_placeholder')"
                        class="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder-fg-soft outline-none focus:border-emerald-500"
                    />
                </div>
                <button
                    type="submit"
                    :disabled="sending"
                    class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                    <Icon v-if="sending" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
                    {{ $t("contact.form_submit") }}
                </button>
                <p v-if="successMsg" class="text-center text-sm text-emerald-400">
                    {{ successMsg }}
                </p>
                <p v-if="errorMsg" class="text-center text-sm text-red-400">{{ errorMsg }}</p>
            </form>

            <!-- GitHub link -->
            <div class="mt-10 flex justify-center">
                <a
                    href="https://github.com/WlanKabL/cold-blood-cast"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 text-sm text-fg-soft transition hover:text-emerald-400"
                >
                    <Icon name="lucide:github" class="h-4 w-4" />
                    {{ $t("contact.github") }}
                </a>
            </div>
        </div>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });
useSeoMeta({ title: "Contact – Cold Blood Cast" });

const { t } = useI18n();

const form = reactive({ name: "", email: "", message: "" });
const sending = ref(false);
const successMsg = ref("");
const errorMsg = ref("");

async function submit() {
    if (sending.value) return;
    sending.value = true;
    successMsg.value = "";
    errorMsg.value = "";

    try {
        // For now, just simulate success since there's no backend contact endpoint yet
        await new Promise((resolve) => setTimeout(resolve, 800));
        successMsg.value = t("contact.form_success");
        form.name = "";
        form.email = "";
        form.message = "";
    } catch {
        errorMsg.value = t("contact.form_error");
    } finally {
        sending.value = false;
    }
}
</script>
