import express from 'express'
import { getCode, saveCode } from '../controllers/codeController.js'
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router()

router.get("/:roomId", verifyToken, getCode)
router.put("/:roomId", verifyToken, saveCode);

export default router 