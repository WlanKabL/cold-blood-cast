import { useQuery } from "@tanstack/vue-query";

export function usePricingAvailability() {
    const api = useApi();

    const { data } = useQuery({
        queryKey: ["subscription-availability"],
        queryFn: () => api.get<{ paymentsActive: boolean }>("/api/subscriptions/availability"),
        staleTime: 5 * 60 * 1000,
    });

    const paymentsActive = computed(() => data.value?.paymentsActive ?? false);

    return { paymentsActive };
}
