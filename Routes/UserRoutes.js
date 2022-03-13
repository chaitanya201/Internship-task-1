const express = require("express")
const router = express.Router()
const userModel = require("../Database/Users")
const bcrypt = require("bcrypt")
const secretKey = require("../token/userToken").apply()
const userAuth = require('../middlewares/UserAuth.js')
const jwt = require('jsonwebtoken')
// user registration function
const registration = async (req, res) => {
    console.log("checking user credentials for registration");
    const findUsername = await userModel.findOne({username: req.body.username})
    if(!findUsername) {
        const findEmail = await userModel.findOne({email:req.body.email})
        if (!findEmail) {
            const salt = await bcrypt.genSalt(20)
            const hashedPassword = await bcrypt.hash(req.body.password, salt)

            const user = new userModel({
                email: req.body.email,
                username: req.body.username,
                password: hashedPassword,
            })

            user.save((err) => {
                if(err) {
                    console.log("error while saving user");
                    res.send({"status": "failed", user:null, "msg": "failed to save user"})
                } else {
                    console.log("user saved successfully");
                    res.send({"status":"success", user: user, "msg":"user saved successfully"})
                }
            })
        } else {
            console.log("email already exists");
            res.send({"status":"failed","msg":"email already exists", user:null})
        } 
    } else {
        console.log("username already exists");
        res.send({"status":"failed", user:null, "msg":"username already exists"})
    }
}

// login the user

const login = async (req, res) => {
    console.log("checking user credentials for login in");
    const user = await userModel.findOne({"username": req.body.username}) 
    if(user) {
        const checkPassword = await bcrypt.compare(req.body.password , user.password)
        if(checkPassword) {
            console.log("user login is successful");
            const token = jwt.sign({userID: user._id}, secretKey, {expiresIn:"15m"})
            res.send({"status":"success", "msg":"user login successful", user:user, token: token})

        } else {
            console.log("password is wrong")
            res.send({"status": "failed", "msg": "username or password is incorrect", user: null})
        }
    } else {
        console.log("username doesn't exists");
        res.send({"status": "failed", "msg": "username or password is incorrect", user: null})

    }
}

// reset password
const getUserForResetPassword = async (req, res) => {
    console.log("getting user for reset password");
    const user = await userModel.findOne({email: req.body.email})
    console.log("user is ", user);
    if(user) {
        const newSecretKey = secretKey + user._id
        const token = jwt.sign({userID: user._id}, newSecretKey, {expiresIn:"10m"})
        const url = `http://localhost:3000/user/reset-password/${user._id}/${token}`
        console.log(url);
        console.log("user id", user._id);
        console.log("token id",token);
        res.send({"status":"success", "msg":"link generated " , "link": url})
    } else {
        res.send({"status":"failed", "msg":"invalid email"})
    }
}

const saveResetPassword = async (req, res) => {
    console.log("in save reset password");
    const {id, token} = req.params
    const user = await userModel.findById(id)
    if(user) {
        console.log("user is", user);
        const newKey =  secretKey + user._id
        console.log("token is", token);
        console.log("id is", id);
        console.log("password ", req.body.password);
        try {
            jwt.verify(token, newKey)
            if(req.body.password && req.body.confirmPassword) {
                if(req.body.password === req.body.confirmPassword) {
                    const salt = await bcrypt.genSalt(20)
                    const hashedPassword = await bcrypt.hash(req.body.password, salt)
                    const changedUser = await userModel.findOneAndUpdate({_id: id}, {
                        $set : {
                            password : hashedPassword
                        }
                    },
                    {
                        new: true
                    })
                    console.log("changed user is ", changedUser);
                    res.send({"status":"success", "msg":"password reset is successful", user:changedUser})
                } else {
                    res.send({"status": "failed", "msg":"password and confirm password are not same"})
                }
            } else {
                res.send({"status": "failed", "msg":"password and confirm password fields are empty or has invalid values"})

            }
        } catch (error) {
            console.log("error in verifying token", error);
            res.send({"status":"failed","msg":"failed to verify the token..", error : error})
        }

    }
}

// 1. registration route
router.post("/registration", registration)

// 2. login route
router.post("/login", login)

// 3. reset password
router.post("/reset-password", getUserForResetPassword)

// 4. save password
router.post("/save-password/:id/:token", saveResetPassword)
module.exports = router
