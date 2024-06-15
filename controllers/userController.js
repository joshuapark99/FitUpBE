const User = require('../models/User')

exports.getUserInfo = async (req, res) => {
    try {
        const { user_id } = req.params;

        const user = await User.findById(user_id);
        if (!user) return res.status(400).json({ message: 'User not found 2' });
        res.json({ firstName: user.firstName, lastName: user.lastName, username: user.username })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}