const request = require('supertest');
const { expect } = require('chai');

const app = require('../../app');

const Post = require('../../models/Post')
const User = require('../../models/User')

const { createPostTypeObject } = require('../testObjects/testPosts');
const { Ian, Chang } = require('../testObjects/testUsers');
const { setupUser } = require('../testTools/testSetupToolsV1');
const { createPost } = require('../../controllers/postsController');

describe('Posts API', async () => {
    const apiPathRoot = '/api/v1/posts';
    let ianAccessToken, ianId, examplePost, changAccessToken, changId;

    before(async () => {
        let { accessToken, userId } = await setupUser(Ian, app);
        ianAccessToken = accessToken;
        ianId = userId;
        ({ accessToken, userId } = await setupUser(Chang, app));
        changAccessToken = accessToken;
        changId = userId;


        //exampleTextPost = createTextPostObject(ianId);
    });

    after(async () => {
        await User.findByIdAndDelete(ianId);
        await User.findByIdAndDelete(changId);
        await User.deleteMany({})
        await Post.deleteMany()
    })


    describe('POST /api/v1/posts', async () => {
        
        afterEach(async () => {
            await Post.deleteMany({});
        });

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

    describe('GET /api/v1/posts/:post_id', async () => {
        const apiEndpoint = '/';

        it("should return a post when provided with the post's post_id", async () => {
            const examplePostObject = createPostTypeObject(ianId, ['text','media']);
            const examplePost = new Post(examplePostObject);
            await examplePost.save();

            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}${examplePost._id}`)
                .set("Authorization", ianAccessToken);
                

            expect(res.status).to.equal(200)
            const { postId = res.body._id, userId, text, mediaUrl, likes, likesCount, mentions, postType} = res.body
            expect(postId).to.equal(examplePost._id.toString())
            expect(userId).to.equal(examplePost.userId.toString())
            expect(text).to.equal(examplePost.text)
            expect(mediaUrl).to.equal(examplePost.mediaUrl)
            expect(likes).to.deep.equal(examplePost.likes)
            expect(likesCount).to.equal(examplePost.likesCount)
            expect(mentions).to.deep.equal(examplePost.mentions)
            expect(postType).to.deep.equal(examplePost.postType)

            await Post.findByIdAndDelete(examplePost._id)
        });

        it('should return an error when provided a post_id that does not exist', async () => {
            const badPostId = '012321301302012301231302'
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}${badPostId}`)
                .set("Authorization", ianAccessToken);

            expect(res.status).to.equal(400)
            expect(res.body).to.have.property("message", "Post could not be found")
        });


    });

    describe('GET /api/v1/posts', async () => {

        const apiEndpoint = '/'
        
        let post1, post2, post3;

        before(async () => {
            const post1Object = createPostTypeObject(ianId, ['text']);
            const post2Object = createPostTypeObject(ianId, ['media']);
            const post3Object = createPostTypeObject(changId, ['text'])

            post1 = new Post(post1Object);
            post2 = new Post(post2Object);
            post3 = new Post(post3Object);

            await post1.save();
            await post2.save();
            await post3.save();
        });

        after(async () => {
            await Post.findByIdAndDelete(post1._id);
            await Post.findByIdAndDelete(post2._id);
            await Post.findByIdAndDelete(post3._id);
            await Post.deleteMany({});
        });

        it('should return two posts', async () => {
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}`)
                .set("Authorization", ianAccessToken);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.length(2);
            expect(res.body[0]).to.have.property("_id").that.is.oneOf([post1._id.toString(), post2._id.toString()]);
            expect(res.body[1]).to.have.property("_id").that.is.oneOf([post1._id.toString(), post2._id.toString()]);
        });

        it('should return one post', async () => {
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}`)
                .set("Authorization", changAccessToken);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.length(1);
        })

        it('should throw error when user calling api is not registered', async () => {
            await User.findByIdAndDelete(changId);
            
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}`)
                .set("Authorization", changAccessToken);
            
            expect(res.status).to.equal(403);
            expect(res.body).to.have.property("message", "User not found");

            const { accessToken, userId } = await setupUser(Chang, app);

            changAccessToken = accessToken;
            changId = userId;
        })
    });

    describe('GET /api/v1/posts/user/:user_id', async () => {

        const apiEndpoint = '/user/'
        
        let post1, post2, post3;

        before(async () => {
            const post1Object = createPostTypeObject(ianId, ['text']);
            const post2Object = createPostTypeObject(ianId, ['media']);
            const post3Object = createPostTypeObject(changId, ['text'])

            post1 = new Post(post1Object);
            post2 = new Post(post2Object);
            post3 = new Post(post3Object);

            await post1.save();
            await post2.save();
            await post3.save();
        });

        after(async () => {
            await Post.findByIdAndDelete(post1._id);
            await Post.findByIdAndDelete(post2._id);
            await Post.findByIdAndDelete(post3._id);
            await Post.deleteMany({});
        });

        it('should return two posts', async () => {
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}${Ian.username}`)
                .set("Authorization", changAccessToken);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.length(2);
            expect(res.body[0]).to.have.property("_id").that.is.oneOf([post1._id.toString(), post2._id.toString()]);
            expect(res.body[1]).to.have.property("_id").that.is.oneOf([post1._id.toString(), post2._id.toString()]);
        });

        it('should return one post', async () => {
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}${Chang.username}`)
                .set("Authorization", ianAccessToken);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.length(1);
        })

        it('should throw error when user calling api is not registered', async () => {
            await User.findByIdAndDelete(changId);
            
            const res = await request(app)
                .get(`${apiPathRoot}${apiEndpoint}${Chang.username}`)
                .set("Authorization", ianAccessToken);
            
            expect(res.status).to.equal(403);
            expect(res.body).to.have.property("message", "User not found");

            const { accessToken, userId } = await setupUser(Chang, app);

            changAccessToken = accessToken;
            changId = userId;
        })
    });

    describe('DELETE /api/v1/posts/:post_id', async () => {
        
        const apiEndpoint = '/'
        let post1;

        beforeEach(async () => {
            const post1Object = createPostTypeObject(ianId, ['text']);

            post1 = new Post(post1Object);

            await post1.save();
        });

        afterEach(async () => {
            await Post.findByIdAndDelete(post1._id)
            await Post.deleteMany({});
        })

        it('should delete document when provided the correct post_id', async () => {
            const res = await request(app)
                .del(`${apiPathRoot}${apiEndpoint}${post1._id}`)
                .set("Authorization", ianAccessToken)

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property("message", "Post successfully deleted");

            const deletedPost = await Post.findById(post1._id);
            expect(deletedPost).to.be.null;
        });

        it('should throw error when provided the incorrect post_id', async () => {
            const incorrectId = '123818231823813281321238'
            
            const res = await request(app)
                .del(`${apiPathRoot}${apiEndpoint}${incorrectId}`)
                .set("Authorization", ianAccessToken)

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message", "Post could not be found");
        });

        it('should throw error when user tries to delete post that they did not create', async () => {
            const res = await request(app)
                .del(`${apiPathRoot}${apiEndpoint}${post1._id}`)
                .set("Authorization", changAccessToken)

            expect(res.status).to.equal(403);
            expect(res.body).to.have.property("message", "User can not delete this post");
        })
    });

    describe('POST /api/v1/posts/:post_id/like', async () => {
        const apiEndpoint = (postId) => {return `/${postId}/like`}
        let post1;

        beforeEach(async () => {
            const post1Object = createPostTypeObject(ianId, ['text']);

            post1 = new Post(post1Object);

            await post1.save();
        });

        afterEach(async () => {
            await Post.findByIdAndDelete(post1._id)
            await Post.deleteMany({});
        })

        it('should append userId to likes field and increment likesCount when user likes another post', async () => {

            const res = await request(app)
                .post(`${apiPathRoot}${apiEndpoint(post1._id)}`)
                .set("Authorization", changAccessToken);

            
            expect(res.status).to.be.equal(200);
            expect(res.body).to.have.property("message", "Post successfully liked");

            const post = await Post.findById(post1._id);
            expect(post.likes.length).to.be.equal(1);
            expect(post.likesCount).to.be.equal(1);

            expect(post.likes.includes(changId)).to.be.true;
        });

        it('should splice userId out of likes field and decrement likesCount when user unlikes another post', async () => {
            let post = await Post.findById(post1._id);
            post.likes.push(changId);
            post.likesCount = 1;
            post.save();
            
            const res = await request(app)
                .post(`${apiPathRoot}${apiEndpoint(post1._id)}`)
                .set("Authorization", changAccessToken);

            
            expect(res.status).to.be.equal(200);
            expect(res.body).to.have.property("message", "Post successfully unliked");

            post = await Post.findById(post1._id);
            expect(post.likes.length).to.be.equal(0);
            expect(post.likesCount).to.be.equal(0);

            expect(post.likes.includes(changId)).to.be.false;
        });

        it('should return an error when user likes a post that doesn\'t exist', async () => {
            const fakeId = '126316231236123616231236'
            
            const res = await request(app)
                .post(`${apiPathRoot}${apiEndpoint(fakeId)}`)
                .set("Authorization", changAccessToken);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property("message","Post could not be found");
        })

    })
});