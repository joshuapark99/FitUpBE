const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    refreshToken: { type: String },
    tokenVersion: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema)