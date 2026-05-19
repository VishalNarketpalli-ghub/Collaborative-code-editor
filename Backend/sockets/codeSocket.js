import Room from "../models/Room.js";
import { runCode } from "../services/executeService.js";

export default function codeSocket(io, socket) {

    socket.on("join-room", async ({ roomId, password, username }) => {

        const userId = socket.user.id;
        socket.user.username = username; // Store on socket
        socket.data.username = username; // Store on data for fetchSockets

        const room = await Room.findOne({ roomId });

        if (!room) {
            return socket.emit("join_error", "Room not found");
        }

        if (room.password && room.password !== password) {
            return socket.emit("join_error", "Incorrect room password");
        }

        if (room.bannedUsers && room.bannedUsers.includes(userId)) {
            return socket.emit("join_error", "You have been banned from this room");
        }

        socket.join(roomId);

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        // Get actual online users
        const sockets = await io.in(roomId).fetchSockets();
        const activeUsers = sockets.map(s => ({
            userId: s.data.userId,
            username: s.data.username || "Unknown"
        }));

        // Send full list to the user who just joined
        socket.emit("room_users", activeUsers);

        // Notify others
        socket.to(roomId).emit("user_joined", {
            userId,
            username
        });
    });

    // LEAVE ROOM
    socket.on("leave_room", async ({ roomId }) => {
        socket.leave(roomId);
        const userId = socket.user.id;
        const username = socket.user.username;
        io.to(roomId).emit("user_left", { userId, username });
    });

    // KICK USER (Host only)
    socket.on("kick_user", async ({ roomId, targetUserId }) => {
        const userId = socket.user.id;
        const room = await Room.findOne({ roomId });
        if (!room || room.createdBy.toString() !== userId) return;

        // Find target user's socket
        const sockets = await io.in(roomId).fetchSockets();
        const targetSocket = sockets.find(s => s.data.userId === targetUserId);
        
        if (targetSocket) {
            targetSocket.emit("kicked");
            targetSocket.leave(roomId);
            io.to(roomId).emit("user_left", { userId: targetUserId, username: targetSocket.data.username });
        }
    });

    // BAN USER (Host only)
    socket.on("ban_user", async ({ roomId, targetUserId }) => {
        const userId = socket.user.id;
        const room = await Room.findOne({ roomId });
        if (!room || room.createdBy.toString() !== userId) return;

        // Add to banned list
        if (!room.bannedUsers) room.bannedUsers = [];
        if (!room.bannedUsers.includes(targetUserId)) {
            room.bannedUsers.push(targetUserId);
            await room.save();
        }

        // Force them out
        const sockets = await io.in(roomId).fetchSockets();
        const targetSocket = sockets.find(s => s.data.userId === targetUserId);
        
        if (targetSocket) {
            targetSocket.emit("banned");
            targetSocket.leave(roomId);
            io.to(roomId).emit("user_left", { userId: targetUserId, username: targetSocket.data.username });
        }
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