import express from "express";
import {
    getCode,
    saveCode,
    listFiles,
    getFile,
    createFile,
    saveFile,
    deleteFile,
    renameFile,
} from "../controllers/codeController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// ---------------------------------------------------------------------------
// File system routes (new multi-file API)
// ---------------------------------------------------------------------------

// List all files for a room (metadata only, no content).
router.get("/:roomId/files", verifyToken, listFiles);

// Get the full content of a single named file.
router.get("/:roomId/file/:filename", verifyToken, getFile);

// Create a new file in the room (host only).
router.post("/:roomId/file", verifyToken, createFile);

// Save the content of a named file (host only).
router.put("/:roomId/file/:filename", verifyToken, saveFile);

// Delete a named file (host only).
router.delete("/:roomId/file/:filename", verifyToken, deleteFile);

// Rename a named file (host only).
router.patch("/:roomId/file/:filename/rename", verifyToken, renameFile);

// ---------------------------------------------------------------------------
// Legacy single-file routes (kept for backward compatibility)
// ---------------------------------------------------------------------------

router.get("/:roomId", verifyToken, getCode);
router.put("/:roomId", verifyToken, saveCode);

export default router;