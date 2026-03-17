import express from 'express'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../controllers/authController.js'
import { verifyToken } from '../middleware/verifyToken.js'

const router = express.Router()

router.post("/register" ,registerUser)
router.post("/login", loginUser)
router.post("/logout",verifyToken, logoutUser)
router.get("/getuser",verifyToken, getCurrentUser)

export default router