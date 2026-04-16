<template>
    <div class="relative" :style="{ height: height + 'px' }">
        <Bar
            v-if="chartData.datasets.length > 0 && chartData.labels!.length > 0"
            :data="chartData"
            :options="chartOptions"
        />
        <div v-else class="flex h-full items-center justify-center">
            <p class="text-fg-muted text-sm">{{ $t("pages.vetVisits.costs.noData") }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Bar } from "vue-chartjs";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions,
} from "chart.js";

const props = withDefaults(
    defineProps<{
        entries: MonthlyCostEntry[];
        height?: number;
    }>(),
    {
        height: 280,
    },
);

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface MonthlyCostEntry {
    month: string;
    petId: string;
    petName: string;
    totalCents: number;
    visitCount: number;
}

const { locale } = useI18n();

const COLORS = [
    { bg: "rgba(138, 156, 74, 0.6)", border: "rgb(138, 156, 74)" },
    { bg: "rgba(96, 165, 250, 0.6)", border: "rgb(96, 165, 250)" },
    { bg: "rgba(251, 146, 60, 0.6)", border: "rgb(251, 146, 60)" },
    { bg: "rgba(167, 139, 250, 0.6)", border: "rgb(167, 139, 250)" },
    { bg: "rgba(248, 113, 113, 0.6)", border: "rgb(248, 113, 113)" },
    { bg: "rgba(52, 211, 153, 0.6)", border: "rgb(52, 211, 153)" },
];

const chartData = computed<ChartData<"bar">>(() => {
    const months = [...new Set(props.entries.map((e) => e.month))].sort();
    const petNames = [...new Set(props.entries.map((e) => e.petName))];

    const loc = locale.value === "de" ? "de-DE" : "en-US";
    const labels = months.map((m) => {
        const d = new Date(`${m}-01`);
        return d.toLocaleDateString(loc, { month: "short" });
    });

    const datasets = petNames.map((petName, i) => {
        const color = COLORS[i % COLORS.length];
        const data = months.map((month) => {
            const entry = props.entries.find((e) => e.month === month && e.petName === petName);
            return entry ? entry.totalCents / 100 : 0;
        });
        return {
            label: petName,
            data,
            backgroundColor: color.bg,
            borderColor: color.border,
            borderWidth: 1,
            borderRadius: 4,
        };
    });

    return { labels, datasets };
});

const chartOptions = computed<ChartOptions<"bar">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: chartData.value.datasets.length > 1,
            labels: { color: "rgba(255, 255, 255, 0.7)" },
        },
        tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            titleColor: "#fff",
            bodyColor: "rgba(255, 255, 255, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
                label: (item) => {
                    const v = item.raw as number;
                    return ` ${item.dataset.label}: ${v.toFixed(2)} €`;
                },
            },
        },
    },
    scales: {
        x: {
            stacked: true,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "rgba(255, 255, 255, 0.5)" },
        },
        y: {
            stacked: true,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
                color: "rgba(255, 255, 255, 0.5)",
                callback: (value) => `${value} €`,
            },
            beginAtZero: true,
        },
    },
}));
</script>
