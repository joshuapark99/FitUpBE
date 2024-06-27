const request = require('supertest');
const { expect } = require('chai');

const app = require('../../app');

const Post = require('../../models/Post')
const User = require('../../models/User')

const { createPostTypeObject } = require('../testObjects/testPosts');
const { Ian } = require('../testObjects/testUsers');
const { setupUser } = require('../testTools/testSetupToolsV1')

describe('Posts API', async () => {
    const apiPathRoot = '/api/v1/posts';
    let ianAccessToken, ianId, examplePost;

    before(async () => {
        const { accessToken } = await setupUser(Ian, app);
        ianAccessToken = accessToken;
        const ianUser = await User.findOne({ email: Ian.email });
        ianId = ianUser._id;

        //exampleTextPost = createTextPostObject(ianId);
    });

    after(async () => {
        await User.findByIdAndDelete(ianId);
    })

    afterEach(async () => {
        await Post.deleteMany({});
    })

    describe('POST /api/v1/posts', async () => {
        
        const apiEndpoint = '/';

        describe('valid operations', async () => {

            it('should create a post document when postType has text and all fields are valid', async () => {
                examplePost = createPostTypeObject(ianId, ['text']);
    
                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);
    
                expect(res.status).to.equal(201);
                expect(res.body).to.have.property("message", "Post successfully uploaded");
    
                const post = await Post.findOne({ userId: ianId })
    
                expect(post).to.have.property("text", examplePost.text);
                expect(post.mediaUrl).to.be.null;
                expect(post).to.have.property("postType").that.deep.equals(examplePost.postType)
            });
    
            it('should create a post document when postType has media and all fields are valid', async () => {
                examplePost = createPostTypeObject(ianId, ['media']);
    
                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);
    
    
                expect(res.status).to.equal(201);
                expect(res.body).to.have.property("message", "Post successfully uploaded");
    
                const post = await Post.findOne({ userId: ianId })
    
                expect(post).to.have.property("mediaUrl", examplePost.mediaUrl);
                expect(post.text).to.be.null;
                expect(post).to.have.property("postType").that.deep.equals(examplePost.postType)
            });
    
            it('should create a post document when postType has text and media and all fields are valid', async () => {
                examplePost = createPostTypeObject(ianId, ['text', 'media']);
    
                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);
    
                expect(res.status).to.equal(201);
                expect(res.body).to.have.property("message", "Post successfully uploaded");
    
                const post = await Post.findOne({ userId: ianId })
    
                expect(post).to.have.property("text", examplePost.text);
                expect(post).to.have.property("mediaUrl", examplePost.mediaUrl);
                expect(post).to.have.property("postType").that.deep.equals(examplePost.postType)
            });
    
            it('should create a post document when postType has workout and all fields are valid', async () => {
                // This will need to be fleshed out once workout model is created
                
                // exampleTextPost = createPostTypeObject(ianId, ['workout']);
    
                // const res = await request(app)
                //     .post(`${apiPathRoot}${apiEndpoint}`)
                //     .set("Authorization", ianAccessToken)
                //     .send(exampleTextPost);
    
                // expect(res.status).to.equal(201);
                // expect(res.body).to.have.property("message", "Post successfully uploaded");
            });

        });
        
        describe('invalid operations', async () => {
            it('should throw an error when postType has media or text and mediaUrl/text is not provided', async () => {
                examplePost = createPostTypeObject(ianId, ['text', 'media']);
                examplePost.text = null;
                examplePost.mediaUrl = null;

                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);

                expect(res.status).to.equal(403)
                expect(res.body.errors.text).to.have.property("message",'Text must be provided if and only if postType includes "text"');
                expect(res.body.errors.mediaUrl).to.have.property("message",'Media URL must be provided if and only if postType includes "media"');
            });

            it('should throw an error when postType is empty', async () => {
                examplePost = createPostTypeObject(ianId, []);
                examplePost.text = null;
                examplePost.mediaUrl = null;

                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);
                
                expect(res.status).to.equal(403)
                expect(res.body.errors.postType).to.have.property("message",'Provided postType is invalid');
            });

            it('should throw an error when postType has duplicates', async () => {
                examplePost = createPostTypeObject(ianId, ['text', 'text']);
                examplePost.text = null;
                examplePost.mediaUrl = null;

                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);
                
                console.log(res.body);
                expect(res.status).to.equal(403)
                expect(res.body.errors.postType).to.have.property("message",'Provided postType is invalid');
            });

            it('should throw an error when postType is not an array', async () => {
                examplePost = createPostTypeObject(ianId, []);
                examplePost.text = null;
                examplePost.mediaUrl = null;
                examplePost.postType = "notAnArray"

                const res = await request(app)
                    .post(`${apiPathRoot}${apiEndpoint}`)
                    .set("Authorization", ianAccessToken)
                    .send(examplePost);
                
                expect(res.status).to.equal(403)
                expect(res.body.errors.postType).to.have.property("message",'Provided postType is invalid');
            });
        });
    });

    
});