const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user/user')
const printRoutes = require('./utils/printRoutes')
const { PORT, MONGO_URI } = require('./config')


const app = express();
app.use(express.json());
app.use(cors());

const port = PORT || 5000;

mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error(err);
});


app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

printRoutes(app);

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
