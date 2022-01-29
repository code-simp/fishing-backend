# fishing-backend
A Node.js based server that is capable of :
1. accepting user's records of a fish and also an image, that the system will automatically resize to 140x140px
2. retrieving all the current records from the database

#### Steps to install
>1. git clone https://github.com/code-simp/fishing-backend.git

>2. npm install

>3. node app.js

>4. type http://localhost:3000/ in your browser

Now you'd be having a minimal HTML form to test out the application
you can fill in the form and also upload an image of the fish to store your beautiful memories
once clicked on submit, you'd get a response stating "successfully added the record"

you can additionally type in http://localhost:3000/allRecords
to get all the current records from the database

## How it works


the image would be resized to 140x140 px in the background

