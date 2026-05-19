import chatSocket from "./chatSocket.js"
import codeSocket from "./codeSocket.js"
import cursorSocket from "./cursorSocket.js"

const socketHandler = (io) => {

    io.on("connection", (socket) => {
        console.log("User Connected:", socket.id)

        codeSocket(io, socket)
        cursorSocket(io, socket)
        chatSocket(io, socket)

        socket.on("disconnecting", () => {
            const rooms = [...socket.rooms];

            rooms.forEach((roomId) => {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit("user_left", {
                        userId: socket.data.userId,
                        username: socket.data.username || "Unknown"
                    });
                }
            });
        });
    })
}

export default socketHandler