const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    text: { 
        type: String,
        validate: {
            validator: function (value) {
                return (!this.postType.includes('text') && !value) || (this.categories.includes('text') && value)
            },

        }
    
    },
    mediaUrl: { 
        type: String,
        validate: {
            validator: function (value) {
                return (!this.postType.includes('media') && !value) || (this.categories.includes('media') && value)
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
        enum: ['text', 'media', 'workout'],
        validate: {
            validator: function (value) {
                return Array.isArray(value) && new Set(value).size === value.length;
            },
            message: props => `${props.value} contains duplicate types`
        }
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
