export default function cursorSocket(io, socket) {

    socket.on("cursor_move", ({ roomId, line, column }) => {

        const userId = socket.data.userId;
        const username = socket.data.username || "Unknown";

        socket.to(roomId).emit("cursor_update", {
            userId,
            username,
            line,
            column
        });
    });
}