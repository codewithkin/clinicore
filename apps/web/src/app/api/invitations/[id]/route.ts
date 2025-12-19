import prisma from "@my-better-t-app/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const invitationId = params.id;
    if (!invitationId) {
        return NextResponse.json({ error: "Missing invitation id" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const lowerEmail = invitation.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: lowerEmail } });

    return NextResponse.json({
        invitation: {
            id: invitation.id,
            email: lowerEmail,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
        },
        user: {
            exists: Boolean(user),
            emailVerified: Boolean(user?.emailVerified),
        },
    });
}
