const request = require('supertest');
const { expect } = require('chai');

const app = require('../../app');
const User = require('../../models/User');

const { setupUser } = require('../../utils/testSetupTools')

const { Ian, Chang, Andrew } = require('../testUsers')

describe('User API', async () => {


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
        
        it('should blah blah', async () => {
            expect(4).to.equal(4)
        });
    });
});