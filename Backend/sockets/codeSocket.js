import Room from "../models/Room.js";
import { runCode } from "../services/executeService.js";

export default function codeSocket(io, socket) {

    // JOIN ROOM
    socket.on("join-room", async ({ roomId, password }) => {

        const userId = socket.user.id;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return socket.emit("join_error", "Room not found");
        }

        if (room.password && room.password !== password) {
            return socket.emit("join_error", "Incorrect room password");
        }

        socket.join(roomId);

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        io.to(roomId).emit("user_joined", {
            userId,
            socketId: socket.id
        });
    });

    // LANGUAGE CHANGE
    socket.on("language_change", async ({ roomId, language }) => {

        const room = await Room.findOne({ roomId });
        if (!room) return;

        room.language = language;
        await room.save();

        socket.to(roomId).emit("language_update", language);
    });

    // CODE SYNC
    socket.on("code_change", ({ roomId, code }) => {
        socket.to(roomId).emit("code_update", code);
    });

    //RUN CODE
    socket.on("run_code", async ({ roomId, source_code, language_id, stdin }) => {
        try {
            // show running status
            io.to(roomId).emit("execution_status", "Running...");

            const result = await runCode(source_code, language_id, stdin);

            // send result to ALL users
            io.to(roomId).emit("code_output", {
                output: result.stdout,
                error: result.stderr,
                compile_output: result.compile_output,
                status: result.status.description
            });

        } catch (err) {
            io.to(roomId).emit("code_output", {
                error: "Execution failed"
            });
        }
    });
}