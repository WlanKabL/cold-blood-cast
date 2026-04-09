import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { verifyAccessToken } from "@/helpers/jwt.js";

// userId → Set of active WebSocket connections
const userSockets = new Map<string, Set<WebSocket>>();

/**
 * Register the /ws route and handle authentication via query param token.
 * Front-end connects: `new WebSocket("ws://host/ws?token=xxx")`
 */
export async function registerWebSocket(app: FastifyInstance): Promise<void> {
    // Register the websocket plugin
    const wsPlugin = await import("@fastify/websocket");
    await app.register(wsPlugin.default);

    app.get("/ws", { websocket: true }, (socket, request) => {
        // Authenticate via query param
        const token = (request.query as Record<string, string>).token;
        if (!token) {
            socket.close(4001, "Missing token");
            return;
        }

        let userId: string;
        try {
            const payload = verifyAccessToken(token);
            userId = payload.userId;
        } catch {
            socket.close(4001, "Invalid token");
            return;
        }

        // Register connection
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket);

        // Heartbeat / ping
        socket.on("message", (data: Buffer | ArrayBuffer | Buffer[]) => {
            let msg: string;
            if (typeof data === "string") {
                msg = data;
            } else if (Buffer.isBuffer(data)) {
                msg = data.toString("utf-8");
            } else if (data instanceof ArrayBuffer) {
                msg = Buffer.from(data).toString("utf-8");
            } else {
                // Buffer[] (fragmented frames)
                msg = Buffer.concat(data).toString("utf-8");
            }
            if (msg === "ping") {
                socket.send(JSON.stringify({ type: "pong" }));
            }
        });

        // Cleanup on close
        socket.on("close", () => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket);
                if (sockets.size === 0) userSockets.delete(userId);
            }
        });

        // Send welcome
        socket.send(JSON.stringify({ type: "connected" }));
    });
}

/**
 * Send a typed event to all active WebSocket connections for a user.
 * Fire-and-forget — swallows errors.
 */
export function sendToUser(userId: string, event: string, data: Record<string, unknown>): void {
    const sockets = userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;

    const payload = JSON.stringify({ type: event, ...data });

    for (const socket of sockets) {
        try {
            if (socket.readyState === 1) {
                // OPEN
                socket.send(payload);
            }
        } catch {
            // swallow
        }
    }
}

/**
 * Check if a user has any active WS connections (for deciding email fallback).
 */
export function isUserOnline(userId: string): boolean {
    const sockets = userSockets.get(userId);
    return !!sockets && sockets.size > 0;
}
