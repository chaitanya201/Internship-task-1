const mongoose = require("mongoose")

const postLikes = new mongoose.Schema({
    likedUsers : [{type: mongoose.Schema.Types.ObjectId, ref: 'UserData'}],
    postId: {
        type:mongoose.Schema.Types.ObjectId, ref: 'UserPosts', required:true
    },
    totalLikes : {
        type:Number
    }
    
})

const postLikesModel = new mongoose.model("UserPostLikes" ,postLikes)

module.exports = postLikesModel