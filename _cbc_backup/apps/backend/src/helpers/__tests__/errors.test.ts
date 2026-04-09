import { describe, it, expect } from "vitest";
import {
    AppError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    internal,
} from "../errors.js";

describe("error helpers", () => {
    describe("AppError", () => {
        it("extends Error", () => {
            const err = new AppError(400, "test");
            expect(err).toBeInstanceOf(Error);
            expect(err).toBeInstanceOf(AppError);
        });

        it("stores statusCode, message, and code", () => {
            const err = new AppError(422, "Validation failed", "VALIDATION");
            expect(err.statusCode).toBe(422);
            expect(err.message).toBe("Validation failed");
            expect(err.code).toBe("VALIDATION");
        });

        it("has name AppError", () => {
            const err = new AppError(500, "test");
            expect(err.name).toBe("AppError");
        });
    });

    describe("factory functions", () => {
        it("badRequest returns 400", () => {
            const err = badRequest("bad input");
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe("bad input");
        });

        it("unauthorized returns 401 with default message", () => {
            const err = unauthorized();
            expect(err.statusCode).toBe(401);
            expect(err.message).toBe("Unauthorized");
        });

        it("unauthorized accepts custom message", () => {
            const err = unauthorized("Invalid token");
            expect(err.message).toBe("Invalid token");
        });

        it("forbidden returns 403 with default message", () => {
            const err = forbidden();
            expect(err.statusCode).toBe(403);
            expect(err.message).toBe("Forbidden");
        });

        it("notFound returns 404 with default message", () => {
            const err = notFound();
            expect(err.statusCode).toBe(404);
            expect(err.message).toBe("Not found");
        });

        it("conflict returns 409", () => {
            const err = conflict("Already exists");
            expect(err.statusCode).toBe(409);
            expect(err.message).toBe("Already exists");
        });

        it("internal returns 500 with default message", () => {
            const err = internal();
            expect(err.statusCode).toBe(500);
            expect(err.message).toBe("Internal server error");
        });

        it("all factories accept optional code", () => {
            const err = badRequest("msg", "BAD_REQUEST");
            expect(err.code).toBe("BAD_REQUEST");
        });
    });
});
