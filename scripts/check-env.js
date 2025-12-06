const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    const vars = {};
    envConfig.split("\n").forEach(line => {
        const [key, value] = line.split("=");
        if (key && value) {
            vars[key.trim()] = "Present";
        }
    });

    console.log("AUTH_GOOGLE_ID:", vars["AUTH_GOOGLE_ID"] || "Missing");
    console.log("AUTH_GOOGLE_SECRET:", vars["AUTH_GOOGLE_SECRET"] || "Missing");
    console.log("AUTH_SECRET:", vars["AUTH_SECRET"] || "Missing");
    console.log("NEXTAUTH_SECRET:", vars["NEXTAUTH_SECRET"] || "Missing");
    console.log("DATABASE_URL:", vars["DATABASE_URL"] || "Missing");
    console.log("AUTH_TRUST_HOST:", vars["AUTH_TRUST_HOST"] || "Missing");
} else {
    console.log(".env file not found");
}
