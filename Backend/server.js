import express from 'express'
import http from 'http'
import cors from 'cors'
import connectDB from './config/db.js'
import initSocket from "./sockets/index.js"
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import codeRoutes from './routes/codeRoutes.js'
import roomRoutes from './routes/roomRoutes.js'
import cookieParser from 'cookie-parser'


dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/code", codeRoutes)
app.use("/api/room", roomRoutes)



const server = http.createServer(app)


connectDB()
initSocket(server)


server.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`)
})

// dealing with invalid path
app.use((req, res, next) => {
  console.log(req.url);
  res.json({ message: `${req.url} is Invalid path` });
});

// error handling middleware
app.use((err, req, res, next) => {

  console.log("Error name:", err.name);
  console.log("Error code:", err.code);
  console.log("Full error:", err);

  // mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];
    return res.status(409).json({
      message: "error occurred",
      error: `${field} "${value}" already exists`,
    });
  }

  // ✅ HANDLE CUSTOM ERRORS
  if (err.status) {
    return res.status(err.status).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // default server error
  res.status(500).json({
    message: "error occurred",
    error: "Server side error",
  });
});