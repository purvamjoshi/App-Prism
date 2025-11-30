const http = require('http');

// Mock analysis data
const mockAnalysis = {
    last_7_days: {
        summary: "Test summary for email integration.",
        themes: [
            { name: "Theme 1", sentiment: { positive: 80, negative: 20 } },
            { name: "Theme 2", sentiment: { positive: 40, negative: 60 } }
        ],
        quotes: [
            { text: "Great app!", rating: 5, time: new Date().toISOString(), sentiment: "Positive" },
            { text: "Needs improvement.", rating: 3, time: new Date().toISOString(), sentiment: "Negative" }
        ],
        action_items: ["Action 1", "Action 2"]
    }
};

const data = JSON.stringify({
    analysis: mockAnalysis,
    appId: 'com.test.app'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/email',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        // Note: This script won't work perfectly because it lacks the session cookie.
        // However, we can at least check if it hits the Unauthorized error, which confirms the endpoint is reachable.
        // To fully test, we'd need to mock the auth session or disable it temporarily.
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
