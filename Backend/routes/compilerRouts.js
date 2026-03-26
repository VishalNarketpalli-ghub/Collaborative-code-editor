import express from "express";
import { runCode } from "../controllers/compileController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/compile/run
router.post("/run", verifyToken, runCode);

export default router;