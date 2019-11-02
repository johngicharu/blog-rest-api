const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateComment(data) {
	let errors = {};

	data.username = !isEmpty(data.username) ? data.username : "";
	data.email = !isEmpty(data.email) ? data.email : "";
	data.content = !isEmpty(data.content) ? data.content : "";

	if (Validator.isEmpty(data.username)) {
		errors.username = "Username is required";
	}

	if (!Validator.isEmail(data.email)) {
		errors.email = "Please enter a valid email";
	}

	if (Validator.isEmpty(data.email)) {
		errors.email = "Email is required";
	}

	if (Validator.isEmpty(data.content)) {
		errors.content = "Comment is required";
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
};
