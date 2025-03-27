const mongoose= require('mongoose')
const ChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true,
        unique: true,  
    },
    chats: [
        {
            type: String,  
        },
    ],},{timestamps:true})
const ChatModel = mongoose.model("Chats",ChatSchema)
module.exports=ChatModel