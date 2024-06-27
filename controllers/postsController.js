const Post = require('../models/Post')


// params: post_id

exports.toggleLikeOnPost = async (req, res) => {

}



// request body: Post schema
exports.createPost = async (req, res) => {
    try {
        const { text, mediaUrl, dateCreated, mentions, postType } = req.body;
        validatePostTypes(postType);
        const userId = req.user_id;

        const newPost = new Post({
            userId: userId,
            text: text,
            mediaUrl: mediaUrl,
            dateCreated: dateCreated,
            likesCount: 0,
            mentions: mentions,
            postType: postType
        });

        await newPost.save();
        return res.status(201).json({ "message":"Post successfully uploaded" });
    } catch (err) {
        if(err.name === 'ValidationError') {
            return res.status(403).json(err)
        }
        return res.status(500).json({ "message": `There was an error: ${err}` });
    }
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

const validatePostTypes = (postTypes) => {
    if (!(postTypes.length === 0) && Array.isArray(postTypes) && new Set(postTypes).size === postTypes.length) {
        return true;
    } else {
        throw { 
            errors: { 
                postType: { 
                    name: 'ValidationError',
                    message: 'Provided postType is invalid'
                }
            },
            name: "ValidationError"
        }
    }
}