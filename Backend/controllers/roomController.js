import Room from '../models/Room.js';
import User from '../models/User.js'; // import user model

// Create Room
export const createRoom = async (req, res) => {
    try {
        // Get userId from token (secure way)
        const userId = req.user.userId;

        const { title, password, language } = req.body;

        // Generate roomId
        const roomId = Math.random().toString(36).substring(2, 8);

        // Create room
        const room = await Room.create({
            roomId,
            title,
            createdBy: userId,
            participants: [userId],
            password,
            language
        });

        // Add this room to user's rooms list
        await User.findByIdAndUpdate(userId, {
            $addToSet: { rooms: room._id } // prevents duplicates
        });

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

        // Find room
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Validate password
        if (room.password && room.password !== password) {
            return res.status(401).json({ message: "Incorrect room password" });
        }

        // Add user to room participants
        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        // Add room to user's rooms list
        await User.findByIdAndUpdate(userId, {
            $addToSet: { rooms: room._id }
        });

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

// Get User Rooms History
export const getUserRooms = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).populate({
            path: "rooms",
            options: { sort: { createdAt: -1 } },
            populate: [
                { path: "createdBy", select: "username email" },
                { path: "participants", select: "username email" }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};