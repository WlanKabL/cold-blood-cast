<template>
    <nav class="w-full px-4 sm:px-6 py-4 text-zinc-100 shadow-sm border-b border-zinc-800">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <NuxtLink
                to="/"
                class="text-2xl tracking-tight hover:text-emerald-400 transition-colors"
            >
                <code> Cold-Blood-Cast 🐍 </code>
            </NuxtLink>
            <div class="hidden md:flex gap-6 items-center text-sm font-medium">
                <Navbar-Links />
                <LanguageSwitcher />
            </div>
            <button
                class="md:hidden text-zinc-100 focus:outline-none"
                @click="menuOpen = !menuOpen"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>
        </div>
        <div
            v-if="menuOpen"
            class="md:hidden mt-4 space-y-3 text-sm font-medium px-4 flex flex-col"
        >
            <Navbar-Links />
            <LanguageSwitcher />
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";

const menuOpen = ref(false);
</script>
