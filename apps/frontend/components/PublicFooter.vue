<template>
    <footer class="border-line-faint bg-surface relative z-10 border-t py-16">
        <div class="mx-auto max-w-7xl px-6">
            <div class="grid grid-cols-1 gap-12 md:grid-cols-4">
                <div class="md:col-span-2">
                    <div class="flex items-center gap-3">
                        <img src="/cbc.png" alt="KeeperLog" class="h-8 w-8 rounded-xl" />
                        <span class="text-lg font-bold">KeeperLog</span>
                    </div>
                    <p class="text-fg-faint mt-4 max-w-sm text-sm leading-relaxed">
                        {{ $t("landing.footer.tagline") }}
                    </p>
                </div>
                <div>
                    <h4 class="text-fg-dim mb-4 text-sm font-semibold">
                        {{ $t("landing.footer.explore") }}
                    </h4>
                    <ul class="text-fg-faint space-y-3 text-sm">
                        <li>
                            <NuxtLink to="/explore/features" class="hover:text-fg transition">{{
                                $t("landing.nav.features")
                            }}</NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/explore/why-keeperlog" class="hover:text-fg transition">
                                {{ $t("landing.nav.whyKeeperlog") }}
                            </NuxtLink>
                        </li>
                        <li v-if="paymentsActive">
                            <NuxtLink to="/explore/pricing" class="hover:text-fg transition">{{
                                $t("landing.nav.pricing")
                            }}</NuxtLink>
                        </li>
                        <li>
                            <NuxtLink
                                to="/explore/compare/excel-vs-keeperlog"
                                class="hover:text-fg transition"
                            >
                                {{ $t("landing.nav.compare") }}
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/explore/faq" class="hover:text-fg transition"
                                >FAQ</NuxtLink
                            >
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-fg-dim mb-4 text-sm font-semibold">
                        {{ $t("landing.footer.legal") }}
                    </h4>
                    <ul class="text-fg-faint space-y-3 text-sm">
                        <li v-for="link in legalLinks" :key="link.key">
                            <NuxtLink :to="`/legal/${link.key}`" class="hover:text-fg transition">
                                {{ isGerman ? link.titleDe : link.title }}
                            </NuxtLink>
                        </li>
                        <li>
                            <button class="hover:text-fg transition" @click="revokeCookieConsent">
                                {{ $t("cookie.revoke") }}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            <div
                class="border-line-faint mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
            >
                <p class="text-fg-ghost text-xs">
                    {{ $t("landing.footer.copyright", { year: new Date().getFullYear() }) }}
                </p>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import type { LegalDocumentLink } from "~/types/api";
import { useQuery } from "@tanstack/vue-query";

const { locale } = useI18n();
const api = useApi();
const { paymentsActive } = usePricingAvailability();
const isGerman = computed(() => locale.value === "de" || locale.value === "de-DE");

const { data: legalLinksData } = useQuery({
    queryKey: ["legal-links"],
    queryFn: () => api.get<LegalDocumentLink[]>("/api/legal"),
});
const legalLinks = computed(() => legalLinksData.value ?? []);

function revokeCookieConsent() {
    // Clear both the current and the legacy storage key so the banner re-prompts
    // regardless of which schema version was previously stored.
    localStorage.removeItem("cbc-cookie-consent");
    localStorage.removeItem("kl_cookie_consent");
    window.location.reload();
}
</script>
