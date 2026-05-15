import ChatMessage from "../models/chatMessage.js";
import Room from "../models/Room.js";

export default function chatSocket(io, socket) {
    socket.on("send-message", async ({ roomId, message }) => {
        try {
            const userId = socket.user.id;
            const room = await Room.findOne({ roomId })
            if(!room) return

            const chat = await ChatMessage.create({
                room: room._id,
                sender: userId,
                message
            });

            //populate sener username before broadcasting
            const populated = await ChatMessage.findById(chat._id).populate("sender","username")
            io.to(roomId).emit("receive_message",populated)
        }catch(error){
            console.error("Chat error:",error.message)
        }
    });
}

