require('dotenv').config();

module.exports = {
    PORT : process.env.PORT,
    MONGO_URI : process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TEST : process.env.MONGO_URI,
    JWT_SECRET : process.env.JWT_SECRET,
    REFRESH_SECRET : process.env.REFRESH_SECRET,
    REFRESH_EXERCISES : false
}