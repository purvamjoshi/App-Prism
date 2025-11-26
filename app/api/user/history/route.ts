import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch distinct appIds from history
        // Prisma doesn't support distinct on SQLite easily with select? 
        // Actually distinct is supported.
        const history = await prisma.searchHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { timestamp: "desc" },
            distinct: ["appId"],
            take: 10,
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("History error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
