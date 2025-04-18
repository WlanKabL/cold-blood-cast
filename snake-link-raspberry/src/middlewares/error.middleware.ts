import { NextFunction, Request, Response } from "express";

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error("🔥 Uncaught error:", err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
    });
}
