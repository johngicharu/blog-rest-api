const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
	_id: Schema.Types.ObjectId,
	authors: [
		{
			type: Schema.Types.ObjectId,
			ref: "Users"
		}
	],
	title: {
		type: String,
		required: true,
		unique: true
	},
	categories: {
		type: [String],
		default: "uncategorized"
	},
	featuredImage: String,
	content: String,
	createdOn: {
		type: Date,
		default: Date.now()
	},
	modifiedOn: Date,
	comments: [
		{
			type: Schema.Types.ObjectId,
			ref: "Comments"
		}
	]
});

module.exports = Posts = mongoose.model("Posts", postSchema);
