const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const uploadsSchema = new Schema({
	_id: Schema.Types.ObjectId,
	filename: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true
	}
});

module.exports = Uploads = mongoose.model("Uploads", uploadsSchema);
