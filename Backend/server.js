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

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));

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
app.use((req, res) => {
    console.log(req.url);
    res.json({ message: `${req.url} is Invalid path` });
});

app.use((err, req, res, next) => {
    //general error
    console.log("Error:", err.name, err.code)

    //validation error
    if (err.name === "ValidationError")
        return res.status(400).json({ message: "Validation error", error: err.message })

    //cast error
    if (err.name === "CastError")
        return res.status(400).json({ message: "Cast error", error: err.message })
    const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code
    const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue
    if (errCode === 11000) {
        const field = Object.keys(keyValue)[0]
        return res.status(409).json({ error: `${field} "${keyValue[field]}" already exists` })
    }
    if (err.status)
        return res.status(err.status).json({ error: err.message })
    res.status(500).json({ error: "Internal server error" })
})