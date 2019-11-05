const express = require("express");
const mongoose = require("mongoose");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

const validateNewPost = require("../../validation/validateNewPost");

const Post = require("../../models/post");
const Comment = require("../../models/comment");

// @route   GET /api/posts/
// @desc    GET all posts
// @access  public
router.get("/", (req, res) => {
	const errors = {};
	Post.find()
		.populate("authors", "username date")
		.populate({ path: "comments", options: { limit: 3 } })
		.sort({ date: -1 })
		.then(posts =>
			res.status(200).json({
				message: "Successfully Fetched Posts",
				data: posts,
				errors: null
			})
		)
		.catch(err => {
			errors.err = "There was an error processing your request";

			res.status(500).json({
				message: "There was an error processing your request",
				data: null,
				errors
			});
		});
});

// @route   GET /api/posts/full
// @desc    GET all posts comments and first replies data
// @access  public
router.get("/full", (req, res) => {
	const errors = {};

	Post.find()
		.sort({ date: -1 })
		.populate({ path: "authors", select: "username date" })
		.populate({ path: "comments", populate: { path: "replies" } })
		.then(posts => {
			res.status(200).json({
				message: "Successfully Fetched Posts",
				data: posts,
				errors: null
			});
		})
		.catch(err => {
			errors.message = "There was an error handling your request";

			res.status(500).json({
				message: errors.message,
				data: null.errors
			});
		});
});

// @route   GET /api/posts/:postId
// @desc    GET single post with comments and first level replies
// @access  public
router.get("/:postId", (req, res) => {
	const errors = {};

	Post.findById(req.params.postId)
		.populate({ path: "authors", select: "username date" })
		.populate({
			path: "comments",
			options: { limit: 3 },
			populate: { path: "replies" }
		})
		.then(post => {
			res.status(200).json({
				message: "Successfully Fetched Post",
				data: post,
				errors: null
			});
		})
		.catch(err => {
			errors.message = "We encountered an error while processing your request";

			res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   GET all user posts /api/posts/userposts/userid
// @desc    GET all user posts
// @access  public
router.get("/userposts/:userId", (req, res) => {
	const errors = {};

	Post.find({ authors: req.params.userId })
		.sort({ date: -1 })
		.then(posts => {
			res.status(200).json({
				message: "User Posts Fetched Successfully",
				data: posts,
				errors: null
			});
		})
		.catch(err => {
			errors.err = "There was an error processing your request";

			res.status(500).json({
				message: "There was an error processing your request",
				data: null,
				errors
			});
		});
});

// @route   POST  /api/posts/
// @desc    ADD post
// @access  private
router.post("/", checkAuth, (req, res) => {
	// Check is user role matches (extra check)
	console.log(req.user.roles);
	if (req.user.roles.includes("admin") || req.user.roles.includes("guest")) {
		const { errors, isValid } = validateNewPost(req.body);

		// validate data
		if (!isValid) {
			return res.status(400).json({
				message: "Invalid Input",
				data: null,
				errors
			});
		}

		// Check if post already exists
		Post.find({ title: req.body.title }).then(posts => {
			if (posts.length > 0) {
				errors.message = "A post with this title already exists";

				return res.status(400).json({
					message: errors.message,
					data: null,
					errors
				});
			} else {
				const categories =
					req.body.categories &&
					req.body.categories.split(",").map(category => {
						if (category.trim().split(/\W\s/).length > 1) {
							return category.trim().replace(/\W\s/, "-");
						} else {
							return category.trim();
						}
					});

				const authors = req.body.authors
					? req.body.authors.split(",").map(author => author.trim())
					: [req.user._id];

				const newPost = new Post({
					_id: new mongoose.Types.ObjectId(),
					authors: [...authors],
					title: req.body.title,
					featuredImage: req.body.featuredImage,
					content: req.body.content,
					categories: req.body.categories ? categories : ["uncategorized"]
				});

				newPost
					.save()
					.then(post => {
						res.status(200).json({
							message: "Post Successfully Added",
							data: post,
							errors: null
						});
					})
					.catch(err => {
						errors.message = "There was an error processing your request";

						res.status(500).json({
							message: errors.message,
							data: null,
							errors
						});
					});
			}
		});
	} else {
		const errors = {};
		errors.err = "Auth Failed";

		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   PATCH /api/posts/:postId
// @desc    modify post
// @access  private (Admin or specific post's author)
router.patch("/:postId", checkAuth, (req, res) => {
	const errors = {};
	if (req.user.roles.includes("admin") || req.user.roles.includes("guest")) {
		Post.findOne({ _id: req.params.postId }).then(post => {
			if (
				req.user.roles.includes("admin") ||
				req.user._id === post.author.toString()
			) {
				const categories =
					req.body.categories &&
					req.body.categories.split(",").map(category => {
						if (category.trim().split(/\W\s/).length > 1) {
							return category.trim().replace(/\W\s/, "-");
						} else {
							return category.trim();
						}
					});

				post.title = req.body.title ? req.body.title : post.title;
				post.content = req.body.content ? req.body.content : post.content;
				post.featuredImage = req.body.featuredImage
					? req.body.featuredImage
					: post.featuredImage;
				post.modifiedOn = Date.now();
				post.author = req.user._id !== post.author ? req.user._id : post.author;
				post.categories = req.body.categories ? categories : post.categories;

				post
					.save()
					.then(() => {
						res.status(200).json({
							message: "Post Successfully Updated",
							data: post,
							errors: null
						});
					})
					.catch(err => {
						errors.err = "There was an error processing your request";

						res.status(500).json({
							message: "There was an error processing your request",
							data: null,
							errors
						});
					});
			} else {
				errors.err = "Auth Failed";

				return res.status(401).json({
					message: "Auth Failed",
					data: null,
					errors
				});
			}
		});
	} else {
		errors.err = "Auth Failed";

		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   DELETE all user posts /api/posts/userposts/:userid
// @desc    Delete specific user's posts
// @access  private (only admin or specific user can perform this action)
router.delete("/userposts/:userId", checkAuth, (req, res) => {
	const errors = {};
	console.log(req.params.userId);
	if (req.user.roles.includes("admin") || req.user._id === req.params.userId) {
		Post.deleteMany({ authors: req.params.userId }, err => {
			if (err) {
				errors.err = "There was an error processing your request";

				return res.status(500).json({
					message: "There was an error processing your request",
					data: null,
					errors
				});
			}

			res.status(200).json({
				message: "Successfully deleted user's posts",
				data: [],
				errors: null
			});
		});
	} else {
		errors.err = "Auth Failed";

		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   DELETE delete single post /api/posts/:postId
// @desc    Delete post
// @access  private (only admin's or post owner can delete the post)
router.delete("/:postId", checkAuth, (req, res) => {
	const errors = {};

	if (req.user.roles.includes("admin") || req.user.roles.includes("guest")) {
		Post.findOne({ _id: req.params.postId })
			.then(post => {
				if (req.user.roles.includes("admin") || req.user._id === post.author) {
					Comment.deleteMany({ commentOn: post._id }, err => {
						if (err) {
							errors.message = "There was an error processing your request";

							return res.status(500).json({
								message: errors.message,
								data: null,
								errors
							});
						}
					});

					post
						.remove()
						.then(() =>
							res.status(200).json({
								message: "Post Successfully Deleted",
								data: {},
								errors: null
							})
						)
						.catch(err => {
							errors.err = "Post not found";

							return res.status(404).json({
								message: "Post not found",
								data: null,
								errors
							});
						});
				} else {
					errors.err = "Auth Failed";

					return res.status(401).json({
						message: "Auth Failed",
						data: null,
						errors
					});
				}
			})
			.catch(err => {
				errors.err = "Post not found";

				res.status(404).json({
					message: "Post not found",
					data: null,
					errors
				});
			});
	} else {
		errors.err = "Auth Failed";

		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

module.exports = router;
