<template>
    <div class="relative" :style="{ height: height + 'px' }">
        <Bar
            v-if="chartData.datasets.length > 0 && chartData.labels!.length > 0"
            :data="chartData"
            :options="chartOptions"
        />
        <div v-else class="flex h-full items-center justify-center">
            <p class="text-fg-muted text-sm">{{ $t("pages.sheddings.analysis.noData") }}</p>
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface SheddingInterval {
    fromDate: string;
    toDate: string;
    days: number;
}

const props = withDefaults(
    defineProps<{
        intervals: SheddingInterval[];
        averageDays?: number;
        height?: number;
    }>(),
    {
        averageDays: 0,
        height: 200,
    },
);

const BAR_COLOR = { bg: "rgba(138, 156, 74, 0.6)", border: "rgb(138, 156, 74)" };
const ANOMALY_COLOR = { bg: "rgba(239, 68, 68, 0.5)", border: "rgb(239, 68, 68)" };

const chartData = computed<ChartData<"bar">>(() => {
    const labels = props.intervals.map((iv) => {
        const from = new Date(iv.fromDate);
        return from.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    });

    const anomalyThreshold = props.averageDays > 0 ? props.averageDays * 1.3 : Infinity;

    const bgColors = props.intervals.map((iv) =>
        iv.days > anomalyThreshold ? ANOMALY_COLOR.bg : BAR_COLOR.bg,
    );
    const borderColors = props.intervals.map((iv) =>
        iv.days > anomalyThreshold ? ANOMALY_COLOR.border : BAR_COLOR.border,
    );

    return {
        labels,
        datasets: [
            {
                label: "Days",
                data: props.intervals.map((iv) => iv.days),
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };
});

const chartOptions = computed<ChartOptions<"bar">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            titleColor: "#fff",
            bodyColor: "rgba(255, 255, 255, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
                title: (items) => {
                    if (!items.length) return "";
                    const idx = items[0].dataIndex;
                    const iv = props.intervals[idx];
                    const from = new Date(iv.fromDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });
                    const to = new Date(iv.toDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });
                    return `${from} → ${to}`;
                },
                label: (item) => ` ${item.raw} days`,
            },
        },
    },
    scales: {
        x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "rgba(255, 255, 255, 0.5)" },
        },
        y: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
                color: "rgba(255, 255, 255, 0.5)",
                callback: (value) => `${value}d`,
            },
            beginAtZero: true,
        },
    },
}));
</script>
