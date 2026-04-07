import { describe, it, expect } from "vitest";
import { hasPermission, isAdmin } from "../permissions.js";
import type { User } from "@cold-blood-cast/shared";

const basePermissions = {
    isAdmin: false,
    viewSensors: [] as string[],
    manageSensors: [] as string[],
    viewWebcams: false,
    viewPrivateSensors: false,
    detectNewSensors: false,
    manageUsers: false,
    manageAppConfig: false,
    useRemoteAccess: false,
    manageRegistrationKeys: false,
};

function createUser(overrides: Partial<typeof basePermissions> = {}): User {
    return {
        id: "user-1",
        username: "test",
        passwordHash: "hash",
        salt: "salt",
        permissions: { ...basePermissions, ...overrides },
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
    });

    describe("hasPermission", () => {
        it("returns false for undefined user", () => {
            expect(hasPermission(undefined, "viewWebcams")).toBe(false);
        });

        it("admin has all permissions", () => {
            const admin = createUser({ isAdmin: true });
            expect(hasPermission(admin, "manageUsers")).toBe(true);
            expect(hasPermission(admin, "detectNewSensors")).toBe(true);
            expect(hasPermission(admin, "manageAppConfig")).toBe(true);
        });

        it("returns true for boolean permission set to true", () => {
            const user = createUser({ viewWebcams: true });
            expect(hasPermission(user, "viewWebcams")).toBe(true);
        });

        it("returns false for boolean permission set to false", () => {
            const user = createUser({ viewWebcams: false });
            expect(hasPermission(user, "viewWebcams")).toBe(false);
        });

        it("returns true for array permission with matching sensorId", () => {
            const user = createUser({ viewSensors: ["sensor-1", "sensor-2"] });
            expect(hasPermission(user, "viewSensors", "sensor-1")).toBe(true);
        });

        it("returns false for array permission without matching sensorId", () => {
            const user = createUser({ viewSensors: ["sensor-1"] });
            expect(hasPermission(user, "viewSensors", "sensor-99")).toBe(false);
        });

        it("returns false for array permission without sensorId argument", () => {
            const user = createUser({ viewSensors: ["sensor-1"] });
            expect(hasPermission(user, "viewSensors")).toBe(false);
        });
    });
});
