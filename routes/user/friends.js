const express = require('express');

const { authenticateToken } = require('../../middleware/authenticateToken')
const friendsController = require('../../controllers/friendsController');

router = express.Router();

// post: Create or modify the friendship table between user and provided user_id in body
router.post('/', friendsController.modifyFriendship);

// get: Gets full list of users' friends, include user_id to get another users' friends list
router.get('/', friendsController.getUserFriends);

module.exports = router