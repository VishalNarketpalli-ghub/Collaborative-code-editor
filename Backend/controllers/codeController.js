import CodeFile from "../models/Codefile.js";
import Room from "../models/Room.js";

// Maximum number of files allowed per room.
const MAX_FILES_PER_ROOM = 10;

// Maps a file extension to a Monaco-compatible language identifier.
// Unrecognised extensions fall back to "plaintext".
const EXTENSION_TO_LANGUAGE = {
    js:   "javascript",
    jsx:  "javascript",
    ts:   "typescript",
    tsx:  "typescript",
    py:   "python",
    java: "java",
    cpp:  "cpp",
    cc:   "cpp",
    cxx:  "cpp",
    c:    "c",
    cs:   "csharp",
    go:   "go",
    rs:   "rust",
    rb:   "ruby",
    php:  "php",
    html: "html",
    css:  "css",
    json: "json",
    md:   "markdown",
    sh:   "shell",
    sql:  "sql",
    xml:  "xml",
    yaml: "yaml",
    yml:  "yaml",
};

// Derive the Monaco language from a filename's extension.
export const languageFromFilename = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return EXTENSION_TO_LANGUAGE[ext] || "plaintext";
};

// Validate that a filename is non-empty, does not contain path separators or
// null bytes, and fits within a reasonable length.
const isValidFilename = (name) => {
    if (!name || typeof name !== "string") return false;
    if (name.trim().length === 0 || name.length > 120) return false;
    if (/[/\\:\0]/.test(name)) return false;
    return true;
};

// ---------------------------------------------------------------------------
// GET /code/:roomId/files
// Returns the list of all file metadata for a room (no content).
// ---------------------------------------------------------------------------
export const listFiles = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Exclude the heavy content field from the list response so that
        // listing files stays fast even for large files.
        const files = await CodeFile.find(
            { room: room._id },
            { content: 0 }
        ).sort({ createdAt: 1 });

        res.status(200).json(files);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------------------------------------------
// GET /code/:roomId/file/:filename
// Returns a single file including its full content.
// ---------------------------------------------------------------------------
export const getFile = async (req, res) => {
    try {
        const { roomId, filename } = req.params;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const file = await CodeFile.findOne({ room: room._id, filename });
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        res.status(200).json(file);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------------------------------------------
// POST /code/:roomId/file
// Creates a new file in the room. Host only.
// Body: { filename }
// ---------------------------------------------------------------------------
export const createFile = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { filename } = req.body;
        const userId = req.user.userId;

        if (!isValidFilename(filename)) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Only the host may create files.
        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the host can create files" });
        }

        // Enforce the per-room file limit.
        const existingCount = await CodeFile.countDocuments({ room: room._id });
        if (existingCount >= MAX_FILES_PER_ROOM) {
            return res.status(400).json({
                message: `File limit reached (max ${MAX_FILES_PER_ROOM} files per room)`
            });
        }

        // Reject duplicate filenames (the DB index is a safety net; this gives a
        // cleaner error message before hitting the MongoDB duplicate-key error).
        const duplicate = await CodeFile.findOne({ room: room._id, filename });
        if (duplicate) {
            return res.status(400).json({ message: "A file with that name already exists" });
        }

        const language = languageFromFilename(filename);

        const file = await CodeFile.create({
            room: room._id,
            roomId,
            filename,
            language,
            content: "",
            lastEditedBy: userId
        });

        res.status(201).json(file);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------------------------------------------
// PUT /code/:roomId/file/:filename
// Saves (overwrites) the content of an existing file. Host only.
// Body: { content }
// ---------------------------------------------------------------------------
export const saveFile = async (req, res) => {
    try {
        const { roomId, filename } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Only the host may explicitly save.
        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the host can save files" });
        }

        const file = await CodeFile.findOneAndUpdate(
            { room: room._id, filename },
            { content, lastEditedBy: userId },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        res.status(200).json({ message: "File saved", file });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------------------------------------------
// DELETE /code/:roomId/file/:filename
// Deletes a file from the room. Host only.
// ---------------------------------------------------------------------------
export const deleteFile = async (req, res) => {
    try {
        const { roomId, filename } = req.params;
        const userId = req.user.userId;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the host can delete files" });
        }

        const deleted = await CodeFile.findOneAndDelete({ room: room._id, filename });
        if (!deleted) {
            return res.status(404).json({ message: "File not found" });
        }

        res.status(200).json({ message: "File deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------------------------------------------
// PATCH /code/:roomId/file/:filename/rename
// Renames a file. Host only.
// Body: { newName }
// ---------------------------------------------------------------------------
export const renameFile = async (req, res) => {
    try {
        const { roomId, filename } = req.params;
        const { newName } = req.body;
        const userId = req.user.userId;

        if (!isValidFilename(newName)) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the host can rename files" });
        }

        // Check the target name is not already taken in this room.
        const conflict = await CodeFile.findOne({ room: room._id, filename: newName });
        if (conflict) {
            return res.status(400).json({ message: "A file with that name already exists" });
        }

        const newLanguage = languageFromFilename(newName);

        const file = await CodeFile.findOneAndUpdate(
            { room: room._id, filename },
            { filename: newName, language: newLanguage },
            { new: true }
        );

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        res.status(200).json({ message: "File renamed", file });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------------------------------------------
// Legacy compatibility — kept so existing code that calls GET /code/:roomId
// and PUT /code/:roomId continues to work during the transition.
// These operate on the first file in the room (oldest by createdAt).
// ---------------------------------------------------------------------------

export const getCode = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Return the oldest file in the room as the "primary" file.
        let codeFile = await CodeFile.findOne(
            { room: room._id },
            null,
            { sort: { createdAt: 1 } }
        );

        if (!codeFile) {
            // This path should not be hit under the new file-system flow
            // (files are created explicitly). Return empty to prevent crashes.
            return res.status(200).json({ content: "", language: room.language });
        }

        res.status(200).json(codeFile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const saveCode = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content, filename } = req.body;
        const userId = req.user.userId;

        const room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the host can save code" });
        }

        // If a filename is supplied, update that specific file.
        // Otherwise fall back to the oldest file (legacy behaviour).
        const query = filename
            ? { room: room._id, filename }
            : { room: room._id };

        const file = await CodeFile.findOneAndUpdate(
            query,
            { content, lastEditedBy: userId },
            { new: true, sort: { createdAt: 1 } }
        );

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        res.status(200).json({ message: "Code saved successfully", codeFile: file });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};