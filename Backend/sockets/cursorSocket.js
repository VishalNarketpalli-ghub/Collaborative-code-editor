export default function cursorSocket(io,socket){
    socket.on("cursor_move",({roomId,userId,line,column})=>{
        socket.to(roomId).emit("cursor_update",{
            userId,line,column
        })
    })
}