const express = require('express');

const authRouter = require('./v1/auth');
const userRouter = require('./v1/user/user');
const postsRouter = require('./v1/posts');
const workoutRouter = require('./v1/workout');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/posts', postsRouter);
router.use('/workout', workoutRouter);

module.exports = router;


//app.use('/api/auth', authRoutes);
//app.use('/api/user', userRoutes);