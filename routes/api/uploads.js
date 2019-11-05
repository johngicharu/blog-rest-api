const router = require("express").Router();
const checkAuth = require("../middleware/checkAuth");
const multer = require("multer");
const Uploads = require("../../models/uploads");
const mongoose = require("mongoose");

const fileFilter = (req, file, cb) => {
	if (
		!file.originalname.match(
			/\.(jpg|jpeg|png|gif|doc|docx|html|htm|odt|pdf|xls|xlsx|ods|ppt|pptx|txt|md)$/
		)
	) {
		req.fileValidationError = "Only image and document files are allowed";
		return cb(null, false);
	}
	cb(null, true);
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		const fileName =
			new Date().getTime() + "-" + file.originalname.replace(/[\s]/g, "-");
		cb(null, fileName);
	}
});

// Multer Config
const upload = multer({ storage: storage, fileFilter: fileFilter });

// @route   POST /api/uploads/
// @desc    POST file/files
// @access  private
router.post("/", checkAuth, upload.array("files"), (req, res) => {
	const errors = {};
	if (req.fileValidationError) {
		errors.message = req.fileValidationError;

		return res.status(400).json({
			success: false,
			message: errors.message,
			data: null,
			errors
		});
	} else {
		const fileArr = [];
		req.files.map(file => {
			const newUpload = {
				_id: new mongoose.Types.ObjectId(),
				filename: file.filename,
				url: file.path
			};
			fileArr.push(newUpload);
		});

		Uploads.insertMany(fileArr, (err, files) => {
			errors.message = "We encountered an error processing your request";

			if (err) {
				return res.status(500).json({
					success: false,
					message: errors.message,
					data: null,
					errors
				});
			} else {
				return res.status(200).json({
					success: true,
					message: "Files successfully uploaded",
					data: files,
					errors: null
				});
			}
		});
	}
});

// @route   GET /api/uploads/
// @desc    GET all files
// @access  private
router.get("/", (req, res) => {
	const errors = {};

	Uploads.find()
		.then(files => {
			return res.status(200).json({
				success: true,
				message: "Successfully fetched uploads",
				data: files,
				errors: null
			});
		})
		.catch(err => {
			errors.message = "We encountered an error processing your request";

			return res.status(500).json({
				success: false,
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   GET /api/uploads/:fileId
// @desc    GET single file
// @access  private
router.get("/:fileId", (req, res) => {
	const errors = {};

	Uploads.find({
		_id: req.params.fileId
	})
		.then(files => {
			return res.status(200).json({
				success: true,
				message: "Successfully fetched file",
				data: files,
				errors: null
			});
		})
		.catch(err => {
			errors.message = "We encountered an error processing your request";

			return res.status(500).json({
				success: false,
				message: errors.message,
				data: null,
				errors
			});
		});
});

// @route   DELETE /api/uploads/:fileId
// @desc    DELETE single file
// @access  private
router.delete("/:fileId", checkAuth, (req, res) => {
	const errors = {};

	Uploads.findByIdAndDelete(req.params.fileId)
		.then(file => {
			res.status(200).json({
				success: true,
				message: `${file.filename} successfully deleted`,
				data: file.filename,
				errors: null
			});
		})
		.catch(err => {
			errors.message = "We encountered an error processing your request";

			return res.status(500).json({
				success: false,
				message: errors.message,
				data: null,
				errors
			});
		});
});

module.exports = router;
