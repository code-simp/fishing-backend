const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser')
const multer = require('multer');
const storage = multer.memoryStorage();
const Record = require('./models/records.js');
const { v4: uuidv4 } = require('uuid');
var upload = multer({
    storage
});
const enque = require('./jobQueues/queues.js')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/newRecord', upload.single("image"), async (req, res, next) => {
    // resizing the image
    const tempName = uuidv4();
    const tempFile = `${tempName}.${req.file.mimetype.split('/')[1]}`

    // calling the enqueue function
    const bufferJson = req.file.buffer.toJSON()
    enque({
        bString: bufferJson,
        buffer: req.file.buffer,
        tempFile: tempFile,
        body: req.body,
        imgName: req.file.originalname
    });

    console.log('done main')

    // send success message
    res.send('successfully added the record');

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

app.listen(PORT, () => {
    console.log(`app is up and running on ${PORT}`)
});