import Room from '../models/Room.js';
import User from '../models/User.js'; // import user model

// Create Room
export const createRoom = async (req, res) => {
    try {
<<<<<<< HEAD

        const { title, password, language } = req.body;

        const userId = req.user.userId;

        const roomId = Math.random().toString(36).substring(2, 8);

=======
        // Get userId from token (secure way)
        const userId = req.user.userId;

        const { title, password, language } = req.body;

        // Generate roomId
        const roomId = Math.random().toString(36).substring(2, 8);

        // Create room
>>>>>>> 442000189ba0aceedded1f22f4250b1832d25134
        const room = await Room.create({
            roomId,
            title,
            createdBy: userId,
            participants: [userId],
            password,
            language
        });

<<<<<<< HEAD
=======
        // Add this room to user's rooms list
        await User.findByIdAndUpdate(userId, {
            $addToSet: { rooms: room._id } // prevents duplicates
        });

>>>>>>> 442000189ba0aceedded1f22f4250b1832d25134
        res.status(201).json(room);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Join Room
export const joinRoom = async (req, res) => {
    try {
        // Get userId from token (secure)
        const userId = req.user.userId;

        const { roomId, password } = req.body;
<<<<<<< HEAD
        const userId = req.user.userId;

=======

        // Find room
>>>>>>> 442000189ba0aceedded1f22f4250b1832d25134
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

<<<<<<< HEAD
=======
        // Validate password
>>>>>>> 442000189ba0aceedded1f22f4250b1832d25134
        if (room.password && room.password !== password) {
            return res.status(401).json({ message: "Incorrect room password" });
        }

<<<<<<< HEAD
=======
        // Add user to room participants
>>>>>>> 442000189ba0aceedded1f22f4250b1832d25134
        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

<<<<<<< HEAD
=======
        // Add room to user's rooms list
        await User.findByIdAndUpdate(userId, {
            $addToSet: { rooms: room._id }
        });

>>>>>>> 442000189ba0aceedded1f22f4250b1832d25134
        res.status(200).json(room);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get Room Details
export const getRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId })
            .populate("participants", "username");

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json(room);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};