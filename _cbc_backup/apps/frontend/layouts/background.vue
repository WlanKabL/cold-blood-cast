<!-- layouts/background.vue -->
<template>
    <div class="relative flex h-screen overflow-hidden bg-base text-fg">
        <!-- Dynamic Background -->
        <div class="fixed inset-0 z-0">
            <img
                :src="backgroundImage"
                alt="Background"
                class="w-full h-full object-cover object-center"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-overlay via-overlay to-base" />
        </div>

        <!-- App Content -->
        <div class="relative z-10 flex h-screen w-full overflow-hidden">
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
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
const defaultImage = "/background.png";
const sidebarOpen = ref(false);

const backgroundImage = computed(() => {
    return (route.meta.layoutBackgroundImage as string) ?? defaultImage;
});
</script>
