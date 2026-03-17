import CodeFile from "../models/Codefile.js"
import Room from "../models/Room.js"


export const getCode = async (req, res) => {
    try {
        const { roomId } = req.params
        const room = await Room.findOne({ roomId })
        if (!room) {
            return res.status(404).json({ message: "Room Not found" })
        }
        let codeFile = await CodeFile.findOne({ room: roomId })

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
        const userId = req.user.id;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const codeFile = await CodeFile.findOneAndUpdate(
            { room: room._id },
            {
                content,
                lastEditedBy: userId
            },
            { new: true }
        );

        res.status(200).json(codeFile);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};