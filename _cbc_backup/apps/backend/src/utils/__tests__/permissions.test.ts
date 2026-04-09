import { describe, it, expect } from "vitest";
import { isAdmin, requireAdmin } from "../permissions.js";
import type { User } from "@cold-blood-cast/shared";

function createUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        email: "test@example.com",
        username: "test",
        displayName: "Test",
        isAdmin: false,
        locale: "de",
        timezone: "Europe/Berlin",
        ...overrides,
    };
}

describe("permissions", () => {
    describe("isAdmin", () => {
        it("returns true for admin user", () => {
            expect(isAdmin(createUser({ isAdmin: true }))).toBe(true);
        });

        it("returns false for non-admin user", () => {
            expect(isAdmin(createUser())).toBe(false);
        });

        it("returns false for undefined user", () => {
            expect(isAdmin(undefined)).toBe(false);
        });
    });

    describe("requireAdmin", () => {
        it("does not throw for admin user", () => {
            expect(() => requireAdmin(createUser({ isAdmin: true }))).not.toThrow();
        });

        it("throws for non-admin user", () => {
            expect(() => requireAdmin(createUser())).toThrow("Forbidden");
        });

        it("throws for undefined user", () => {
            expect(() => requireAdmin(undefined)).toThrow("Forbidden");
        });
    });
});
