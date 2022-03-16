const mongoose = require("mongoose")

const postCommentsSchema = new mongoose.Schema({
    postId : {
        type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required:true
    },
    comments : [{
        userId: {
            type:  mongoose.Schema.Types.ObjectId, ref: 'UserPosts'
        },
        comment : {
            type:String
        }
    }],
    
    likes: {
        type:Number
    }
    
})

const postCommentsModel = new mongoose.model("PostComments" ,postCommentsSchema)

module.exports = postCommentsModel