const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const commentSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user: {
		type: Schema.Types.ObjectId,
		ref: "Users"
	},
	avatar: String,
	content: {
		type: String,
		required: true
	},
	commentOn: {
		type: Schema.Types.ObjectId,
		ref: "Posts"
	},
	parent: String,
	replies: [
		{
			type: Schema.Types.ObjectId,
			ref: "Comments"
		}
	],
	approved: Boolean,
	date: {
		type: Date,
		default: Date.now()
	},
	modifiedOn: Date
});

module.exports = Comments = mongoose.model("Comments", commentSchema);
