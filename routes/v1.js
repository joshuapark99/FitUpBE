const express = require('express');

const authRoutes = require('./v1/auth')
const userRoutes = require('./v1/user/user')

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);

module.exports = router;


//app.use('/api/auth', authRoutes);
//app.use('/api/user', userRoutes);