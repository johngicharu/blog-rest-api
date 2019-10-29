const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// DB Connection
mongoose.connect(`mongodb://localhost:27017/rest-api`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true,
	useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err))

app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;
const postsRouter = require('./routes/api/posts');
const userRouter = require('./routes/api/users');

app.use('/api/posts', postsRouter);
app.use('/api/users', userRouter);

app.get('/', (req, res, next) => {
	res.status(200).json({
		message: "Server running :)"
	})
})

app.listen(PORT, () => {
	console.log(`Server started on port: ${PORT}`)
})