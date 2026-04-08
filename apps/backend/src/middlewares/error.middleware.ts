import { type NextFunction, type Request, type Response } from "express";
import { AppError } from "../helpers/errors.js";

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            ...(err.code ? { code: err.code } : {}),
        });
        return;
    }

    const isProduction = process.env.NODE_ENV === "production";

    res.status(500).json({
        error: "Internal Server Error",
        ...(!isProduction ? { message: err.message } : {}),
    });
}
