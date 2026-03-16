import { Server } from "socket.io";
import socketHandler from "./socketHandler.js";

const initSocket = (server) => {

  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // socketHandler(io, socket);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

};

export default initSocket;