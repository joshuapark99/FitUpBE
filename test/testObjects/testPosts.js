const Post = require('../../models/Post');

exports.createPostTypeObject = (userId, postType) => {
    const textPost = {
        userId: userId,
        text: postType.includes('text') ? "Example text for text post" : null,
        mediaUrl: postType.includes('media') ? "exampleurlformedia.com" : null,
        dateCreated: Date.now(),
        likes: [],
        likesCount: 0,
        mentions: [],
        postType: postType
    };

    return textPost;
}