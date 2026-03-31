import express from 'express'
import { createRoom, getRoom, joinRoom, getUserRooms } from '../controllers/roomController.js'
import {verifyToken} from '../middleware/verifyToken.js'
const router = express.Router()

router.post("/create",verifyToken, createRoom)
router.post("/join",verifyToken, joinRoom)
router.get("/history", verifyToken, getUserRooms)
router.post("/:roomId",verifyToken, getRoom)

export default router