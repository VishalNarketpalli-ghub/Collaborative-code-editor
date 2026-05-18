import { io } from "socket.io-client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const token = jwt.sign({ userId: "testUser123" }, JWT_SECRET);

const socket = io("http://localhost:6600", {
    auth: { token }
});

const roomId = "testRoom";

socket.on("connect", () => {
    console.log("Connected to socket server");
    
    // simulate joining the room
    socket.emit("join-room", { roomId });

    socket.on("execution_status", (status) => {
        console.log("Received status:", status);
    });

    socket.on("code_output", (output) => {
        console.log("Received code output:", output);
        process.exit(0);
    });

    setTimeout(() => {
        console.log("Emitting run_code...");
        socket.emit("run_code", {
            roomId,
            source_code: "console.log('Hello from socket');",
            language: "javascript",
            stdin: ""
        });
    }, 1000);
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
});
