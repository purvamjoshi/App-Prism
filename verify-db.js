const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    try {
        console.log("Connecting to database...");
        // Try to count users to see if the table exists
        const count = await prisma.user.count();
        console.log(`Successfully connected! Found ${count} users.`);
        console.log("Database schema appears to be correct.");
    } catch (error) {
        console.error("Error connecting to database:", error.message);
        if (error.code === 'P2021') {
            console.error("The table 'User' does not exist in the current database. Schema push failed.");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
