import { Server } from "socket.io";
import socketHandler from "./socketHandler.js";
import jwt from 'jsonwebtoken'

const initSocket = (server) => {
    // Support multiple origins: local dev + production Vercel URL
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
    ].filter(Boolean); // remove undefined if env var not set

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true,
        },
        // Required for Render.com: allow polling fallback when WebSocket upgrades fail
        transports: ["websocket", "polling"],
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // socket.data is shared across fetchSockets() — this is the fix for kick/ban
            socket.data.userId = decoded.userId;
            socket.data.username = ""; // will be set when client emits join-room

            // Keep socket.user for backward compat (disconnect handler)
            socket.user = { id: decoded.userId, username: "" };

            next();
        } catch (err) {
            next(new Error("Authentication failed"));
        }
    });

    socketHandler(io);
};

export default initSocket;