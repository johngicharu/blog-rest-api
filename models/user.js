const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
	_id: Schema.Types.ObjectId,
	username: {
		type: String,
		required: true,
		unique: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	roles: [
		{ type: String, enum: ["admin", "subscriber", "guest", "visitor", "super"] }
	],
	password: String,
	avatar: String,
	date: {
		type: Date,
		default: Date.now()
	},
	modifiedOn: Date
});

module.exports = User = mongoose.model("Users", userSchema);
