const express = require('express');

const postsController = require('../../controllers/postsController');

const authenticateToken  = require('../../middleware/authenticateToken');



const router = express.Router();

router.post('/:post_id/like', authenticateToken, postsController.toggleLikeOnPost);

router.get('/:post_id', authenticateToken, postsController.getSinglePost);

router.delete('/:post_id', authenticateToken, postsController.deletePost);

router.get('/user/:username', authenticateToken, postsController.getUserPosts);

router.post('/', authenticateToken, postsController.createPost);

router.get('/', authenticateToken, postsController.getPosts);


module.exports = router;
