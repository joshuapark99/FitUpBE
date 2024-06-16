const express = require('express');

const authenticateToken  = require('../../middleware/authenticateToken');
const userController = require('../../controllers/userController');
//const friendsRoutes = require('./friends');


const router = express.Router();


router.get('/:user_id', authenticateToken, userController.getUserInfo);

router.use('/:user_id/friends', friendsRoutes);

module.exports = router;
