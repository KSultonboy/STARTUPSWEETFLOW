const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000, // Assuming port 5000 as per common Express defaults
    path: '/api/health',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
