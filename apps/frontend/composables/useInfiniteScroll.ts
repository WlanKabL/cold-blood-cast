export function useInfiniteScroll(
    onLoadMore: () => void,
    options: { enabled: Ref<boolean> | ComputedRef<boolean> },
) {
    const sentinel = ref<HTMLElement | null>(null);
    let observer: IntersectionObserver | null = null;

    function setup() {
        cleanup();
        if (!sentinel.value) return;

        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && unref(options.enabled)) {
                    onLoadMore();
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(sentinel.value);
    }

    function cleanup() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    watch(sentinel, () => setup());
    watch(options.enabled, () => setup());

    onUnmounted(() => cleanup());

    return { sentinel };
}
