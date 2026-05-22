import Room from "../models/Room.js";
import CodeFile from "../models/Codefile.js";
import { runCode } from "../services/executeService.js";
import { languageFromFilename } from "../controllers/codeController.js";

// Helper: cast any value to a comparable string (handles ObjectId, string, etc.)
const toStr = (val) => String(val);

// Maximum files per room — must match the value in codeController.js.
const MAX_FILES_PER_ROOM = 10;

export default function codeSocket(io, socket) {

    // ── JOIN ROOM ─────────────────────────────────────────────────────────────
    socket.on("join-room", async ({ roomId, username }) => {

        const userId = socket.data.userId;

        // Store the username on socket.data so fetchSockets() can read it later.
        if (username) {
            socket.data.username = username;
            socket.user.username = username;
        }

        const room = await Room.findOne({ roomId });

        if (!room) {
            return socket.emit("join_error", "Room not found");
        }

        // Non-hosts cannot join an inactive (ended) session.
        // Hosts can always enter their own room regardless of isActive because
        // they may be reopening it via the EditorPage auto-reopen flow.
        const isHost = toStr(room.createdBy) === toStr(userId);
        if (!room.isActive && !isHost) {
            return socket.emit("join_error", "This session has ended");
        }

        // Check bannedUsers BEFORE participants. A banned user may still be in
        // room.participants (banning does not remove them from the array in the
        // DB). Checking here first prevents the participant check below from
        // granting them entry.
        const isBanned = room.bannedUsers && room.bannedUsers.some(
            (b) => toStr(b) === toStr(userId)
        );
        if (isBanned) {
            return socket.emit("join_error", "You have been banned from this room.");
        }

        // The REST API (/room/join) adds users to participants before they ever
        // reach this socket event. Verifying again here is a second layer of
        // defence against unauthenticated direct-socket access.
        const isParticipant = room.participants.some(
            (p) => toStr(p) === toStr(userId)
        );
        if (!isParticipant) {
            return socket.emit("join_error", "You are not a participant of this room.");
        }

        // All checks passed — join the Socket.IO room.
        socket.join(roomId);

        // Fetch all sockets currently in the room AFTER this socket joined.
        const sockets = await io.in(roomId).fetchSockets();
        const activeUsers = sockets.map((s) => ({
            userId: s.data.userId,
            username: s.data.username || "Unknown",
        }));

        // Send the full online-user list back to the user who just joined.
        socket.emit("room_users", activeUsers);

        // Request a live code sync from an existing peer so the new joiner gets
        // the current in-memory editor state rather than just the last DB snapshot.
        const peers = sockets.filter((s) => s.data.userId !== userId);
        if (peers.length > 0) {
            peers[0].emit("request_code_sync", {
                targetSocketId: socket.id,
                // Also ask the peer to send the current active filename so the
                // new joiner can open the same file as everyone else.
                requestActiveFile: true,
            });
        } else {
            // No peers are online — fall back to the last DB-saved content so the
            // editor is not blank when the user is the sole person in the room.
            // We emit db_file_sync instead of hijacking request_code_sync so the
            // client can distinguish between a live-peer sync and a DB snapshot.
            const dbFiles = await CodeFile.find(
                { roomId },
                { filename: 1, content: 1, language: 1 }
            );
            if (dbFiles.length > 0) {
                socket.emit("db_file_sync", { files: dbFiles });
            }
        }

        // Notify everyone else that this user joined.
        socket.to(roomId).emit("user_joined", { userId, username });
    });

    // ── CODE SYNC RELAY ───────────────────────────────────────────────────────
    // A peer pushes their current code to the new joiner's socket.
    // The server only relays — it does not store the transient state.
    socket.on("send_code_sync", ({ targetSocketId, code, filename }) => {
        io.to(targetSocketId).emit("code_sync", { code, filename });
    });

    // ── CODE CHANGE (broadcast) ───────────────────────────────────────────────
    // Relay a code change to all other users in the room.
    // The sender must actually be in the Socket.IO room to prevent a banned or
    // kicked user whose socket is still alive from pushing edits.
    socket.on("code_change", ({ roomId, code, filename }) => {
        if (!socket.rooms.has(roomId)) return;
        socket.to(roomId).emit("code_update", { code, filename });
    });

    // ── LEAVE ROOM ────────────────────────────────────────────────────────────
    socket.on("leave_room", ({ roomId }) => {
        socket.leave(roomId);
        const userId = socket.data.userId;
        const username = socket.data.username;
        io.to(roomId).emit("user_left", { userId, username });
    });

    // ── KICK USER (host only) ─────────────────────────────────────────────────
    socket.on("kick_user", async ({ roomId, targetUserId }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room || toStr(room.createdBy) !== toStr(userId)) return;

        const sockets = await io.in(roomId).fetchSockets();
        const targetSocket = sockets.find((s) => s.data.userId === targetUserId);

        if (targetSocket) {
            targetSocket.emit("kicked");
            targetSocket.leave(roomId);
            io.to(roomId).emit("user_left", {
                userId: targetUserId,
                username: targetSocket.data.username,
            });
        }
    });

    // ── BAN USER (host only) ──────────────────────────────────────────────────
    socket.on("ban_user", async ({ roomId, targetUserId }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room || toStr(room.createdBy) !== toStr(userId)) return;

        if (!room.bannedUsers) room.bannedUsers = [];
        const alreadyBanned = room.bannedUsers.some(
            (b) => toStr(b) === toStr(targetUserId)
        );
        if (!alreadyBanned) {
            room.bannedUsers.push(targetUserId);
        }

        // Remove the banned user from participants so that on every subsequent
        // page load initRoom() triggers POST /room/join which correctly returns
        // 403 Forbidden.
        room.participants = room.participants.filter(
            (p) => toStr(p) !== toStr(targetUserId)
        );

        await room.save();

        // Disconnect their active socket from the room immediately.
        const sockets = await io.in(roomId).fetchSockets();
        const targetSocket = sockets.find((s) => s.data.userId === targetUserId);

        if (targetSocket) {
            targetSocket.emit("banned");
            targetSocket.leave(roomId);
            io.to(roomId).emit("user_left", {
                userId: targetUserId,
                username: targetSocket.data.username,
            });
        }
    });

    // ── LANGUAGE CHANGE (host only) ───────────────────────────────────────────
    socket.on("language_change", async ({ roomId, language }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room) return;
        if (toStr(room.createdBy) !== toStr(userId)) return;

        room.language = language;
        await room.save();

        socket.to(roomId).emit("language_update", language);
    });

    // ── END SESSION (host only) ───────────────────────────────────────────────
    socket.on("end_session", async ({ roomId }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room) return;
        if (toStr(room.createdBy) !== toStr(userId)) return;

        room.isActive = false;
        await room.save();

        // Broadcast session_ended to everyone EXCEPT the host.
        // The host has already navigated away in handleEndSession() before this
        // event reaches the client, so sending it to the host would trigger a
        // redundant navigate("/room") call from the onSessionEnded handler.
        socket.to(roomId).emit("session_ended");
    });

    // ── RUN CODE ──────────────────────────────────────────────────────────────
    socket.on("run_code", async ({ roomId, source_code, language, stdin }) => {
        try {
            io.to(roomId).emit("execution_status", "Running...");

            const result = await runCode(source_code, language, stdin);

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

    // ── FILE CREATED (host only, relayed to all peers) ────────────────────────
    // The host creates a file via REST and then emits this event so all
    // connected participants update their file explorer without a page refresh.
    socket.on("file_created", async ({ roomId, file }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room || toStr(room.createdBy) !== toStr(userId)) return;
        if (!socket.rooms.has(roomId)) return;

        // Relay the new file metadata to every other participant.
        socket.to(roomId).emit("file_created", { file });
    });

    // ── FILE DELETED (host only, relayed to all peers) ────────────────────────
    socket.on("file_deleted", async ({ roomId, filename }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room || toStr(room.createdBy) !== toStr(userId)) return;
        if (!socket.rooms.has(roomId)) return;

        socket.to(roomId).emit("file_deleted", { filename });
    });

    // ── FILE RENAMED (host only, relayed to all peers) ────────────────────────
    socket.on("file_renamed", async ({ roomId, oldName, newName, newLanguage }) => {
        const userId = socket.data.userId;
        const room = await Room.findOne({ roomId });
        if (!room || toStr(room.createdBy) !== toStr(userId)) return;
        if (!socket.rooms.has(roomId)) return;

        socket.to(roomId).emit("file_renamed", { oldName, newName, newLanguage });
    });

    // ── ACTIVE FILE SWITCH (broadcast, any user) ──────────────────────────────
    // Optional: when a user switches to a different file tab, broadcast so peers
    // can see which file they are currently editing (used only for display).
    socket.on("active_file_switch", ({ roomId, filename }) => {
        if (!socket.rooms.has(roomId)) return;
        socket.to(roomId).emit("peer_switched_file", {
            userId: socket.data.userId,
            username: socket.data.username,
            filename,
        });
    });
}