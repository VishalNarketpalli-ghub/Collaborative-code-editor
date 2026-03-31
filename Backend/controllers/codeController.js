import CodeFile from "../models/Codefile.js"
import Room from "../models/Room.js"


export const getCode = async (req, res) => {
    try {
        const { roomId } = req.params
        const room = await Room.findOne({ roomId })
        if (!room) {
            return res.status(404).json({ message: "Room Not found" })
        }

        let codeFile = await CodeFile.findOne({ room: room._id });

        if (!codeFile) {
            codeFile = await CodeFile.create({
                room: room._id,
                content: "",
                language: room.language
            });
        }

        res.status(200).json(codeFile)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


export const saveCode = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // ONLY CREATOR CAN SAVE
        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({
                message: "Only room creator can save code"
            });
        }

        const codeFile = await CodeFile.findOneAndUpdate(
            { room: room._id },
            {
                content,
                lastEditedBy: userId
            },
            { new: true, upsert: true } //If code file doesn’t exist → create it automatically
        );

        res.status(200).json({
            message: "Code saved successfully",
            codeFile
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};