// requiring mongoose to connect to mongodb
require('dotenv').config();
const mongoose = require('mongoose');
// connecting to my mongodb atlas
mongoose.connect(process.env.MONGOURL, { useNewUrlParser: true });

// creation of schema for the records
const recordSchema = mongoose.Schema({
    name: String,
    species: String,
    weight: Number,
    length: Number,
    latitude: Number,
    longitude: Number,
    timeStamp: {
        type: String,
    },
    img: {
        link: String,
        imgName: String
    }
});

// exporting the module to make use in queues.js 
module.exports = mongoose.model('record', recordSchema);

// to get current date 
// new Date().toLocaleString();