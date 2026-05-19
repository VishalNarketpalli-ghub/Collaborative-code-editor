export default function cursorSocket(io, socket) {

    socket.on("cursor_move", ({ roomId, line, column }) => {

        const userId = socket.user.id;
        const username = socket.user.username;

        socket.to(roomId).emit("cursor_update", {
            userId,
            username,
            line,
            column
        });
    });
}