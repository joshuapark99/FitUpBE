const express = require('express');

const authenticateToken = require('../../../middleware/authenticateToken');
const friendsController = require('../../../controllers/friendsController');

router = express.Router();

// post: Create or modify the friendship table between user and provided user_id in body
router.post('/', authenticateToken, friendsController.modifyFriendship);


// get: Gets full list of users' friends, will get friends list of username if provided
router.get('/:username?', authenticateToken, friendsController.getUserFriends);

module.exports = router