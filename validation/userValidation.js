const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateUserRegistration(data) {
	// Init errors
	let errors = {};
	// Check if empty
	data.username = !isEmpty(data.username) ? data.username : "";
	data.email = !isEmpty(data.email) ? data.email : "";

	// Check Names.json({})
	if (!Validator.isLength(data.username, { min: 4, max: 30 })) {
		errors.username = "Username must be between 4 and 30 characters";
	}

	if (Validator.isEmpty(data.username)) {
		errors.username = "Username is required";
	}

	if (!Validator.isEmail(data.email)) {
		errors.email = "Enter a valid email address";
	}

	if (Validator.isEmpty(data.email)) {
		errors.email = "Email address is required";
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
};
