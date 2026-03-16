import User from "../models/User"
import bcrypt from 'bcrypt'

export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        })

        res.status(201).json({ id: user._id, username: user.username, email: user.email })

    } catch (error) {
        return res.status(400).json({ message: "User already exists" })
    }
}

export const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const logoutUser = async(req,res) =>{
    res.status(200).json({ message: "Logged out successfully" })
}

export const getCurrentUser = async(req,res) =>{
    try{
        const user = await User.findById(req.user.id).select("-password")

        res.status(201).json(user);
    }catch(error){
        res.status(200).json({ message: "Logged out successfully" })
    }
}