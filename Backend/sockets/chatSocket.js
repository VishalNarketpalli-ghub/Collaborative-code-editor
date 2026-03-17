import ChatMessage from "../models/chatMessage.js";

export default function chatSocket(io, socket) {

    socket.on("send-message", async ({ roomId, message }) => {

        const userId = socket.user.id;

        const chat = await ChatMessage.create({
            room: roomId,
            sender: userId,
            message
        });

        io.to(roomId).emit("receive_message", chat);
    });
}