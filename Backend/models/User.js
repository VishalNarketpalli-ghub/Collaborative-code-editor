import mongoose, { Schema,model } from "mongoose";

const UserSchema = new Schema({
    username:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    avatar:{
        type:String,
        
    },
    rooms:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"room"
        }
    ]
},{
    timestamps:true
})

export default User = model("user",UserSchema)