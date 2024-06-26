const express = require('express');

const authRoutes = require('./v1/auth')
const userRoutes = require('./v1/user/user')
const postsRoutes = requre('./v1/posts')

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/posts', postsRoutes);

module.exports = router;


//app.use('/api/auth', authRoutes);
//app.use('/api/user', userRoutes);