const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    userId : {
        type:mongoose.Schema.Types.ObjectId, ref: 'UserData', required:true
    },
    post : {type:String, required:true},
    caption : {type:String},
    likes : {type:Number},
    date:{type: Date, default: Date.now },
    tags:[{type:mongoose.Schema.Types.ObjectId, ref: 'UserData'}]
    
})

const postModel = new mongoose.model("UserPosts" ,postSchema)

module.exports = postModel