// Meant to be only used for testing purposes
const User = require('../../models/User')


const request = require('supertest');

async function setupUser(user, app) {
	try {
		let response = await request(app)
			.post('/api/v1/auth/register')
			.send(user)

		if(response.statusCode === 201) {
			response = await request(app)
				.post('/api/v1/auth/login')
				.send({
					email: user.email,
					password: user.password
				});
		} else {
			throw new Error(`Error registering user: ${response.body.message}`)
		}

		if(response.statusCode === 201) {
			const userObject = await User.findOne({ email: user.email })
			const userInfo = { accessToken: response.body.token, refreshToken: response.body.refreshToken, userId: userObject._id};
			return userInfo
		} else {
			throw new Error(`Error logging in user: ${response.body.message}`)
		}

	} catch (error) {
		throw new Error(error);
	}
}

async function registerUser(user, app) {
	try {
		const response = await request(app)
			.post('/api/v1/auth/register')
			.send(user)
		if(response.statusCode !== 201) {
			throw new Error(`Error registering user: ${response.body.message}`)
		}
	} catch (error) {
		throw new Error(error);
	}
}

module.exports = {
	setupUser,
	registerUser
}