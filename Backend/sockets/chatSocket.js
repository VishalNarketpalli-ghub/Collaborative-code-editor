import ChatMessage from "../models/chatMessage.js";
import Room from "../models/Room.js";

export default function chatSocket(io, socket) {

    socket.on("send-message", async ({ roomId, message }) => {

        const userId = socket.user.id;
        const room = await Room.findOne({roomId})

        const chat = await ChatMessage.create({
            room: room._id,
            sender: userId,
            message
        });

        io.to(roomId).emit("receive_message", chat);
    });

    socket.on("join_room",(roomId)=>{
        socket.join(roomId)
    })

    socket.on("send_message",async(data)=>{
        
    })
}

