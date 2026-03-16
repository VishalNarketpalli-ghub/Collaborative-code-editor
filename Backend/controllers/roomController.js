import Room from '../models/Room.js'

// Rout for creating room
export const createRoom = async (req, res) => {
    try {
        // destructure 
        // later fetch the userId from valisate middleware
        const { title, password, language, userId } = req.body

        // const userId = req.user.id

        // generate a room id
        const roomId = Math.random().toString(36).substring(2, 8)

        // create a room
        const room = await Room.create({
            roomId,
            title,
            createdBy: userId,
            participants: [userId],
            password,
            language
        });

        // send response
        res.status(201).json(room)
    } catch (err) {

        // handle errors
        res.status(500).json({ message: err.message })
    }
}

// Rout for joining
export const joinRoom = async (req, res) => {
    try {

        // Destructre inputs
        const { roomId, password, userId } = req.body;
        // const userId = req.user.id;
        // complete this after verification middlewear

        // finsing room by id
        const room = await Room.findOne({ roomId });

        // handeling room dosent exist case
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // validating password
        if (room.password && room.password !== password) {
            return res.status(401).json({ message: "Incorrect room password" });
        }

        // pushing the particicipates in to use array
        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        // send response
        res.status(200).json(room);

    } catch (error) {

        // handle errors
        res.status(500).json({ message: error.message });
    }
};

// rout for fetching room details
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