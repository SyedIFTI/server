const mongoose = require('mongoose')
const ImageSchema = new mongoose.Schema({
    imageId:{
        type:String
    },
    imageUrl:[{
        type:String
    }],
    createdAt :  { type: Date, default: Date.now },
    user:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
          }]

})

const ImageModel = mongoose.model("Images",ImageSchema)
module.exports = ImageModel