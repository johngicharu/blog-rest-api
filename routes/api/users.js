const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

const User = require("../../models/user");
const validateUserRegistration = require("../../validation/userValidation");
const validateUpdateDetails = require("../../validation/validateUpdateDetails");
const validatePw = require("../../validation/validatePw");
const validateUserLogin = require("../../validation/validateUserLogin");

// Routes
// Get Subscribers except admin
// Get All except admin
// Get Single user/id
// /register (Post) User
// /subscribe/userid Add subscriber role to user
// /unsubscribe/userid Remove subscriber role from user
// /makeguest/userid (post) must send in password to activate guest (Can only be done by admin)
// /removeguest/userid (patch) removes password from guest (can only be done by admin)
// /updatepw/userid (patch) for guests and admins, updating passwords
// /userid (delete) delete user from all lists, can only be done by admin

// Other possible routes to be added later
// delete all subscribers
// login to get auth key, seperate logins for guests and admins
// Set password for turning into admin/guest, updatepassword/changepw, forgotpassword

// @route   GET api/users/subscribers
// @desc    get all subs apart from those marked admin/guest
// @access  private (for guests and admins only)
router.get("/subscribers", checkAuth, (req, res) => {
	const errors = {};

	if (req.user.roles.includes("admin") || req.user.roles.includes("guest")) {
		User.find(
			{
				roles: "subscriber",
				$and: [{ roles: { $ne: "admin" } }, { roles: { $ne: "guest" } }]
			},
			{ password: 0 }
		)
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
	} else {
		errors.err = "Auth Failed";

		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   GET api/users/all
// @desc    Fetch all users apart from admins
// @access  private (for admin only)
router.get("/all", checkAuth, (req, res) => {
	const errors = {};

	if (req.user.roles.includes("admin")) {
		User.find({}, { password: 0 })
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
	} else {
		errors.err = "Auth Failed";

		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   get api/users/:userId
// @desc    get single user, for non admins and nonguests
// @access  public
router.get("/:userId", (req, res) => {
	const errors = {};

	User.findOne(
		{
			_id: req.params.userId,
			$and: [{ roles: { $ne: "admin" } }, { roles: { $ne: "guest" } }]
		},
		{ password: 0 }
	)
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

// @route   POST api/users/removeguest/:userId
// @desc    Add user and set as subscriber
// @access  public
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

	User.findOne({ email: req.body.email }, { password: 0 }).then(user => {
		if (user) {
			errors.email = "Email already exists";

			return res.status(400).json({
				message: errors.message,
				data: null,
				errors
			});
		} else {
			User.findOne({ username: req.body.username }).then(user => {
				if (user) {
					errors.message = "Username already exists";

					return res.status(400).json({
						message: errors.message,
						data: null,
						errors
					});
				} else {
					const avatar = gravatar.url(req.body.email, {
						s: "200", // size
						r: "pg", // rating
						d: "mm" // default (mm - no profile image)
					});
					const newUser = new User({
						_id: new mongoose.Types.ObjectId(),
						username: req.body.username,
						email: req.body.email,
						avatar,
						roles: "visitor"
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
							errors.message = "There was an error processing your request";

							res.status(500).json({
								message: errors.message,
								data: null,
								errors
							});
						});
				}
			});
		}
	});
});

// @route   POST api/users/login
// @desc    User login
// @access  public
router.post("/login", (req, res) => {
	const { errors, isValid } = validateUserLogin(req.body);

	if (!isValid) {
		return res.status(404).json({
			message: "Invalid Input",
			data: null,
			errors
		});
	}

	User.findOne({ email: req.body.email }).then(user => {
		bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
			if (err) {
				errors.err = "Auth Failed";

				return res.status(401).json({
					message: "Auth Failed",
					data: null,
					errors
				});
			}

			if (isMatch) {
				const userData = {
					_id: user._id,
					username: user.username,
					email: user.email,
					roles: user.roles,
					createdOn: user.createdOn
				};

				const options = {
					expiresIn: "1h",
					issuer: "yousite.com"
				};

				// Return token to user
				jwt.sign(userData, process.env.SECRET_OR_KEY, options, (err, token) => {
					if (err) {
						errors.err = "Auth Failed";
						return res.status(401).json({
							message: "Auth Failed",
							data: null,
							errors
						});
					}

					return res.status(200).json({
						message: "Successfully logged in",
						token: `Bearer ${token}`,
						errors: null
					});
				});
			} else {
				errors.message = "Password Incorrect";

				return res.status(401).json({
					success: false,
					message: errors.message,
					data: null,
					errors
				});
			}
		});
	});
});

// @route   PATCH api/users/makeadmin/:userId
// @desc    Addd user to guest list
// @access  private (for selected super user only)
router.patch("/makeadmin/:userId", checkAuth, (req, res) => {
	const { errors, isValid } = validatePw(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors
		});
	}

	if (req.user.roles.includes(process.env.SUPER_USERNAME)) {
		bcrypt.genSalt(Number(process.env.HASH_ROUNDS), (err, salt) => {
			bcrypt.hash(req.body.password, salt, (err, hash) => {
				if (err) console.log(err);
				// set password to hashed password

				User.findOneAndUpdate(
					{ _id: req.params.userId },
					{
						$addToSet: { roles: "admin" },
						$set: { password: hash, modifiedOn: Date.now() }
					},
					{
						fields: { password: 0 },
						new: true
					}
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
	} else {
		errors.err = "Auth Failed";
		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   PATCH api/users/makeguest/:userId
// @desc    Addd user to guest list
// @access  private (for admin only)
router.patch("/makeguest/:userId", checkAuth, (req, res) => {
	const { errors, isValid } = validatePw(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors
		});
	}

	if (req.user.roles.includes("admin")) {
		bcrypt.genSalt(Number(process.env.HASH_ROUNDS), (err, salt) => {
			bcrypt.hash(req.body.password, salt, (err, hash) => {
				if (err) console.log(err);
				// set password to hashed password

				User.findOneAndUpdate(
					{ _id: req.params.userId },
					{
						$addToSet: { roles: "guest" },
						$set: { password: hash, modifiedOn: Date.now() }
					},
					{
						fields: { password: 0 },
						new: true
					}
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
	} else {
		errors.err = "Auth Failed";
		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   PATCH api/users/removeguest/:userId
// @desc    Remove user from guest list
// @access  private (for admin only)
router.patch("/removeguest/:userId", checkAuth, (req, res) => {
	const errors = {};

	if (req.user.roles.includes("admin")) {
		User.findOneAndUpdate(
			{
				_id: req.params.userId,
				$and: [{ roles: { $ne: "admin" } }, { roles: "guest" }]
			},
			{
				$pull: { roles: "guest" },
				$unset: { password: "" },
				$set: { modifiedOn: Date.now() }
			},
			{ fields: { password: 0 }, new: true }
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
	} else {
		errors.err = "Auth Failed";
		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   PATCH api/users/update/:userId
// @desc    Update user details (name and email only)
// @access  private for admins and guests
router.patch("/update/:userId", checkAuth, (req, res) => {
	const { errors, isValid } = validateUpdateDetails(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors
		});
	}

	if (
		req.user._id === req.params.userId &&
		(req.user.roles.includes("admin") || req.user.roles.includes("guest"))
	) {
		const avatar = gravatar.url(req.body.email, {
			s: "200", // size
			r: "pg", // rating
			d: "mm" // default (mm - no profile image)
		});
		User.findOneAndUpdate(
			{
				_id: req.params.userId,
				$and: [{ roles: { $ne: "admin" } }, { roles: { $ne: "guest" } }]
			},
			{
				$set: {
					username: req.body.username ? req.body.username : username,
					email: req.body.email ? req.body.email : email,
					avatar,
					modifiedOn: Date.now()
				}
			},
			{ fields: { password: 0 }, new: true }
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
	} else {
		errors.err = "Auth Failed";
		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   PATCH api/users/updatepw/:userId
// @desc    Update guest/admin password
// @access  private (for admins and guests only)
router.patch("/updatepw/:userId", checkAuth, (req, res) => {
	const { errors, isValid } = validatePw(req.body);

	if (!isValid) {
		return res.status(400).json({
			message: "Error: Invalid Input",
			data: null,
			errors: errors
		});
	}

	if (
		req.user._id === req.params.userId &&
		(req.user.roles.includes("admin") || req.user.roles.includes("guest"))
	) {
		bcrypt.genSalt(Number(process.env.HASH_ROUNDS), (err, salt) => {
			bcrypt.hash(req.body.password, salt, (err, hash) => {
				if (err) console.log(err);
				// set password to hashed password

				User.findOneAndUpdate(
					{
						_id: req.params.userId,
						$or: [{ roles: "guest" }, { roles: "admin" }]
					},
					{
						$set: { password: hash, modifiedOn: Date.now() }
					},
					{ fields: { password: 0 }, new: true }
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
	} else {
		errors.err = "Auth Failed";
		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
});

// @route   PATCH api/users/subscribe/:userId
// @desc    Subscribe user to list
// @access  public (cannot be done for admins for security reasons)
router.patch("/subscribe/:userId", (req, res) => {
	const errors = {};

	User.findOneAndUpdate(
		{
			_id: req.params.userId,
			$and: [{ roles: { $ne: "admin" } }, { roles: { $ne: "subscriber" } }]
		},
		{
			$addToSet: { roles: "subscriber" },
			$set: { modifiedOn: Date.now() }
		},
		{ fields: { password: 0 }, new: true }
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

// @route   PATCH api/users/subscribe/:userId
// @desc    Subscribe user to list
// @access  public (cannot be done for admins for security reasons)
router.post("/subscribe", (req, res) => {
	const { errors, isValid } = validateUserRegistration(req.body);

	if (!isValid) {
		errors.message = "Invalid Input";

		return res.status(400).json({
			success: false,
			message: errors.message,
			data: null,
			errors
		});
	}

	User.findOne({
		$or: [{ username: req.body.username }, { email: req.body.email }],
		$and: [{ roles: { $ne: "admin" } }, { roles: { $ne: "subscriber" } }]
	})
		.then(user => {
			if (user) {
				errors.message =
					"Username already subscribed, consider changing your username/password to register";

				res.status(400).json({
					success: false,
					message: errors.message,
					data: null,
					errors
				});
			} else {
				const newSubscriber = new User({
					_id: new mongoose.Types.ObjectId(),
					username: req.body.username,
					email: req.body.email,
					roles: "subscriber"
				});

				newSubscriber
					.save()
					.then(user =>
						res.status(200).json({
							success: true,
							message: "You have successfully subscribed to our newsletter",
							data: user,
							errors: null
						})
					)
					.catch(err => {
						errors.message =
							"Username already subscribed, consider changing your username/password to register";

						return res.status(400).json({
							success: false,
							message: errors.message,
							data: null,
							errors
						});
					});
			}
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
});

// @route   PATCH api/users/unsubscribe/:userId
// @desc    Remove subscriber from list
// @access  public (not for admins)
router.patch("/unsubscribe/:userId", (req, res) => {
	const errors = {};

	User.findOneAndUpdate(
		{
			_id: req.params.userId,
			$and: [{ roles: { $ne: "admin" } }, { roles: "subscriber" }]
		},
		{
			$pull: { roles: "subscriber" },
			$set: { modifiedOn: Date.now() }
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

// @route   DELETE api/users/delete/:userId
// @desc    Completely delete user
// @access  private (for admin only)
router.delete("/:userId", checkAuth, (req, res) => {
	// Validate if user is admin
	// Find and delete user
	const errors = {};

	if (req.user.roles.includes("admin")) {
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
	} else {
		errors.err = "Auth Failed";
		return res.status(401).json({
			message: "Auth Failed",
			data: null,
			errors
		});
	}
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
