const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateUserRegistration(data) {
	// Init errors
	let errors = {};

	if (data.email !== undefined) {
		data.email = !isEmpty(data.email) ? data.email : "";

		if (!Validator.isEmail(data.email)) {
			errors.email = "Enter a valid email address";
		}
	}

	if (data.username !== undefined) {
		data.username = !isEmpty(data.username) ? data.username : "";
		if (!Validator.isLength(data.username, { min: 4, max: 30 })) {
			errors.username = "Username must be between 4 and 30 characters";
		}
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
};
