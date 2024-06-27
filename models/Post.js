const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    text: { 
        type: String,
        default: null,
        validate: {
            validator: function (value) {
                return (!this.postType.includes('text') && !value) || (this.postType.includes('text') && value)
            },
            message: `Text must be provided if and only if postType includes "text"`
        }
    },
    mediaUrl: { 
        type: String,
        default: null,
        validate: {
            validator: function (value) {
                return (!this.postType.includes('media') && !value) || (this.postType.includes('media') && value)
            },
            message: 'Media URL must be provided if and only if postType includes "media"'
        }
    },
    dateCreated: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number },
    // commentsCount: { type: Number},
    // comments: [commentsSchema]
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
