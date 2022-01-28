const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Fishing');

const recordSchema = mongoose.Schema({
    name: String,
    species: String,
    weight: Number,
    length: Number,
    latitude: Number,
    longitude: Number,
    timeStamp: Timestamp,
})


// to get current date 
// new Date().toLocaleString();