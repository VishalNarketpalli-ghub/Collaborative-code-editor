import ChatMessage from "../models/chatMessage.js"

export default function chatSocket(io, socket) {
    socket.on("send-message", async ({ roomId, sender, message }) => {
        const chat = await ChatMessage.create({
            room: roomId,
            sender,
            message
        })
        io.to(roomId).emit("receive_message", chat)
    })
}