<template>
    <footer class="w-full px-4 py-8 text-sm text-zinc-400 border-t border-zinc-700 bg-[#0D1117]">
        <div class="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
            <div class="flex items-center gap-2 text-zinc-500">
                <span>🦎</span>
                <span class="text-zinc-300 font-semibold tracking-wide"> Cold-Blood-Cast </span>
                <span class="text-emerald-500 animate-pulse">●</span>
                <span>Live from your terrarium</span>
            </div>

            <div class="flex flex-wrap justify-center gap-3 text-zinc-500">
                <NuxtLink to="/enclosures" class="hover:text-emerald-400 transition-colors">
                    {{ $t("nav.enclosures") }}
                </NuxtLink>
                <NuxtLink to="/pets" class="hover:text-emerald-400 transition-colors">
                    {{ $t("nav.pets") }}
                </NuxtLink>
                <NuxtLink to="/sensors" class="hover:text-emerald-400 transition-colors">
                    {{ $t("nav.sensors") }}
                </NuxtLink>
                <a
                    href="https://github.com/WlanKabL/cold-blood-cast"
                    target="_blank"
                    rel="noopener"
                    class="hover:text-emerald-400 transition-colors"
                >
                    GitHub
                </a>
            </div>

            <p class="text-xs text-zinc-600 mt-2 opacity-60">
                Made with 🧪 TypeScript, 🐍 love for reptiles, and ☕ lots of caffeine.
            </p>
        </div>
    </footer>
</template>
