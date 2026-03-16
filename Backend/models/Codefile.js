import { Schema, model } from "mongoose";

const codeFileSchema = new Schema(
{
    room: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },

    filename: {
        type: String,
        default: "main.js"
    },

    language: {
        type: String,
        default: "javascript"
    },

    content: {
        type: String,
        default: ""
    },

    lastEditedBy: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
},
{
    timestamps: true
}
);

export default Code = model("CodeFile", codeFileSchema);