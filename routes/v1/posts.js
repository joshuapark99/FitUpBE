const express = require('express');

const postsController = require('../../controllers/postsController');

const authenticateToken  = require('../../middleware/authenticateToken');



const router = express.Router();

router.post('/', authenticateToken, authController.createPost);

router.get('/post/:post_id', authenticateToken, authController.getSinglePost);

router.get('/', authenticateToken, authController.getPosts);

router.get('/user/:user_id', authenticateToken, authController.getUserPosts);

router.delete('/post/:post_id', authenticateToken, authController.deletePost);

module.exports = router;
