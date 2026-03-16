import chatSocket from "./chatSocket"
import codeSocket from "./codeSocket"
import cursorSocket from "./cursorSocket"

const socketHandler = (io) =>{
    
    io.on("connection",(socket)=>{
        console.log("User Connected:",socket.id)

        codeSocket(io,socket)
        cursorSocket(io,socket)
        chatSocket(io,socket)

        socket.on("disconnect",()=>{
            console.log("User disconnected: ",socket.id)
        })
    })
}

export default socketHandler