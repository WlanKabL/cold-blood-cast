import { describe, it, expect } from "vitest";
import {
    UserSchema,
    UserPermissionsSchema,
    isValidUser,
    isValidPartialUser,
    isValidUserPermissions,
    isValidPartialUserPermissions,
} from "../users.js";

const validPermissions = {
    isAdmin: false,
    viewSensors: ["sensor-1"],
    manageSensors: [],
    viewWebcams: false,
    viewPrivateSensors: false,
    detectNewSensors: false,
    manageUsers: false,
    manageAppConfig: false,
    useRemoteAccess: false,
    manageRegistrationKeys: false,
};

const validUser = {
    id: "user-1",
    username: "testuser",
    passwordHash: "abc",
    salt: "def",
    permissions: validPermissions,
};

describe("user schemas", () => {
    describe("UserPermissionsSchema", () => {
        it("validates valid permissions", () => {
            expect(UserPermissionsSchema.safeParse(validPermissions).success).toBe(true);
        });

        it("rejects missing fields", () => {
            expect(UserPermissionsSchema.safeParse({ isAdmin: true }).success).toBe(false);
        });
    });

    describe("UserSchema", () => {
        it("validates a valid user", () => {
            expect(UserSchema.safeParse(validUser).success).toBe(true);
        });

        it("rejects user without username", () => {
            const { username, ...rest } = validUser;
            expect(UserSchema.safeParse(rest).success).toBe(false);
        });

        it("rejects user without permissions", () => {
            const { permissions, ...rest } = validUser;
            expect(UserSchema.safeParse(rest).success).toBe(false);
        });
    });

    describe("isValidUser", () => {
        it("returns true for valid user", () => {
            expect(isValidUser(validUser)).toBe(true);
        });

        it("returns false for non-object", () => {
            expect(isValidUser("not a user")).toBe(false);
        });
    });

    describe("isValidPartialUser", () => {
        it("returns true for partial user", () => {
            expect(isValidPartialUser({ username: "new" })).toBe(true);
        });

        it("returns true for empty object", () => {
            expect(isValidPartialUser({})).toBe(true);
        });
    });

    describe("isValidUserPermissions", () => {
        it("returns true for valid permissions", () => {
            expect(isValidUserPermissions(validPermissions)).toBe(true);
        });
    });

    describe("isValidPartialUserPermissions", () => {
        it("returns true for partial permissions", () => {
            expect(isValidPartialUserPermissions({ isAdmin: true })).toBe(true);
        });
    });
});
