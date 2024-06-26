const express = require('express');

const authenticateToken  = require('../../../middleware/authenticateToken');
const userController = require('../../../controllers/userController');
const friendsRoutes = require('./friends');

const router = express.Router();


router.use('/friends', friendsRoutes);

router.get('/:username', authenticateToken, userController.getUserInfo);

router.get('/', authenticateToken, userController.getUserInfo)


module.exports = router;
