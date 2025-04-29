<template>
    <section class="py-20 px-4 sm:px-6 lg:px-8">
        <div class="max-w-xl mx-auto bg-zinc-900/70 backdrop-blur-lg p-8 rounded-xl shadow-xl">
            <h2 class="text-3xl font-bold text-center text-white mb-6">
                {{ title }}
            </h2>

            <form class="space-y-4" @submit.prevent="sendMessage">
                <input
                    v-model="email"
                    type="email"
                    required
                    placeholder="Your email"
                    class="w-full p-3 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <textarea
                    v-model="message"
                    required
                    placeholder="Your message"
                    rows="5"
                    class="w-full p-3 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                    type="submit"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                    {{ loading ? "Sending..." : "Send Message" }}
                </button>
            </form>

            <p v-if="success" class="text-green-400 text-sm mt-4 text-center">
                ✅ Message sent successfully!
            </p>
            <p v-if="error" class="text-red-400 text-sm mt-4 text-center">
                ❌ Something went wrong.
            </p>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps({
    title: {
        type: String,
        default: "Get in Touch",
    },
});

const email = ref("");
const message = ref("");
const loading = ref(false);
const success = ref(false);
const error = ref(false);

const sendMessage = async () => {
    loading.value = true;
    success.value = false;
    error.value = false;

    try {
        await $fetch("/api/contact", {
            method: "POST",
            body: { email: email.value, message: message.value },
        });
        success.value = true;
        email.value = "";
        message.value = "";
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
};
</script>
