<template>
    <div class="p-4 max-w-2xl mx-auto">
        <h1 class="text-2xl font-bold mb-4">📦 AppConfig Settings</h1>

        <div class="space-y-4">
            <div>
                <label class="block font-semibold mb-1">Polling Interval (ms)</label>
                <input type="number" class="input" />
            </div>

            <div>
                <label class="block font-semibold mb-1">Auto Log Interval (ms)</label>
                <input type="number" class="input" />
            </div>

            <div>
                <label class="block font-semibold mb-1">Retention (minutes)</label>
                <input type="number" class="input" />
            </div>

            <div>
                <label class="block font-semibold mb-1">Log File Limit</label>
                <input type="number" class="input" />
            </div>

            <div>
                <label class="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Remote Sync Enabled</span>
                </label>
            </div>

            <button class="btn btn-primary mt-4">💾 Save</button>
        </div>
    </div>
</template>

<script setup lang="ts"></script>
