import { Schema, model } from "mongoose";

const chatMessageSchema = new Schema(
{
    room: {
        type: Schema.Types.ObjectId,
        ref: "room",
        required: true
    },

    sender: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    }
},
{
    timestamps: true
}
);

export default message = model("ChatMessage", chatMessageSchema);