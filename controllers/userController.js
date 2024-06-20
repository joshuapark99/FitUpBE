const User = require('../models/User')

exports.getUserInfo = async (req, res) => {
    try {
        const { username } = req.params;

        let user; 

        if(!username) {
            user = await User.findById(req.user_id);

        } else {
            user = await User.findOne({ username });
        }
        
        if (!user) return res.status(400).json({ message: 'User not found' });
        res.status(200).json({ firstName: user.firstName, lastName: user.lastName, username: user.username })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}