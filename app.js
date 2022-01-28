const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser')
const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const Record = require('./models/records.js')
const fs = require("fs");

var upload = multer({
    storage
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/newRecord', upload.single("image"), async (req, res, next) => {
    const buffer = await sharp(req.file.buffer).resize(140, 140).toBuffer();
    console.log(buffer)
    const record = new Record({
        name: req.body.name,
        species: req.body.species,
        weight: req.body.weight,
        length: req.body.length,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        timeStamp: new Date().toLocaleString(),
        img: {
            data: buffer,
            fileName: req.file.mimetype,
            imgName: req.file.originalname
        }
    });
    record.save();

});

app.get('/allRecords', (req, res) => {
    Record.find({}).sort({ timeStamp: -1 }).exec((err, docs) => {
        if (err) {
            res.send(err);
        }
        else if (docs.length == 0) {
            res.send('no documents found');
        }
        else {
            res.send(docs);
        }
    });
});

// app.get('/image', (req, res) => {
//     const object = Record.find({ _id: '61f432c39eb29315d10c5176' }, (err, docs) => {
//         var i = 0
//         for (i in docs) {
//             var data = docs[i].img.data
//             var name = docs[i].img.imgName
//             fs.writeFileSync(`./public/images/${name}`, data)
//         }
//     })
// })

app.listen(PORT, () => {
    console.log(`app is up and running on ${PORT}`)
});