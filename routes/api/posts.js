const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

let posts = [
	{
		_id: "12u6431t23",
		title: "Post One",
		content: "Post one content."
	},
	{
		_id: "12u643sh23",
		title: "Post Two",
		content: "Post Two content."
	},
	{
		_id: "12lkss1t23",
		title: "Post Three",
		content: "Post Three content."
	},
	{
		_id: "hyatw31t23",
		title: "Post Four",
		content: "Post Four content."
	}
];

const Posts = require("../../models/post");

// get posts
router.get("/", (req, res) => {
	Posts.find()
		.sort({ date: -1 })
		.then(posts =>
			res.status(200).json({
				success: true,
				error: false,
				message: "Successfully Fetched Posts",
				data: posts
			})
		)
		.catch(err =>
			res.status(500).json({
				success: false,
				error: true,
				message: `Error: ${err}`,
				data: null
			})
		);
});

// get single post
router.get("/:postId", (req, res) => {
	Posts.findById(req.params.postId)
		.then(post => {
			res.status(200).json({
				success: true,
				error: false,
				message: "Successfully Fetched Post",
				data: post
			});
		})
		.catch(err => {
			res.status(404).json({
				success: false,
				error: true,
				message: "Error: Post not found",
				data: null
			});
		});
});

// create post
router.post("/", (req, res) => {
	const newPost = {
		_id: new mongoose.Types.ObjectId(),
		title: req.body.title,
		content: req.body.content
	};

	posts.push(newPost);

	res.status(200).json({
		message: "Success",
		data: posts
	});
});

// update post
router.patch("/:postId", (req, res) => {
	const updatedPosts = [...posts];
	posts.map(post => {
		if (post._id === req.params.postId) {
			(post.title = req.body.title ? req.body.title : post.title),
				(post.content = req.body.content ? req.body.content : post.content);
		}
	});
	posts = updatedPosts;
	res.status(200).json({
		message: "Success",
		data: posts
	});
});

// delete post
router.delete("/", (req, res) => {
	posts = [];
	res.status(200).json({
		message: "Success",
		data: posts
	});
});

// delete all posts
router.delete("/:postId", (req, res) => {
	posts = posts.filter(post => post._id !== req.params.postId);
	res.status(200).json({
		message: "Success",
		data: posts
	});
});

module.exports = router;
