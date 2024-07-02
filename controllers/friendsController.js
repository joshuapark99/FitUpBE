const Friendship = require('../models/Friendship')
const User = require('../models/User')

const validOperations = [ 'send', 'accept', 'block', 'unblock', 'unfriend'];
const validStatuses = ['pending_awaiting2' , 'pending_awaiting1', 'friends', 'blocked_by1', 'blocked_by2', 'blocked_both'];


// request body: username, operation
exports.modifyFriendship = async (req, res) => {
    try {
        const friend_username = req.body.username;
        if (!friend_username) return res.status(400).json({ message: "Invalid request body: 'username' field is required."});

        const friend = await User.findOne({username: friend_username});
        if(!friend) return res.status(404).json({ message: "The requested user was not found"});

        if (friend._id.toString() === req.user_id.toString()) return res.status(400).json({ message: "Invalid request: User cannot have relationship with themself."});

        


        const friendship = (req.user_id < friend._id) ? await Friendship.findOne({
            user1: req.user_id, user2: friend._id 
        }) : await Friendship.findOne({
            user1: friend._id, user2: req.user_id
        });
        
        // if friendship table does not exist, create a friendship table 
        if (!friendship) {
            
            // if operation is 'send', a new friendship table is created and is set to pending
            if (req.body.operation == validOperations[0]) {

                let newFriendship;

                if (req.user_id < friend._id) {
                    newFriendship = new Friendship({
                        user1: req.user_id,
                        user2: friend._id,
                        status: validStatuses[0],

                        lastModified: Date.now(),
                        createdAt: Date.now()
                    })
                } else {
                    newFriendship = new Friendship({
                        user1: friend._id,
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

                if (req.user_id < friend._id) {
                    newFriendship = new Friendship({
                        user1: req.user_id,
                        user2: friend._id,
                        status: validStatuses[3],

                        lastModified: Date.now(),
                        createdAt: Date.now()
                    })
                } else {
                    newFriendship = new Friendship({
                        user1: friend._id,
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
                return res.status(400).json({ message: "Invalid request body: 'operation' is not valid on current relationship"})
            }

        } else {
            // friendship table does exist, now do stuff
            switch (req.body.operation) {
                
                // accept
                case validOperations[1]:
                    try {
                        const newFriendship = handleAcceptFriendRequest(req.user_id, friendship);
                        await newFriendship.save();
                        return res.status(201).json({ message: "Friend request accepted"});
                    } catch (obj) {
                        if (obj.err_code == 400) return res.status(400).json({message: obj.message})
                        return res.status(500).json({message: obj.message})
                    }
                    
                // block
                case validOperations[2]:
                    try {
                        const newFriendship = handleBlockUser(req.user_id, friend._id, friendship);
                        await newFriendship.save();
                        return res.status(201).json({ message: "User successfully blocked"});
                    } catch (obj) {
                        if (obj.err_code == 400) return res.status(400).json({message: obj.message});
                        return res.status(500).json({message: obj.message})
                    }

                // unblock
                case validOperations[3]:
                    try {
                        const response = await handleUnblockUser(req.user_id, friendship);
                        if (response.action == 'modified') {
                            const newFriendship = response.friendshipTable;
                            await newFriendship.save()
                            return res.status(201).json({message: "User successfully unblocked"})
                        
                        } else if (response.action == 'deleted') {
                                return res.status(201).json({ message: "User successfully unblocked"});
                        }
                    } catch (obj) {
                        if (obj.err_code == 400) return res.status(400).json({message: obj.message});
                        return res.status(500).json({message: obj.message})
                    }

                // unfriend
                case validOperations[4]:
                    try {
                        const response = await handleUnfriendUser(friendship);
                        if (response.success) {
                            return res.status(201).json({ message: "User successfully unfriended" })
                        } else {
                            return res.status(400).json({ message: "User could not be unfriended"});
                        }
                    } catch {
                        return res.status(500).json({message: obj.message});
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
    // if frienshipTable is not 'pending_awaiting2' or 'pending_awaiting1', user cannot use 'accept' as an operation
    if (!validStatuses.slice(0,2).includes(friendshipTable.status)) throw { err_code: 400, message: "Invalid request: 'accept' is not a valid operation for this friendship" };

    if (user_id.toString() == friendshipTable.user1._id.toString()) {
        if (friendshipTable.status == validStatuses[0]) {
            // cannot accept because user sent the friend request
            throw { err_code: 400, message: "Invalid request: There is no friend request from this user" };
        } else {
            // user accepts friend request
            friendshipTable.status = validStatuses[2];
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        }
    } else {
        if (friendshipTable.status == validStatuses[1]) {
            // cannot accept because user sent the friend request
            throw {err_code: 400, message: "Invalid request: There is no friend request from this user" };
        } else {
            // user accepts friend request
            friendshipTable.status = validStatuses[2];
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        }
    }
}


function handleBlockUser(user_id, user2_id, friendshipTable) {

    // states pending, friends can be handled in the same block
    if (validStatuses.slice(0,3).includes(friendshipTable.status)) {
        user_id < user2_id ? friendshipTable.status = validStatuses[3] : friendshipTable.status = validStatuses[4];
        friendshipTable.lastModified = Date.now()
        return friendshipTable
    }

    // case: user is already blocking other user
    //if (friendshipTable.user1 == user_id && friendshipTable.status == validStatuses[3]) throw { err_code: 400, message: "User is already blocking specified user"};
    //if (friendshipTable.user2 == user_id && friendshipTable.status == validStatuses[4]) throw { err_code: 400, message: "User is already blocking specified user"};

    // case: user is being blocked by other user
    if (friendshipTable.user1.toString() == user_id.toString()) {
        if (friendshipTable.status == validStatuses[3]) throw { err_code: 400, message: "User is already blocking specified user"};
        if (friendshipTable.status == validStatuses[4]) {
            friendshipTable.status = validStatuses[5]
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        } 
    } else {
        if (friendshipTable.status == validStatuses[4]) throw { err_code: 400, message: "User is already blocking specified user"};
        if (friendshipTable.status == validStatuses[3]) {
            friendshipTable.status = validStatuses[5]
            friendshipTable.lastModified = Date.now();
            return friendshipTable;
        }
    }
    
    // case: both users are already blocking each other
    if (friendshipTable.status == validStatuses[5]) throw { err_code: 400, message: "User is already blocking specified user"};

    // case nothing matches ???
    throw new Error()
}

// consider the case that friendshipTable does not exist and user tries to unblock someone

async function handleUnblockUser(user_id, friendshipTable) {
    // check if user is even blocking anyone
    if (validStatuses.slice(0,3).includes(friendshipTable.status)) throw { err_code: 400, message: "Can not unblock this user"}
    
    // check if users are blocking each other
    if (friendshipTable.status == validStatuses[5]) {
        if (user_id.toString() == friendshipTable.user1._id.toString()) {
            // friendshiptable status is changed to validStatuses[4]
            friendshipTable.status = validStatuses[4];
            friendshipTable.lastModified = Date.now();
            return { action: 'modified', friendshipTable};
        }

        if (user_id.toString() == friendshipTable.user2._id.toString()) {
            // friendshipTable status is changed to validStatuses[3]
            friendshipTable.status = validStatuses[3];
            friendshipTable.lastModified = Date.now();
            return { action: 'modified', friendshipTable};
        }
    }

    // check if user2 is blocked by user
    if (user_id.toString() == friendshipTable.user1._id.toString()) {
        if(friendshipTable.status !== validStatuses[3]) throw { err_code: 400, message: "Can not unblock this user"}
        else {
            await Friendship.findByIdAndDelete(friendshipTable._id);
            return { action: 'deleted' };
        }
        // friendshipTable is changed so that user is no longer blocking 
        // might have to do this by deleting friendshiptable document
    }

    if (user_id.toString() == friendshipTable.user2._id.toString()) {
        if(friendshipTable.status !== validStatuses[4]) throw { err_code: 400, message: "Can not unblock this user"}
        else {
            await Friendship.findByIdAndDelete(friendshipTable._id);
            return { action: 'deleted' };
        }
        // friendshipTable is changed so that user is no longer blocking 
        // might have to do this by deleting friendshiptable document
    }
}

async function handleUnfriendUser(friendshipTable) {
    // check if user is friends with other user
    if (friendshipTable.status !== validStatuses[2]) {
        // error saying user is not friends with other user
        return { success: false, message: 'Users are not friends'}
    }

    await Friendship.findByIdAndDelete(friendshipTable._id);
    return { success: true }
}

// params: userId?
exports.getUserFriends = async (req, res) => {
    try {
        let userId;

        if (req.params.username) {
            const requestedUser = await User.findOne({ username: req.params.username });
            userId = requestedUser._id;
        } else {
            userId = req.user_id;
        }

        
        const friendships = await Friendship.find({
            $and: [
                { $or: [{ user1: userId}, { user2: userId}] },
                { status: 'friends' }
            ]
        }).populate('user1 user2');

        const friends = friendships.map(friendship => {
            if (friendship.user1._id.equals(userId)) {
                return friendship.user2;
            } else {
                return friendship.user1;
            }
        });

        return res.status(201).json(friends);

    } catch (err) {
        return res.status(500).json({ message: "Could not find friends"})
    }
}