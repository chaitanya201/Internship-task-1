const mongoose = require("mongoose")

mongoose.connect('mongodb://localhost:27017/InternshipProject', {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}, ()=>{
    console.log("MongoDB connected..")
})

const userSchema = new mongoose.Schema({
    email:{type: String, required:true, unique:true},
    username:{type: String, required:true, unique:true},
    password: {type:String, required:true}
})

const userModel = new mongoose.model("UserData" ,userSchema)

module.exports = userModel