import { type Request, type NextFunction } from "express";
import { userStore } from "../stores/userStore.js";
import { verifyAccessToken } from "../helpers/jwt.js";
import { unauthorized } from "../helpers/errors.js";

export async function authMiddleware(req: Request, res: any, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(unauthorized());
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = verifyAccessToken(token);
        const user = await userStore.findById(payload.userId);
        if (!user) return next(unauthorized("User not found"));

        req.user = user;
        next();
    } catch {
        return next(unauthorized("Invalid token"));
    }
}
