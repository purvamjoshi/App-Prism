async function testApi() {
    try {
        console.log("Testing /api/analyze...");
        const response = await fetch("http://localhost:3000/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appId: "com.nextbillion.groww" }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Success! API returned data:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testApi();
