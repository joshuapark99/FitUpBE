const express = require('express');

const authRouter = require('./v1/auth')
const userRouter = require('./v1/user/user')
const postsRouter = require('./v1/posts')

const router = express.Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/posts', postsRouter);

module.exports = router;


//app.use('/api/auth', authRoutes);
//app.use('/api/user', userRoutes);