<template>
    <section class="py-20 min-h-screen px-4">
        <div class="max-w-3xl mx-auto text-center">
            <h1 class="text-4xl font-bold text-white mb-6">Let's Get In Touch</h1>
            <p class="text-gray-400 text-lg mb-12">
                You’ve got a project idea, a question, or just want to vibe? Feel free to reach out
                – I’m always open for new connections.
            </p>

            <ContactForm title="Contact me" />

            <div class="flex flex-col sm:flex-row justify-center gap-6 text-white text-lg mt-12">
                <a
                    href="https://www.linkedin.com/in/philipp-stecher-aab167258/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 hover:text-indigo-400 transition-colors"
                >
                    <IconLinkedin class="w-5 h-5" /> LinkedIn
                </a>

                <a
                    href="https://github.com/WlanKabL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 hover:text-indigo-400 transition-colors"
                >
                    <IconGithub class="w-5 h-5" /> GitHub
                </a>

                <p class="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                    <img src="/discord.svg" alt="Discord" class="w-5 h-5" />
                    wlankabl
                </p>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Github as IconGithub, Linkedin as IconLinkedin } from "lucide-vue-next";

definePageMeta({
    layout: "default",
});

useSeoMeta({
    title: "Contact – </WlanKabL>",
    ogTitle: "Contact – </WlanKabL>",
    description:
        "Reach out to WlanKabL – whether it’s for a project, collaboration, or just to connect.",
    ogDescription:
        "Reach out to WlanKabL – whether it’s for a project, collaboration, or just to connect.",
    ogImage: "/Crowd-Nation-Logo-BETTER.png",
    twitterCard: "summary_large_image",
});
</script>
