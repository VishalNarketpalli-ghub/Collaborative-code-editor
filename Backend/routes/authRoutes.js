import express from 'express'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../controllers/authController'

const router = express.Router()

router.post("/register",registerUser)
router.post("/login",loginUser)
router.post("/logout",logoutUser)
router.get("/getuser",getCurrentUser)

export default router