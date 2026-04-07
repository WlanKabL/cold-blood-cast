<template>
    <PageContainer title="Login">
        <div class="flex flex-col items-center justify-center h-screen">
            <form @submit.prevent="handleLogin" class="w-full max-w-sm">
                <BaseInput
                    v-model="username"
                    label="Username"
                    type="text"
                    placeholder="Enter your username"
                    required
                />
                <BaseInput
                    v-model="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    required
                />
                <button
                    type="submit"
                    class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Login
                </button>
            </form>
        </div>
    </PageContainer>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "default"
})

const username = ref<string>("");
const password = ref<string>("");

function handleLogin() {
    
}
</script>