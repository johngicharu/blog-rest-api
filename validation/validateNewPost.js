const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validatePostInput(data) {
	let errors = {};

	data.title = !isEmpty(data.title) ? data.title : "";

	if (Validator.isEmpty(data.title)) {
		errors.title = "Title is required";
	}

	data.featuredImage = !isEmpty(data.featuredImage) ? data.featuredImage : "";

	if (Validator.isEmpty(data.featuredImage)) {
		errors.featuredImage = "Featured Image is required";
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
};
