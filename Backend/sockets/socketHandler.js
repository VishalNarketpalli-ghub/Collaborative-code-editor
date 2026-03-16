import chatSocket from "./chatSocket.js"
import codeSocket from "./codeSocket.js"
import cursorSocket from "./cursorSocket.js"

const socketHandler = (io) => {

    io.on("connection", (socket) => {
        console.log("User Connected:", socket.id)

        codeSocket(io, socket)
        cursorSocket(io, socket)
        chatSocket(io, socket)

        socket.on("disconnect", () => {
            console.log("User disconnected: ", socket.id)
        })
    })
}

export default socketHandler