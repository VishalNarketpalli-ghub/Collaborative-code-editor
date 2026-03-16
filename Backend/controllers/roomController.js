import Room from '../models/Room.js'

export const createRoom = async (req, res) => {
    try {
        const { title, password, language } = req.body
        const userId = req.user.id

        const roomId = Math.random().toString(36).substring(2, 8)

        const room = await Room.create({
            roomId,
            title,
            createdBy: userId,
            participants: [userId],
            password,
            language
        });

        res.status(201).json(room)
    } catch (err) {
        res.status(500).json({ message: error.message })
    }
}

export const joinRoom = async (req, res) => {
    try {

        const { roomId, password } = req.body;
        const userId = req.user.id;

        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.password && room.password !== password) {
            return res.status(401).json({ message: "Incorrect room password" });
        }

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        res.status(200).json(room);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRoom = async (req, res) => {
  try {

    const { roomId } = req.params;

    const room = await Room.findOne({ roomId }).populate("participants", "username");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}