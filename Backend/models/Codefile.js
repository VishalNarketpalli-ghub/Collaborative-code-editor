import { Schema, model } from "mongoose";

// Each document represents one file inside a room.
// A room can have up to MAX_FILES_PER_ROOM files (enforced in the controller).
// The compound unique index on (room, filename) prevents duplicate filenames
// within the same room at the database level.
const codeFileSchema = new Schema(
    {
        // Reference to the parent Room document (ObjectId).
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },

        // Human-readable room identifier string (e.g. "abc123").
        // Stored here as a denormalized field so bulk-delete queries can
        // filter by roomId string without a join through the Room collection.
        roomId: {
            type: String,
            required: true
        },

        // Filename including extension (e.g. "main.py", "utils.js").
        // Extension is used to infer Monaco language mode.
        filename: {
            type: String,
            required: true,
            trim: true
        },

        // Monaco language identifier inferred from the file extension.
        // Stored explicitly so it can be sent to clients without re-computing.
        language: {
            type: String,
            default: "javascript"
        },

        // Full text content of the file.
        content: {
            type: String,
            default: ""
        },

        // Last user to save this file (optional audit trail).
        lastEditedBy: {
            type: Schema.Types.ObjectId,
            ref: "user"
        }
    },
    {
        timestamps: true
    }
);

// Prevent two files with the same name inside the same room.
codeFileSchema.index({ room: 1, filename: 1 }, { unique: true });

const CodeFile = model("CodeFile", codeFileSchema);

export default CodeFile;