import { Schema, model } from "mongoose";

const roomSchema = Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        default: "Untitled Room"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    language: {
        type: String,
        default: "Python"
    },
    password: {
        type: String,
        default: ""
    },

    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    bannedUsers: [
        {
            type: Schema.Types.ObjectId,
            ref: "user"
        }
    ],
    isActive:{
        type: Boolean,
        default:true
    }
}, {
    timestamps: true
})

const Room = model("room", roomSchema);

export default Room;