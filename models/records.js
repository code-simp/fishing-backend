// requiring mongoose to connect to mongodb
const mongoose = require('mongoose');
// connecting to my mongodb atlas
mongoose.connect('mongodb+srv://admin-tarun:Tarunnexus9@maincluster.pgzzp.mongodb.net/fishing', { useNewUrlParser: true });

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