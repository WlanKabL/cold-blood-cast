import { reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * Supported field types for URL query parameters.
 * - 'string'  → plain text
 * - 'number'  → parsed via parseInt / parseFloat
 * - 'string[]' → comma-separated
 */
type FieldType = "string" | "number" | "string[]";

/** Schema definition: maps field name → its type + default value. */
type SchemaEntry<T extends FieldType> = {
    type: T;
    default: T extends "string" ? string : T extends "number" ? number : string[];
};

type SchemaMap = Record<string, SchemaEntry<FieldType>>;

/** Infer the reactive state type from a schema. */
type InferState<S extends SchemaMap> = {
    [K in keyof S]: S[K]["type"] extends "string"
        ? string
        : S[K]["type"] extends "number"
          ? number
          : string[];
};

/**
 * Type-safe composable for syncing reactive state with URL query parameters.
 *
 * - Reads from `route.query` on init
 * - Uses `router.replace` (not push) to avoid back-button pollution
 * - Debounces URL writes (default 300ms)
 * - Provides `resetFilters()` to clear everything to defaults
 *
 * @example
 * ```ts
 * const { state, resetFilters } = useQueryParams({
 *   symbol:    { type: 'string',   default: '' },
 *   page:      { type: 'number',   default: 1 },
 *   tags:      { type: 'string[]', default: [] },
 * });
 * // state.symbol, state.page, state.tags are reactive & synced to URL
 * ```
 */
export function useQueryParams<S extends SchemaMap>(
    schema: S,
    options: { debounce?: number } = {},
): {
    state: InferState<S>;
    resetFilters: () => void;
} {
    const route = useRoute();
    const router = useRouter();
    const debounceMs = options.debounce ?? 300;

    // Build defaults object
    const defaults: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(schema)) {
        defaults[key] = Array.isArray(entry.default) ? [...entry.default] : entry.default;
    }

    // Build initial state from URL query, falling back to defaults
    const initial: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(schema)) {
        const raw = route.query[key];
        if (raw == null || raw === "") {
            initial[key] = Array.isArray(entry.default) ? [...entry.default] : entry.default;
            continue;
        }

        const str = String(raw);
        switch (entry.type) {
            case "number": {
                const parsed = Number(str);
                initial[key] = Number.isFinite(parsed) ? parsed : entry.default;
                break;
            }
            case "string[]":
                initial[key] = str
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                break;
            default:
                initial[key] = str;
        }
    }

    const state = reactive(initial) as InferState<S>;

    // Debounced sync to URL
    let syncTimer: ReturnType<typeof setTimeout> | null = null;

    function syncToUrl() {
        const query: Record<string, string> = {};

        // Preserve unknown query params (e.g. fromPlan, utm_source)
        for (const [k, v] of Object.entries(route.query)) {
            if (!(k in schema) && v != null) {
                query[k] = String(v);
            }
        }

        for (const [key, entry] of Object.entries(schema)) {
            const val = (state as Record<string, unknown>)[key];
            const def = defaults[key];

            // Skip default values (keep URL clean)
            if (entry.type === "string[]") {
                const arr = val as string[];
                if (arr.length === 0) continue;
                query[key] = arr.join(",");
            } else if (entry.type === "number") {
                if (val === def) continue;
                query[key] = String(val);
            } else {
                if (val === def || val === "") continue;
                query[key] = String(val);
            }
        }

        router.replace({ query });
    }

    // Watch state and debounce URL sync
    watch(
        () => {
            const snapshot: Record<string, unknown> = {};
            for (const key of Object.keys(schema)) {
                const val = (state as Record<string, unknown>)[key];
                snapshot[key] = Array.isArray(val) ? [...val] : val;
            }
            return JSON.stringify(snapshot);
        },
        () => {
            if (syncTimer) clearTimeout(syncTimer);
            syncTimer = setTimeout(syncToUrl, debounceMs);
        },
    );

    function resetFilters() {
        for (const [key, entry] of Object.entries(schema)) {
            if (entry.type === "string[]") {
                (state as Record<string, unknown>)[key] = [...(entry.default as string[])];
            } else {
                (state as Record<string, unknown>)[key] = entry.default;
            }
        }
    }

    return { state, resetFilters };
}
