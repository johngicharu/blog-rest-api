const router = require("express").Router();

const mongoose = require("mongoose");

const Blog = require("../../models/blog");
const checkAuth = require("../middleware/checkAuth");
const validateBlogData = require("../../validation/validateBlogData");

// @route   GET /api/blog/
// @desc    GET blog info
// @access  public
router.get("/", (req, res) => {
	const errors = {};

	Blog.find()
		.populate("admin", ["username", "email"])
		.populate("uploads")
		.then(blog => {
			if (blog.length === 0) {
				errors.message = "There is no information available on this blog";

				return res.status(404).json({
					success: false,
					message: errors.message,
					data: null,
					errors
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
			console.log(err);
			errors.message = "We encountered an error while processing your request";

			res.status(500).json({
				success: false,
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   POST /api/blog/
// @desc    POST blog info
// @access  private
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

	if (
		req.user.roles.includes("admin") ||
		req.user.roles.includes(process.env.SUPER_USERNAME)
	) {
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
				req.body.description = req.body.description
					? req.body.description
					: "Just another JDev Website";
				// Save Blog Info
				const newBlog = new Blog({
					_id: new mongoose.Types.ObjectId(),
					title: req.body.title,
					description: req.body.description,
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
	} else {
		errors.message = "Auth Failed";

		return res.status(401).json({
			success: false,
			message: errors.message,
			data: null,
			errors
		});
	}
});

// @route   PATCH /api/blog/
// @desc    PATCH blog info
// @access  private
router.patch("/", checkAuth, (req, res) => {
	const { errors, isValid } = validateBlogData(req.body);

	if (!isValid) {
		return res.status(400).json({
			success: false,
			message: "Invalid Input",
			data: null,
			errors
		});
	}

	if (
		req.user.roles.includes("admin") ||
		req.user.roles.includes(process.env.SUPER_USERNAME)
	) {
		req.body.description = req.body.description
			? req.body.description
			: "Just another JDev Website";
		Blog.find().then(blogInfo => {
			if (blogInfo.length > 0) {
				// Update Blog
				blogInfo[0]
					.update(
						{
							title: req.body.title,
							description: req.body.description,
							url: req.body.url,
							admin: req.user._id,
							email: req.body.email
						},
						{ upsert: true, overwrite: true }
					)
					.then(blog => {
						res.status(200).json({
							success: true,
							message: "Successfully Saved Information",
							data: req.body,
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
					description: req.body.description,
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
	} else {
		errors.message = "Auth Failed";

		return res.status(401).json({
			success: false,
			message: errors.message,
			data: null,
			errors
		});
	}
});

module.exports = router;
