const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    text: { type: String },
    mediaUrl: { 
        type: String,
        validate: function (value) {
            return (!this.postType.includes('media') && !value) || (this.categories.includes('media') && value)
        },
        message: 'Media URL must be provided if and only if postType includes "media"'
    },
    dateCreated: { type: Date, default: Date.now },
    likesCount: { type: Number },
    commentsCount: { type: Number},
    mentions: [{ type: String }],
    postType: [{
        type: String,
        enum: ['text', 'media', 'workout']
    }],
    // workout: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     validate: {
    //         validator: function(value) {
    //             // if postType does not include workout, return true meaning 
    //             return (!this.postType.includes('workout') && !value) || (this.categories.includes('workout') && value)
    //         }
    //     },
    //     message: 'Workout details must be provided if and only if postType includes "workout"',
    //     ref: 'Workout'
    // }
});

module.exports = mongoose.model('Post', postSchema)
