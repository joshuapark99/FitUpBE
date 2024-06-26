const request = require('supertest');
const { expect } = require('chai');

const app = require('../../app');
const User = require('../../models/User');
const Friendship = require('../../models/Friendship')

const { setupUser } = require('../../utils/testSetupToolsV1')

const { Ian, Chang, Andrew } = require('../testUsers')

describe('User API', async () => {

    const apiPathRoot = '/api/v1/user'

    let ianAccessToken;
    let changAccessToken;
    let AndrewAccessToken;
    
    before(async () => {
        const ianUser = await setupUser(Ian, app);
        const changUser = await setupUser(Chang, app);
        const andrewUser = await setupUser(Andrew, app);

        ianAccessToken = ianUser.accessToken;
        changAccessToken = changUser.accessToken;
        AndrewAccessToken = andrewUser.accessToken;
    });

    after(async () => {
        await User.deleteMany({})
    })


    describe('User endpoints', async () => {

        describe('GET /api/user/:username', async () => {

            const apiEndpoint = '/'

            it('should return client user information when username is not provided', async () => {
                
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)

                expect(res.status).to.equal(200)
                expect(res.body).to.have.property("firstName", Ian.firstName);
                expect(res.body).to.have.property("lastName", Ian.lastName);
                expect(res.body).to.have.property("username", Ian.username);
            });

            it('should return other user information when username is provided', async () => {
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}${Chang.username}`)
                    .set("Authorization", ianAccessToken)
                
                expect(res.status).to.equal(200)
                expect(res.body).to.have.property("firstName", Chang.firstName);
                expect(res.body).to.have.property("lastName", Chang.lastName);
                expect(res.body).to.have.property("username", Chang.username);
            });

            it('should return "User not found" when providing a non-registered username', async () => {
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}fakeUsername`)
                    .set("Authorization", ianAccessToken)

                expect(res.status).to.equal(400);
                expect(res.body).to.have.property("message", "User not found");
            })

            it('should fail authorization when providing invalid access token', async () => {
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", "badAccessToken");
                
                expect(res.status).to.equal(403);
                expect(res.body).to.have.property("message", "Invalid Token")
            })
        });

    });

    describe('Friends endpoints', async () => {
        
        let ianId;
        let changId;
        let andrewId;

        before(async () => {
            //const andrewUser = await setupUser(Andrew, app);

            const ianUser = await User.findOne({ email: Ian.email });
            ianId = ianUser._id;
            const changUser = await User.findOne({ email: Chang.email });
            changId = changUser._id;
            const andrewUser = await User.findOne({ email: Andrew.email })
            andrewId = andrewUser._id;
        });
        

        
        
        describe('POST /api/user/friends', async () => {

            const apiEndpoint = '/friends'

            afterEach(async () => {
                await Friendship.deleteMany({});
            })
            describe('Initial Validations', async () => {
                it('should throw error when username is not provided', async () => {
                    const res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken);

                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "Invalid request body: 'username' field is required.");
                });
    
                it('should throw error when username does not exist in users', async () => {


                    const res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username":"fakeusername",
                            "operation":"send"
                        });

                    expect(res.status).to.equal(404);
                    expect(res.body).to.have.property("message", "The requested user was not found");
                });
    
                it('should throw error when user tries to modify relationship with themself', async () => {
                    const res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username":Ian.username,
                            "operation":"send"
                        });

                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "Invalid request: User cannot have relationship with themself.")
                });
            });

            describe('Friendship table does not exist and will create one if valid', async () => {

                it('should create new friendship table with correct status pending_awaiting2/pending_awaiting1 when friendship table does not exist with operation send', async () => {
                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username": Chang.username,
                            "operation": "send"
                        });
                    
                    expect(res.status).to.equal(201)
                    expect(res.body).to.have.property("message", "Friend request sent");
                    
                    let friendshipTable = (ianId < changId ? await Friendship.findOne({ user1: ianId , user2: changId }) : await Friendship.findOne({ user1: changId , user2: ianId }))
                    
                    if ( ianId < changId ) {
                        expect(friendshipTable).to.have.property("status", "pending_awaiting2")
                    } else {
                        expect(friendshipTable).to.have.property("status", "pending_awaiting1")
                    }

                    await Friendship.findByIdAndDelete(friendshipTable._id);

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", changAccessToken)
                        .send({
                            "username": Ian.username,
                            "operation": "send"
                        });
                    
                    expect(res.status).to.equal(201)
                    expect(res.body).to.have.property("message", "Friend request sent");

                    friendshipTable = (ianId < changId ? await Friendship.findOne({ user1: ianId , user2: changId }) : await Friendship.findOne({ user1: changId , user2: ianId }))
                    
                    if ( ianId < changId ) {
                        expect(friendshipTable).to.have.property("status", "pending_awaiting1")
                    } else {
                        expect(friendshipTable).to.have.property("status", "pending_awaiting2")
                    }

                });
    
                it('should create new friendship table with correct status blocked_by1/blocked_by2 when friendship table does not exist with operation block', async () => {
                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username": Chang.username,
                            "operation": "block"
                        });
                    
                    expect(res.status).to.equal(201)
                    expect(res.body).to.have.property("message", "User blocked succesfully");

                    let friendshipTable = (ianId < changId ? await Friendship.findOne({ user1: ianId , user2: changId }) : await Friendship.findOne({ user1: changId , user2: ianId }))
                    
                    if ( ianId < changId ) {
                        expect(friendshipTable).to.have.property("status", "blocked_by1")
                    } else {
                        expect(friendshipTable).to.have.property("status", "blocked_by2")
                    }

                    await Friendship.findByIdAndDelete(friendshipTable._id);

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", changAccessToken)
                        .send({
                            "username": Ian.username,
                            "operation": "block"
                        });
                    
                    expect(res.status).to.equal(201)
                    expect(res.body).to.have.property("message", "User blocked succesfully");

                    friendshipTable = (ianId < changId ? await Friendship.findOne({ user1: ianId , user2: changId }) : await Friendship.findOne({ user1: changId , user2: ianId }))
                    
                    if ( ianId < changId ) {
                        expect(friendshipTable).to.have.property("status", "blocked_by2")
                    } else {
                        expect(friendshipTable).to.have.property("status", "blocked_by1")
                    }
                });

                it('should throw error when user tries operation [accept, unblock, unfriend] when friendship table does not exist with (username)', async () => {
                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username": Chang.username,
                            "operation": "accept"
                        });
                    
                    expect(res.status).to.equal(400)
                    expect(res.body).to.have.property("message", "Invalid request body: 'operation' is not valid on current relationship")

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username": Chang.username,
                            "operation": "unblock"
                        });
                    
                    expect(res.status).to.equal(400)
                    expect(res.body).to.have.property("message", "Invalid request body: 'operation' is not valid on current relationship")

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", ianAccessToken)
                        .send({
                            "username": Chang.username,
                            "operation": "unfriend"
                        });
                    
                    expect(res.status).to.equal(400)
                    expect(res.body).to.have.property("message", "Invalid request body: 'operation' is not valid on current relationship")
                });
            });
            
            describe('Friendship table does exist and operation: accept', async() => {
                
                it('should change friendship table status to friends when operation is accept and current status is pending', async () => {
                    
                    // checking pending_awaiting2 works correctly
                    
                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];
                    const pendingFriendship_awaiting2 = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "pending_awaiting2"
                    });

                    await pendingFriendship_awaiting2.save();

                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken2) // setting authorization to user who needs to accept
                        .send({
                            "username": username1,
                            "operation": "accept"
                        });
                    
                    expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "Friend request accepted");

                    let acceptedFriendship = await Friendship.findOne({
                        user1: user1Id,
                        user2: user2Id
                    });

                    expect(acceptedFriendship).to.have.property("status", "friends");

                    await Friendship.findByIdAndDelete(acceptedFriendship._id);

                    const pendingFriendship_awaiting1 = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "pending_awaiting1"
                    });

                    await pendingFriendship_awaiting1.save();

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken1) // setting authorization to user who needs to accept
                        .send({
                            "username": username2,
                            "operation": "accept"
                        });
                    
                     expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "Friend request accepted");

                    acceptedFriendship = await Friendship.findOne({
                        user1: user1Id,
                        user2: user2Id
                    });

                    expect(acceptedFriendship).to.have.property("status", "friends");
                });

                it('should throw error when user tries to accept a pending relationship that they started', async () => {

                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];
                    
                    const pendingRelationship_awaiting2 = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "pending_awaiting2"
                    });


                    await pendingRelationship_awaiting2.save();
                    
                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken1)
                        .send({
                            "username": username2,
                            "operation": "accept"
                        });
                    
                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "Invalid request: There is no friend request from this user");

                    await Friendship.findOneAndDelete({ user1: user1Id, user2: user2Id })

                    const pendingRelationship_awaiting1 = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "pending_awaiting1"
                    });

                    await pendingRelationship_awaiting1.save();

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken2)
                        .send({
                            "username": username1,
                            "operation": "accept"
                        });

                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "Invalid request: There is no friend request from this user");               
                });

                it('should throw error when current status is not pending and operation is accept', async () => {
                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];

                    const friendRelationship = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "friends"
                    });
                    await friendRelationship.save();
                    const frResponse = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken1)
                        .send({
                            "username": username2,
                            "operation": "accept"
                        });

                    await Friendship.deleteMany({});
                    

                    const blocked_by1Relationship = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "blocked_by1"
                    });
                    await blocked_by1Relationship.save();
                    const b1Response = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken1)
                        .send({
                            "username": username2,
                            "operation": "accept"
                        });

                    await Friendship.deleteMany({});
                    
                    const blocked_by2Relationship = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "blocked_by2"
                    });
                    await blocked_by2Relationship.save();
                    const b2Response = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken1)
                        .send({
                            "username": username2,
                            "operation": "accept"
                        });

                    await Friendship.deleteMany({});

                    const blocked_bothRelationship = new Friendship({
                        user1: user1Id,
                        user2: user2Id,
                        status: "blocked_both"
                    });
                    await blocked_bothRelationship.save();
                    const bbResponse = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", aToken1)
                        .send({
                            "username": username2,
                            "operation": "accept"
                        });

                    await Friendship.deleteMany({});
                    
                    expect(frResponse.status).to.equal(400);
                    expect(b1Response.status).to.equal(400);
                    expect(b2Response.status).to.equal(400);
                    expect(bbResponse.status).to.equal(400);

                    expect(frResponse.body).to.have.property("message", "Invalid request: 'accept' is not a valid operation for this friendship");
                    expect(b1Response.body).to.have.property("message", "Invalid request: 'accept' is not a valid operation for this friendship");
                    expect(b2Response.body).to.have.property("message", "Invalid request: 'accept' is not a valid operation for this friendship");
                    expect(bbResponse.body).to.have.property("message", "Invalid request: 'accept' is not a valid operation for this friendship");
                });
            });
            
            describe('Friendship table does exist and operation: block', async() => {

                let userInformation;

                before(async () => {
                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];

                    userInformation = { user1Id, username1, aToken1, user2Id, username2, aToken2 }
                });

                
                it('should change friendship table status to blocked_by1/blocked_by2 when operation is block and current status is pending or friends', async () => {
                    const validStatuses = ['pending_awaiting2', 'pending_awaiting1', 'friends'];

                    let newRelationshipTables = [];

                    validStatuses.forEach((stat) => {
                        newRelationshipTables.push(new Friendship({
                            user1: userInformation.user1Id,
                            user2: userInformation.user2Id,
                            status: stat
                        }));
                    })

                    newRelationshipTables.forEach(async (relationship) => {                    
                        // user1 is blocking
                        
                        await relationship.save();

                        const res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken1)
                            .send({
                                "username": userInformation.username2,
                                "operation": "block"
                        });
                        
                        expect(res.status).to.equal(201);
                        expect(res.body).to.have.property("message", "User successfully blocked");

                        await Friendship.findOneAndDelete({ user1: userInformation.user1Id, user2: userInformation.user2Id });


                        // user2 is blocking

                        await relationship.save()

                        const res2 = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken2)
                            .send({
                                "username": userInformation.username1,
                                "operation": "block"
                        });

                        expect(res2.status).to.equal(201);
                        expect(res2.body).to.have.property("message", "User successfully blocked");

                        await Friendship.findOneAndDelete({ user1: userInformation.user1Id, user2: userInformation.user2Id });
                    })

                    await Friendship.deleteMany({});
                });

                it('should change friendship table status to blocked_both when operation is block and current status is blocked_by1/blocked_by2', async () => {

                    const blockby1Friendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_by1",
                
                    });

                    const blockby2Friendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_by2",
                    });

                    // check blocked_by1 changes to blocked_both
                    await blockby1Friendship.save()

                    let res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken2)
                            .send({
                                "username": userInformation.username1,
                                "operation": "block"
                    });

                    let newFriendship = await Friendship.findOne({ user1: userInformation.user1Id, user2: userInformation.user2Id });

                    expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "User successfully blocked");

                    expect(newFriendship).to.have.property("status", "blocked_both");

                    await Friendship.findByIdAndDelete(newFriendship._id);

                    // check blocked_by2 changes to blocked_both
                    await blockby2Friendship.save();
                    
                    res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken1)
                            .send({
                                "username": userInformation.username2,
                                "operation": "block"
                    });

                    newFriendship = await Friendship.findOne({ user1: userInformation.user1Id, user2: userInformation.user2Id });

                    expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "User successfully blocked");

                    expect(newFriendship).to.have.property("status", "blocked_both");

                    await Friendship.findByIdAndDelete(newFriendship._id);
                });

                it('should throw error when operation is block and user is already blocking other user', async () => {
                    const blockby1Friendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_by1"
                    });

                    const blockby2Friendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_by2"
                    });

                    await blockby1Friendship.save();

                    let res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken1)
                            .send({
                                "username": userInformation.username2,
                                "operation": "block"
                    });

                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "User is already blocking specified user");

                    await Friendship.deleteMany({});

                    await blockby2Friendship.save();

                    res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken2)
                            .send({
                                "username": userInformation.username1,
                                "operation": "block"
                    });

                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "User is already blocking specified user");

                    await Friendship.deleteMany({});
                });

                it('should throw error when operation is block and current status is blocked_both', async () => {
                    const blockBothFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_both"
                    });

                    blockBothFriendship.save();

                    const res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken1)
                            .send({
                                "username": userInformation.username2,
                                "operation": "block"
                    });

                    const res2 = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken1)
                            .send({
                                "username": userInformation.username2,
                                "operation": "block"
                    });

                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "User is already blocking specified user");
                    expect(res2.status).to.equal(400);
                    expect(res2.body).to.have.property("message", "User is already blocking specified user");
                });
            });

            describe('Friendship table does exist and operation: unblock', async() => {

                let userInformation;

                before(async () => {
                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];

                    userInformation = { user1Id, username1, aToken1, user2Id, username2, aToken2 }
                });


                it('should throw error if user is not blocking other user', async () => {
                    const nonBlockingStatuses = ['pending_awaiting2, pending_awaiting1, friends']
                    let nonBlockingFriendships = []
                    nonBlockingStatuses.forEach((status) => {
                        const friendship = new Friendship({
                            user1: userInformation.user1Id,
                            user2: userInformation.user2Id,
                            status: status
                        });

                        nonBlockingFriendships.push(friendship);
                    });
                    
                    nonBlockingFriendships.forEach(async (friendship) => {
                        await friendship.save();

                        const res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", ianAccessToken)
                            .send({
                                "username": Chang.username,
                                "operation": "unblock"
                            });

                        expect(res.status).to.equal(400);
                        expect(res.body).to.have.property("message", "Can not unvblock this user");

                        await Friendship.findOneAndDelete({ user1: userInformation.user1Id, user2: userInformation.user2Id });
                    });
                    


                });

                it('should change friendship table status to blocked_by1/blocked_by2 if current status is blocked_both', async () => {
                    let blockedBothFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_both"
                    });

                    await blockedBothFriendship.save();

                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set('Authorization', userInformation.aToken1)
                        .send({
                            "username": userInformation.username2,
                            "operation": "unblock"
                        })

                    expect(res.status).to.equal(201)
                    expect(res.body).to.have.property("message", "User successfully unblocked");
                    
                    let friendshipTable = await Friendship.findById(blockedBothFriendship._id);

                    expect(friendshipTable).to.have.property("status", "blocked_by2")

                    await Friendship.findByIdAndDelete(blockedBothFriendship._id);

                    blockedBothFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_both"
                    });

                    await blockedBothFriendship.save();

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set('Authorization', userInformation.aToken2)
                        .send({
                            "username": userInformation.username1,
                            "operation": "unblock"
                        })

                    expect(res.status).to.equal(201)
                    expect(res.body).to.have.property("message", "User successfully unblocked");

                    friendshipTable = await Friendship.findById(blockedBothFriendship._id);

                    expect(friendshipTable).to.have.property("status", "blocked_by1")

                    await Friendship.findByIdAndDelete(blockedBothFriendship._id);
                });

                it('should delete friendship table when user is blocking other user and operation is unblock', async () => {
                    let blockedFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_by1"
                    });

                    await blockedFriendship.save();

                    let res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", userInformation.aToken1)
                        .send({
                            "username": userInformation.username2,
                            "operation": "unblock"
                        });
                    
                    expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "User successfully unblocked")

                    let deletedFriendship = await Friendship.findOne(blockedFriendship._id);
                    expect(deletedFriendship).to.be.null;

                    blockedFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "blocked_by2"
                    });

                    await blockedFriendship.save();

                    res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", userInformation.aToken2)
                        .send({
                            "username": userInformation.username1,
                            "operation": "unblock"
                        });
                    
                    expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "User successfully unblocked")

                    deletedFriendship = await Friendship.findOne(blockedFriendship._id);
                    expect(deletedFriendship).to.be.null;
                });
            });
            
            describe('Friendship table does exist and operation: unfriend', async() => {

                let userInformation;

                before(async () => {
                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];

                    userInformation = { user1Id, username1, aToken1, user2Id, username2, aToken2 }
                });

                it('should delete friendship table when user is friends with other user', async () => {
                    const mutualFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: "friends"
                    });

                    await mutualFriendship.save();

                    const res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", userInformation.aToken1)
                        .send({
                            "username": userInformation.username2,
                            "operation": "unfriend"
                        });

                    expect(res.status).to.equal(201);
                    expect(res.body).to.have.property("message", "User successfully unfriended");

                    const deletedFriendship = await Friendship.findOne(mutualFriendship._id);
                    expect(deletedFriendship).to.be.null;
                });

                it('should throw error when user is not friends with other user and operation is unfriend', async () => {
                    const invalidStatuses = ['pending_awaiting2', 'pending_awaiting1', 'blocked_by1', 'blocked_by2', 'blocked_both']
                    let friendships = []
                    invalidStatuses.forEach((status) => {
                        friendships.push(new Friendship({
                            user1: userInformation.user1Id,
                            user2: userInformation.user2Id,
                            status: status
                        }))
                    })

                    friendships.forEach(async (friendship) => {
                        await friendship.save();

                        const res = await request(app)
                            .post(`${apiPathRoot}${apiEndpoint}`)
                            .set("Authorization", userInformation.aToken1)
                            .send({
                                "username": userInformation.username2,
                                "operation": "unfriend"
                            });

                        expect(res.status).to.equal(400);
                        expect(res.body).to.have.property("message", "User could not be unfriended");

                        await Friendship.findByIdAndDelete(friendship._id);
                    })
                });
            });

            describe('Friendship table does exist and operation: send', async() => {
                let userInformation;

                before(async () => {
                    const [user1Id, username1, aToken1, user2Id, username2, aToken2] = 
                        ianId < changId ? 
                            [ianId, Ian.username, ianAccessToken, changId, Chang.username, changAccessToken] : 
                            [changId, Chang.username, changAccessToken, ianId, Ian.username, ianAccessToken];

                    userInformation = { user1Id, username1, aToken1, user2Id, username2, aToken2 }
                });

                it('should throw an error when friendship table exists and operation is send', async() => {
                    const existingFriendship = new Friendship({
                        user1: userInformation.user1Id,
                        user2: userInformation.user2Id,
                        status: 'friends'
                    });

                    await existingFriendship.save();

                    const res = await request(app)
                        .post(`${apiPathRoot}${apiEndpoint}`)
                        .set("Authorization", userInformation.aToken1)
                        .send({
                            "username": userInformation.username2,
                            "operation": "send"
                        });
                    
                    expect(res.status).to.equal(400);
                    expect(res.body).to.have.property("message", "Invalid request body: 'operation' does not match accept,block,unblock,unfriend");

                    await Friendship.findByIdAndDelete(existingFriendship._id);
                })
            })


        });

        describe('GET /api/user/friends/:username', async () => {

            const apiEndpoint = '/friends'
            
            let ianChangFriendship;
            let ianAndrewFriendship;
            let changAndrewFriendship;

            beforeEach(async () => {
                // setup so that Ian is friends with Chang and Andrew, Chang is friends with Ian, and Andrew is friends with Ian
                // Chang and Andrew are pending

                // not going to enforce user1 < user2 as it is not relevant here
                ianChangFriendship = new Friendship({
                    user1: ianId < changId ? ianId : changId,
                    user2: changId > ianId ? changId : ianId,
                    status: "friends"
                });

                ianAndrewFriendship = new Friendship({
                    user1: ianId < andrewId ? ianId : andrewId,
                    user2: andrewId > ianId ? andrewId : ianId,
                    status: "friends"
                });

                changAndrewFriendship = new Friendship({
                    user1: changId < andrewId ? changId : andrewId,
                    user2: andrewId > changId ? andrewId : changId,
                    status: "pending_awaiting1"
                });

                await ianChangFriendship.save()
                await ianAndrewFriendship.save()
                await changAndrewFriendship.save()
            });

            afterEach(async () => {
                await Friendship.deleteMany({})
            })

            it('should return user friends when username is not provided', async () => {
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                
                expect(res.status).to.equal(201);
                expect(res.body.length).to.equal(2);
                let usernames = res.body.map(user => user.username);

                expect(usernames).to.include(Chang.username);
                expect(usernames).to.include(Andrew.username);

                const oneFriendRes = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", changAccessToken)

                expect(oneFriendRes.status).to.equal(201);
                expect(oneFriendRes.body.length).to.equal(1);

                usernames = oneFriendRes.body.map(user => user.username);
                expect(usernames).to.include(Ian.username);
            });

            it("should return username's friends when username is provided", async () => {
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}/${Ian.username}`)
                    .set("Authorization", changAccessToken)

                    expect(res.status).to.equal(201);
                    expect(res.body.length).to.equal(2);
                    let usernames = res.body.map(user => user.username);
    
                    expect(usernames).to.include(Chang.username);
                    expect(usernames).to.include(Andrew.username);
            });

            it('should throw error when username does not exist in user table', async () => {
                const res = await request(app)
                    .get(`${apiPathRoot}${apiEndpoint}/nonExistingUsername`)
                    .set("Authorization", changAccessToken)
                
                expect(res.status).to.equal(500)
                expect(res.body).to.have.property("message", "Could not find friends");
            });
        })
    });
});