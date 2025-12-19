import prisma from "@my-better-t-app/db";
import { NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase();

    // Check for pending invitations
    const pendingInvitation = await prisma.invitation.findFirst({
        where: {
            email: userEmail,
            status: "pending",
            expiresAt: {
                gte: new Date(),
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Check if user is already a member of any organization
    const membership = await prisma.member.findFirst({
        where: {
            userId: session.user.id,
        },
    });

    return NextResponse.json({
        hasPendingInvitation: Boolean(pendingInvitation),
        invitationId: pendingInvitation?.id || null,
        isOrgMember: Boolean(membership),
    });
}
