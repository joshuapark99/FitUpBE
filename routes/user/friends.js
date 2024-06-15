const express = require('express');

const { authenticateToken } = require('../../middleware/authenticateToken')
const friendsController = require('../../controllers/friendsController');

router = express.Router();

router.get('/')

module.exports = router