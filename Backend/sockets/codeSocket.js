import Room from "../models/Room.js";
import { runCode } from "../services/executeService.js";

export default function codeSocket(io, socket) {

    socket.on("join-room", async ({ roomId, password, username }) => {

        const userId = socket.data.userId;

        // Store username on both socket.data (for fetchSockets) and socket.user (for disconnect)
        if (username) {
            socket.data.username = username;
            socket.user.username = username;
        }

        const room = await Room.findOne({ roomId });

        if (!room) {
            return socket.emit("join_error", "Room not found");
        }

        // Verify the user is allowed in this room.
        //
        // We do NOT re-validate the password here. The HTTP API (/room/join) already
        // handled authentication and added the user to room.participants before the
        // client ever emits this socket event. If we checked the password here,
        // it would always fail because the client does not send the password to the socket.
        //
        // Instead, we trust the server-side state: if the user is in room.participants,
        // they were already authenticated by the HTTP API. This is the secure approach.
        const isParticipant = room.participants.some(
            (p) => p.toString() === userId
        );

        if (!isParticipant) {
            // This covers unauthenticated direct-link access attempts.
            return socket.emit("join_error", "You are not a participant of this room.");
        }

        // Block banned users from the socket layer as a second line of defense.
        if (room.bannedUsers && room.bannedUsers.some(b => b.toString() === userId)) {
            return socket.emit("join_error", "You have been banned from this room.");
        }

        socket.join(roomId);

        // Get all sockets currently in the room (AFTER this socket joined).
        const sockets = await io.in(roomId).fetchSockets();
        const activeUsers = sockets.map(s => ({
            userId: s.data.userId,
            username: s.data.username || "Unknown"
        }));

        // Send full online user list to the user who just joined.
        socket.emit("room_users", activeUsers);

        // Request a live code sync from an existing peer (not the joiner themselves).
        // This ensures the new joiner gets the current in-memory editor state, not just
        // the last database snapshot. We pick one existing peer arbitrarily.
        const peers = sockets.filter(s => s.data.userId !== userId);
        if (peers.length > 0) {
            // Ask the first available peer to send their current code to the new joiner.
            // The peer will respond with a "send_code_sync" event targeted at the new socket id.
            peers[0].emit("request_code_sync", { targetSocketId: socket.id });
        }

        // Notify others that this user has joined.
        socket.to(roomId).emit("user_joined", {
            userId,
            username
        });
    });

    // CODE PUSH: a peer sends their current code to a specific socket.
    // This is triggered by "request_code_sync" above and emitted by the peer's client.
    socket.on("send_code_sync", ({ targetSocketId, code }) => {
        // Forward the code directly to the new joiner's socket.
        io.to(targetSocketId).emit("code_sync", code);
    });

    // LEAVE ROOM
    socket.on("leave_room", async ({ roomId }) => {
        socket.leave(roomId);
        const userId = socket.data.userId;
        const username = socket.data.username;
        io.to(roomId).emit("user_left", { userId, username });
    });

    // KICK USER (Host only)
    socket.on("kick_user", async ({ roomId, targetUserId }) => {
        const userId = socket.data.userId;
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
        const userId = socket.data.userId;
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

        const userId = socket.data.userId
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
        
        const userId = socket.data.userId
        const room = await Room.findOne({roomId})
        if(!room) return
        if(room.createdBy.toString() !== userId) return // only host

        room.isActive = false
        await room.save()

        //broadcast to everyone in the room
        io.to(roomId).emit("session_ended")
    })
}