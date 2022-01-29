// this file contains the code for the background jobs
// Bull and Redis used to implement the same
// multer is used to process images in the backend
const multer = require('multer');
// sharp is a library used to resize image
const sharp = require('sharp');
const storage = multer.memoryStorage();
const Record = require('../models/records.js');
// filesystem used to store incoming image temporarily on the server
const fs = require("fs");

// replace your redis port and host in here
const rPORT = 6379;
const rHOST = '127.0.0.1';

// require bull for queuing operations 
const Queue = require('bull');
// defining all the queues
const resize = new Queue('resizeQueue', { redis: { port: rPORT, host: rHOST } });
const uploadQueue = new Queue('uploadQueue', { redis: { port: rPORT, host: rHOST } });
const dbQueue = new Queue('dbQueue', { redis: { port: rPORT, host: rHOST } });
const delQueue = new Queue('delQueue', { redis: { port: rPORT, host: rHOST } });

// creating fucntions to handle jobs
// resize queue takes cares of resizing the image to 140x140 px
resize.process(async (job, done) => {
    // code to resize the image
    const actualBuffer = await sharp(Buffer.from(job.data.bString)).resize(140, 140).toBuffer();
    // filesystem storing the image temporarily
    fs.writeFileSync(`./public/images/${job.data.tempFile}`, actualBuffer);

    // calling the upload queue which takes care of uploading
    // the image to my firebase storage
    uploadQueue.add({
        tempFile: job.data.tempFile,
        body: job.data.body,
        imgName: job.data.imgName
    });

    // ends the job if sub queues are done
    done();
});

// uploadQueue takes care of uploading the image to firebase storage
uploadQueue.process(async (job, done) => {
    // uploadImage is a fucntion written below to upload image to the storage
    const url = await uploadImage(`./public/images/${job.data.tempFile}`, `${job.data.tempFile}`);

    // calling the DB push queue to push all the info/attributes to the mongoDB database
    dbQueue.add({
        body: job.data.body,
        imgName: job.data.imgName,
        url: url,
        tempFile: job.data.tempFile
    });
    // ends the job if sub queues are done
    done();
});

// dbQueue takes care of pushing the data to the mongodb database
dbQueue.process(async (job, done) => {
    // creating a new document for the schema created in models/records
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
    // saving the document aka commit
    record.save((err) => {
        if (err) {
            res.send(err);
        }
    });

    // calling the delQueue queue
    delQueue.add({
        tempFile: job.data.tempFile,
    })

    done();
})

// delQueue takes care of deleting the temporarily stored image as it is no longer needed
delQueue.process(async (job, done) => {
    // checking for the validity of the file if it exists
    fs.stat(`./public/images/${job.data.tempFile}`, function (err, stats) {
        if (err) {
            return console.error(err);
        }

        // deleting the file
        fs.unlink(`./public/images/${job.data.tempFile}`, function (err) {
            if (err) return console.log(err);
            console.log('file deleted successfully');
        });
    });
    // for the developer's reference
    console.log('done queues');
    // is the last sub queue
    done();
})

// firebase cloud storage to store images
// Auth..
const firebaseAdmin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const serviceAccount = require('../fishing-backend-firebase-adminsdk-6suc4-711fa58c49.json');

const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});
// firebase bucket
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

// exporting the module and making use of it on app.js
module.exports = async function enque(data) {
    resize.add(data);
}