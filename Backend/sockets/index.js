import { Server } from "socket.io";
import socketHandler from "./socketHandler.js";

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  socketHandler(io); 
};

export default initSocket;