import { Server } from "socket.io";
import socketHandler from "./socketHandler.js";
import jwt from 'jsonwebtoken'

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173"],
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = {
                id: decoded.userId
            };

            next();
        } catch (err) {
            next(new Error("Authentication failed"));
        }
    });

    socketHandler(io);
};

export default initSocket;