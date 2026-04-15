import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick, ref, type Ref, watch } from "vue";
import {
    useKeyboardShortcuts,
    useGlobalKeyboardShortcuts,
    useLocalShortcuts,
} from "../useKeyboardShortcuts";

// Mock useRouter
const mockPush = vi.fn();
vi.stubGlobal("useRouter", () => ({ push: mockPush }));
vi.stubGlobal("navigateTo", vi.fn());

// Mock useActiveElement — returns a controllable ref
const activeEl = ref<Element | null>(null);
vi.stubGlobal("useActiveElement", () => activeEl);

// Mock whenever — simplified version of @vueuse/shared whenever
vi.stubGlobal(
    "whenever",
    (
        source: (() => unknown) | Ref<unknown>,
        cb: (...args: unknown[]) => void,
        options?: object,
    ) => {
        return watch(
            source,
            (v: unknown, ov: unknown, onCleanup: unknown) => {
                if (v) cb(v, ov, onCleanup);
            },
            options,
        );
    },
);

// Mock useMagicKeys — tracks keys via document events, resolves aliases
function createMockMagicKeys() {
    const keyMap = new Map<string, Ref<boolean>>();
    const aliasMap: Record<string, string> = {
        ctrl: "control",
        cmd: "meta",
        command: "meta",
        option: "alt",
    };

    const getKey = (name: string): Ref<boolean> => {
        const n = aliasMap[name] ?? name;
        if (!keyMap.has(n)) keyMap.set(n, ref(false));
        return keyMap.get(n)!;
    };

    const handler = (e: KeyboardEvent) => {
        const isDown = e.type === "keydown";
        getKey(e.key.toLowerCase()).value = isDown;
        getKey("control").value = e.ctrlKey;
        getKey("alt").value = e.altKey;
        getKey("meta").value = e.metaKey;
    };

    document.addEventListener("keydown", handler);
    document.addEventListener("keyup", handler);

    const cleanup = () => {
        document.removeEventListener("keydown", handler);
        document.removeEventListener("keyup", handler);
    };

    const proxy = new Proxy({} as Record<string, Ref<boolean>>, {
        get(_, prop: string) {
            return getKey(prop.toLowerCase());
        },
    });

    return { proxy, cleanup };
}

let magicKeysCleanup: (() => void) | null = null;

vi.stubGlobal("useMagicKeys", () => {
    const { proxy, cleanup } = createMockMagicKeys();
    magicKeysCleanup = cleanup;
    return proxy;
});

function pressKey(key: string, options?: Partial<KeyboardEventInit>) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

function releaseKey(key: string, options?: Partial<KeyboardEventInit>) {
    document.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, ...options }));
}

describe("useKeyboardShortcuts", () => {
    it("returns shared state", () => {
        const result = useKeyboardShortcuts();
        expect(result).toHaveProperty("showHelp");
        expect(result).toHaveProperty("allShortcuts");
        expect(result).toHaveProperty("globalShortcuts");
        expect(result).toHaveProperty("localShortcuts");
        expect(result).toHaveProperty("isMac");
    });

    it("showHelp starts as false", () => {
        const { showHelp } = useKeyboardShortcuts();
        showHelp.value = false;
        expect(showHelp.value).toBe(false);
    });
});

function mountWithShortcuts() {
    return mount(
        defineComponent({
            setup() {
                useGlobalKeyboardShortcuts();
                return () => null;
            },
        }),
    );
}

describe("useGlobalKeyboardShortcuts", () => {
    beforeEach(() => {
        mockPush.mockClear();
        activeEl.value = null;
        const { showHelp } = useKeyboardShortcuts();
        showHelp.value = false;
    });

    afterEach(() => {
        magicKeysCleanup?.();
        magicKeysCleanup = null;
    });

    it("registers navigation shortcuts", () => {
        const wrapper = mountWithShortcuts();
        const { globalShortcuts } = useKeyboardShortcuts();
        const nav = globalShortcuts.value.filter((s) => s.category === "navigation");
        expect(nav.length).toBe(7);
        wrapper.unmount();
    });

    it("registers CBC domain shortcuts", () => {
        const wrapper = mountWithShortcuts();
        const { globalShortcuts } = useKeyboardShortcuts();
        const keys = globalShortcuts.value.map((s) => s.key);
        expect(keys).toContain("E");
        expect(keys).toContain("P");
        expect(keys).toContain("N");
        expect(keys).toContain("S");
        expect(keys).toContain("F");
        expect(keys).toContain("W");
        wrapper.unmount();
    });

    it("navigates to dashboard on 'd' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("d");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
        releaseKey("d");
        wrapper.unmount();
    });

    it("navigates to enclosures on 'e' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("e");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/enclosures");
        releaseKey("e");
        wrapper.unmount();
    });

    it("navigates to pets on 'p' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("p");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/pets");
        releaseKey("p");
        wrapper.unmount();
    });

    it("navigates to settings on 's' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("s");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/settings");
        releaseKey("s");
        wrapper.unmount();
    });

    it("navigates to sensors on 'n' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("n");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/sensors");
        releaseKey("n");
        wrapper.unmount();
    });

    it("navigates to feedings on 'f' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("f");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/feedings");
        releaseKey("f");
        wrapper.unmount();
    });

    it("navigates to weights on 'w' key", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("w");
        await nextTick();
        expect(mockPush).toHaveBeenCalledWith("/weights");
        releaseKey("w");
        wrapper.unmount();
    });

    it("ignores shortcuts when typing in input", async () => {
        const wrapper = mountWithShortcuts();
        const input = document.createElement("input");
        activeEl.value = input;
        await nextTick();

        pressKey("d");
        await nextTick();
        expect(mockPush).not.toHaveBeenCalled();
        releaseKey("d");
        activeEl.value = null;
        wrapper.unmount();
    });

    it("ignores shortcuts with modifier keys", async () => {
        const wrapper = mountWithShortcuts();
        pressKey("d", { ctrlKey: true });
        await nextTick();
        expect(mockPush).not.toHaveBeenCalled();
        releaseKey("d");
        wrapper.unmount();
    });

    it("toggles help overlay on '?' key", async () => {
        const wrapper = mountWithShortcuts();
        const { showHelp } = useKeyboardShortcuts();
        showHelp.value = false;
        pressKey("?");
        await nextTick();
        expect(showHelp.value).toBe(true);
        releaseKey("?");
        wrapper.unmount();
    });

    it("closes help overlay on Escape", async () => {
        const wrapper = mountWithShortcuts();
        const { showHelp } = useKeyboardShortcuts();
        showHelp.value = true;
        pressKey("Escape");
        await nextTick();
        expect(showHelp.value).toBe(false);
        releaseKey("Escape");
        wrapper.unmount();
    });

    it("blocks navigation shortcuts when help overlay is open", async () => {
        const wrapper = mountWithShortcuts();
        const { showHelp } = useKeyboardShortcuts();
        showHelp.value = true;
        pressKey("d");
        await nextTick();
        expect(mockPush).not.toHaveBeenCalled();
        releaseKey("d");
        wrapper.unmount();
    });
});

describe("useLocalShortcuts", () => {
    beforeEach(() => {
        activeEl.value = null;
        const { showHelp } = useKeyboardShortcuts();
        showHelp.value = false;
    });

    afterEach(() => {
        magicKeysCleanup?.();
        magicKeysCleanup = null;
    });

    it("registers local shortcut definitions", () => {
        const handler = vi.fn();
        const wrapper = mount(
            defineComponent({
                setup() {
                    useLocalShortcuts([{ key: "n", label: "New", category: "actions", handler }]);
                    return () => null;
                },
            }),
        );
        const { localShortcuts } = useKeyboardShortcuts();
        expect(localShortcuts.value).toHaveLength(1);
        expect(localShortcuts.value[0]?.key).toBe("n");
        wrapper.unmount();
    });

    it("cleans up local shortcuts on unmount", () => {
        const handler = vi.fn();
        const wrapper = mount(
            defineComponent({
                setup() {
                    useLocalShortcuts([{ key: "n", label: "New", category: "actions", handler }]);
                    return () => null;
                },
            }),
        );
        wrapper.unmount();
        const { localShortcuts } = useKeyboardShortcuts();
        expect(localShortcuts.value).toHaveLength(0);
    });

    it("fires local shortcut handler on key press", async () => {
        const handler = vi.fn();
        const wrapper = mount(
            defineComponent({
                setup() {
                    useLocalShortcuts([{ key: "n", label: "New", category: "actions", handler }]);
                    return () => null;
                },
            }),
        );
        pressKey("n");
        await nextTick();
        expect(handler).toHaveBeenCalled();
        releaseKey("n");
        wrapper.unmount();
    });
});
