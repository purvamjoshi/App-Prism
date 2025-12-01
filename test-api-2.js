// Using built-in fetch
// If node-fetch is not available, I will use the built-in fetch if node version supports it (Node 18+)
// Or I can use a simple http request. Let's try built-in fetch first as it is likely available in this environment.

async function testApi() {
    try {
        console.log("Sending request to /api/analyze...");
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appId: 'com.nextbillion.groww' }),
        });

        const status = response.status;
        console.log(`Response Status: ${status}`);

        const text = await response.text();
        console.log("Response Body:", text);

    } catch (error) {
        console.error("API call failed:", error);
    }
}

testApi();
