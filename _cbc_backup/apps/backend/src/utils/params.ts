import type { Request } from "express";

/**
 * Safely extracts a route parameter as a string.
 * In Express 5, params can be `string | string[]` — this normalises the value.
 */
export function paramString(req: Request, name: string): string {
    const val = req.params[name];
    return Array.isArray(val) ? val[0] : val;
}
