import Room from '../models/Room.js';
import User from '../models/User.js'; // import user model
import ChatMessage from '../models/chatMessage.js';

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

        //Non-host cannot join an ended session
        if (!room.isActive && room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "This session has ended" })
        }

        // Validate password
        if (room.password && room.password !== password) {
            return res.status(401).json({ message: "Incorrect room password" });
        }

        // Check if user is banned
        if (room.bannedUsers && room.bannedUsers.includes(userId)) {
            return res.status(403).json({ message: "You have been banned from this room." });
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
            .populate("participants", "username email")
            .populate("createdBy", "username email _id")

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
                { path: "createdBy", select: "username email _id" },
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


//end session : host only
export const endSession = async (req, res) => {
    try {
        const userId = req.user.userId
        const { roomId } = req.params

        //finding the room
        const room = await Room.findOne({ roomId })

        //when room doesn't exist
        if (!room) {
            return res.status(404).json({ message: "Room not found" })
        }

        //checking is user is host
        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to end this session" })
        }

        //if the user is host and room exists
        room.isActive = false
        await room.save()

        // Clear temporary chat messages
        await ChatMessage.deleteMany({ room: room._id })

        res.status(200).json({ message: "Session Ended" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

//reopen session : host only
export const reopenSession = async (req, res) => {
    try {
        const userId = req.user.userId
        const { roomId } = req.params

        //finding room
        const room = await Room.findOne({ roomId })

        //if room not found
        if (!room) return res.status(404).json({ message: "Room not found" })

        //making sure user is host
        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the host can reopen the session" })
        }

        room.isActive = true
        await room.save()

        // Clear old chat messages on reopen
        await ChatMessage.deleteMany({ room: room._id })

        res.status(200).json(room)
    }catch(err){
        res.status(500).json({message: err.message})
    }
}