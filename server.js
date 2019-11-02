require("dotenv/config");

const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");

const app = express();
const User = require("./models/user");
const bcrypt = require("bcryptjs");

// DB Connection
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then(() => {
		User.findOne({ username: process.env.SUPER_USERNAME }).then(user => {
			if (!user) {
				bcrypt.genSalt(Number(process.env.HASH_ROUNDS), (err, salt) => {
					bcrypt.hash(process.env.SUPER_PW, salt, (err, hash) => {
						if (err) {
							return console.log(err);
						}

						const newUser = new User({
							_id: new mongoose.Types.ObjectId(),
							username: process.env.SUPER_USERNAME,
							email: process.env.SUPER_EMAIL,
							roles: ["admin", process.env.SUPER_USERNAME],
							password: hash
						});

						return newUser
							.save()
							.then(user =>
								console.log(`${process.env.SUPER_USERNAME} Created`)
							)
							.catch(err => console.log(err));
					});
				});
			} else {
				return "Super User Present";
			}
		});
		console.log("MongoDB Connected");
	})
	.catch(err => console.log(err));

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;
const blog = require("./routes/api/blog");
const postsRouter = require("./routes/api/posts");
const usersRouter = require("./routes/api/users");
const commentsRouter = require("./routes/api/comments");

app.use("/api/blog", blog);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
app.use("/api/comments", commentsRouter);

app.get("/", (req, res, next) => {
	res.status(200).json({
		message: "Server running :)"
	});
});

app.listen(PORT, () => {
	console.log(`Server started on port: ${PORT}`);
});
