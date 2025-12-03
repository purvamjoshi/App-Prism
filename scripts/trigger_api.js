const http = require('http');

const data = JSON.stringify({
    appId: 'com.nextbillion.groww'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/analyze',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            console.log('Response Keys:', Object.keys(json));
            if (json.last_7_days) {
                console.log('last_7_days keys:', Object.keys(json.last_7_days));
                console.log('last_7_days.daily_ratings sample:', json.last_7_days.daily_ratings ? json.last_7_days.daily_ratings[0] : 'None');
            }
            if (json.last_15_days) {
                console.log('last_15_days keys:', Object.keys(json.last_15_days));
            }
        } catch (e) {
            console.log('Failed to parse JSON:', body.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
