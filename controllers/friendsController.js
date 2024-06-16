const Friendship = require('../models/Friendship')
const User = require('../models/User')

const validOperations = [ 'send', 'accept', 'block', 'unblock'];
const validStatuses = ['pending_1to2' , 'pending_2to1', 'friends', 'blocked_by1', 'blocked_by2', 'blocked_both'];

exports.modifyFriendship = async (req, res) => {
    try {
        const friend_id = req.body.user_id;
        if (!friend_id) return res.status(400).json({ message: "Invalid request body: 'user_id' field is required."});

        if (friend_id == req.user_id) return res.status(400).json({ message: "Invalid request: User cannot have relationship with themself."});

        const friend = await User.findById(friend_id)
        if(!friend) return res.status(404).json({ message: "The requested user was not found"});


        const friendship = (req.user_id < friend_id) ? await Friendship.findOne({
            user1: req.user_id, user2: friend_id 
        }) : await Friendship.findOne({
            user1: friend_id, user2: req.user_id
        });
        
        // if friendship table does not exist, create a friendship table 
        if (!friendship) {
            
            // if operation is 'send', a new friendship table is created and is set to pending
            if (req.body.operation == validOperations[0]) {

                let newFriendship;

                if (req.user_id < friend_id) {
                    newFriendship = new Friendship({
                        user1: req.user_id,
                        user2: friend_id,
                        status: validStatuses[0],

                        lastModified: Date.now(),
                        createdAt: Date.now()
                    })
                } else {
                    newFriendship = new Friendship({
                        user1: friend_id,
                        user2: req.user_id,
                        status: validStatuses[1],

                        lastModified: Date.now(),
                        createdAt: Date.now()
                        })
                }
                await newFriendship.save();

                return res.status(201).json({ message: "Friend request sent"})


            // if operation is 'block', a new friendship table is created and is set to blocked
            } else if (req.body.operation == validOperations[2]) {
                let newFriendship;

                if (req.user_id < friend_id) {
                    newFriendship = new Friendship({
                        user1: req.user_id,
                        user2: friend_id,
                        status: validStatuses[3],

                        lastModified: Date.now(),
                        createdAt: Date.now()
                    })
                } else {
                    newFriendship = new Friendship({
                        user1: friend_id,
                        user2: req.user_id,
                        status: validStatuses[4],

                        lastModified: Date.now(),
                        createdAt: Date.now()
                        })
                }
                await newFriendship.save();

                return res.status(201).json({ message: "User blocked succesfully"})

            // if operation is anything else, it cannot be executed on a new friendship table
            } else {
                return res.status(400).json({ message: "Invalid request body: 'operation' is not valid on current friendship"})
            }

        } else {
            // friendship table does exist, now do stuff
            switch (req.body.operation) {
                case validOperations[1]:
                    try {
                        friendship = handleAcceptFriendRequest(req.user_id, friendship);
                        await friendship.save();
                        return res.status(201).json({ message: "Friend request accepted"});
                    } catch (obj) {
                        return res.status(400).json(obj)
                    }
                    
                case validOperations[2]:
                    try {
                        friendship = handleBlockUser(req.user_id, friend_id, friendship);
                        await friendship.save();
                        return res.status(201).json({ message: "User successfully blocked"});
                    } catch (obj) {
                        return res.status(400).json(obj)
                    }
                    

                case validOperations[3]:
                    try {
                        friendship = handleUnblockUser(req.user_id, friendship);
                        await friendship.save();
                        return res.status(201).json({ message: "User successfully unblocked"});
                    } catch (obj) {
                        return res.status(400).json(obj)
                    }


                default:
                    return res.status(400).json({ message: `Invalid request body: 'operation' does not match ${validOperations.slice(1)}`})
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

function handleAcceptFriendRequest(user_id, friendshipTable) {
    // if frienshipTable is not 'pending_1to2' or 'pending_2to1', user cannot use 'accept' as an operation
    if (!validStatuses.slice(0,2).includes(friendshipTable.status)) return res.status(400).json({ message: "Invalid request body: 'accept' is not a valid operation for this friendship"});

    if (user_id == friendshipTable.user1) {
        if (friendshipTable.status == validStatuses[0]) {
            // cannot accept because user sent the friend request
            throw { message: "Invalid request body: There is no friend request from this user" };
        } else {
            // user accepts friend request
            friendshipTable.status = validStatuses[2];
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        }
    } else {
        if (friendshipTable.status == validStatuses[1]) {
            // cannot accept because user sent the friend request
            throw { message: "Invalid request body: There is no friend request from this user" };
        } else {
            // user accepts friend request
            friendshipTable.status = validStatuses[2];
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        }
    }
}


function handleBlockUser(user_id, user2_id, friendshipTable) {

    // states pending, friends can be hanled in the same block
    if (validStatuses.slice(0,3).includes(friendshipTable.status)) {
        user_id < user2_id ? friendshipTable.status = validStatuses[3] : friendshipTable = validStatuses[4];
        friendshipTable.lastModified = Date.now()
        return friendshipTable
    }

    // case: user is already blocking other user
    if (friendshipTable.user1 == user_id && friendshipTable.status == validStatuses[3]) throw { message: "User is already blocking specified user"};
    if (friendshipTable.user2 == user_id && friendshipTable.status == validStatuses[4]) throw { message: "User is already blocking specified user"};

    // case: user is being blocked by other user
    if (friendshipTable.user1 == user_id) {
        if (friendshipTable.status == validStatuses[3]) throw { message: "User is already blocking specified user"};
        if (friendshipTable.status == validStatuses[4]) {
            friendshipTable.status = validStatuses[5]
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        } 
    } else {
        if (friendshipTable.status == validStatuses[4]) throw { message: "User is already blocking specified user"};
        if (friendshipTable.status == validStatuses[3]) {
            friendshipTable.status = validStatuses[5]
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        }
    }
    
    // case: both users are already blocking each other
    if (friendshipTable.status == validStatuses[5]) throw { message: "User is already blocking specified user"};

    // case nothing matches ???
    throw new Error()
}



exports.getUserFriends = async (req, res) => {

}