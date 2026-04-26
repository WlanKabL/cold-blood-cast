<template>
    <div class="space-y-6">
        <!-- Header -->
        <div>
            <h1 class="text-fg text-2xl font-bold tracking-tight">
                {{ $t("admin.emails.title") }}
            </h1>
            <p class="text-fg-muted mt-1 text-[12px]">
                {{ $t("admin.emails.subtitle") }}
            </p>
        </div>

        <!-- Tab Bar -->
        <div class="bg-surface-raised flex gap-1 rounded-xl p-1">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                class="flex-1 rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                :class="
                    activeTab === tab.key
                        ? 'bg-surface-active text-fg shadow-sm'
                        : 'text-fg-muted hover:text-fg-soft'
                "
                @click="activeTab = tab.key"
            >
                <Icon :name="tab.icon" class="mr-1.5 inline h-4 w-4" />
                {{ $t(tab.label) }}
            </button>
        </div>

        <!-- ═══════════════════════════════════════════ -->
        <!-- SEND EMAIL TAB                              -->
        <!-- ═══════════════════════════════════════════ -->
        <div v-if="activeTab === 'send'" class="grid gap-6 lg:grid-cols-2">
            <!-- Left: Form -->
            <div class="space-y-4">
                <!-- Test Digest Card -->
                <div class="glass-card flex items-center justify-between gap-4 p-4">
                    <div>
                        <p class="text-fg text-[13px] font-medium">
                            {{ $t("admin.emails.testDigest.title") }}
                        </p>
                        <p class="text-fg-muted mt-0.5 text-[11px]">
                            {{ $t("admin.emails.testDigest.description") }}
                        </p>
                    </div>
                    <button
                        class="bg-primary-600 hover:bg-primary-500 shrink-0 rounded-xl px-4 py-2 text-[12px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="sendingDigest"
                        @click="sendTestDigest"
                    >
                        <Icon
                            :name="sendingDigest ? 'lucide:loader-2' : 'lucide:calendar-check'"
                            class="mr-1 inline h-3.5 w-3.5"
                            :class="{ 'animate-spin': sendingDigest }"
                        />
                        {{ $t("admin.emails.testDigest.button") }}
                    </button>
                </div>

                <div class="glass-card space-y-4 p-5">
                    <!-- Recipient mode toggle -->
                    <div>
                        <label class="text-fg-muted mb-1.5 block text-[12px] font-medium">
                            {{ $t("admin.emails.recipient") }}
                        </label>
                        <div class="flex gap-2">
                            <button
                                class="flex-1 rounded-lg px-3 py-2 text-[12px] font-medium transition-all"
                                :class="
                                    recipientMode === 'user'
                                        ? 'bg-primary-600/20 text-primary-400 ring-primary-500/30 ring-1'
                                        : 'bg-surface-raised text-fg-muted hover:text-fg-soft'
                                "
                                @click="recipientMode = 'user'"
                            >
                                <Icon name="lucide:users" class="mr-1 inline h-3.5 w-3.5" />
                                {{ $t("admin.emails.selectUsers") }}
                            </button>
                            <button
                                class="flex-1 rounded-lg px-3 py-2 text-[12px] font-medium transition-all"
                                :class="
                                    recipientMode === 'manual'
                                        ? 'bg-primary-600/20 text-primary-400 ring-primary-500/30 ring-1'
                                        : 'bg-surface-raised text-fg-muted hover:text-fg-soft'
                                "
                                @click="recipientMode = 'manual'"
                            >
                                <Icon name="lucide:at-sign" class="mr-1 inline h-3.5 w-3.5" />
                                {{ $t("admin.emails.manualEmail") }}
                            </button>
                        </div>
                    </div>

                    <!-- User search + multi-select -->
                    <div v-if="recipientMode === 'user'" class="relative">
                        <input
                            v-model="userSearch"
                            type="text"
                            :placeholder="$t('admin.emails.searchUsers')"
                            class="border-line bg-page text-fg placeholder:text-fg-faint focus:border-primary-500 focus:ring-primary-500/30 w-full rounded-xl border px-3 py-2.5 text-[13px] focus:ring-1 focus:outline-none"
                            @input="debouncedSearchUsers"
                            @focus="showUserDropdown = true"
                        />
                        <!-- Selected users badges -->
                        <div v-if="selectedUsers.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                            <span
                                v-for="u in selectedUsers"
                                :key="u.id"
                                class="bg-primary-500/15 text-primary-400 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px]"
                            >
                                <Icon name="lucide:user" class="h-3 w-3" />
                                {{ u.username }}
                                <button
                                    class="hover:text-primary-200 ml-0.5"
                                    @click="removeUser(u.id)"
                                >
                                    <Icon name="lucide:x" class="h-3 w-3" />
                                </button>
                            </span>
                        </div>
                        <!-- Dropdown -->
                        <div
                            v-if="showUserDropdown && filteredSearchResults.length > 0"
                            class="border-line bg-surface-raised absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border shadow-lg"
                        >
                            <button
                                v-for="u in filteredSearchResults"
                                :key="u.id"
                                class="hover:bg-surface-hover flex w-full items-center gap-3 px-3 py-2 text-left text-[12px]"
                                @click="addUser(u)"
                            >
                                <span class="text-fg font-medium">{{ u.username }}</span>
                                <span class="text-fg-faint">{{ u.email }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Manual email -->
                    <div v-else>
                        <input
                            v-model="manualEmail"
                            type="email"
                            :placeholder="$t('admin.emails.emailPlaceholder')"
                            class="border-line bg-page text-fg placeholder:text-fg-faint focus:border-primary-500 focus:ring-primary-500/30 w-full rounded-xl border px-3 py-2.5 text-[13px] focus:ring-1 focus:outline-none"
                        />
                    </div>

                    <!-- Template select -->
                    <div>
                        <label class="text-fg-muted mb-1.5 block text-[12px] font-medium">
                            {{ $t("admin.emails.template") }}
                        </label>
                        <select
                            v-model="selectedTemplate"
                            class="border-line bg-page text-fg focus:border-primary-500 focus:ring-primary-500/30 w-full rounded-xl border px-3 py-2.5 text-[13px] focus:ring-1 focus:outline-none"
                            @change="onTemplateChange"
                        >
                            <option value="" disabled>
                                {{ $t("admin.emails.chooseTemplate") }}
                            </option>
                            <option v-for="tpl in templates" :key="tpl.key" :value="tpl.key">
                                {{ tpl.label }}
                            </option>
                        </select>
                    </div>

                    <!-- Subject -->
                    <div>
                        <label class="text-fg-muted mb-1.5 block text-[12px] font-medium">
                            {{ $t("admin.emails.subject") }}
                        </label>
                        <input
                            v-model="subject"
                            type="text"
                            class="border-line bg-page text-fg placeholder:text-fg-faint focus:border-primary-500 focus:ring-primary-500/30 w-full rounded-xl border px-3 py-2.5 text-[13px] focus:ring-1 focus:outline-none"
                        />
                    </div>

                    <!-- Dynamic fields -->
                    <template v-if="currentFields.length > 0">
                        <div class="border-line-faint border-t pt-3">
                            <p
                                class="text-fg-faint mb-3 text-[11px] font-semibold tracking-wider uppercase"
                            >
                                {{ $t("admin.emails.templateFields") }}
                            </p>
                            <div class="space-y-3">
                                <div v-for="field in currentFields" :key="field.key">
                                    <label class="text-fg-muted mb-1 block text-[12px] font-medium">
                                        {{ field.label }}
                                        <span
                                            v-if="field.required && !isAutoPersonalized(field.key)"
                                            class="text-red-400"
                                            >*</span
                                        >
                                    </label>
                                    <!-- Auto-personalized hint for username when multi-user -->
                                    <div
                                        v-if="isAutoPersonalized(field.key)"
                                        class="border-line-faint bg-surface-raised text-fg-faint flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px]"
                                    >
                                        <Icon
                                            name="lucide:sparkles"
                                            class="text-primary-400 h-3.5 w-3.5"
                                        />
                                        {{ $t("admin.emails.autoPersonalized") }}
                                    </div>
                                    <textarea
                                        v-else-if="field.type === 'textarea'"
                                        v-model="templateData[field.key]"
                                        rows="5"
                                        class="border-line bg-page text-fg placeholder:text-fg-faint focus:border-primary-500 focus:ring-primary-500/30 w-full rounded-xl border px-3 py-2.5 text-[13px] focus:ring-1 focus:outline-none"
                                    />
                                    <input
                                        v-else
                                        v-model="templateData[field.key]"
                                        type="text"
                                        class="border-line bg-page text-fg placeholder:text-fg-faint focus:border-primary-500 focus:ring-primary-500/30 w-full rounded-xl border px-3 py-2.5 text-[13px] focus:ring-1 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Variables Lexicon (collapsible) -->
                    <div v-if="selectedTemplate" class="border-line-faint border-t pt-3">
                        <button
                            class="text-fg-faint hover:text-fg-muted flex w-full items-center gap-2 text-left text-[11px] font-semibold tracking-wider uppercase transition-colors"
                            @click="showVariables = !showVariables"
                        >
                            <Icon
                                name="lucide:chevron-right"
                                class="h-3.5 w-3.5 transition-transform"
                                :class="{ 'rotate-90': showVariables }"
                            />
                            <Icon name="lucide:braces" class="h-3.5 w-3.5" />
                            {{ $t("admin.emails.variablesTitle") }}
                        </button>
                        <Transition
                            enter-active-class="transition-all duration-200 ease-out"
                            leave-active-class="transition-all duration-150 ease-in"
                            enter-from-class="max-h-0 opacity-0"
                            enter-to-class="max-h-96 opacity-100"
                            leave-from-class="max-h-96 opacity-100"
                            leave-to-class="max-h-0 opacity-0"
                        >
                            <div v-if="showVariables" class="mt-3 space-y-3 overflow-hidden">
                                <p class="text-fg-faint text-[11px]">
                                    {{ $t("admin.emails.variablesHint") }}
                                </p>

                                <!-- System Variables -->
                                <div v-if="availableVariables.system.length > 0">
                                    <p
                                        class="text-fg-faint mb-1.5 text-[10px] font-semibold tracking-wider uppercase"
                                    >
                                        {{ $t("admin.emails.variablesSystem") }}
                                    </p>
                                    <div class="space-y-1">
                                        <div
                                            v-for="v in availableVariables.system"
                                            :key="v.key"
                                            class="bg-surface-raised flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                                        >
                                            <code
                                                class="bg-page text-primary-400 rounded px-1.5 py-0.5 text-[11px] font-medium"
                                                >{{ varTag(v.key) }}</code
                                            >
                                            <span class="text-fg-muted flex-1 text-[11px]">{{
                                                v.description
                                            }}</span>
                                            <span class="text-fg-faint text-[10px]">{{
                                                v.example
                                            }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- User Variables -->
                                <div v-if="availableVariables.user.length > 0">
                                    <p
                                        class="text-fg-faint mb-1.5 text-[10px] font-semibold tracking-wider uppercase"
                                    >
                                        {{ $t("admin.emails.variablesUser") }}
                                    </p>
                                    <div class="space-y-1">
                                        <div
                                            v-for="v in availableVariables.user"
                                            :key="v.key"
                                            class="bg-surface-raised flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                                        >
                                            <code
                                                class="bg-page rounded px-1.5 py-0.5 text-[11px] font-medium text-green-400"
                                                >{{ varTag(v.key) }}</code
                                            >
                                            <span class="text-fg-muted flex-1 text-[11px]">{{
                                                v.description
                                            }}</span>
                                            <span class="text-fg-faint text-[10px]">{{
                                                v.example
                                            }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </div>

                    <!-- Actions -->
                    <div class="border-line-faint flex gap-2 border-t pt-4">
                        <button
                            class="bg-surface-raised text-fg-muted hover:bg-surface-hover hover:text-fg flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors"
                            :disabled="!selectedTemplate"
                            @click="loadPreview"
                        >
                            <Icon name="lucide:eye" class="mr-1.5 inline h-4 w-4" />
                            {{ $t("admin.emails.preview") }}
                        </button>
                        <button
                            class="bg-primary-600 hover:bg-primary-500 flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="!canSend || sending"
                            @click="confirmSend"
                        >
                            <Icon
                                :name="sending ? 'lucide:loader-2' : 'lucide:send'"
                                class="mr-1.5 inline h-4 w-4"
                                :class="{ 'animate-spin': sending }"
                            />
                            {{ sending ? $t("admin.emails.sending") : $t("admin.emails.send") }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Preview -->
            <div class="glass-card flex flex-col overflow-hidden p-0">
                <div class="border-line flex items-center gap-2 border-b px-4 py-3">
                    <Icon name="lucide:monitor" class="text-fg-faint h-4 w-4" />
                    <span class="text-fg-muted text-[12px] font-medium">
                        {{ $t("admin.emails.previewTitle") }}
                    </span>
                </div>
                <div v-if="!previewHtml" class="flex flex-1 items-center justify-center p-8">
                    <p class="text-fg-faint text-[12px]">
                        {{ $t("admin.emails.previewEmpty") }}
                    </p>
                </div>
                <iframe
                    v-else
                    :srcdoc="previewHtml"
                    class="min-h-125 w-full flex-1 border-0 bg-white"
                    sandbox="allow-same-origin"
                />
            </div>
        </div>

        <!-- ═══════════════════════════════════════════ -->
        <!-- MAIL LOG TAB                                -->
        <!-- ═══════════════════════════════════════════ -->
        <div v-if="activeTab === 'log'" class="space-y-4">
            <!-- Filters -->
            <div class="glass-card flex flex-wrap items-center gap-3 p-4">
                <input
                    v-model="logSearch"
                    type="text"
                    :placeholder="$t('admin.emails.logSearchPlaceholder')"
                    class="border-line bg-page text-fg placeholder:text-fg-faint focus:border-primary-500 focus:ring-primary-500/30 flex-1 rounded-xl border px-3 py-2 text-[13px] focus:ring-1 focus:outline-none"
                    @input="debouncedLoadLog"
                />
                <select
                    v-model="logTemplateFilter"
                    class="border-line bg-page text-fg focus:border-primary-500 rounded-xl border px-3 py-2 text-[13px] focus:outline-none"
                    @change="debouncedLoadLog"
                >
                    <option value="">{{ $t("admin.emails.allTemplates") }}</option>
                    <option v-for="tpl in templates" :key="tpl.key" :value="tpl.key">
                        {{ tpl.label }}
                    </option>
                </select>
                <select
                    v-model="logStatusFilter"
                    class="border-line bg-page text-fg focus:border-primary-500 rounded-xl border px-3 py-2 text-[13px] focus:outline-none"
                    @change="debouncedLoadLog"
                >
                    <option value="">{{ $t("admin.emails.allStatus") }}</option>
                    <option value="sent">{{ $t("admin.emails.statusSent") }}</option>
                    <option value="failed">{{ $t("admin.emails.statusFailed") }}</option>
                </select>
            </div>

            <!-- Loading -->
            <div v-if="logLoading" class="overflow-hidden">
                <div
                    v-for="i in 6"
                    :key="i"
                    class="border-line-faint flex items-center gap-4 border-b px-4 py-3"
                >
                    <UiSkeleton width="80" height="12" />
                    <UiSkeleton width="140" height="13" />
                    <UiSkeleton width="56" height="18" rounded="full" />
                    <UiSkeleton width="100" height="12" />
                </div>
            </div>

            <!-- Table -->
            <div v-else>
                <div v-if="!logEntries.length" class="glass-card p-8 text-center">
                    <p class="text-fg-muted text-[13px]">{{ $t("admin.emails.logEmpty") }}</p>
                </div>

                <div v-else class="overflow-x-auto">
                    <div class="space-y-0 md:hidden">
                        <div
                            v-for="entry in logEntries"
                            :key="'m-' + entry.id"
                            class="border-line-faint border-b px-4 py-3"
                        >
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-fg truncate text-[13px] font-medium">{{
                                    entry.to
                                }}</span>
                                <span class="text-fg-muted shrink-0 text-[11px]">{{
                                    formatDateTime(entry.sentAt)
                                }}</span>
                            </div>
                            <div class="mt-1 flex flex-wrap items-center gap-2">
                                <span
                                    class="bg-primary-500/15 text-primary-400 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    >{{ templateLabel(entry.template) }}</span
                                >
                                <span
                                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    :class="
                                        entry.status === 'sent'
                                            ? 'bg-green-500/15 text-green-400'
                                            : 'bg-red-500/15 text-red-400'
                                    "
                                    >{{
                                        entry.status === "sent"
                                            ? $t("admin.emails.statusSent")
                                            : $t("admin.emails.statusFailed")
                                    }}</span
                                >
                            </div>
                            <p class="text-fg-faint mt-0.5 truncate text-[11px]">
                                {{ entry.subject }}
                            </p>
                            <p v-if="entry.user" class="text-fg-faint text-[11px]">
                                {{ entry.user.username }}
                            </p>
                        </div>
                    </div>

                    <table class="hidden w-full text-left text-[13px] md:table">
                        <thead>
                            <tr
                                class="border-line text-fg-faint border-b text-[11px] font-semibold tracking-wider uppercase"
                            >
                                <th class="px-4 py-3">{{ $t("admin.emails.colDate") }}</th>
                                <th class="px-4 py-3">{{ $t("admin.emails.colRecipient") }}</th>
                                <th class="px-4 py-3">{{ $t("admin.emails.colTemplate") }}</th>
                                <th class="px-4 py-3">{{ $t("admin.emails.colSubject") }}</th>
                                <th class="px-4 py-3">{{ $t("admin.emails.colStatus") }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="entry in logEntries"
                                :key="entry.id"
                                class="border-line-faint hover:bg-surface-hover border-b transition-colors"
                            >
                                <td class="text-fg-muted px-4 py-3 whitespace-nowrap">
                                    {{ formatDateTime(entry.sentAt) }}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex flex-col">
                                        <span class="text-fg">{{ entry.to }}</span>
                                        <span v-if="entry.user" class="text-fg-faint text-[11px]">
                                            {{ entry.user.username }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="bg-primary-500/15 text-primary-400 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    >
                                        {{ templateLabel(entry.template) }}
                                    </span>
                                </td>
                                <td class="text-fg-muted max-w-50 truncate px-4 py-3">
                                    {{ entry.subject }}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                        :class="
                                            entry.status === 'sent'
                                                ? 'bg-green-500/15 text-green-400'
                                                : 'bg-red-500/15 text-red-400'
                                        "
                                    >
                                        {{
                                            entry.status === "sent"
                                                ? $t("admin.emails.statusSent")
                                                : $t("admin.emails.statusFailed")
                                        }}
                                    </span>
                                    <span
                                        v-if="entry.error"
                                        class="ml-1 text-[10px] text-red-400"
                                        :title="entry.error"
                                    >
                                        <Icon name="lucide:alert-circle" class="inline h-3 w-3" />
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div
                    v-if="logPagination.totalPages > 1"
                    class="mt-4 flex items-center justify-between"
                >
                    <span class="text-fg-faint text-[12px]">
                        {{
                            $t("admin.emails.showing", {
                                from: (logPagination.page - 1) * logPagination.limit + 1,
                                to: Math.min(
                                    logPagination.page * logPagination.limit,
                                    logPagination.total,
                                ),
                                total: logPagination.total,
                            })
                        }}
                    </span>
                    <div class="flex gap-1">
                        <button
                            class="rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors"
                            :class="
                                logPagination.page > 1
                                    ? 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                                    : 'text-fg-faint cursor-not-allowed opacity-50'
                            "
                            :disabled="logPagination.page <= 1"
                            @click="logPagination.page > 1 && goToPage(logPagination.page - 1)"
                        >
                            {{ $t("admin.emails.prev") }}
                        </button>
                        <button
                            class="rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors"
                            :class="
                                logPagination.page < logPagination.totalPages
                                    ? 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                                    : 'text-fg-faint cursor-not-allowed opacity-50'
                            "
                            :disabled="logPagination.page >= logPagination.totalPages"
                            @click="
                                logPagination.page < logPagination.totalPages &&
                                goToPage(logPagination.page + 1)
                            "
                        >
                            {{ $t("admin.emails.next") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Send Confirmation Modal -->
        <Teleport to="body">
            <Transition
                enter-active-class="transition-opacity duration-200"
                enter-from-class="opacity-0"
                leave-active-class="transition-opacity duration-200"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="showConfirmModal"
                    class="bg-page-translucent/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
                    @click.self="showConfirmModal = false"
                >
                    <div class="glass-card w-full max-w-md space-y-4 p-6">
                        <h3 class="text-fg text-[15px] font-semibold">
                            {{ $t("admin.emails.confirmTitle") }}
                        </h3>
                        <div class="space-y-2 text-[13px]">
                            <div class="text-fg-muted">
                                <strong class="text-fg"
                                    >{{ $t("admin.emails.colRecipient") }}:</strong
                                >
                                <div
                                    v-if="recipientMode === 'user' && selectedUsers.length > 1"
                                    class="mt-1 flex flex-wrap gap-1"
                                >
                                    <span
                                        v-for="u in selectedUsers"
                                        :key="u.id"
                                        class="bg-surface-raised text-fg-muted rounded-md px-1.5 py-0.5 text-[11px]"
                                    >
                                        {{ u.username }}
                                    </span>
                                </div>
                                <span v-else>{{ confirmRecipient }}</span>
                            </div>
                            <p
                                v-if="recipientMode === 'user' && selectedUsers.length > 1"
                                class="text-primary-400 flex items-center gap-1.5 text-[11px]"
                            >
                                <Icon name="lucide:sparkles" class="h-3 w-3" />
                                {{
                                    $t("admin.emails.confirmPersonalized", {
                                        count: selectedUsers.length,
                                    })
                                }}
                            </p>
                            <p class="text-fg-muted">
                                <strong class="text-fg"
                                    >{{ $t("admin.emails.colTemplate") }}:</strong
                                >
                                {{ templateLabel(selectedTemplate) }}
                            </p>
                            <p class="text-fg-muted">
                                <strong class="text-fg"
                                    >{{ $t("admin.emails.colSubject") }}:</strong
                                >
                                {{ subject }}
                            </p>
                        </div>
                        <div class="flex justify-end gap-2 pt-2">
                            <button
                                class="bg-surface-raised text-fg-muted hover:bg-surface-hover rounded-xl px-4 py-2 text-[13px] font-medium"
                                @click="showConfirmModal = false"
                            >
                                {{ $t("admin.cancel") }}
                            </button>
                            <button
                                class="bg-primary-600 hover:bg-primary-500 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
                                :disabled="sending"
                                @click="doSend"
                            >
                                <Icon
                                    :name="sending ? 'lucide:loader-2' : 'lucide:send'"
                                    class="mr-1.5 inline h-4 w-4"
                                    :class="{ 'animate-spin': sending }"
                                />
                                {{ $t("admin.emails.send") }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { EmailLogEntry } from "@cold-blood-cast/shared";
import { useQuery } from "@tanstack/vue-query";

definePageMeta({ layout: "admin" });

const { t } = useI18n();

useHead({ title: () => `${t("admin.emails.title")} — Admin` });

const { formatDateTime } = useFormatters();
const api = useApi();
const toast = useAppToast();

// ─── Tabs ────────────────────────────────────────────────────

type Tab = "send" | "log";
const activeTab = ref<Tab>("send");
const tabs = [
    { key: "send" as Tab, icon: "lucide:send", label: "admin.emails.tabSend" },
    { key: "log" as Tab, icon: "lucide:scroll-text", label: "admin.emails.tabLog" },
];

// ─── Templates ───────────────────────────────────────────────

interface TemplateField {
    key: string;
    label: string;
    required: boolean;
    defaultValue?: string;
    type?: "text" | "textarea";
}

interface TemplateInfo {
    key: string;
    label: string;
    defaultSubject: string;
    fields: TemplateField[];
}

const templates = ref<TemplateInfo[]>([]);
const selectedTemplate = ref("");
const subject = ref("");
const templateData = ref<Record<string, string>>({});
const previewHtml = ref("");

// ─── Variables Lexicon ───────────────────────────────────────

interface VariableInfo {
    key: string;
    label: string;
    description: string;
    example: string;
    category: "system" | "user";
}

const showVariables = ref(false);
const availableVariables = ref<{ system: VariableInfo[]; user: VariableInfo[] }>({
    system: [],
    user: [],
});

const currentFields = computed(() => {
    const tpl = templates.value.find((tp) => tp.key === selectedTemplate.value);
    return tpl?.fields ?? [];
});

function onTemplateChange(): void {
    const tpl = templates.value.find((tp) => tp.key === selectedTemplate.value);
    if (!tpl) return;
    subject.value = tpl.defaultSubject;
    const data: Record<string, string> = {};
    for (const field of tpl.fields) {
        if (field.defaultValue) data[field.key] = field.defaultValue;
        else data[field.key] = "";
    }
    // Auto-fill username for single user
    if (selectedUsers.value.length === 1 && data.username !== undefined && selectedUsers.value[0]) {
        data.username = selectedUsers.value[0].username;
    }
    templateData.value = data;
    previewHtml.value = "";
}

/** Whether a field is auto-personalized per user (multi-user + username field) */
function isAutoPersonalized(fieldKey: string): boolean {
    return (
        fieldKey === "username" && recipientMode.value === "user" && selectedUsers.value.length > 1
    );
}

/** Format a variable key as a mustache tag for display */
function varTag(key: string): string {
    const open = "{{";
    const close = "}}";
    return `${open}${key}${close}`;
}

// ─── Recipients ──────────────────────────────────────────────

type UserEntry = { id: string; username: string; email: string };

const recipientMode = ref<"user" | "manual">("user");
const manualEmail = ref("");
const userSearch = ref("");
const showUserDropdown = ref(false);
const searchResults = ref<UserEntry[]>([]);
const selectedUsers = ref<UserEntry[]>([]);

// Filter out already-selected users from dropdown
const filteredSearchResults = computed(() =>
    searchResults.value.filter((u) => !selectedUsers.value.some((s) => s.id === u.id)),
);

let searchTimeout: ReturnType<typeof setTimeout> | undefined;
function debouncedSearchUsers(): void {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchUsers, 300);
}

async function searchUsers(): Promise<void> {
    if (userSearch.value.length < 2) {
        searchResults.value = [];
        return;
    }
    try {
        const res = await api.get<{
            items: Array<UserEntry>;
        }>(`/api/admin/users?search=${encodeURIComponent(userSearch.value)}&limit=10`);
        searchResults.value = res.items;
        showUserDropdown.value = true;
    } catch {
        searchResults.value = [];
    }
}

function addUser(u: UserEntry): void {
    if (selectedUsers.value.some((s) => s.id === u.id)) return;
    selectedUsers.value.push(u);
    userSearch.value = "";
    showUserDropdown.value = false;
    searchResults.value = [];
    // Auto-fill username if single user + template has username field
    if (selectedUsers.value.length === 1 && templateData.value.username !== undefined) {
        templateData.value.username = u.username;
    }
    // Clear username if multiple users (backend auto-fills per user)
    if (selectedUsers.value.length > 1 && templateData.value.username !== undefined) {
        templateData.value.username = "";
    }
}

function removeUser(userId: string): void {
    selectedUsers.value = selectedUsers.value.filter((u) => u.id !== userId);
    // Re-fill username for remaining single user
    if (
        selectedUsers.value.length === 1 &&
        templateData.value.username !== undefined &&
        selectedUsers.value[0]
    ) {
        templateData.value.username = selectedUsers.value[0].username;
    }
}

const confirmRecipient = computed(() => {
    if (recipientMode.value === "user") {
        const first = selectedUsers.value[0];
        if (selectedUsers.value.length === 1 && first) {
            return `${first.username} (${first.email})`;
        }
        return `${selectedUsers.value.length} ${t("admin.emails.usersSelected")}`;
    }
    return manualEmail.value;
});

const canSend = computed(() => {
    const hasRecipient =
        (recipientMode.value === "user" && selectedUsers.value.length > 0) ||
        (recipientMode.value === "manual" && manualEmail.value.includes("@"));
    const hasTemplate = !!selectedTemplate.value;
    const hasSubject = !!subject.value;
    const requiredOk = currentFields.value
        .filter((f) => f.required && !isAutoPersonalized(f.key))
        .every((f) => !!templateData.value[f.key]?.trim());
    return hasRecipient && hasTemplate && hasSubject && requiredOk;
});

// ─── Preview ─────────────────────────────────────────────────

async function loadPreview(): Promise<void> {
    if (!selectedTemplate.value) return;
    try {
        const res = await api.post<{ html: string; subject: string }>("/api/admin/emails/preview", {
            template: selectedTemplate.value,
            templateData: templateData.value,
            subject: subject.value,
        });
        previewHtml.value = res.html;
    } catch {
        toast.add({ title: t("admin.emails.previewError"), color: "red", timeout: 4000 });
    }
}

// ─── Send ────────────────────────────────────────────────────

interface SendResult {
    results: Array<{ to: string; username: string; sent: boolean }>;
    totalSent: number;
    totalFailed: number;
}

const sending = ref(false);
const showConfirmModal = ref(false);

// ─── Test Digest ─────────────────────────────────────────

const sendingDigest = ref(false);

async function sendTestDigest(): Promise<void> {
    sendingDigest.value = true;
    try {
        const res = await api.post<{ sent: boolean; to: string }>(
            "/api/admin/emails/test-digest",
            {},
        );
        if (res.sent) {
            toast.add({
                title: t("admin.emails.testDigest.success", { email: res.to }),
                color: "green",
                timeout: 5000,
            });
        } else {
            toast.add({
                title: t("admin.emails.testDigest.failed"),
                color: "red",
                timeout: 5000,
            });
        }
    } catch {
        toast.add({
            title: t("admin.emails.testDigest.failed"),
            color: "red",
            timeout: 5000,
        });
    } finally {
        sendingDigest.value = false;
    }
}

function confirmSend(): void {
    showConfirmModal.value = true;
}

async function doSend(): Promise<void> {
    sending.value = true;
    try {
        const payload: Record<string, unknown> = {
            template: selectedTemplate.value,
            subject: subject.value,
            templateData: templateData.value,
        };

        if (recipientMode.value === "user") {
            const first = selectedUsers.value[0];
            if (selectedUsers.value.length === 1 && first) {
                payload.userId = first.id;
            } else {
                payload.userIds = selectedUsers.value.map((u) => u.id);
            }
        } else {
            payload.to = manualEmail.value;
        }

        const res = await api.post<SendResult>("/api/admin/emails/send", payload);
        showConfirmModal.value = false;

        if (res.totalFailed === 0) {
            toast.add({
                title: t("admin.emails.sentSuccess", { count: res.totalSent }),
                color: "green",
                timeout: 5000,
            });
        } else if (res.totalSent > 0) {
            toast.add({
                title: t("admin.emails.sentPartial", {
                    sent: res.totalSent,
                    failed: res.totalFailed,
                }),
                color: "amber",
                timeout: 6000,
            });
        } else {
            toast.add({
                title: t("admin.emails.sentFailed"),
                color: "red",
                timeout: 5000,
            });
        }
    } catch {
        toast.add({ title: t("admin.emails.sentFailed"), color: "red", timeout: 5000 });
    } finally {
        sending.value = false;
    }
}

// ─── Mail Log ────────────────────────────────────────────────

const logLoading = ref(false);
const logEntries = ref<EmailLogEntry[]>([]);
const logSearch = ref("");
const logTemplateFilter = ref("");
const logStatusFilter = ref("");
const logPagination = reactive({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
});

function templateLabel(key: string): string {
    return templates.value.find((tp) => tp.key === key)?.label ?? key;
}

// ─── Init ────────────────────────────────────────────────────

const { data: templatesData } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
        const res = await api.get<{ templates: TemplateInfo[] }>("/api/admin/emails/templates");
        return res.templates;
    },
});

watchEffect(() => {
    if (templatesData.value) templates.value = templatesData.value;
});

const { data: variablesData } = useQuery({
    queryKey: ["admin-email-variables"],
    queryFn: () =>
        api.get<{ system: VariableInfo[]; user: VariableInfo[] }>("/api/admin/emails/variables"),
});

watchEffect(() => {
    if (variablesData.value) availableVariables.value = variablesData.value;
});

const debouncedLogSearch = ref("");
const debouncedLogTemplate = ref("");
const debouncedLogStatus = ref("");

let logSearchTimeout2: ReturnType<typeof setTimeout> | undefined;
function debouncedLoadLog(): void {
    clearTimeout(logSearchTimeout2);
    logSearchTimeout2 = setTimeout(() => {
        debouncedLogSearch.value = logSearch.value;
        debouncedLogTemplate.value = logTemplateFilter.value;
        debouncedLogStatus.value = logStatusFilter.value;
    }, 300);
}

const { data: logData, isLoading: logLoading2 } = useQuery({
    queryKey: computed(() => [
        "admin-email-log",
        {
            page: logPagination.page,
            search: debouncedLogSearch.value,
            template: debouncedLogTemplate.value,
            status: debouncedLogStatus.value,
        },
    ]),
    queryFn: async () => {
        const params = new URLSearchParams({
            page: String(logPagination.page),
            limit: String(logPagination.limit),
        });
        if (debouncedLogSearch.value) params.set("search", debouncedLogSearch.value);
        if (debouncedLogTemplate.value) params.set("template", debouncedLogTemplate.value);
        if (debouncedLogStatus.value) params.set("status", debouncedLogStatus.value);

        return api.get<{
            logs: EmailLogEntry[];
            pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(`/api/admin/emails?${params.toString()}`);
    },
});

watchEffect(() => {
    if (logData.value) {
        logEntries.value = logData.value.logs;
        Object.assign(logPagination, logData.value.pagination);
    }
    logLoading.value = logLoading2.value;
});

function goToPage(page: number): void {
    logPagination.page = page;
}

function handleClickOutside(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest(".relative")) {
        showUserDropdown.value = false;
    }
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
});

watch(activeTab, (val) => {
    if (val === "log") {
        debouncedLogSearch.value = logSearch.value;
        debouncedLogTemplate.value = logTemplateFilter.value;
        debouncedLogStatus.value = logStatusFilter.value;
    }
});
</script>
