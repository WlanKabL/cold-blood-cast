<template>
    <nav
        class="w-full px-6 py-4 bg-zinc-900 text-zinc-100 shadow-sm border-b border-zinc-800"
    >
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <!-- Logo -->
            <NuxtLink
                to="/"
                class="text-2xl font-semibold tracking-tight hover:text-indigo-400 transition-colors"
            >
                &lt;/WlanKabL&gt;
            </NuxtLink>

            <!-- Navigation -->
            <div class="hidden md:flex gap-6 items-center text-sm font-medium">
                <NuxtLink
                    to="/projects"
                    class="hover:text-indigo-400 transition-colors"
                >
                    {{ $t("project_title") }}
                </NuxtLink>
                <NuxtLink
                    to="/about"
                    class="hover:text-indigo-400 transition-colors"
                >
                    About
                </NuxtLink>
                <NuxtLink
                    to="/contact"
                    class="hover:text-indigo-400 transition-colors"
                >
                    Contact
                </NuxtLink>
                <LanguageSwitcher />
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
// nothing needed here
</script>
