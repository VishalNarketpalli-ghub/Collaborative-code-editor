import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
    if(socket) return socket

    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:6600", {
        auth: { token },
        // Allow polling fallback — needed when Render's WebSocket upgrade is slow
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket){
        socket.disconnect()
        socket=null
    }
};