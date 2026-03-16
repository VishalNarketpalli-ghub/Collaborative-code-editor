import express from 'express'

const router = express.Router()

router.get("/:roomId", (req, res) => {
	res.status(501).json({ message: "Code route handler not implemented yet" })
})

export default router