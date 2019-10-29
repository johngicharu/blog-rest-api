const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
	_id: Schema.Types.ObjectId,
	author: {
		type: Schema.Types.ObjectId,
		ref: "Users"
	},
	title: {
		type: String,
		required: true
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
