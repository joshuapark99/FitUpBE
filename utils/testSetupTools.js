// Meant to be only used for testing purposes



const request = require('supertest');

async function setupUser(user, app) {
	try {
		let response = await request(app)
			.post('/api/auth/register')
			.send(user)

		if(response.statusCode === 201) {
			response = await request(app)
				.post('/api/auth/login')
				.send({
					email: user.email,
					password: user.password
				});
		} else {
			throw new Error(`Error register user: ${response.body.message}`)
		}

		if(response.statusCode === 201) {
			const tokens = { accessToken: response.body.token, refreshToken: response.body.refreshToken };
			return tokens
		} else {
			throw new Error(`Error logging in user: ${response.body.message}`)
		}

	} catch (error) {
		throw new Error(`Error setting up user: ${error}`);
	}
}

async function registerUser(user, app) {
	try {
		const response = await request(app)
			.post('/api/auth/register')
			.send(user)
		if(response.statusCode !== 201) {
			throw new Error(`Error register user: ${response.body.message}`)
		}
	} catch (error) {
		throw new Error(`Error setting up user: ${error}`);
	}
}

module.exports = {
	setupUser,
	registerUser
}