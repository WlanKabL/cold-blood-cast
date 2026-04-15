export interface ShortcutDef {
    key: string;
    label: string;
    category: "navigation" | "actions" | "general";
}

interface LocalShortcut extends ShortcutDef {
    handler: () => void;
}

// --- Module-level shared state ---
const showHelp = ref(false);
const globalDefs = ref<ShortcutDef[]>([]);
const localDefs = ref<ShortcutDef[]>([]);
const isMac = ref(false);

function isTypingTarget(el: Element | null | undefined): boolean {
    if (!el) return false;
    const tag = (el as HTMLElement).tagName;
    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement).isContentEditable
    );
}

export function useKeyboardShortcuts() {
    return {
        showHelp,
        isMac: readonly(isMac),
        allShortcuts: computed(() => [...globalDefs.value, ...localDefs.value]),
        globalShortcuts: readonly(globalDefs),
        localShortcuts: readonly(localDefs),
    };
}

export function useGlobalKeyboardShortcuts() {
    if (import.meta.client) {
        isMac.value = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    }

    const router = useRouter();
    const activeElement = useActiveElement();
    const isTyping = computed(() => isTypingTarget(activeElement.value));
    const keys = useMagicKeys();
    const noMod = computed(() => !keys.ctrl?.value && !keys.alt?.value && !keys.meta?.value);

    globalDefs.value = [
        { key: "D", label: "shortcuts.dashboard", category: "navigation" },
        { key: "E", label: "shortcuts.enclosures", category: "navigation" },
        { key: "P", label: "shortcuts.pets", category: "navigation" },
        { key: "N", label: "shortcuts.sensors", category: "navigation" },
        { key: "S", label: "shortcuts.settings", category: "navigation" },
        { key: "F", label: "shortcuts.feedings", category: "navigation" },
        { key: "W", label: "shortcuts.weights", category: "navigation" },
        { key: "?", label: "shortcuts.help", category: "general" },
    ];

    const go = (key: string, path: string) =>
        whenever(
            () => keys[key]?.value && noMod.value && !isTyping.value && !showHelp.value,
            () => router.push(path),
        );

    go("d", "/dashboard");
    go("e", "/enclosures");
    go("p", "/pets");
    go("n", "/sensors");
    go("s", "/settings");
    go("f", "/feedings");
    go("w", "/weights");

    whenever(
        () => keys["?"]?.value && !isTyping.value,
        () => {
            showHelp.value = !showHelp.value;
        },
    );

    whenever(
        () => keys.escape?.value && showHelp.value,
        () => {
            showHelp.value = false;
        },
    );
}

export function useLocalShortcuts(shortcuts: LocalShortcut[]) {
    const activeElement = useActiveElement();
    const isTyping = computed(() => isTypingTarget(activeElement.value));
    const keys = useMagicKeys();
    const noMod = computed(() => !keys.ctrl?.value && !keys.alt?.value && !keys.meta?.value);

    localDefs.value = shortcuts.map(({ handler: _, ...def }) => def);

    for (const shortcut of shortcuts) {
        const key = shortcut.key.toLowerCase();
        whenever(
            () => keys[key]?.value && noMod.value && !isTyping.value && !showHelp.value,
            () => shortcut.handler(),
        );
    }

    onUnmounted(() => {
        localDefs.value = [];
    });
}
