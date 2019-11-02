const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const blogSchema = new Schema({
	_id: Schema.Types.ObjectId,
	title: {
		type: String,
		default: "JDev Site" // Site title
	},
	description: {
		type: String,
		default: "Just another JDev Site"
	},
	url: String, // site address
	admin: {
		type: Schema.Types.ObjectId,
		ref: "Users"
	},
	email: String,
	comments: [
		{
			type: Schema.Types.ObjectId,
			ref: "Comments"
		}
	],
	date: {
		type: Date,
		default: Date.now()
	}
});

module.exports = Blog = mongoose.model("Blog", blogSchema);
