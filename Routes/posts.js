const express = require("express");
const router = express.Router();
const userAuth = require("../middlewares/UserAuth.js");
const postModel = require("../Database/posts");
const commentModel = require("../Database/postComments");
const multer = require("multer");
const postCommentsModel = require("../Database/postComments");
const postLikesModel = require("../Database/postLikes.js");
const { resetWatchers } = require("nodemon/lib/monitor/watch");
const { json } = require("express/lib/response");

// configuring storage
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("in multer ....................");
    console.log("multer file is ", file);
    cb(
      null,
      "D:/Node  JS Projects/InternshipProjects/RegistrationWebApp/public/user/posts"
    );
  },
  filename: function (req, file, cb) {
    const date = Date.now();
    console.log(date, " date");
    cb(null, date + "_" + file.originalname);
  },
});

//
const upload = multer({ storage: storage }).single("post");

// Post operations

const addPost = async (req, res) => {
  if (req.file) {
    const post = new postModel({
      caption: req.body.caption,
      userId: req.user._doc._id,
      post: req.file.filename,
      tags: req.body.tags,
    });

    post.save((err) => {
      if (err) {
        console.log("error while saving the post", err);
        res.send({ status: "failed", msg: "failed to save the post" });
      } else {
        console.log("post saved successfully");
        res.send({ status: "success", msg: "post saved successfully", post });
      }
    });
  } else {
    console.log(" post is missing");
    res.send({ status: "failed", msg: "post or caption is missing" });
  }
};

// updating user posts
const updatePost = async (req, res) => {
  if (req.body.postId && req.file) {
    const getPost = await postModel.findOne({
      _id: req.body.postId,
      userId: req.body.userId,
    });
    if (getPost) {
      let preTags = [...getPost.tags];
      const updatePost = await postModel.findOneAndUpdate(
        { _id: req.body.postId, userId: req.body.userId },
        {
          $set: {
            post: req.file.filename,
            caption: req.body.caption,
            tags: [...preTags, ...req.body.tags],
          },
        },
        { new: true }
      );

      if (updatePost) {
        console.log("post updated successfully");
        res.send({
          status: "success",
          msg: "post updated successfully",
          post: updatePost,
        });
      } else {
        res.send({ status: "failed", msg: "failed to update the post" });
      }
    } else {
      console.log("wrong post id");
      res.send({ status: "failed", msg: "provided postId is wrong" });
    }
  } else {
    console.log("post id is absent");
    res.send({ status: "failed", msg: "provide post Id" });
  }
};

// getting users all post
const getPosts = async (req, res) => {
  console.log("in get posts function");
  const allPosts = postModel.find({ userId: req.user._doc._id });
  if (allPosts) {
    console.log("all posts found ", allPosts);
    res.send({ status: "success", msg: "found all posts" });
  } else {
    console.log("unable to find the posts");
    res.send({ status: "failed", msg: "failed to find the posts" });
  }
};

// for deleting the post
const deletePost = async (req, res) => {
  console.log("in delete post function");
  console.log("post id ", req.body.postId);
  console.log("user id ", req.body.userId);
  if (req.body.postId) {
    const getPost = await postModel.findOne({
      _id: req.body.postId,
      userId: req.body.userId,
    });
    if (getPost) {
      const deletePost = await postModel.deleteOne({ _id: req.body.postId });

      // I am deleting all the info related to post at the time of deleting post
      const deletePostLikes = await postLikesModel.deleteOne({
        postId: req.body.postId,
      });
      const deletePostComments = await postCommentsModel.deleteOne({
        postId: req.body.postId,
      });
      console.log("deleted post ", deletePost);

      if (deletePost.acknowledged) {
        if (deletePostLikes.acknowledged) {
          if (deletePostComments.acknowledged) {
            console.log("all data along with post is deleted");
            res.send({
              status: "success",
              msg: "post along with all the liked and comments are removed",
            });
          } else {
            console.log("post deleted but error while deleting comments");
            res.send({
              status: "failed",
              msg: "post is removed but comments are left",
            });
          }
        } else {
          res.send({
            status: "failed",
            msg: "post is removed but all the likes and comments are still in the database",
          });
        }
      } else {
        res.send({ status: "failed", msg: "failed to delete the post" });
      }
    } else {
      console.log("wrong post id");
      res.send({ status: "failed", msg: "provided postId is wrong" });
    }
  } else {
    console.log("post id is absent");
    res.send({ status: "failed", msg: "provide post Id" });
  }
};

// Comments part
const addComment = async (req, res) => {
  console.log("in add comment");
  if (req.body.comment) {
    const getPost = await postModel.findOne({ _id: req.body.postId });
    if (getPost) {
      const getPreComments = await postCommentsModel.findOne({
        postId: req.body.postId,
      });
      if (getPreComments) {
        let newComments = [
          ...getPreComments.comments,
          { userId: req.body.userId, comment: req.body.comment },
        ];
        const updatedComments = await postCommentsModel.findOneAndUpdate(
          { postId: req.body.postId },
          {
            $set: {
              comments: [...newComments],
            },
          },
          { new: true }
        );

        if (updatedComments) {
          console.log("comment added successfully");
          res.send({
            status: "success",
            msg: "comment has added",
            comments: newComments,
          });
        }
      } else {
        let comment = [{ userId: req.body.userId, comment: req.body.comment }];
        let model = new postCommentsModel({
          postId: req.body.postId,
          comments: comment,
        });
        model.save((err) => {
          if (err) {
            console.log("error while saving for first time ", err);
            res.send({ status: "failed", msg: "error while saving" });
          } else {
            console.log("comment added to post");
            res.send({ status: "success", msg: "comment added successfully" });
          }
        });
      }
    } else {
      console.log("failed to find the post");
      res.send({ status: "failed", msg: "wrong post id" });
    }
  } else {
    console.log("comment is empty ");
    res.send({ status: "failed", msg: "please provide a comment to add" });
  }
};

// Add likes
const addLikes = async (req, res) => {
  console.log("in add likes");

  const post = await postModel.findOne({ _id: req.body.postId });
  if (post) {
    const likeModel = await postLikesModel.findOne({ postId: post._id });
    if (likeModel) {
      let userCheck = likeModel.likedUsers.includes(req.user._doc._id);
      console.log("user Check", userCheck);
      let totalLikes = likeModel.totalLikes;
      let ar = [...likeModel.likedUsers];
      const check = await postLikesModel.findOne({
        postId: req.body.postId,
        likedUsers: req.user._doc._id,
      });

      // checking if user has already liked this particular post if yes then removing its like from post
      // if not then add his like to post
      if (check) {
        totalLikes--;
        const update = await postLikesModel.findOneAndUpdate(
          { postId: req.body.postId, likedUsers: req.user._doc._id },
          {
            $pull: {
              likedUsers: req.user._doc._id,
            },
            $set: {
              totalLikes: totalLikes,
            },
          },

          { new: true }
        );
        console.log("update is ", update);
        return res.send({
          status: "success",
          msg: "like remove from the database",
          updatedModel: update,
        });
      } else {
        // its users first time liking this post so add its like to database

        totalLikes++;
        ar.push(req.user._doc._id);
        const updateModel = await postLikesModel.findOneAndUpdate(
          { postId: req.body.postId },
          { $set: { totalLikes: totalLikes, likedUsers: ar } },
          { new: true }
        );
        if (updateModel) {
          console.log("liked added successfully");
          res.send({ status: "success", msg: "liked added" });
        } else {
          console.log("error at updating");
          res.send({ status: "failed", msg: "couldnt update the likes" });
        }
      }
    }

    // no one has liked this post yet so this is the first like
    // so create a new doc to store like
    else {
      const newLike = new postLikesModel({
        postId: req.body.postId,
        totalLikes: 1,
        likedUsers: [req.body.userId],
      });

      newLike.save((err) => {
        if (err) {
          console.log("error while saving the first instance", err);
          res.send({
            status: "failed",
            msg: "error while saving first like instance",
          });
        } else {
          console.log("first like added ");
          res.send({
            status: "success",
            msg: "first like added",
            obj: newLike,
          });
        }
      });
    }
  } else {
    console.log("could not get the posts");
    res.send({
      status: "failed",
      msg: "failed to get the project with provided projectId",
    });
  }
};

// defining routes

// 1. add post
router.post("/add-post", userAuth, upload, addPost);

// 2. delete post
router.post("/delete-post", userAuth, deletePost);

// 3. update post
router.post("/update-post", userAuth, upload, updatePost);

// 4. add comment
router.post("/add-comment", userAuth, addComment);

// 5. add like
router.post("/add-like", userAuth, addLikes);

// 6. get all user posts
router.get("/get-posts", userAuth, getPosts);

module.exports = router;
