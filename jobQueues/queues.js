const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const Record = require('../models/records.js');
const fs = require("fs");

// replace your redis port and host in here
const rPORT = 6379;
const rHOST = '127.0.0.1';

// require bull for queuing operations `../public/images/${job.data.tempFile}`
const Queue = require('bull');
const resize = new Queue('resizeQueue', { redis: { port: rPORT, host: rHOST } });
const uploadQueue = new Queue('uploadQueue', { redis: { port: rPORT, host: rHOST } });
const dbQueue = new Queue('dbQueue', { redis: { port: rPORT, host: rHOST } });
const delQueue = new Queue('delQueue', { redis: { port: rPORT, host: rHOST } });

// creating fucntions to handle jobs
resize.process(async (job, done) => {
    const actualBuffer = await sharp(Buffer.from(job.data.bString)).resize(140, 140).toBuffer();
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
    console.log('done queues');
    done();
})

// firebase cloud storage to store images

const firebaseAdmin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const serviceAccount = require('../fishing-backend-firebase-adminsdk-6suc4-711fa58c49.json');

const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});

const storageRef = admin.storage().bucket(`gs://fishing-backend.appspot.com`);

// A function that takes care of uploading the image to my firebase storage
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

module.exports = async function enque(data) {
    resize.add(data);
}