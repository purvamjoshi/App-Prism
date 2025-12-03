import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
        where: { user: { email: session.user.email } },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, appTitle, action } = await req.json();

    if (!appId) {
        return NextResponse.json({ error: "App ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        if (action === "subscribe") {
            const subscription = await prisma.subscription.create({
                data: {
                    userId: user.id,
                    appId,
                    appTitle: appTitle || appId,
                },
            });
            return NextResponse.json({ success: true, subscription });
        } else if (action === "unsubscribe") {
            await prisma.subscription.deleteMany({
                where: {
                    userId: user.id,
                    appId,
                },
            });
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        // Handle unique constraint violation for duplicate subscription
        if (error.code === 'P2002') {
            return NextResponse.json({ success: true, message: "Already subscribed" });
        }
        console.error("Subscription error:", error);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }
}
