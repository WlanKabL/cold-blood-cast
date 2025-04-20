import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { userStore } from "../stores/userStore.js";
import { User } from "../types/users.js";

export interface AuthRequest extends Request {
    user?: User;
}

export function authMiddleware(req: AuthRequest, res: any, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = userStore.findById(payload.id);
        if (!user) return res.status(401).json({ error: "Invalid token" });

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
