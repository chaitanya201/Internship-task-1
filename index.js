const express = require("express") 
const app = express()
const cors = require("cors")
const userRoutes = require("./Routes/UserRoutes")
const postRoutes = require("./Routes/posts")
// defining Port 
const PORT = 5000 || process.env.PORT


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())

// defining routes for posts
app.use('/show-post', express.static('./public/user/posts'))

// using custom user routes in main app
app.use('/post', postRoutes )
app.use('/user', userRoutes)

// starting server
app.listen(PORT,(err) => {
    if(err) {
        console.log("err is error ", err);
        
    } else {
        console.log("server started");
    }
})