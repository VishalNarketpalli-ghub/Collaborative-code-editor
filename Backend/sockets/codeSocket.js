import Room from "../models/Room.js"

export default function codeSocket(io, socket) {

    socket.on("join-room", async ({ roomId, userId, password }) => {

        const room = await Room.findOne({ roomId })

        if (!room) {
            return socket.emit("join_error", "Room not found")
        }

        if (room.password && room.password !== password) {
            return socket.emit("join_error", "Incorrect room password")
        }

        socket.join(roomId)

        if (!room.participants.includes(userId)) {
            room.participants.push(userId)
            await room.save()
        }

        io.to(roomId).emit("user_joined", {
            userId,
            socketId: socket.id
        })

    })


    socket.on("language_change", async ({ roomId, language }) => {

        const room = await Room.findOne({ roomId })

        if (!room) return

        room.language = language
        await room.save()

        socket.to(roomId).emit("language_update", language)

    })

    socket.on("code_change", ({ roomId, code }) => {
        socket.to(roomId).emit("code_update", code)
    })
}