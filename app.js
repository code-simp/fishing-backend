const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser')
const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const Record = require('./models/records.js')

var upload = multer({
    storage
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/newRecord', (req, res) => {
    console.log(req.body)
    const record = new Record({
        name: req.body.name,
        species: req.body.species,
        weight: req.body.weight,
        length: req.body.length,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        timeStamp: new Date().toLocaleString()
    });
    record.save()

})

app.listen(PORT, () => {
    console.log(`app is up and running on ${PORT}`)
});