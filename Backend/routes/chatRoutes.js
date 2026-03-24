import express from 'express'
import { getChatHistory } from '../controllers/chatController.js'
import {verifyToken} from '../middleware/verifyToken.js'

const router = express.Router()

router.get("/:roomId",verifyToken,getChatHistory)

export default router