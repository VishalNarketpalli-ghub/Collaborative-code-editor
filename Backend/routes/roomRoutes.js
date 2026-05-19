import express from 'express'
import { createRoom, getRoom, joinRoom, getUserRooms, endSession, reopenSession, deleteRoom, deleteAllUserRooms } from '../controllers/roomController.js'
import {verifyToken} from '../middleware/verifyToken.js'
const router = express.Router()

router.post("/create",verifyToken, createRoom)
router.post("/join",verifyToken, joinRoom)
router.get("/history", verifyToken, getUserRooms)
router.delete("/all", verifyToken, deleteAllUserRooms)
router.delete("/:roomId", verifyToken, deleteRoom)
router.get("/:roomId",verifyToken, getRoom)
router.patch("/:roomId/end", verifyToken, endSession)
router.patch("/:roomId/reopen", verifyToken, reopenSession)

export default router