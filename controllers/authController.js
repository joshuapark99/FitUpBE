const User = require('../models/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, REFRESH_SECRET} = require('../config');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, firstName, lastName, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, firstName, lastName, password: hashedPassword, refreshToken: null, tokenVersion: 0});
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const requestingUser = await User.findOne({ email });
        if (!requestingUser) return res.status(400).json({ message: 'User not found' });
        
        const isMatch = await bcrypt.compare(password, requestingUser.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        
        requestingUser.tokenVersion += 1;
        const token = jwt.sign({ id: requestingUser._id, tokenVersion: requestingUser.tokenVersion}, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: requestingUser._id, tokenVersion: requestingUser.tokenVersion}, process.env.REFRESH_SECRET, { expiresIn: '7d'});

        requestingUser.refreshToken = refreshToken;

        await requestingUser.save();
        
        res.json({ token, refreshToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.refreshTokenUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(403).json({ message: 'refresh token not provided' });
    
        const requestingUser = await User.findOne({ refreshToken });
        if (!requestingUser) return res.status(403).json({ message: 'refresh token does not match' });
    
        jwt.verify(refreshToken, REFRESH_SECRET, async (err, decodedUser) => {
            if (err) {
                return res.status(403).json({ message: 'invalid refresh token' });
            }
            
            if (decodedUser.tokenVersion !== requestingUser.tokenVersion) {
                return res.status(403).json({ message: 'token version mismatch' });
            }
    
            requestingUser.tokenVersion += 1;
    
            const newAccessToken = jwt.sign({ id: requestingUser._id, tokenVersion: requestingUser.tokenVersion }, JWT_SECRET, { expiresIn: '1h' });
            const newRefreshToken = jwt.sign({ id: requestingUser._id, tokenVersion: requestingUser.tokenVersion }, REFRESH_SECRET, { expiresIn: '7d' });
    
            requestingUser.refreshToken = newRefreshToken;
            await requestingUser.save();
    
            res.json({ token: newAccessToken, refreshToken: newRefreshToken });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.logoutUser = async (req, res) => {
    const { refreshToken } = req.body;
    const user = await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    if (!user) return res.sendStatus(403);
    res.sendStatus(200)
}