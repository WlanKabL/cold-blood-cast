export interface AppToast {
    id: string;
    title: string;
    description?: string;
    color: "green" | "red" | "amber" | "blue";
    timeout: number;
}

const toasts = ref<AppToast[]>([]);

export const useAppToast = () => {
    function add(toast: Omit<AppToast, "id">) {
        const id: string = crypto.randomUUID();
        const newToast: AppToast = { ...toast, id };

        toasts.value.push(newToast);

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

    function success(title: string, description?: string) {
        add({ title, description, color: "green", timeout: 4000 });
    }

    function error(title: string, description?: string) {
        add({ title, description, color: "red", timeout: 5000 });
    }

    function warning(title: string, description?: string) {
        add({ title, description, color: "amber", timeout: 5000 });
    }

    function info(title: string, description?: string) {
        add({ title, description, color: "blue", timeout: 4000 });
    }

    return {
        toasts: readonly(toasts),
        add,
        remove,
        success,
        error,
        warning,
        info,
    };
};
