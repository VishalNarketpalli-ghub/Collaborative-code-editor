import express from 'express'
import { getCode, saveCode } from '../controllers/codeController.js'

const router = express.Router()

router.get("/:roomId",getCode)
router.put("/:roomId",saveCode)

export default router