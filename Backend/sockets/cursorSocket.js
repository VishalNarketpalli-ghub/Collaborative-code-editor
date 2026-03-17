export default function cursorSocket(io, socket) {

    socket.on("cursor_move", ({ roomId, line, column }) => {

        const userId = socket.user.id;

        socket.to(roomId).emit("cursor_update", {
            userId,
            line,
            column
        });
    });
}