const mongoose = require('mongoose')
const VideoSchema = new mongoose.Schema({
    VideoId:{
        type:String,
    },
    videoUrl:[{
        type:String
    }],
    status:{
        type:String
    },
    user:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    createdAt: { type: Date, default: Date.now },
})
const VideoModel = mongoose.model('Video',VideoSchema)
module.exports = VideoModel