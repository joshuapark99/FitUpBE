const request = require('supertest');
const { expect } = require('chai');

const app = require('../../app');
const User = require('../../models/User');

const { setupUser } = require('../../utils/testSetupTools')

const { Ian, Chang, Andrew } = require('../testUsers')

describe('User API', async () => {

    let accessToken;
    
    before(async () => {
        const ianUser = await setupUser(Ian, app);
        const changUser = await setupUser(Chang, app);

        accessToken = ianUser.accessToken;

    });

    after(async () => {
        await User.deleteMany({})
    })


    describe('User endpoints', async () => {

        describe('GET /api/user/:username', async () => {
            it('should return client user information when username is not provided', async () => {
                
                const res = await request(app)
                    .get('/api/user/')
                    .set("Authorization", accessToken)

                expect(res.status).to.equal(200)
                expect(res.body).to.have.property("firstName", Ian.firstName);
                expect(res.body).to.have.property("lastName", Ian.lastName);
                expect(res.body).to.have.property("username", Ian.username);
            });

            it('should return other user information when username is provided', async () => {
                const res = await request(app)
                    .get(`/api/user/${Chang.username}`)
                    .set("Authorization", accessToken)
                
                expect(res.status).to.equal(200)
                expect(res.body).to.have.property("firstName", Chang.firstName);
                expect(res.body).to.have.property("lastName", Chang.lastName);
                expect(res.body).to.have.property("username", Chang.username);
            });

            it('should return "User not found" when providing a non-registered username', async () => {
                const res = await request(app)
                    .get(`/api/user/${Andrew.username}`)
                    .set("Authorization", accessToken)

                expect(res.status).to.equal(400);
                expect(res.body).to.have.property("message", "User not found");
            })

            it('should fail authorization when providing invalid access token', async () => {
                const res = await request(app)
                    .get(`/api/user/`)
                    .set("Authorization", "badAccessToken");
                
                expect(res.status).to.equal(403);
                expect(res.body).to.have.property("message", "Invalid Token")
            })
        });

    });

    describe('Friends endpoints', async () => {
        
        before(async () => {
            const andrewUser = await setupUser(Andrew, app);
        });
        
        describe('POST /api/friends', async () => {
            describe('Initial Validations', async () => {
                it('should throw error when username is not provided', async () => {
                    throw new Error("not yet implemented")
                });
    
                it('should throw error when username does not exist in users', async () => {
                    throw new Error("not yet implemented")
                });
    
                it('should throw error when user tries to modify relationship with themself', async () => {
                    throw new Error("not yet implemented")
                });
            });

            describe('Friendship table does not exist', async () => {
                it('should create new friendship table with correct status pending_1to2/pending_2to1 when friendship table does not exist with operation send', async () => {
                    throw new Error("not yet implemented")
                });
    
                it('should create new friendship table with correct status blocked_by1/blocked_by2 when friendship table does not exist with operation block', async () => {
                    throw new Error("not yet implemented")
                });

                it('should throw error when user tries operation [accept, unblock, unfriend] when friendship table does not exist with (username)', async () => {
                    throw new Error("not yet implemented")
                });
            });
            
            describe('Friendship table does exist and operation: accept', async() => {
                
                it('should change friendship table status to friends when operation is accept and current status is pending', async () => {
                    throw new Error("not yet implemented")
                });

                it('should throw error when user tries to accept a pending relationship that they started', async () => {
                    throw new Error("not yet implemented")
                });

                it('should throw error when current status is not pending and operation is accept', async () => {
                    throw new Error("not yet implemented")
                });
            });
            
            describe('Friendship table does exist and operation: block', async() => {
                it('should change friendship table status to blocked_by1/blocked_by2 when operation is block and current status is pending or friends', async () => {
                    throw new Error("not yet implemented")
                });

                it('should change friendship table status to blocked_both when operation is block and current status is blocked_by1/blocked_by2', async () => {
                    throw new Error("not yet implemented")
                });

                it('should throw error when operation is block and user is already blocking user2', async () => {
                    throw new Error("not yet implemented")
                });

                it('should throw error when operation is block and current status is blocked_both', async () => {
                    throw new Error("not yet implemented")
                });
            });

            describe('Friendship table does exist and operation: unblock', async() => {
                it('should throw error if user is not blocking other user', async () => {
                    throw new Error("not yet implemented")
                });

                it('should change friendship table status to blocked_by1/blocked_by2 if current status is blocked_both', async () => {
                    throw new Error("not yet implemented")
                });

                it('should delete friendship table when user is blocking other user and operation is unblock', async () => {
                    throw new Error("not yet implemented")
                });
            });
            
            describe('Friendship table does exist and operation: unfriend', async() => {
                it('should delete friendship table when user is friends with other user', async () => {
                    throw new Error("not yet implemented")
                });

                it('should throw error when user is not friends with other user and operation is unfriend', async () => {
                    throw new Error("not yet implemented")
                });
            });

            describe('Friendship table does exist and operation: send', async() => {
                it('should throw an error when friendship table exists and operation is send', async() => {
                    throw new Error("not yet implemented")
                })
            })


        });

        describe('GET /api/friends/:username', async () => {
            it('should return user friends when username is not provided', async () => {
                throw new Error("not yet implemented")
            });

            it("should return username's friends when username is provided", async () => {
                throw new Error("not yet implemented")
            });

            it('should throw error when username does not exist in user table', async () => {
                throw new Error("not yet implemented")
            });
        })
    });
});