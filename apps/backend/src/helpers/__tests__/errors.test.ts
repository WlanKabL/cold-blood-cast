import { describe, it, expect } from "vitest";
import {
    ErrorCodes,
    AppError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    internalError,
    serviceUnavailable,
} from "../errors.js";

describe("ErrorCodes", () => {
    it("contains all expected domain groups", () => {
        expect(ErrorCodes.E_INTERNAL_SERVER_ERROR).toBe("E_INTERNAL_SERVER_ERROR");
        expect(ErrorCodes.E_AUTH_INVALID_CREDENTIALS).toBe("E_AUTH_INVALID_CREDENTIALS");
        expect(ErrorCodes.E_ENCLOSURE_NOT_FOUND).toBe("E_ENCLOSURE_NOT_FOUND");
        expect(ErrorCodes.E_SENSOR_NOT_FOUND).toBe("E_SENSOR_NOT_FOUND");
        expect(ErrorCodes.E_PET_NOT_FOUND).toBe("E_PET_NOT_FOUND");
    });

    it("has unique values (no duplicates)", () => {
        const values = Object.values(ErrorCodes);
        const unique = new Set(values);
        expect(unique.size).toBe(values.length);
    });

    it("all codes follow E_ prefix convention", () => {
        for (const code of Object.values(ErrorCodes)) {
            expect(code).toMatch(/^E_[A-Z0-9_]+$/);
        }
    });
});

describe("AppError", () => {
    it("creates with all required fields", () => {
        const err = new AppError(ErrorCodes.E_NOT_FOUND, 404, "Not found");
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(AppError);
        expect(err.name).toBe("AppError");
        expect(err.code).toBe("E_NOT_FOUND");
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe("Not found");
        expect(err.details).toBeUndefined();
    });

    it("stores optional details", () => {
        const details = { field: "email", reason: "taken" };
        const err = new AppError(ErrorCodes.E_VALIDATION_ERROR, 400, "Invalid", details);
        expect(err.details).toEqual(details);
    });

    it("toResponse() returns structured error without details", () => {
        const err = new AppError(ErrorCodes.E_FORBIDDEN, 403, "No access");
        expect(err.toResponse()).toEqual({
            success: false,
            error: {
                code: "E_FORBIDDEN",
                message: "No access",
            },
        });
    });

    it("toResponse() includes details when present", () => {
        const err = new AppError(ErrorCodes.E_VALIDATION_ERROR, 400, "Bad input", {
            fields: ["name"],
        });
        expect(err.toResponse()).toEqual({
            success: false,
            error: {
                code: "E_VALIDATION_ERROR",
                message: "Bad input",
                details: { fields: ["name"] },
            },
        });
    });

    it("is catchable as a regular Error", () => {
        const err = new AppError(ErrorCodes.E_INTERNAL_SERVER_ERROR, 500, "Oops");
        expect(() => {
            throw err;
        }).toThrow("Oops");
    });
});

describe("Factory Helpers", () => {
    describe("badRequest()", () => {
        it("creates 400 error", () => {
            const err = badRequest(ErrorCodes.E_VALIDATION_ERROR, "Invalid data");
            expect(err.statusCode).toBe(400);
            expect(err.code).toBe("E_VALIDATION_ERROR");
            expect(err.message).toBe("Invalid data");
        });

        it("passes details through", () => {
            const err = badRequest(ErrorCodes.E_VALIDATION_ERROR, "Bad", { field: "x" });
            expect(err.details).toEqual({ field: "x" });
        });
    });

    describe("unauthorized()", () => {
        it("creates 401 error", () => {
            const err = unauthorized(ErrorCodes.E_AUTH_TOKEN_EXPIRED, "Token expired");
            expect(err.statusCode).toBe(401);
            expect(err.code).toBe("E_AUTH_TOKEN_EXPIRED");
        });
    });

    describe("forbidden()", () => {
        it("creates 403 with default message when called with no args", () => {
            const err = forbidden();
            expect(err.statusCode).toBe(403);
            expect(err.code).toBe("E_FORBIDDEN");
            expect(err.message).toBe("Forbidden");
        });

        it("creates 403 with custom message", () => {
            const err = forbidden("Not allowed");
            expect(err.statusCode).toBe(403);
            expect(err.message).toBe("Not allowed");
        });

        it("creates 403 with code and message", () => {
            const err = forbidden(ErrorCodes.E_ADMIN_REQUIRED, "Admin only");
            expect(err.statusCode).toBe(403);
            expect(err.code).toBe("E_ADMIN_REQUIRED");
            expect(err.message).toBe("Admin only");
        });
    });

    describe("notFound()", () => {
        it("creates 404 error", () => {
            const err = notFound(ErrorCodes.E_SENSOR_NOT_FOUND, "Sensor missing");
            expect(err.statusCode).toBe(404);
            expect(err.code).toBe("E_SENSOR_NOT_FOUND");
        });
    });

    describe("internalError()", () => {
        it("creates 500 with default message", () => {
            const err = internalError();
            expect(err.statusCode).toBe(500);
            expect(err.code).toBe("E_INTERNAL_SERVER_ERROR");
            expect(err.message).toBe("Internal server error");
        });

        it("creates 500 with custom message", () => {
            const err = internalError("DB connection lost");
            expect(err.message).toBe("DB connection lost");
        });
    });

    describe("serviceUnavailable()", () => {
        it("creates 503 error", () => {
            const err = serviceUnavailable(ErrorCodes.E_MAINTENANCE_MODE, "Under maintenance");
            expect(err.statusCode).toBe(503);
            expect(err.code).toBe("E_MAINTENANCE_MODE");
        });
    });
});
