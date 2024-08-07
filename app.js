const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const apiV1Routes = require('./routes/v1')
const loadExercises = require('./utils/loadExercises')
const printRoutes = require('./utils/printRoutes')
const { PORT, MONGO_URI, REFRESH_EXERCISES } = require('./config')


const app = express();
app.use(express.json());
app.use(cors());

const port = PORT || 5000;

mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error(err);
});

(async () => {
    try { 
        await loadExercises({"load": REFRESH_EXERCISES});
    } catch(err) {
        console.log(err);
    }
})();

app.use('/api/v1', apiV1Routes);


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

// Export the app for testing
module.exports = app