const jwt = require('jsonwebtoken');
const User = require('../models/User')
const { JWT_SECRET } = require('../config');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) res.status(401).send('Access Denied');

    jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
        if (err) return res.status(403).json({message:'Invalid Token'});

        const user = await User.findById(decodedUser.id);
        if(!user) return res.status(403).json({message: 'User not found'});
        
        if(decodedUser.tokenVersion !== user.tokenVersion) return res.status(401).json({message: 'Token version mismatch'});

        req.user_id = user._id
        
        next();
    });
};

module.exports = authenticateToken;