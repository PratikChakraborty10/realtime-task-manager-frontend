import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
    return socket;
}

export function connectSocket(token: string): Socket {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
        console.log("[Socket] Connected");
    });

    socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error.message);
    });

    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// Room management
export function joinProjectRoom(projectId: string): void {
    socket?.emit("join:project", projectId);
}

export function leaveProjectRoom(projectId: string): void {
    socket?.emit("leave:project", projectId);
}

export function joinTaskRoom(taskId: string): void {
    socket?.emit("join:task", taskId);
}

export function leaveTaskRoom(taskId: string): void {
    socket?.emit("leave:task", taskId);
}
