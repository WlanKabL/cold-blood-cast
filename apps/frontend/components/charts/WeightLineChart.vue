<template>
    <div class="relative" :style="{ height: height + 'px' }">
        <Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="flex h-full items-center justify-center">
            <p class="text-fg-muted text-sm">{{ $t("pages.weights.chart.noData") }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Line } from "vue-chartjs";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    type ChartData,
    type ChartOptions,
} from "chart.js";

const props = withDefaults(
    defineProps<{
        series: WeightSeries[];
        height?: number;
        showLegend?: boolean;
        fill?: boolean;
        sparkline?: boolean;
    }>(),
    {
        height: 300,
        showLegend: true,
        fill: true,
        sparkline: false,
    },
);

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
);

export interface WeightSeries {
    petId: string;
    petName: string;
    points: { date: string; weightGrams: number }[];
}

const COLORS = [
    { border: "rgb(138, 156, 74)", bg: "rgba(138, 156, 74, 0.15)" }, // olive primary
    { border: "rgb(216, 117, 51)", bg: "rgba(216, 117, 51, 0.15)" }, // warm copper
    { border: "rgb(96, 165, 250)", bg: "rgba(96, 165, 250, 0.15)" }, // blue
    { border: "rgb(244, 114, 182)", bg: "rgba(244, 114, 182, 0.15)" }, // pink
    { border: "rgb(52, 211, 153)", bg: "rgba(52, 211, 153, 0.15)" }, // emerald
];

const chartData = computed<ChartData<"line">>(() => {
    const datasets = props.series.map((s, i) => {
        const color = COLORS[i % COLORS.length];
        return {
            label: s.petName,
            data: s.points.map((p) => ({
                x: new Date(p.date).getTime(),
                y: p.weightGrams,
            })),
            borderColor: color.border,
            backgroundColor: props.fill ? color.bg : "transparent",
            fill: props.fill,
            tension: 0.3,
            pointRadius: props.sparkline ? 0 : 4,
            pointHoverRadius: props.sparkline ? 3 : 6,
            borderWidth: props.sparkline ? 2 : 2.5,
        };
    });

    return { datasets } as ChartData<"line">;
});

const chartOptions = computed<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: "index",
        intersect: false,
    },
    plugins: {
        legend: {
            display: props.showLegend && !props.sparkline,
            labels: {
                color: "rgba(255, 255, 255, 0.7)",
                usePointStyle: true,
                padding: 16,
            },
        },
        tooltip: {
            enabled: !props.sparkline,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            titleColor: "#fff",
            bodyColor: "rgba(255, 255, 255, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            padding: 12,
            callbacks: {
                title: (items) => {
                    if (!items.length) return "";
                    const raw = items[0].raw as { x: number };
                    return new Date(raw.x).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    });
                },
                label: (item) => {
                    const raw = item.raw as { y: number };
                    return ` ${item.dataset.label}: ${raw.y} g`;
                },
            },
        },
    },
    scales: {
        x: {
            type: "linear",
            display: !props.sparkline,
            grid: {
                color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
                color: "rgba(255, 255, 255, 0.5)",
                maxTicksLimit: 8,
                callback: (value) =>
                    new Date(value as number).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                    }),
            },
        },
        y: {
            display: !props.sparkline,
            grid: {
                color: "rgba(255, 255, 255, 0.05)",
            },
            ticks: {
                color: "rgba(255, 255, 255, 0.5)",
                callback: (value) => `${value} g`,
            },
            beginAtZero: false,
        },
    },
}));
</script>
