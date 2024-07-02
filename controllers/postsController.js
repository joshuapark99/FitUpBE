const Post = require('../models/Post')
const User = require('../models/User')


// params: post_id

exports.toggleLikeOnPost = async (req, res) => {
    try { 
        let likesIndex;

        const postId = req.params.post_id;
        const userId = req.user_id;
        const post = await Post.findById(postId);
        
        if(!post) return res.status(400).json({"message": "Post could not be found"});

        likesIndex = post.likes.indexOf(userId);
        if(likesIndex === -1) {
            post.likes.push(req.user_id);
            post.likesCount += 1;
            
            await post.save();
            return res.status(200).json({"message": "Post successfully liked"})
        } else {
            post.likes.splice(likesIndex, 1);
            post.likesCount -= 1;

            await post.save();
            return res.status(200).json({"message": "Post successfully unliked"})
        }

    } catch(err) {
        return res.status(500).json({ "message": `There was an error: ${err}` });
    }
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
    try {
        const post = await Post.findById(req.params.post_id);
        if(!post) return res.status(400).json({ "message": "Post could not be found"});
        return res.status(200).json(post);
    } catch (err) {
        return res.status(500).json({ "message": `There was an error: ${err}` });
    }
}

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.user_id });
        if(!posts) return res.status(400).json({ "message": "Posts could not be found"});
        return res.status(200).json(posts);
    } catch (err) {
        return res.status(500).json({ "message": `There was an error: ${err}` });
    }
}

// params: user_id
exports.getUserPosts = async (req, res) => {
    try {
        const userId = await validateUserExists(req.params.username);
        const posts = await Post.find({ userId: userId });
        if(!posts) return res.status(400).json({ "message": "Posts could not be found"});
        return res.status(200).json(posts);
    } catch (err) {
        if(err.status === 403) return res.status(403).json({ "message": err.message })
        return res.status(500).json({ "message": `There was an error: ${err}` });
    }
}

// params: post_id
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if(!post) return res.status(400).json({ "message": "Post could not be found"});
        validateUserMadePost(req.user_id, post.userId);
        await Post.findByIdAndDelete(req.params.post_id);
        return res.status(200).json({"message": "Post successfully deleted"});
    } catch (err) {
        if( err.status === 403) return res.status(err.status).json({ "message": err.message})
        return res.status(500).json({ "message": `There was an error: ${err}` });
    }
}

const validateUserMadePost = (userId, posterUserId) => {
    if(!(userId.toString() === posterUserId.toString())) {
        throw { status: 403, message: "User can not delete this post" }
    }
}

const validateUserExists = async (username) => {
    const user = await User.findOne({ username: username});
    if(!user) throw { status: 403, message: "User not found"}
    return user._id;
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