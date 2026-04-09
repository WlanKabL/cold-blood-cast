export interface Toast {
    id: string;
    title: string;
    description?: string;
    color: "green" | "red" | "amber" | "blue";
    timeout: number;
}

export interface ToastOptions {
    description?: string;
    timeout?: number;
}

const MAX_TOASTS = 5;
const toasts = ref<Toast[]>([]);

export const useToast = () => {
    function add(toast: Omit<Toast, "id">) {
        const id = crypto.randomUUID();
        const newToast: Toast = { ...toast, id };

        toasts.value.push(newToast);

        // Evict oldest toasts when limit exceeded
        while (toasts.value.length > MAX_TOASTS) {
            toasts.value.shift();
        }

        if (toast.timeout > 0) {
            setTimeout(() => {
                remove(id);
            }, toast.timeout);
        }
    }

    function remove(id: string) {
        const index = toasts.value.findIndex((t) => t.id === id);
        if (index > -1) {
            toasts.value.splice(index, 1);
        }
    }

    function success(title: string, opts?: ToastOptions) {
        add({
            title,
            color: "green",
            timeout: opts?.timeout ?? 3000,
            description: opts?.description,
        });
    }

    function error(title: string, opts?: ToastOptions) {
        add({
            title,
            color: "red",
            timeout: opts?.timeout ?? 5000,
            description: opts?.description,
        });
    }

    function warn(title: string, opts?: ToastOptions) {
        add({
            title,
            color: "amber",
            timeout: opts?.timeout ?? 4000,
            description: opts?.description,
        });
    }

    function info(title: string, opts?: ToastOptions) {
        add({
            title,
            color: "blue",
            timeout: opts?.timeout ?? 3000,
            description: opts?.description,
        });
    }

    return {
        toasts: readonly(toasts),
        add,
        remove,
        success,
        error,
        warn,
        info,
    };
};
