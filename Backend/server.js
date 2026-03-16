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



dotenv.config()
const app = express()
app.use(cors)
app.use(express.json())

app.use("/api/auth",authRoutes)
app.use("/api/auth",chatRoutes)
app.use("/api/auth",codeRoutes)
app.use("/api/auth",roomRoutes)


const server = http.createServer(app)


connectDB()
initSocket(server)


server.listen(process.env.PORT,()=>{
    console.log(`server is running on port ${process.env.PORT}`)
})