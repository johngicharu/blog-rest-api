const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateUserLogin(data) {
	// Init errors
	let errors = {};
	// Check if empty
	data.email = !isEmpty(data.email) ? data.email : "";
	data.password = !isEmpty(data.password) ? data.password : "";

	if (!Validator.isEmail(data.email)) {
		errors.email = "Enter a valid email address";
	}

	if (Validator.isEmpty(data.email)) {
		errors.email = "Email address is required";
	}

	if (Validator.isEmpty(data.password)) {
		errors.password = "Password is required";
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
};
