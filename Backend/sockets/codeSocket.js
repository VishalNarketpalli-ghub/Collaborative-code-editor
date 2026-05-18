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

    // LANGUAGE CHANGE : host only
    socket.on("language_change", async ({ roomId, language }) => {

        const userId = socket.user.id
        const room = await Room.findOne({ roomId });
        if (!room) return;
        if(room.createdBy.toString() !== userId) return

        room.language = language;
        await room.save();

        socket.to(roomId).emit("language_update", language);
    });

    // CODE SYNC
    socket.on("code_change", ({ roomId, code }) => {
        socket.to(roomId).emit("code_update", code);
    });

    //RUN CODE - broadcasting output to all users in room
    socket.on("run_code", async ({ roomId, source_code, language, stdin }) => {
        console.log(`[run_code] trigger for roomId: ${roomId}, lang: ${language}`);
        try {
            io.to(roomId).emit("execution_status", "Running...");

            const result = await runCode(source_code, language, stdin);
            console.log(`[run_code] result:`, result);

            if (result.statusCode === 200) {
                io.to(roomId).emit("code_output", {
                    stdout: result.output,
                    stderr: "",
                    exitCode: 0,
                });
            } else {
                io.to(roomId).emit("code_output", {
                    stdout: "",
                    stderr: result.output || result.error || "Execution failed",
                    exitCode: result.statusCode,
                });
            }

        } catch (err) {
            console.error("Run code error:", err.message);
            io.to(roomId).emit("code_output", {
                stderr: "Execution failed: " + err.message,
                exitCode: 1,
            });
        }
    });

    socket.on("end_session",async({roomId})=>{
        
        const userId = socket.user.id
        const room = await Room.findOne({roomId})
        if(!room) return
        if(room.createdBy.toString() !== userId) return // only host

        room.isActive = false
        await room.save()

        //broadcast to everyone in the room
        io.to(roomId).emit("session_ended")
    })
}