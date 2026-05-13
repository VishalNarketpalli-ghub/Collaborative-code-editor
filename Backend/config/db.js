import mongoose from "mongoose";
import dns from "dns";

// Fix for Node.js DNS resolution issues with MongoDB SRV records on certain networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async() =>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB Connected")
    }catch(error){
        console.log("Database Connection Failed:", error.message)
        process.exit(1)
    }
}

export default connectDB