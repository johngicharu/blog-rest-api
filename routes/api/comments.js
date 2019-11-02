const router = require("express").Router();
const mongoose = require("mongoose");

const Comment = require("../../models/comment");
const Post = require("../../models/post");
const User = require("../../models/user");
const validateComment = require("../../validation/validateComment");
const checkAuth = require("../middleware/checkAuth");

// @route   GET /api/comments/
// @desc    GET all comments
// @access  public
router.get("/", (req, res) => {
	const errors = {};

	Comment.find()
		.sort({ date: -1 })
		.then(comments => {
			if (comments.length > 0) {
				return res.status(200).json({
					message: "Sucessfully Fetched Comments",
					data: comments,
					errors: null
				});
			} else {
				errors.message = "There are currently no comments on this site";

				return res.status(404).json({
					message: errors.message,
					data: [],
					errors: null
				});
			}
		})
		.catch(err => {
			errors.message = "There was an error processing your request";

			res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   GET /api/comments/user/:userId
// @desc    GET specific user's comments
// @access  public
router.get("/user/:userId", (req, res) => {
	const errors = {};

	Comment.find({ user: req.params.userId })
		.sort({ date: -1 })
		.then(comments => {
			if (comments.length > 0) {
				res.status(200).json({
					message: "Successfully Fetched Comments",
					data: comments,
					errors: null
				});
			} else {
				res.status(404).json({
					message: "This user has no comments",
					data: comments,
					errors: null
				});
			}
		})
		.catch(err => {
			errors.message = "There was an error processing your request";

			res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   GET /api/comments/post/:postId
// @desc    GET specific post's comments
// @access  public
router.get("/post/:postId", (req, res) => {
	const errors = {};

	Comment.find({ commentOn: req.params.postId })
		.sort({ date: -1 })
		.then(comments => {
			if (comments.length > 0) {
				res.status(200).json({
					message: "Successfully Fetched Comments",
					data: comments,
					errors: null
				});
			} else {
				res.status(404).json({
					message: "There are no comments in this post",
					data: null,
					errors: null
				});
			}
		})
		.catch(err => {
			errors.message = "There was an error processing your request";

			res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   GET /api/comments/replies/:parentCommentId
// @desc    GET specific post's comment's replies
// @access  public
router.get("/replies/:parentCommentId", (req, res) => {
	const errors = {};

	Comment.find({ parent: req.params.parentCommentId })
		.sort({ date: -1 })
		.then(replies => {
			if (replies.length > 0) {
				return res.status(200).json({
					message: "Successfully Fetched Comment Replies",
					data: replies,
					errors: null
				});
			} else {
				errors.message = "This comment has no replies";

				return res.status(404).json({
					message: errors.message,
					data: replies,
					errors
				});
			}
		})
		.catch(err => {
			errors.message = "There was an error processing your request";

			return res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   POST /api/comments/:postId
// @desc    Add comment
// @access  public
router.post("/:postId", (req, res) => {
	const { errors, isValid } = validateComment(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Invalid Input",
			data: null,
			errors
		});
	}

	User.findOne(
		{ $or: [{ email: req.body.email }, { username: req.body.username }] },
		{ password: 0 }
	)
		.then(user => {
			const newUser = user
				? user
				: new User({
						_id: new mongoose.Types.ObjectId(),
						username: req.body.username,
						email: req.body.email,
						roles: "visitor"
				  })
						.save()
						.then(user => "User successfully added")
						.catch(err => {
							errors.message = "There was an error adding your comment";

							return res.status(500).json({
								message: errors.message,
								data: null,
								errors
							});
						});

			// Check if comment already exists
			Comment.findOne({ content: req.body.content, user: newUser })
				.then(comment => {
					if (comment) {
						errors.message = "Sorry, looks like you have already said that";

						return res.status(400).json({
							message: errors.message,
							data: null,
							errors
						});
					} else {
						const newComment = new Comment({
							_id: new mongoose.Types.ObjectId(),
							user: newUser._id,
							content: req.body.content,
							parent: null,
							commentOn: req.params.postId,
							approved:
								user.roles.includes("admin") || user.roles.includes("guest")
									? true
									: false
						});

						newComment
							.save()
							.then(comment => {
								Post.findOneAndUpdate(
									{ _id: req.params.postId },
									{
										$addToSet: { comments: comment._id }
									},
									(err, post) => {
										if (err) {
											errors.message =
												"There was an error while adding your comment";

											return res.status(500).json({
												message: errors.message,
												err,
												data: null,
												errors
											});
										}
									}
								);

								return res.status(200).json({
									message: comment.approved
										? "Comment was successfully added"
										: "Success, your comment will be posted once it is approved",
									data: comment,
									errors: null
								});
							})
							.catch(err => {
								errors.message = "There was an error while adding your comment";

								return res.status(500).json({
									message: errors.message,
									err,
									data: null,
									errors
								});
							});
					}
				})
				.catch(err => {
					errors.message = "There was an error adding your comment";

					return res.status(500).json({
						message: errors.message,
						data: null,
						errors
					});
				});
		})
		.catch(err => {
			errors.message = "There was an error adding your comment";

			return res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   POST /api/comments/reply/:postId
// @desc    Reply to a comment
// @access  public
router.post("/reply/:postId/:parentCommentId", (req, res) => {
	const { errors, isValid } = validateComment(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Invalid Input",
			data: null,
			errors
		});
	}

	User.findOne(
		{ $or: [{ email: req.body.email }, { username: req.body.username }] },
		{ password: 0 }
	)
		.then(user => {
			const newUser = user
				? user
				: new User({
						_id: new mongoose.Types.ObjectId(),
						username: req.body.username,
						email: req.body.email,
						roles: "visitor"
				  })
						.save()
						.then(user => "User successfully added")
						.catch(err => {
							errors.message = "There was an error adding your comment";

							return res.status(500).json({
								message: errors.message,
								data: null,
								errors
							});
						});

			// Check if comment already exists
			Comment.findOne({ content: req.body.content, user: newUser })
				.then(comment => {
					if (comment) {
						errors.message = "Sorry, looks like you have already said that";

						return res.status(400).json({
							message: errors.message,
							data: null,
							errors
						});
					} else {
						const newComment = new Comment({
							_id: new mongoose.Types.ObjectId(),
							user: newUser,
							content: req.body.content,
							parent: req.params.parentCommentId,
							commentOn: req.params.postId,
							approved:
								user.roles.includes("admin") || user.roles.includes("guest")
									? true
									: false
						});

						newComment
							.save()
							.then(comment => {
								Comment.findOneAndUpdate(
									{ _id: req.params.parentCommentId },
									{
										$addToSet: { replies: comment._id }
									},
									(err, comment) => {
										if (err) {
											errors.message =
												"There was an error while adding your comment";

											return res.status(500).json({
												message: errors.message,
												err,
												data: null,
												errors
											});
										}
									}
								);

								return res.status(200).json({
									message: comment.approved
										? "Comment was successfully added"
										: "Success, your comment will be posted once it is approved",
									data: comment,
									errors: null
								});
							})
							.catch(err => {
								errors.message = "There was an error while adding your comment";

								return res.status(500).json({
									message: errors.message,
									err,
									data: null,
									errors
								});
							});
					}
				})
				.catch(err => {
					errors.message = "There was an error adding your comment";

					return res.status(500).json({
						message: errors.message,
						data: null,
						errors
					});
				});
		})
		.catch(err => {
			errors.message = "There was an error adding your comment";

			return res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   PATCH /api/comments/:commentId
// @desc    Edit/Modify comment
// @access  private (for admins/guests own comments)
router.patch("/:commentId", checkAuth, (req, res) => {
	const errors = {};
	Comment.findOne({ _id: req.params.commentId, user: req.user._id })
		.then(comment => {
			if (comment.content === req.body.content) {
				return res.status(200).json({
					message: "Nothing to changed",
					data: comment,
					errors: null
				});
			} else {
				comment.content = comment.content + `\n Edit: ${req.body.content}`;
				comment
					.save()
					.then(newComment => {
						return res.status(200).json({
							message: "Comment successfully edited",
							data: newComment,
							errors: null
						});
					})
					.catch(err => {
						errors.message = "There was an error handling your request";

						return res.status(500).json({
							message: errors.message,
							data: null,
							errors
						});
					});
			}
		})
		.catch(err => {
			errors.message = "There was an error handling your request";

			res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete comment
// @access  admin/guests(if its their post/comment)
router.delete("/:commentId", checkAuth, (req, res) => {
	const errors = {};

	Comment.findOne({ _id: req.params.commentId })
		.then(comment => {
			if (
				comment.user.toString() !== req.user._id ||
				!req.user.roles.includes("admin")
			) {
				errors.message = "Auth Failed";

				return res.status(401).json({
					message: errors.message,
					data: null,
					errors
				});
			} else {
				comment
					.remove()
					.then(deletedComment => {
						res.status(200).json({
							message: "Comment Successfully Deleted",
							data: deletedComment,
							errors: null
						});
					})
					.catch(err => {
						errors.message = "There was an error handling your request";

						res.status(500).json({
							message: errors.message,
							data: null,
							errors
						});
					});
			}
		})
		.catch(err => {
			errors.message = "There was an error handling your request";

			res.status(500).json({
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   DELETE /api/comments/user/:userId
// @desc    Delete all comments for specific user
// @access  Admin
router.delete("/user/:userId", checkAuth, (req, res) => {
	const errors = {};

	if (req.user.roles.includes("admin")) {
		Comment.deleteMany({ user: req.params.userId })
			.then(comments => {
				return res.status(200).json({
					message: "Comments successfully deleted",
					data: [],
					errors: null
				});
			})
			.catch(err => {
				errors.message = "There was an error processing your request";

				return res.status(500).json({
					message: errors.message,
					data: null,
					errors
				});
			});
	} else {
		errors.message = "Auth Failed";

		return res.status(401).json({
			message: errors.message,
			data: null,
			errors
		});
	}
});

// @route   DELETE /api/comments/post/:postId
// @desc    Delete All comments
// @access  admin
router.delete("/post/:postId", checkAuth, (req, res) => {
	const errors = {};

	if (req.user.roles.includes("admin")) {
		Comment.deleteMany({ commentOn: req.params.postId })
			.then(comments => {
				return res.status(200).json({
					message: "Comments successfully deleted",
					data: [],
					errors: null
				});
			})
			.catch(err => {
				errors.message = "There was an error processing your request";

				return res.status(500).json({
					message: errors.message,
					data: null,
					errors
				});
			});
	} else {
		errors.message = "Auth Failed";

		return res.status(401).json({
			message: errors.message,
			data: null,
			errors
		});
	}
});

module.exports = router;
