import { io, Socket } from "socket.io-client";
import { env } from "./env";
import { tokenStorage } from "./api/token";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket && typeof window !== "undefined") {
    const token = tokenStorage.getAccessToken();

    socket = io(env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("⚡ [Socket] Connected to Royal Honey BD server:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 [Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ [Socket] Connection error:", err.message);
    });
  }

  return socket!;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

