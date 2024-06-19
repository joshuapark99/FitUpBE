const express = require('express');

const authenticateToken  = require('../../middleware/authenticateToken');
const userController = require('../../controllers/userController');
const friendsRoutes = require('./friends');


const router = express.Router();


router.use('/friends', friendsRoutes);

// this needs to be changed to asking for username
router.get('/:user_id', authenticateToken, userController.getUserInfo);


module.exports = router;
