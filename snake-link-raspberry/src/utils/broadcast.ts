import { WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

export const broadcast = (data: any) => {
    if (!wss) return;
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(payload);
    });
};

broadcast.setServer = (server: WebSocketServer) => {
    wss = server;
};
