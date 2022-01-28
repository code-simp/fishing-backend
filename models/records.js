const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Fishing');

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
        data: Buffer,
        fileName: String
    }
});

module.exports = mongoose.model('record', recordSchema);


// to get current date 
// new Date().toLocaleString();