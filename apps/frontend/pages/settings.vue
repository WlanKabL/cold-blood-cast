<template>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
        <h1 class="animate-fade-in-up text-fg text-2xl font-bold tracking-tight">
            {{ $t("nav.settings") }}
        </h1>

        <UiTabs v-model="activeTab" :tabs="settingsTabs">
            <!-- General Tab -->
            <div v-if="activeTab === 'general'" class="space-y-6">
                <!-- Appearance -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.appearance") }}
                    </h2>
                    <div class="space-y-4">
                        <!-- Theme -->
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p class="text-fg text-[13px] font-medium">
                                    {{ $t("pages.settings.theme") }}
                                </p>
                                <p class="text-fg-muted text-[12px]">
                                    {{
                                        settings.isDarkMode
                                            ? $t("pages.settings.darkMode")
                                            : $t("pages.settings.lightMode")
                                    }}
                                </p>
                            </div>
                            <button
                                class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-xl border px-4 py-2 text-[13px] transition-all duration-200"
                                @click="settings.toggleTheme()"
                            >
                                <Icon
                                    :name="settings.isDarkMode ? 'lucide:sun' : 'lucide:moon'"
                                    class="mr-2 inline h-4 w-4"
                                />
                                {{
                                    settings.isDarkMode
                                        ? $t("pages.settings.lightMode")
                                        : $t("pages.settings.darkMode")
                                }}
                            </button>
                        </div>

                        <!-- Language -->
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p class="text-fg text-[13px] font-medium">
                                    {{ $t("pages.settings.language") }}
                                </p>
                                <p class="text-fg-muted text-[12px]">
                                    {{ settings.currentLocale === "de" ? "Deutsch" : "English" }}
                                </p>
                            </div>
                            <button
                                class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-xl border px-4 py-2 text-[13px] transition-all duration-200"
                                @click="toggleLocale"
                            >
                                {{ settings.currentLocale === "en" ? "Deutsch" : "English" }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Account Info -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.account") }}
                    </h2>
                    <div class="space-y-4">
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("pages.settings.username") }}</span>
                            <span class="text-fg">{{ authStore.user?.username }}</span>
                        </div>
                        <div class="flex justify-between text-[13px]">
                            <span class="text-fg-muted">{{ $t("pages.settings.email") }}</span>
                            <span class="text-fg">{{ authStore.user?.email }}</span>
                        </div>

                        <!-- Display Name -->
                        <div class="border-line border-t pt-4">
                            <label class="text-fg mb-1.5 block text-[13px] font-medium">
                                {{ $t("pages.settings.displayName") }}
                            </label>
                            <p class="text-fg-muted mb-3 text-[12px]">
                                {{ $t("pages.settings.displayNameHint") }}
                            </p>
                            <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <input
                                    v-model="displayName"
                                    type="text"
                                    maxlength="64"
                                    :placeholder="
                                        authStore.user?.username ?? $t('pages.settings.displayName')
                                    "
                                    class="border-line bg-surface text-fg focus:border-accent flex-1 rounded-xl border px-4 py-2.5 text-[13px] transition-colors outline-none"
                                />
                                <button
                                    :disabled="savingProfile || !displayNameChanged"
                                    class="bg-accent hover:bg-accent/90 shrink-0 self-start rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                                    @click="saveDisplayName"
                                >
                                    <Icon
                                        v-if="savingProfile"
                                        name="lucide:loader-2"
                                        class="mr-1.5 inline h-4 w-4 animate-spin"
                                    />
                                    {{
                                        savingProfile
                                            ? $t("pages.settings.saving")
                                            : $t("pages.settings.save")
                                    }}
                                </button>
                            </div>
                            <p v-if="profileSuccess" class="mt-2 text-[12px] text-green-500">
                                <Icon name="lucide:check" class="mr-1 inline h-3.5 w-3.5" />
                                {{ $t("pages.settings.displayNameSaved") }}
                            </p>
                            <p v-if="profileError" class="mt-2 text-[12px] text-red-500">
                                {{ profileError }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.notifications") }}
                    </h2>
                    <div class="space-y-4">
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p class="text-fg text-[13px] font-medium">
                                    {{ $t("pages.settings.weeklyDigest") }}
                                </p>
                                <p class="text-fg-muted text-[12px]">
                                    {{ $t("pages.settings.weeklyDigestHint") }}
                                </p>
                            </div>
                            <button
                                :disabled="savingDigest"
                                class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg shrink-0 self-start rounded-xl border px-4 py-2 text-[13px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                                @click="toggleWeeklyDigest"
                            >
                                <Icon
                                    v-if="savingDigest"
                                    name="lucide:loader-2"
                                    class="mr-1.5 inline h-4 w-4 animate-spin"
                                />
                                <Icon
                                    v-else
                                    :name="weeklyDigestEnabled ? 'lucide:bell-off' : 'lucide:bell'"
                                    class="mr-1.5 inline h-4 w-4"
                                />
                                {{
                                    weeklyDigestEnabled
                                        ? $t("pages.settings.weeklyDigestDisable")
                                        : $t("pages.settings.weeklyDigestEnable")
                                }}
                            </button>
                        </div>
                        <p v-if="digestSuccess" class="text-[12px] text-green-500">
                            <Icon name="lucide:check" class="mr-1 inline h-3.5 w-3.5" />
                            {{ $t("pages.settings.weeklyDigestSaved") }}
                        </p>
                        <p v-if="digestError" class="text-[12px] text-red-500">
                            {{ digestError }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Security Tab -->
            <div v-if="activeTab === 'security'" class="space-y-6">
                <!-- Password Reset -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.security") }}
                    </h2>
                    <div class="space-y-4">
                        <div
                            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <p class="text-fg text-[13px] font-medium">
                                    {{ $t("pages.settings.password") }}
                                </p>
                                <p class="text-fg-muted text-[12px]">
                                    {{ $t("pages.settings.passwordHint") }}
                                </p>
                            </div>
                            <button
                                :disabled="resetSending || resetSent"
                                class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg shrink-0 self-start rounded-xl border px-4 py-2 text-[13px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                                @click="requestPasswordChange"
                            >
                                <Icon
                                    v-if="resetSending"
                                    name="lucide:loader-2"
                                    class="mr-1.5 inline h-4 w-4 animate-spin"
                                />
                                <Icon
                                    v-else-if="resetSent"
                                    name="lucide:check"
                                    class="mr-1.5 inline h-4 w-4 text-green-500"
                                />
                                <Icon v-else name="lucide:mail" class="mr-1.5 inline h-4 w-4" />
                                {{
                                    resetSent
                                        ? $t("pages.settings.resetSent")
                                        : resetSending
                                          ? $t("pages.settings.resetSending")
                                          : $t("pages.settings.resetRequest")
                                }}
                            </button>
                        </div>
                        <p v-if="resetSent" class="text-[12px] text-green-500">
                            <Icon name="lucide:info" class="mr-1 inline h-3.5 w-3.5" />
                            {{ $t("pages.settings.resetSentHint") }}
                        </p>
                        <p v-if="resetError" class="text-[12px] text-red-500">
                            {{ resetError }}
                        </p>
                    </div>
                </div>

                <!-- Username Change -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.usernameChange.title") }}
                    </h2>
                    <p class="text-fg-muted mb-4 text-[12px]">
                        {{ $t("pages.settings.usernameChange.hint") }}
                    </p>
                    <div class="space-y-3">
                        <div>
                            <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                                {{ $t("pages.settings.usernameChange.newUsername") }}
                            </label>
                            <input
                                v-model="usernameForm.newUsername"
                                type="text"
                                maxlength="32"
                                :placeholder="authStore.user?.username"
                                class="border-line bg-surface text-fg focus:border-accent w-full rounded-xl border px-4 py-2.5 text-[13px] transition-colors outline-none"
                            />
                        </div>
                        <div>
                            <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                                {{ $t("pages.settings.usernameChange.password") }}
                            </label>
                            <input
                                v-model="usernameForm.password"
                                type="password"
                                :placeholder="
                                    $t('pages.settings.usernameChange.passwordPlaceholder')
                                "
                                class="border-line bg-surface text-fg focus:border-accent w-full rounded-xl border px-4 py-2.5 text-[13px] transition-colors outline-none"
                                @keydown.enter="submitUsernameChange"
                            />
                        </div>
                        <div class="flex items-center justify-between">
                            <p v-if="usernameRateLimited" class="text-fg-muted text-[12px]">
                                <Icon name="lucide:clock" class="mr-1 inline h-3.5 w-3.5" />
                                {{ $t("pages.settings.usernameChange.rateLimited") }}
                            </p>
                            <span v-else />
                            <button
                                :disabled="
                                    usernameChanging || !usernameFormValid || usernameRateLimited
                                "
                                class="bg-accent hover:bg-accent/90 shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                                @click="submitUsernameChange"
                            >
                                <Icon
                                    v-if="usernameChanging"
                                    name="lucide:loader-2"
                                    class="mr-1.5 inline h-4 w-4 animate-spin"
                                />
                                {{ $t("pages.settings.save") }}
                            </button>
                        </div>
                        <p v-if="usernameSuccess" class="text-[12px] text-green-500">
                            <Icon name="lucide:check" class="mr-1 inline h-3.5 w-3.5" />
                            {{ $t("pages.settings.usernameChange.saved") }}
                        </p>
                        <p v-if="usernameError" class="text-[12px] text-red-500">
                            {{ usernameError }}
                        </p>
                    </div>
                </div>

                <!-- Email Change -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.emailChange.title") }}
                    </h2>
                    <p class="text-fg-muted mb-4 text-[12px]">
                        {{ $t("pages.settings.emailChange.hint") }}
                    </p>

                    <!-- Step 1: Request email change -->
                    <div v-if="!emailChangeCodeSent" class="space-y-3">
                        <div>
                            <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                                {{ $t("pages.settings.emailChange.currentEmail") }}
                            </label>
                            <p class="text-fg text-[13px]">{{ authStore.user?.email }}</p>
                        </div>
                        <div>
                            <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                                {{ $t("pages.settings.emailChange.newEmail") }}
                            </label>
                            <input
                                v-model="emailForm.newEmail"
                                type="email"
                                :placeholder="$t('pages.settings.emailChange.newEmailPlaceholder')"
                                class="border-line bg-surface text-fg focus:border-accent w-full rounded-xl border px-4 py-2.5 text-[13px] transition-colors outline-none"
                            />
                        </div>
                        <div>
                            <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                                {{ $t("pages.settings.emailChange.password") }}
                            </label>
                            <input
                                v-model="emailForm.password"
                                type="password"
                                :placeholder="$t('pages.settings.emailChange.passwordPlaceholder')"
                                class="border-line bg-surface text-fg focus:border-accent w-full rounded-xl border px-4 py-2.5 text-[13px] transition-colors outline-none"
                                @keydown.enter="requestEmailChange"
                            />
                        </div>
                        <div class="flex justify-end">
                            <button
                                :disabled="emailRequesting || !emailRequestFormValid"
                                class="bg-accent hover:bg-accent/90 shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                                @click="requestEmailChange"
                            >
                                <Icon
                                    v-if="emailRequesting"
                                    name="lucide:loader-2"
                                    class="mr-1.5 inline h-4 w-4 animate-spin"
                                />
                                {{ $t("pages.settings.emailChange.sendCode") }}
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: Confirm with code -->
                    <div v-else class="space-y-3">
                        <p class="text-fg-muted text-[12px]">
                            <Icon name="lucide:mail" class="mr-1 inline h-3.5 w-3.5" />
                            {{
                                $t("pages.settings.emailChange.codeSentTo", {
                                    email: emailForm.newEmail,
                                })
                            }}
                        </p>
                        <div>
                            <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                                {{ $t("pages.settings.emailChange.code") }}
                            </label>
                            <input
                                v-model="emailConfirmCode"
                                type="text"
                                maxlength="6"
                                inputmode="numeric"
                                :placeholder="$t('pages.settings.emailChange.codePlaceholder')"
                                class="border-line bg-surface text-fg focus:border-accent w-full rounded-xl border px-4 py-2.5 text-[13px] tracking-widest transition-colors outline-none"
                                @keydown.enter="confirmEmailChange"
                            />
                        </div>
                        <div class="flex items-center justify-between">
                            <button
                                class="text-fg-muted hover:text-fg text-[12px] underline transition-colors"
                                @click="resetEmailChangeFlow"
                            >
                                {{ $t("pages.settings.emailChange.back") }}
                            </button>
                            <button
                                :disabled="emailConfirming || emailConfirmCode.length !== 6"
                                class="bg-accent hover:bg-accent/90 shrink-0 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                                @click="confirmEmailChange"
                            >
                                <Icon
                                    v-if="emailConfirming"
                                    name="lucide:loader-2"
                                    class="mr-1.5 inline h-4 w-4 animate-spin"
                                />
                                {{ $t("pages.settings.emailChange.confirm") }}
                            </button>
                        </div>
                    </div>

                    <p v-if="emailSuccess" class="mt-3 text-[12px] text-green-500">
                        <Icon name="lucide:check" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("pages.settings.emailChange.saved") }}
                    </p>
                    <p v-if="emailError" class="mt-3 text-[12px] text-red-500">
                        {{ emailError }}
                    </p>
                </div>

                <!-- Cookie Preferences -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.cookiePreferences") }}
                    </h2>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p class="text-fg text-[13px] font-medium">
                                {{ $t("pages.settings.cookiePreferencesLabel") }}
                            </p>
                            <p class="text-fg-muted text-[12px]">
                                {{ $t("pages.settings.cookiePreferencesHint") }}
                            </p>
                        </div>
                        <button
                            class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg shrink-0 self-start rounded-xl border px-4 py-2 text-[13px] font-medium transition-all duration-200 sm:self-auto"
                            @click="revokeCookieConsent"
                        >
                            <Icon name="lucide:cookie" class="mr-1.5 inline h-4 w-4" />
                            {{ $t("pages.settings.cookieRevoke") }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Privacy Tab -->
            <div v-if="activeTab === 'privacy'" class="space-y-6">
                <!-- Data & Privacy (GDPR Export) -->
                <div class="glass-card p-6">
                    <h2 class="text-fg mb-4 text-[15px] font-semibold">
                        {{ $t("pages.settings.dataPrivacy") }}
                    </h2>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p class="text-fg text-[13px] font-medium">
                                {{ $t("pages.settings.exportData") }}
                            </p>
                            <p class="text-fg-muted text-[12px]">
                                {{ $t("pages.settings.exportDataHint") }}
                            </p>
                        </div>
                        <button
                            :disabled="
                                exportRequesting ||
                                exportStatus?.status === 'pending' ||
                                exportStatus?.status === 'processing'
                            "
                            class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg shrink-0 self-start rounded-xl border px-4 py-2 text-[13px] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                            @click="showExportDialog = true"
                        >
                            <Icon
                                v-if="exportRequesting || exportStatus?.status === 'processing'"
                                name="lucide:loader-2"
                                class="mr-1.5 inline h-4 w-4 animate-spin"
                            />
                            <Icon
                                v-else-if="exportStatus?.status === 'ready'"
                                name="lucide:check"
                                class="mr-1.5 inline h-4 w-4 text-green-400"
                            />
                            <Icon v-else name="lucide:download" class="mr-1.5 inline h-4 w-4" />
                            {{
                                exportStatus?.status === "processing" ||
                                exportStatus?.status === "pending"
                                    ? $t("pages.settings.exportDataExporting")
                                    : exportStatus?.status === "ready"
                                      ? $t("pages.settings.exportDataReady")
                                      : $t("pages.settings.exportData")
                            }}
                        </button>
                    </div>
                    <p
                        v-if="exportStatus?.status === 'ready' && exportStatus.expiresAt"
                        class="mt-3 text-[12px] text-green-500"
                    >
                        <Icon name="lucide:info" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("pages.settings.exportReadyHint") }}
                    </p>
                    <p
                        v-if="exportStatus?.status === 'failed'"
                        class="mt-3 text-[12px] text-red-500"
                    >
                        <Icon name="lucide:alert-circle" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("pages.settings.exportFailed") }}
                    </p>
                    <p v-if="exportError" class="mt-3 text-[12px] text-red-500">
                        {{ exportError }}
                    </p>
                </div>

                <!-- Danger Zone -->
                <div class="glass-card border border-red-500/20 p-6">
                    <h2 class="mb-4 text-[15px] font-semibold text-red-400">
                        {{ $t("pages.settings.dangerZone") }}
                    </h2>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p class="text-fg text-[13px] font-medium">
                                {{ $t("pages.settings.deleteAccount") }}
                            </p>
                            <p class="text-fg-muted text-[12px]">
                                {{ $t("pages.settings.deleteAccountHint") }}
                            </p>
                        </div>
                        <button
                            :disabled="deleteSending || deleteSent"
                            class="shrink-0 self-start rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-all duration-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                            @click="showDeleteDialog = true"
                        >
                            <Icon
                                v-if="deleteSending"
                                name="lucide:loader-2"
                                class="mr-1.5 inline h-4 w-4 animate-spin"
                            />
                            <Icon
                                v-else-if="deleteSent"
                                name="lucide:check"
                                class="mr-1.5 inline h-4 w-4"
                            />
                            <Icon v-else name="lucide:trash-2" class="mr-1.5 inline h-4 w-4" />
                            {{
                                deleteSent
                                    ? $t("pages.settings.deleteEmailSent")
                                    : deleteSending
                                      ? $t("pages.settings.deleteSending")
                                      : $t("pages.settings.deleteAccount")
                            }}
                        </button>
                    </div>
                    <p v-if="deleteSent" class="mt-3 text-[12px] text-green-500">
                        <Icon name="lucide:info" class="mr-1 inline h-3.5 w-3.5" />
                        {{ $t("pages.settings.deleteEmailSentHint") }}
                    </p>
                    <p v-if="deleteError" class="mt-3 text-[12px] text-red-500">
                        {{ deleteError }}
                    </p>
                </div>
            </div>
        </UiTabs>

        <!-- Export Data Confirmation Dialog -->
        <Teleport to="body">
            <div
                v-if="showExportDialog"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                @click.self="showExportDialog = false"
            >
                <div
                    class="border-line bg-surface w-full max-w-md rounded-2xl border p-6 shadow-2xl"
                >
                    <div class="mb-4 flex items-center gap-3">
                        <div
                            class="bg-brand/10 flex h-10 w-10 items-center justify-center rounded-full"
                        >
                            <Icon name="lucide:download" class="text-brand h-5 w-5" />
                        </div>
                        <h3 class="text-fg text-[16px] font-semibold">
                            {{ $t("pages.settings.exportDialogTitle") }}
                        </h3>
                    </div>
                    <p class="text-fg-muted mb-4 text-[13px]">
                        {{ $t("pages.settings.exportDialogMessage") }}
                    </p>
                    <div class="mb-4">
                        <label class="text-fg-dim mb-1 block text-[12px] font-medium">
                            {{ $t("pages.settings.exportDialogPasswordLabel") }}
                        </label>
                        <input
                            v-model="exportPassword"
                            type="password"
                            :placeholder="$t('pages.settings.exportDialogPasswordPlaceholder')"
                            class="border-line bg-surface-hover text-fg focus:border-brand w-full rounded-xl border px-4 py-2 text-[13px] transition-colors outline-none"
                            @keydown.enter="requestDataExport"
                        />
                    </div>
                    <p v-if="exportDialogError" class="mb-3 text-[12px] text-red-500">
                        {{ exportDialogError }}
                    </p>
                    <div class="flex justify-end gap-3">
                        <button
                            class="border-line text-fg-dim hover:bg-surface-hover hover:text-fg rounded-xl border px-4 py-2 text-[13px] transition-all"
                            @click="showExportDialog = false"
                        >
                            {{ $t("common.cancel") }}
                        </button>
                        <button
                            :disabled="exportRequesting || !exportPassword"
                            class="bg-brand hover:bg-brand/90 rounded-xl px-4 py-2 text-[13px] font-medium text-white transition-all disabled:opacity-50"
                            @click="requestDataExport"
                        >
                            <Icon
                                v-if="exportRequesting"
                                name="lucide:loader-2"
                                class="mr-1.5 inline h-4 w-4 animate-spin"
                            />
                            {{ $t("pages.settings.exportDialogConfirm") }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Delete Account Confirmation Dialog -->
        <UiConfirmDialog
            :show="showDeleteDialog"
            :title="$t('pages.settings.deleteDialogTitle')"
            :message="$t('pages.settings.deleteDialogMessage')"
            variant="danger"
            :confirm-label="$t('pages.settings.deleteDialogConfirm')"
            :cancel-label="$t('common.cancel')"
            :loading="deleteSending"
            @confirm="requestAccountDeletion"
            @cancel="showDeleteDialog = false"
        >
            <ul class="text-fg-muted mb-4 space-y-1 text-[12px]">
                <li>
                    <Icon name="lucide:x" class="mr-1 inline h-3 w-3 text-red-400" />
                    {{ $t("pages.settings.deleteDialogItem1") }}
                </li>
                <li>
                    <Icon name="lucide:x" class="mr-1 inline h-3 w-3 text-red-400" />
                    {{ $t("pages.settings.deleteDialogItem2") }}
                </li>
                <li>
                    <Icon name="lucide:x" class="mr-1 inline h-3 w-3 text-red-400" />
                    {{ $t("pages.settings.deleteDialogItem3") }}
                </li>
            </ul>
            <p class="text-fg-muted text-[12px]">
                {{ $t("pages.settings.deleteDialogConfirmHint") }}
            </p>
        </UiConfirmDialog>
    </div>
</template>

<script setup lang="ts">
import type { DataExportInfo } from "@cold-blood-cast/shared";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const { t } = useI18n();
const settings = useSettingsStore();
const authStore = useAuthStore();
const api = useApi();
const queryClient = useQueryClient();

useHead({ title: () => t("nav.settings") });

// ── Tabs ──
const activeTab = ref("general");
const settingsTabs = computed(() => [
    { key: "general", label: t("pages.settings.tabs.general"), icon: "lucide:settings" },
    { key: "security", label: t("pages.settings.tabs.security"), icon: "lucide:shield" },
    { key: "privacy", label: t("pages.settings.tabs.privacy"), icon: "lucide:lock" },
]);

// ── Locale Toggle ──
function toggleLocale() {
    const next = settings.currentLocale === "en" ? "de" : "en";
    settings.setLocale(next);
}

// ── Display Name ──
const displayName = ref(authStore.user?.displayName ?? "");
const savingProfile = ref(false);
const profileSuccess = ref(false);
const profileError = ref("");

const displayNameChanged = computed(() => {
    const current = authStore.user?.displayName ?? "";
    return displayName.value.trim() !== current;
});

async function saveDisplayName() {
    savingProfile.value = true;
    profileSuccess.value = false;
    profileError.value = "";

    try {
        const json = await api.patch<{ user: { displayName: string | null } }>(
            "/api/auth/profile",
            { displayName: displayName.value.trim() || null },
        );

        if (authStore.user) {
            authStore.user = { ...authStore.user, displayName: json.user.displayName };
        }
        displayName.value = json.user.displayName ?? "";
        profileSuccess.value = true;
        setTimeout(() => {
            profileSuccess.value = false;
        }, 3000);
    } catch (err: unknown) {
        profileError.value = err instanceof Error ? err.message : String(err);
    } finally {
        savingProfile.value = false;
    }
}

// ── Weekly Digest Toggle ──
const weeklyDigestEnabled = computed(() => !!authStore.user?.weeklyReportEnabled);
const savingDigest = ref(false);
const digestSuccess = ref(false);
const digestError = ref("");

async function toggleWeeklyDigest() {
    savingDigest.value = true;
    digestSuccess.value = false;
    digestError.value = "";

    try {
        const newVal = !weeklyDigestEnabled.value;
        const json = await api.patch<{ user: { weeklyReportEnabled: boolean } }>(
            "/api/auth/profile",
            { weeklyReportEnabled: newVal },
        );

        if (authStore.user) {
            authStore.user = {
                ...authStore.user,
                weeklyReportEnabled: json.user.weeklyReportEnabled,
            };
        }
        digestSuccess.value = true;
        setTimeout(() => {
            digestSuccess.value = false;
        }, 3000);
    } catch (err: unknown) {
        digestError.value = err instanceof Error ? err.message : String(err);
    } finally {
        savingDigest.value = false;
    }
}

// ── Password Reset ──
const resetSending = ref(false);
const resetSent = ref(false);
const resetError = ref("");

async function requestPasswordChange() {
    if (!authStore.user?.email) return;

    resetSending.value = true;
    resetError.value = "";

    try {
        await authStore.forgotPassword(authStore.user.email);
        resetSent.value = true;
    } catch (err: unknown) {
        resetError.value = err instanceof Error ? err.message : String(err);
    } finally {
        resetSending.value = false;
    }
}

// ── Username Change ──
const usernameForm = reactive({ newUsername: "", password: "" });
const usernameChanging = ref(false);
const usernameSuccess = ref(false);
const usernameError = ref("");

const usernameFormValid = computed(
    () => usernameForm.newUsername.trim().length >= 3 && usernameForm.password.length > 0,
);

const usernameRateLimited = computed(() => {
    const changedAt = authStore.user?.usernameChangedAt;
    if (!changedAt) return false;
    const cooldownMs = 30 * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(changedAt).getTime() < cooldownMs;
});

async function submitUsernameChange() {
    if (!usernameFormValid.value || usernameRateLimited.value) return;

    usernameChanging.value = true;
    usernameSuccess.value = false;
    usernameError.value = "";

    try {
        const json = await api.post<{ username: string }>("/api/auth/change-username", {
            newUsername: usernameForm.newUsername.trim(),
            password: usernameForm.password,
        });

        if (authStore.user) {
            authStore.user = {
                ...authStore.user,
                username: json.username,
                usernameChangedAt: new Date().toISOString(),
            };
        }
        usernameForm.newUsername = "";
        usernameForm.password = "";
        usernameSuccess.value = true;
        setTimeout(() => {
            usernameSuccess.value = false;
        }, 3000);
    } catch (err: unknown) {
        usernameError.value = err instanceof Error ? err.message : String(err);
    } finally {
        usernameChanging.value = false;
    }
}

// ── Email Change ──
const emailForm = reactive({ newEmail: "", password: "" });
const emailChangeCodeSent = ref(false);
const emailConfirmCode = ref("");
const emailRequesting = ref(false);
const emailConfirming = ref(false);
const emailSuccess = ref(false);
const emailError = ref("");

const emailRequestFormValid = computed(
    () => emailForm.newEmail.trim().length > 0 && emailForm.password.length > 0,
);

async function requestEmailChange() {
    if (!emailRequestFormValid.value) return;

    emailRequesting.value = true;
    emailError.value = "";

    try {
        await api.post("/api/auth/request-email-change", {
            newEmail: emailForm.newEmail.trim(),
            password: emailForm.password,
        });
        emailChangeCodeSent.value = true;
        emailForm.password = "";
    } catch (err: unknown) {
        emailError.value = err instanceof Error ? err.message : String(err);
    } finally {
        emailRequesting.value = false;
    }
}

async function confirmEmailChange() {
    if (emailConfirmCode.value.length !== 6) return;

    emailConfirming.value = true;
    emailError.value = "";

    try {
        const json = await api.post<{ email: string }>("/api/auth/confirm-email-change", {
            code: emailConfirmCode.value,
        });

        if (authStore.user) {
            authStore.user = { ...authStore.user, email: json.email };
        }
        resetEmailChangeFlow();
        emailSuccess.value = true;
        setTimeout(() => {
            emailSuccess.value = false;
        }, 3000);
    } catch (err: unknown) {
        emailError.value = err instanceof Error ? err.message : String(err);
    } finally {
        emailConfirming.value = false;
    }
}

function resetEmailChangeFlow() {
    emailChangeCodeSent.value = false;
    emailConfirmCode.value = "";
    emailForm.newEmail = "";
    emailForm.password = "";
    emailError.value = "";
}

// ── Account Deletion ──
const showDeleteDialog = ref(false);
const deleteSending = ref(false);
const deleteSent = ref(false);
const deleteError = ref("");

async function requestAccountDeletion() {
    deleteSending.value = true;
    deleteError.value = "";

    try {
        await api.post("/api/auth/request-account-deletion");
        deleteSent.value = true;
        showDeleteDialog.value = false;
    } catch (err: unknown) {
        deleteError.value = err instanceof Error ? err.message : String(err);
    } finally {
        deleteSending.value = false;
    }
}

// ── Cookie Preferences ──
function revokeCookieConsent() {
    // Clear both the current and the legacy storage key so the banner re-prompts
    // regardless of which schema version was previously stored.
    localStorage.removeItem("cbc-cookie-consent");
    localStorage.removeItem("kl_cookie_consent");
    window.location.reload();
}

// ── Data Export (GDPR) ──
const showExportDialog = ref(false);
const exportPassword = ref("");
const exportRequesting = ref(false);
const exportError = ref("");
const exportDialogError = ref("");
let exportPollTimer: ReturnType<typeof setInterval> | null = null;

const { data: exportStatusData } = useQuery({
    queryKey: ["data-export-status"],
    queryFn: async () => {
        try {
            return await api.get<DataExportInfo | null>("/api/data-export/status");
        } catch {
            return null;
        }
    },
});

const exportStatus = computed(() => exportStatusData.value ?? null);

async function requestDataExport() {
    if (!exportPassword.value) return;

    exportRequesting.value = true;
    exportDialogError.value = "";
    exportError.value = "";

    try {
        await api.post("/api/data-export", { password: exportPassword.value });
        showExportDialog.value = false;
        exportPassword.value = "";
        queryClient.invalidateQueries({ queryKey: ["data-export-status"] });
        startExportPolling();
    } catch (err: unknown) {
        exportDialogError.value = err instanceof Error ? err.message : String(err);
    } finally {
        exportRequesting.value = false;
    }
}

function startExportPolling() {
    stopExportPolling();
    exportPollTimer = setInterval(async () => {
        await queryClient.invalidateQueries({ queryKey: ["data-export-status"] });
        if (
            exportStatus.value?.status !== "pending" &&
            exportStatus.value?.status !== "processing"
        ) {
            stopExportPolling();
        }
    }, 5000);
}

function stopExportPolling() {
    if (exportPollTimer) {
        clearInterval(exportPollTimer);
        exportPollTimer = null;
    }
}

onUnmounted(() => {
    stopExportPolling();
});
</script>
