const mongoose = require('mongoose')

exports.createPostTypeObject = (userId, postType) => {
  const textPost = {
    userId: userId,
    text: postType.includes("text") ? "Example text for text post" : null,
    mediaUrl: postType.includes("media") ? "exampleurlformedia.com" : null,
    workout: postType.includes("workout") ? new mongoose.Types.ObjectId() : null,
    dateCreated: Date.now(),
    likes: [],
    likesCount: 0,
    mentions: [],
    postType: postType,
  };

  return textPost;
};

