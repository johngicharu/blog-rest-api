const router = require("express").Router();

const mongoose = require("mongoose");

const Blog = require("../../models/blog");
const checkAuth = require("../middleware/checkAuth");
const validateBlogData = require("../../validation/validateBlogData");

// @route   GET /api/blog/
// @desc    GET all posts
// @access  public
router.get("/", (req, res) => {
	const errors = {};

	Blog.find()
		.populate("admin", ["username", "email"])
		.then(blog => {
			if (blog.length === 0) {
				errors.message = "There is no information available on this blog";

				return res.status(404).json({
					success: false,
					message: errors.message,
					data: null.errors
				});
			}
			res.status(200).json({
				success: true,
				message: "Successfully Fetched Blog Info",
				data: blog,
				errors: null
			});
		})
		.catch(err => {
			errors.message = "We encountered an error while processing your request";

			res.status(500).json({
				success: false,
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   GET /api/blog/
// @desc    GET all posts
// @access  public
router.post("/", checkAuth, (req, res) => {
	const { errors, isValid } = validateBlogData(req.body);

	if (!isValid) {
		return res.status(400).json({
			success: false,
			message: "Invalid Input",
			data: null,
			errors
		});
	}

	Blog.find().then(blogInfo => {
		if (blogInfo.length > 0) {
			// Update Blog
			blogInfo[0]
				.update({
					title: req.body.title,
					description: req.body.description
						? req.body.description
						: "Just another JDev Site",
					url: req.body.url,
					admin: req.user._id,
					email: req.body.email
				})
				.then(blog => {
					res.status(200).json({
						success: true,
						message: "Successfully Saved Information",
						data: blog,
						errors: null
					});
				})
				.catch(err => {
					errors.message = "We encountered an error processing your request";

					res.status(500).json({
						success: false,
						message: errors.message,
						data: null,
						errors
					});
				});
		} else {
			// Save Blog Info
			const newBlog = new Blog({
				_id: new mongoose.Types.ObjectId(),
				title: req.body.title,
				description: req.body.description
					? req.body.description
					: "Just another JDev Site",
				url: req.body.url,
				admin: req.user._id,
				email: req.body.email
			});

			newBlog
				.save()
				.then(blog => {
					res.status(200).json({
						success: true,
						message: "Successfully Saved Information",
						data: blog,
						errors: null
					});
				})
				.catch(err => {
					errors.message = "We encountered an error processing your request";

					res.status(500).json({
						success: false,
						message: errors.message,
						data: null,
						errors
					});
				});
		}
	});
});

module.exports = router;
