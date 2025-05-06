<template>
    <section class="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div
            class="absolute inset-0 bg-cover bg-center z-0"
            style="
                background-image: url(&quot;https://downloads.crowd-nation.com/Portfolio.png&quot;);
            "
        >
            <div
                class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0D1117]"
            />
        </div>

        <div class="relative z-10 max-w-5xl mx-auto text-center text-white">
            <h1 class="text-4xl sm:text-6xl font-extrabold leading-tight mb-6">Cold-Blood-Cast</h1>
            <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                A modern monitoring system for terrariums, built with passion, precision, and full
                control – from real-time data to remote access.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                <div>
                    <h2 class="text-2xl font-semibold mb-4 text-emerald-400">
                        📡 Born from Purpose
                    </h2>
                    <p class="text-gray-300 leading-relaxed">
                        Cold-Blood-Cast started as a personal need – I wanted to monitor the
                        environment of my corn snake in real time. Most commercial solutions were
                        overpriced or lacked flexibility. So I built my own – and added way more
                        than just temperature.
                    </p>
                </div>

                <div>
                    <h2 class="text-2xl font-semibold mb-4 text-emerald-400">
                        🔥 Built for Reliability
                    </h2>
                    <p class="text-gray-300 leading-relaxed">
                        With support for DHT22, BME280, water sensors, live logging and WebSocket
                        broadcasting – the system runs on a Raspberry Pi and adapts to any terrarium
                        setup. It’s not just stable. It’s modular, extendable, and ready for more
                        features like camera detection and pump control.
                    </p>
                </div>

                <div>
                    <h2 class="text-2xl font-semibold mb-4 text-emerald-400">🛠 Powered by Code</h2>
                    <p class="text-gray-300 leading-relaxed">
                        Written in TypeScript with Express and Vue 3, Cold-Blood-Cast brings modern
                        dev standards to a world of hobby reptile keeping. Real-time sensor data,
                        authentication, remote sync, and a beautiful frontend are just the start.
                    </p>
                </div>

                <div>
                    <h2 class="text-2xl font-semibold mb-4 text-emerald-400">🎯 The Vision</h2>
                    <p class="text-gray-300 leading-relaxed">
                        I want to make terrarium tech smarter and more affordable. This project
                        isn’t just for me – it’s built for anyone who wants to monitor their animals
                        properly, without needing to be an engineer. Cold-Blood-Cast is open,
                        hackable and built to grow.
                    </p>
                </div>
            </div>

            <div class="mt-12 flex justify-center gap-4 flex-wrap">
                <NuxtLink
                    to="/projects"
                    class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                    🚀 View Project Details
                </NuxtLink>

                <NuxtLink
                    to="/contact"
                    class="inline-flex items-center gap-2 border border-emerald-400 text-emerald-300 hover:bg-emerald-700/30 font-medium px-6 py-3 rounded-lg transition-all"
                >
                    ✉️ Contact Me
                </NuxtLink>
            </div>

            <p class="mt-16 text-gray-500 text-sm">
                This is not just about code – it's about creating real value for cold-blooded
                creatures 🐍
            </p>
        </div>
    </section>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "default",
});

useSeoMeta({
    title: "About – Cold-Blood-Cast",
    ogTitle: "About – Cold-Blood-Cast",
    description:
        "Cold-Blood-Cast is a custom-built smart monitoring system for terrariums. Learn how it started and what it aims to become.",
    ogDescription:
        "Cold-Blood-Cast is a custom-built smart monitoring system for terrariums. Learn how it started and what it aims to become.",
    ogImage: "/Crowd-Nation-Logo-BETTER.png",
    twitterCard: "summary_large_image",
});
</script>
