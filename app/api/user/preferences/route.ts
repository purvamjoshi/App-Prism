import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isWeeklyEmailEnabled: true },
    });

    return NextResponse.json({ isWeeklyEmailEnabled: user?.isWeeklyEmailEnabled || false });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isWeeklyEmailEnabled } = await req.json();

    const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { isWeeklyEmailEnabled },
    });

    return NextResponse.json({ success: true, isWeeklyEmailEnabled: user.isWeeklyEmailEnabled });
}
