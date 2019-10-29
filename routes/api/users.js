const express = require("express");

const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../models/user");
const validateUserRegistration = require("../../validation/userValidation");
const validateUpdateDetails = require("../../validation/validateUpdateDetails");
const validatePw = require("../../validation/validatePw");

const bcrypt = require("bcryptjs");

router.get("/subscribers", (req, res) => {
	const errors = {};

	User.find({ roles: "subscriber" })
		.sort({ date: -1 })
		.then(users =>
			res.status(200).json({
				message: "Successfully Fetched Users",
				data: users,
				errors: null
			})
		)
		.catch(err => {
			errors.err = err;

			return res.status(500).json({
				message: `Error: There was an error processing your request`,
				data: null,
				errors
			});
		});
});

// All Users
router.get("/all", (req, res) => {
	const errors = {};

	User.find({ roles: { $ne: "admin" } })
		.sort({ date: -1 })
		.then(users =>
			res.status(200).json({
				message: "Successfully Fetched Users",
				data: users,
				errors: null
			})
		)
		.catch(err => {
			errors.err = err;

			return res.status(500).json({
				message: `Error: There was an error processing your request`,
				data: null,
				errors
			});
		});
});

router.get("/:userId", (req, res) => {
	const errors = {};

	User.findById(req.params.userId)
		.then(user => {
			res.status(200).json({
				message: "Successfully Fetched User",
				data: user,
				errors: null
			});
		})
		.catch(err => {
			errors.err = err;

			res.status(404).json({
				message: "Error: User not found",
				data: null,
				errors
			});
		});
});

router.post("/register", (req, res) => {
	// Check user inputs
	// Check if user exists
	// Submit user if user exists
	// return error
	const { errors, isValid } = validateUserRegistration(req.body);
	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors: errors
		});
	}

	User.findOne({ email: req.body.email }).then(user => {
		if (user) {
			errors.email = "Email already registered";

			return res.status(400).json({
				message: "Error: Email already exists",
				data: null,
				errors
			});
		} else {
			const newUser = new User({
				_id: new mongoose.Types.ObjectId(),
				username: req.body.username,
				email: req.body.email,
				roles: "subscriber"
			});

			return newUser
				.save()
				.then(user => {
					res.status(200).json({
						message: "User registration was successful",
						data: user,
						errors: null
					});
				})
				.catch(err => {
					errors.err = err;

					res.status(500).json({
						message: `Error: User registration unsuccessful ${err}`,
						data: null,
						errors
					});
				});
		}
	});
});

router.patch("/makeguest/:userId", (req, res) => {
	const { errors, isValid } = validatePw(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors
		});
	}

	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(req.body.password, salt, (err, hash) => {
			if (err) console.log(err);
			// set password to hashed password

			User.findByIdAndUpdate(
				req.params.userId,
				{
					$addToSet: { roles: "guest" },
					$set: { password: hash }
				},
				{ new: true }
			)
				.then(user => {
					res.status(200).json({
						message: "Success, you are now a guest user",
						data: user,
						errors: null
					});
				})
				.catch(err => {
					errors.err = err;

					res.status(500).json({
						message: `Error: There was an error processing your request`,
						data: null,
						errors
					});
				});
		});
	});
});

// Private Route
router.patch("/update/:userId", (req, res) => {
	const { errors, isValid } = validateUpdateDetails(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors
		});
	}
	User.findByIdAndUpdate(
		req.params.userId,
		{
			$set: {
				username: req.body.username ? req.body.username : username,
				email: req.body.email ? req.body.email : email
			}
		},
		{ new: true }
	)
		.then(user => {
			res.status(200).json({
				message: "Successfully Updated",
				data: user,
				errors: null
			});
		})
		.catch(err => {
			errors.err = err;

			res.status(500).json({
				message: "Error: There was an error processing your request",
				data: null,
				errors
			});
		});
});

router.patch("/updatepw/:userId", (req, res) => {
	const { errors, isValid } = validatePw(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors: errors
		});
	}

	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(req.body.password, salt, (err, hash) => {
			if (err) console.log(err);
			// set password to hashed password

			User.findOneAndUpdate(
				{
					_id: req.params.userId,
					$or: [{ roles: "guest" }, { roles: "admin" }]
				},
				{
					$set: { password: hash }
				},
				{ new: true }
			)
				.then(user => {
					if (user) {
						return res.status(200).json({
							message: "Password successfully updated",
							data: user,
							errors: null
						});
					} else {
						errors.err = "Sorry, only guests and admins can set passwords";

						return res.status(401).json({
							message: "Error: You are not a guest or admin",
							data: null,
							errors
						});
					}
				})
				.catch(err => {
					errors.err = err;

					res.status(500).json({
						message: `Error: There was processing your request`,
						data: null,
						errors
					});
				});
		});
	});
});

// remove guests
router.patch("/removeguest/:userId", (req, res) => {
	const errors = {};

	User.findOneAndUpdate(
		{
			_id: req.params.userId,
			$and: [{ roles: { $ne: "admin" } }, { roles: "guest" }]
		},
		{
			$pull: { roles: "guest" }
		}
	)
		.then(user => {
			if (!user) {
				errors.err = "Sorry, User was not found";

				return res.status(401).json({
					message: "Error: User not found",
					data: null,
					errors
				});
			} else {
				return res.status(200).json({
					message: "User removed from guest list",
					data: user,
					errors: null
				});
			}
		})
		.catch(err => {
			errors.err = err;

			return res.status(500).json({
				message: "There was an error processing your request",
				data: null,
				errors
			});
		});
});

// Subscribe
router.patch("/subscribe/:userId", (req, res) => {
	const errors = {};

	User.findOneAndUpdate(
		{
			_id: req.params.userId,
			$and: [{ roles: { $ne: "admin" } }, { roles: { $ne: "subscriber" } }]
		},
		{
			$addToSet: { roles: "subscriber" }
		},
		{ new: true }
	)
		.then(user => {
			if (!user) {
				errors.err = "User already subscribed";

				return res.status(400).json({
					message: "User already subscribed",
					data: null,
					errors
				});
			} else {
				res.status(200).json({
					message:
						"Success, you have successfully subscribed to out newsletter",
					data: user,
					errors: null
				});
			}
		})
		.catch(err => {
			errors.err = err;

			res.status(500).json({
				message: `Error: There was an error processing your request`,
				data: null,
				errors
			});
		});
});

// unsubscribe
router.patch("/unsubscribe/:userId", (req, res) => {
	const errors = {};

	User.findOneAndUpdate(
		{
			_id: req.params.userId,
			$and: [{ roles: { $ne: "admin" } }, { roles: "subscriber" }]
		},
		{
			$pull: { roles: "subscriber" }
		}
	)
		.then(user => {
			if (!user) {
				errors.err = "Sorry, User was not found";

				return res.status(401).json({
					message: "Error: User not found",
					data: null,
					errors
				});
			} else {
				return res.status(200).json({
					message: "User successfully unsubscribed",
					data: user,
					errors: null
				});
			}
		})
		.catch(err => {
			errors.err = err;

			return res.status(500).json({
				message: "There was an error processing your request",
				data: null,
				errors
			});
		});
});

router.delete("/:userId", (req, res) => {
	// Validate if user is admin
	// Find and delete user
	const errors = {};

	User.findOneAndDelete({
		_id: req.params.userId,
		$or: [{ roles: "guest" }, { roles: "subscriber" }],
		$and: [{ roles: { $ne: "admin" } }]
	})
		.then(user => {
			if (!user) {
				errors.err = "Sorry, User was not found";

				return res.status(401).json({
					message: "Error: User not found",
					data: null,
					errors
				});
			} else {
				return res.status(200).json({
					message: "Success: User Account Deleted",
					data: user,
					errors: null
				});
			}
		})
		.catch(err => {
			errors.err = err;

			return res.status(500).json({
				message: "There was an error processing your request",
				data: null,
				errors
			});
		});
});

// No need to delete all users
// router.delete("/", (req, res) => {
// 	users = [];
// 	res.status(200).json({
// 		message: "Success: All User Accounts Deleted",
// 		data: users
// 	});
// });

module.exports = router;
