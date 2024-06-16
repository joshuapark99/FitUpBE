const mongoose = require('mongoose')

const friendshipSchema = new mongoose.Schema({
    user1 : { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    user2 : { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },

    status: {
        type: String,
        enum: ['pending_1to2' , 'pending_2to1', 'friends', 'blocked_by1', 'blocked_by2', 'block_both'],
        required: true
    },

    createdAt: { type: Date },
    lastModified: { type: Date }
});

module.exports = mongoose.model('Friendship', friendshipSchema);