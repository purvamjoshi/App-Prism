const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
    fs.appendFileSync(envPath, "\nAUTH_TRUST_HOST=true\n");
    console.log("Appended AUTH_TRUST_HOST=true to .env");
} else {
    console.log(".env file not found");
}
