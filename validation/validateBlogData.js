const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateBlogData(data) {
	let errors = {};

	data.title = !isEmpty(data.title) ? data.title : "";
	data.description = !isEmpty(data.description) ? data.description : "";
	data.url = !isEmpty(data.url) ? data.url : "";
	data.email = !isEmpty(data.email) ? data.email : "";

	if (Validator.isEmpty(data.title)) {
		errors.title = "Title is required";
	}

	if (!Validator.isURL(data.url)) {
		errors.url = "Please enter a valid url";
	}

	if (!Validator.isEmail(data.email)) {
		errors.email = "Please enter a valid email";
	}

	if (Validator.isEmpty(data.email)) {
		errors.email = "Email is required";
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
};
