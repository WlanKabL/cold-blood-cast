<template>
    <footer class="w-full py-8 px-4 text-center text-sm text-zinc-500">
        <div class="flex flex-col items-center gap-2">
            <div class="flex items-center gap-2">
                <span>Made by hand</span>
                <span class="animate-pulse">🖤</span>
                <span>with care & caffeine</span>
            </div>

            <div class="text-zinc-600 hover:text-emerald-400 transition-colors">
                <a
                    href="https://github.com/WlanKabL/cold-blood-cast"
                    target="_blank"
                    rel="noopener"
                >
                    → Check the source on GitHub
                </a>
            </div>

            <div class="mt-1 text-xs text-[#161B22] opacity-40 select-none">
                {{ easteregg }}
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
const easteregg = "console.log('</WlanKabL>')";
</script>
