import express from 'express'
import { createRoom, getRoom, joinRoom } from '../controllers/roomController'

const router = express.Router()

router.post("/create",createRoom)
router.post("/join",joinRoom)
router.post("/:roomId",getRoom)

export default router