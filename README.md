# fishing-backend
A Node.js based server that is capable of :
1. accepting user's records of a fish and also an image, that the system will automatically resize to 140x140px
2. retrieving all the current records from the database

###### Timeline of branches
initially started using main --> master --> test

Default branch with all working code : test

#### Steps to install
>1. git clone https://github.com/code-simp/fishing-backend.git

>2. npm install

>3. node app.js

>4. type http://localhost:3000/ in your browser

#### NOTE
Do keep in mind that the job queues make use of a datastore called redis,
I do not have a cluster for redis and hence the code still makes use of locally stored redis, 
hence you need to have redis configured on your machine to run the code
to configure redis on your machine visit https://redis.io/documentation

once configured, head on to ./jobQueues/queues.js
and change rPORT and rHOST (in line 13) accordingly

Now you'd be having a minimal HTML form to test out the application.
you can fill in the form and also upload an image of the fish to store your beautiful memories.
once clicked on submit, you'd get a response stating "successfully added the record".

you can additionally type in http://localhost:3000/allRecords
to get all the current records from the database

## How it works

The initial GET / method sends out a html file for you to test the POST method
once entered the details and uploaded the image,
it would trigger the POST /newRecord method to receive the data and the image.

an uuid is generated and henceforth that would be the name of the image to maintain uniqueness
A background job gets enqueued to resize the image to 140x140
and it immediately sends a response stating the record has been inserted

Note that the image is actually stored on firebase cloud storage and the link to the image along with its original name 
will be stored in the mongodb database.

## Background Jobs

1. implemented using bull and redis
2. once the resize image job is queued, the image is temporarily stored in the file system of server
3. this job further enqueues a process to upload the resized image to my firebase storage
4. once uploaded, it enqueues the job to push the data along with the firebase image URL to mongodb database
5. once pushed, it finally enqueues the process to delete the temporarily stored image from the fileSystem
6. You can notice from the console that the user gets the confirmation then the job gets completed
7. additional info's commented out in the code

## Unit Tests

Jest and supertest is used to test the working of both the GET methods 
the index.js file contains the code meant only to test
index.js has an instance "appTest" that listens to, on indexTest.js

the __tests__ folder contains the test script 

to run test open a new terminal that points to the current dir. and type 
>npm run test

the result would be displayed in terms of how many test cases passed

## Working
https://youtu.be/BJtFBKjR_lg


