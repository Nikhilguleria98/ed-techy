const mongoose = require('mongoose');
const { initialize: initializeFallbackStore } = require('../utils/inMemoryDB');
require('dotenv').config();

exports.connectDB = () => {
    mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => {
            console.log('Database connected successfully');
        })
        .catch(error => {
            console.log(`Error while connecting to database: ${error.message}`);
            console.log('Server will continue without database connection and use fallback data.');
            initializeFallbackStore();
        })
};

