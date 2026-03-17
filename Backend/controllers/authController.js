import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

// register user
export const registerUser = async (req, res) => {
  try {
    // Destructre inputs
    const { username, email, password } = req.body;

    // find user
    const existingUser = await User.findOne({ email });

    // handle existing user
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // add salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    const token = generateToken(user);
    // send response
    res.status(201).json({
      token,
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    // Destructre input
    const { email, password } = req.body;

    // find user with email
    const user = await User.findOne({ email });

    // handle user not found
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // send response for invalid response
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    // send response
    res.status(200).json({
      token,
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    // catch any exceptions
    res.status(500).json({ message: error.message });
  }
};

// Logout user
export const logoutUser = async (req, res) => {
  // should be updated after cookie implimentation
  res.clearCookie("token").json({ message: "Logged out" });
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    // from validation middleweare get the user and find userObj
    const user = await User.findById(req.user.userId).select("-password");

    // send response
    res.status(201).json(user);
  } catch (error) {
    // handle exception
    res.status(200).json({ message: "Logged out successfully" });
  }
};
