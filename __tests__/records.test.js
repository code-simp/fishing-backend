// making use of supertest and jest to test both the GET methods
const request = require('supertest');
const appTest = require('../index.js');
// increasing the timeout just incase the data grows
jest.setTimeout(10000);

// testing the default GET / method's status code
describe('GET /', () => {
    test('server returns status 200', async () => {
        const response = await request(appTest).get('/');
        expect(response.statusCode).toBe(200);
    });
});

// testing the GET /allRecords method to see if it also 
// returns this particular document which already exists
// in the database
describe('GET /allRecords', () => {
    test('check if "get all records" also retrieves this particular doc', async () => {
        const checkDoc = {
            "__v": 0,
            "_id": "61f54d2e794a82878e65309b",
            "img": {
                "imgName": "Screenshot 2022-01-28 at 12.04.47 PM.png",
                "link": "https://storage.googleapis.com/download/storage/v1/b/fishing-backend.appspot.com/o/920e5a48-a69c-4144-8703-683230546d44.png?generation=1643466030104816&alt=media"
            },
            "latitude": 90.1,
            "length": 81.4,
            "longitude": -67.8777,
            "name": "russel",
            "species": "katla",
            "timeStamp": "1/29/2022, 7:50:30 PM",
            "weight": 20
        }
        const response = await request(appTest).get('/allRecords');
        expect(response.body).toContainEqual(checkDoc);
    })
});