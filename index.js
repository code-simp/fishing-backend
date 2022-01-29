// This is a testFile inOrder to test using Jest 

// require all the dependencies
const express = require('express');
const appTest = express();
const PORT = 3000;
const bodyParser = require('body-parser')
// multer is used to process images in the backend
const multer = require('multer');
const storage = multer.memoryStorage();
// mongodb schema is defined in the models folder, we import that here
const Record = require('./models/records.js');
// uuid used to generate an id
const { v4: uuidv4 } = require('uuid');
var upload = multer({
    storage
});
// jobs coded in the queries.js page is imported here
const enque = require('./jobQueues/queues.js')
// require bodyParser in order to read incoming data
appTest.use(bodyParser.urlencoded({ extended: true }));
appTest.use(bodyParser.json());

// default route that sends out the index.html that contains 
// a form to fill out and also upload a picture
appTest.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})
// post method to recieve all the attributes plus the image
appTest.post('/newRecord', upload.single("image"), async (req, res, next) => {
    // resizing the image and storing its name in an unique ID
    const tempName = uuidv4();
    const tempFile = `${tempName}.${req.file.mimetype.split('/')[1]}`

    // calling the enqueue function to enque background jobs
    const bufferJson = req.file.buffer.toJSON()
    enque({
        bString: bufferJson,
        buffer: req.file.buffer,
        tempFile: tempFile,
        body: req.body,
        imgName: req.file.originalname
    });
    // just for the developers
    console.log('done main')

    // send success message
    res.send('successfully added the record');

});

// get method to send all the posts sorted by recent date and time
appTest.get('/allRecords', (req, res) => {
    // find method to retrieve all data from mongodb DB
    Record.find({}).sort({ timeStamp: -1 }).exec((err, docs) => {
        if (err) {
            res.send(err);
        }
        // if there's no data, then send the following msg
        else if (docs.length == 0) {
            res.send('no documents found');
        }
        else {
            res.send(docs);
        }
    });
});


module.exports = appTest;