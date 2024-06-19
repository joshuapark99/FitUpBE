const request = require('supertest');
const { expect } = require('chai');

const app = require('../app');
const { default: mongoose } = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken')

describe('Auth API', () => {
    
    const newUser = {
        testUsername : 'testUser',
        testEmail: 'testEmail',
        testFirstName: 'testFirst',
        testLastName: 'testLast',
        testPassword: 'testPassword'
    };

    before(async () => {
        await mongoose.connect(process.env.MONGO_URI_TEST);
        await User.deleteMany({})
        const testUser = new User({ 
            username: newUser.testUsername,
            email: newUser.testEmail,
            firstName: newUser.testFirstName,
            lastName: newUser.testLastName,
            password: newUser.testPassword
        })
        await testUser.save()
    });

    after(async () => {
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register', () => {
        it(('should register a new user'), async () => {
            // Setup
            
            await User.findOneAndDelete({username: newUser.testUsername})


            //Exercise
            
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: newUser.testUsername,
                    email: newUser.testEmail,
                    firstName: newUser.testFirstName,
                    lastName: newUser.testLastName,
                    password: newUser.testPassword
                });

            // Verify
            // Assert response
            
            expect(res.status).to.equal(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('message', "User registered successfully");
            
            // Query database to verify user was created
            const user = await User.findOne({ email: newUser.testEmail });
            expect(user).to.not.be.null;
            expect(user).to.have.property('username', newUser.testUsername);
            expect(user).to.have.property('email', newUser.testEmail);
            expect(user).to.have.property('firstName', newUser.testFirstName);
            expect(user).to.have.property('lastName', newUser.testLastName);
        });

        it('should return 403 error when fields not provided', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'all required fields not provided');
        });

        it(('should give an error when registering a user with duplicate details'), async () => {
            // Setup
            

            //Exercise
            
            const res = await request(app)
                .post('/api/auth/register')
                .send({ 
                    username: newUser.testUsername,
                    email: newUser.testEmail,
                    firstName: newUser.testFirstName,
                    lastName: newUser.testLastName,
                    password: newUser.testPassword
                });

            // Verify
            // Assert response
            
            expect(res.status).to.equal(400);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('message', "A user with that username or email already exists");
            
        })
    })

    describe('POST /api/auth/login', () => {
        it('should send login post method and return access token and refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: newUser.testEmail,
                    password: newUser.testPassword
                });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('token');
            expect(res.body).to.have.property('refreshToken');

            const { token, refreshToken } = res.body;

            expect(token).to.match(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/);
            expect(refreshToken).to.match(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/);

            const decodedAccessToken = jwt.decode(token);
            const decodedRefreshToken = jwt.decode(refreshToken);
            const user = await User.findOne({ email: newUser.testEmail });
            const userRefreshTokenVersion = jwt.decode(user.refreshToken).tokenVersion
            expect(decodedAccessToken).to.have.property('id', user._id.toString());
            expect(decodedAccessToken).to.have.property('tokenVersion', userRefreshTokenVersion);

            expect(decodedRefreshToken).to.have.property('id', user._id.toString());
            expect(decodedRefreshToken).to.have.property('tokenVersion', userRefreshTokenVersion);
        });

        it('should return 403 error when email or password not provided', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'all required fields not provided');
        });

        it('should return User not found when trying to login with wrong email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: "wrongemail@gmail.com",
                    password: newUser.testPassword
                });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "User not found")
        });

        it('should return User not found when trying to login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: newUser.testEmail,
                    password: "wrongPassword"
                });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Invalid credentials")
        })

        it('should send two login post method and token version should change', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: newUser.testEmail,
                    password: newUser.testPassword
                });

            const accessToken = res.body.token;
            const refreshToken = res.body.refreshToken;
            
            const decodedAccessToken = jwt.decode(accessToken);
            const decodedRefreshToken = jwt.decode(refreshToken);


            const res2 = await request(app)
                .post('/api/auth/login')
                .send({
                    email: newUser.testEmail,
                    password: newUser.testPassword
                });

            const accessToken2 = res2.body.token;
            const refreshToken2 = res2.body.refreshToken;
            
            const decodedAccessToken2 = jwt.decode(accessToken2);
            const decodedRefreshToken2 = jwt.decode(refreshToken2);
            
            expect(decodedAccessToken2).to.have.property('tokenVersion', decodedAccessToken.tokenVersion + 1);
            expect(decodedRefreshToken2).to.have.property('tokenVersion', decodedRefreshToken.tokenVersion + 1);
        })
    });

    describe('POST /api/auth/token', () => {
        it('should refresh access/refresh token and token versions should increment', async () => {
            const user = await User.findOne({ email: newUser.testEmail })
            const userRefreshToken = user.refreshToken
            
            const res = await request(app)
                .post('/api/auth/token')
                .send({
                    refreshToken: userRefreshToken
                });
            
            const newAccessToken = res.body.token;
            const newRefreshToken = res.body.refreshToken;

            const refreshTokenVersion = jwt.decode(userRefreshToken).tokenVersion;
            const newRefreshTokenVersion = jwt.decode(newRefreshToken).tokenVersion;

            expect(newAccessToken).to.match(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/);
            expect(newRefreshToken).to.match(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/);

            expect(refreshTokenVersion).to.equal(newRefreshTokenVersion - 1)

        });

        it('should return 403 error when refreshToken not provided', async () => {
            const res = await request(app)
                .post('/api/auth/token')
                .send({});

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'refresh token not provided');
        });

        it('should return error when refresh token does not match', async () => {
            const res = await request(app)
                .post('/api/auth/token')
                .send({refreshToken:'wrongtoken'});

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'refresh token does not match');
        })

        // maybe unreachable code now
        /*(it('should return error when refresh token is the wrong token version', async () => {
            const user = await User.findOne({ email: newUser.testEmail })
            const userRefreshToken = user.refreshToken
            
            await request(app)
                .post('/api/auth/token')
                .send({ refreshToken: userRefreshToken });

            const res = await request(app)
                .post('/api/auth/token')
                .send({ refreshToken: userRefreshToken});

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'token version mismatch');
        })*/
    });

    describe('POST /api/auth/logout', () => {
        it('should set refreshToken to null for user after calling logout', async () => {
            const user = await User.findOne({ email: newUser.testEmail })
            const userRefreshToken = user.refreshToken
            
            const res = await request(app)
                .post('/api/auth/logout')
                .send({
                    refreshToken: userRefreshToken
                });


            const loggedOutUser = await User.findOne({ email: newUser.testEmail });
            
            expect(res.status).to.equal(200);
            expect(loggedOutUser.refreshToken).to.be.null;
        }); 

        it('should return 403 error when refreshToken not provided', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .send({});

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property('message', 'refresh token not provided');
        });
    });
})