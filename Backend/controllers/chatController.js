import ChatMessage from '../models/chatMessage.js'
import Room from '../models/Room.js'


export const getChatHistory = async (req,res) =>{
    try{
        const {roomId} = req.params

        const room = await Room.findOne({roomId})

        if(!room){
            return res.status(404).json({message:"Room not Found"})
        }

        const messages = await ChatMessage.find({room:room._id}).populate("sender","username").sort({createdAt:1})

        res.status(200).json(messages)
    }catch(err){
        res.status(500).json({message:err.message})
    }

}