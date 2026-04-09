/**
 * Settings Types
 */

export type Theme = "light" | "dark";

export const THEMES: Theme[] = ["light", "dark"];

export function isValidTheme(value: unknown): value is Theme {
    return typeof value === "string" && THEMES.includes(value as Theme);
}
