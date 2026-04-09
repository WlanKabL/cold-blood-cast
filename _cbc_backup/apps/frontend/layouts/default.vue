<template>
    <div class="flex h-screen overflow-hidden bg-base text-fg">
        <LayoutAppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

        <div class="flex flex-1 flex-col overflow-hidden">
            <LayoutAppTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

            <main class="flex-1 overflow-y-auto p-4 lg:p-6">
                <NuxtPage />
            </main>
        </div>

        <LayoutAppToast />
        <CookieConsent />
    </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false);
</script>
