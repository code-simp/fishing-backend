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

// require bull for queuing operations 
const Queue = require('bull');
const resizeQueue = new Queue('resizeQueue', { redis: { port: 6379, host: '127.0.0.1' } });
const uploadQueue = new Queue('uploadQueue', { redis: { port: 6379, host: '127.0.0.1' } });
const dbQueue = new Queue('dbQueue', { redis: { port: 6379, host: '127.0.0.1' } });
const delQueue = new Queue('delQueue', { redis: { port: 6379, host: '127.0.0.1' } });

// creating fucntions to handle jobs
resizeQueue.process(async (job, done) => {
    let obj = job.data.buffer.data;
    let buffer = Buffer.from(JSON.stringify(obj));
    console.log(buffer)
    const actualBuffer = await sharp(buffer).resize(140, 140).toBuffer();
    fs.writeFileSync(`./public/images/${job.data.tempFile}`, actualBuffer);

    // calling the upload queue
    uploadQueue.add({
        tempFile: job.data.tempFile,
        body: job.data.body,
        imgName: job.data.imgName
    });

    done();
});

uploadQueue.process(async (job, done) => {
    const url = await uploadImage(`./public/images/${job.data.tempFile}`, `${job.data.tempFile}`);
    console.log(url);

    // calling the DB push function
    dbQueue.add({
        body: job.data.body,
        imgName: job.data.imgName,
        url: url,
        tempFile: job.data.tempFile
    });

    done();
});

dbQueue.process(async (job, done) => {
    const record = new Record({
        name: job.data.body.name,
        species: job.data.body.species,
        weight: job.data.body.weight,
        length: job.data.body.length,
        latitude: job.data.body.latitude,
        longitude: job.data.body.longitude,
        timeStamp: new Date().toLocaleString(),
        img: {
            link: job.data.url,
            imgName: job.data.imgName
        }
    });
    record.save((err) => {
        if (err) {
            res.send(err);
        }
    });

    // calling the delQueue function
    delQueue.add({
        tempFile: job.data.tempFile,
    })

    done();
})

delQueue.process(async (job, done) => {
    fs.stat(`./public/images/${job.data.tempFile}`, function (err, stats) {
        if (err) {
            return console.error(err);
        }

        fs.unlink(`./public/images/${job.data.tempFile}`, function (err) {
            if (err) return console.log(err);
            console.log('file deleted successfully');
        });
    });
    done();
})

// firebase cloud storage to store images

const firebaseAdmin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const serviceAccount = require('./fishing-backend-firebase-adminsdk-6suc4-711fa58c49.json');

const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});

const storageRef = admin.storage().bucket(`gs://fishing-backend.appspot.com`);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// Later needs to cut pasted into the post function
async function uploadImage(path, filename) {
    const storage = await storageRef.upload(path, {
        public: true,
        destination: `${filename}`,
        metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
        }
    });
    return storage[0].metadata.mediaLink;
}

app.post('/newRecord', upload.single("image"), async (req, res, next) => {
    // resizing the image
    const tempName = uuidv4();
    const tempFile = `${tempName}.${req.file.mimetype.split('/')[1]}`
    // const resizeData = ;
    // calling the enqueue function
    resizeQueue.add({
        buffer: req.file.buffer,
        tempFile: tempFile,
        body: req.body,
        imgName: req.file.originalname
    });


    // const buffer = await sharp(req.file.buffer).resize(140, 140).toBuffer();
    // const tempFile = `${tempName}.${req.file.mimetype.split('/')[1]}`
    // fs.writeFileSync(`./public/images/${tempFile}`, buffer);

    // uploading the image to firebase cloud storage
    // const url = await uploadImage(`./public/images/${tempFile}`, `${tempFile}`);
    // console.log(url)

    // pushing the attributes and resized image link to database
    // const record = new Record({
    //     name: req.body.name,
    //     species: req.body.species,
    //     weight: req.body.weight,
    //     length: req.body.length,
    //     latitude: req.body.latitude,
    //     longitude: req.body.longitude,
    //     timeStamp: new Date().toLocaleString(),
    //     img: {
    //         link: url,
    //         imgName: req.file.originalname
    //     }
    // });
    // record.save((err) => {
    //     if (err) {
    //         res.send(err);
    //     }
    // });

    // delete the temp image stored on server
    // fs.stat(`./public/images/${tempFile}`, function (err, stats) {
    //     if (err) {
    //         return console.error(err);
    //     }

    //     fs.unlink(`./public/images/${tempFile}`, function (err) {
    //         if (err) return console.log(err);
    //         console.log('file deleted successfully');
    //     });
    // });

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