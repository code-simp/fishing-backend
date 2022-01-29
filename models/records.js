const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin-tarun:Tarunnexus9@maincluster.pgzzp.mongodb.net/fishing', { useNewUrlParser: true });


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

module.exports = mongoose.model('record', recordSchema);


// to get current date 
// new Date().toLocaleString();