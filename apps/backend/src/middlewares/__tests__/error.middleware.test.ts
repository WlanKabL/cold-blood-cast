import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorMiddleware } from "../error.middleware.js";
import { AppError } from "../../helpers/errors.js";
import type { Request, Response, NextFunction } from "express";

function createMockRes() {
    const res = {
        statusCode: 0,
        body: null as unknown,
        status(code: number) {
            res.statusCode = code;
            return res;
        },
        json(data: unknown) {
            res.body = data;
            return res;
        },
    };
    return res as typeof res & Response;
}

describe("errorMiddleware", () => {
    const req = {} as Request;
    const next = vi.fn() as NextFunction;

    it("handles AppError with correct status and message", () => {
        const err = new AppError(400, "Bad input", "BAD_INPUT");
        const res = createMockRes();

        errorMiddleware(err, req, res, next);

        expect((res as any).statusCode).toBe(400);
        expect((res as any).body).toEqual({ error: "Bad input", code: "BAD_INPUT" });
    });

    it("handles AppError without code", () => {
        const err = new AppError(404, "Not found");
        const res = createMockRes();

        errorMiddleware(err, req, res, next);

        expect((res as any).statusCode).toBe(404);
        expect((res as any).body).toEqual({ error: "Not found" });
    });

    it("returns 500 for generic errors in production", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";

        const err = new Error("Sensitive database info");
        const res = createMockRes();

        errorMiddleware(err, req, res, next);

        expect((res as any).statusCode).toBe(500);
        expect((res as any).body).toEqual({ error: "Internal Server Error" });

        process.env.NODE_ENV = originalEnv;
    });

    it("exposes error message in development", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";

        const err = new Error("Debug info");
        const res = createMockRes();

        errorMiddleware(err, req, res, next);

        expect((res as any).statusCode).toBe(500);
        expect((res as any).body).toEqual({
            error: "Internal Server Error",
            message: "Debug info",
        });

        process.env.NODE_ENV = originalEnv;
    });
});
