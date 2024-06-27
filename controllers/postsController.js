const Posts = require('../models/Post')


// params: post_id

exports.modifyLikeOnPost = async (req, res) => {

}



// request body: Post schema
exports.createPost = async (req, res) => {
    const { text, mediaUrl, dateCreated, mentions, postType } = req.body;
    const userId = req.user_id;

    const newPost = new Posts({
        userId: userId,
        text: text,
        mediaUrl: mediaUrl,
        dateCreated: dateCreated,
        likesCount: 0,
        mentions: mentions,
        postType: postType
    });

    await newPost.save();
}

// params: post_id
exports.getSinglePost = async (req, res) => {
    // const post = await Posts.findById(req.params.post_id)
    // return res.status(200).json(post);
}

exports.getPosts = async (req, res) => {
    // const posts = await Posts.find({ userId: req.user_id })
}

// params: user_id
exports.getUserPosts = async (req, res) => {
    
}

// params: post_id
exports.deletePost = async (req, res) => {
    
}
