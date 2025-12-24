import { NextResponse } from "next/server";
import { db } from "@my-better-t-app/db";
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a member of this organization
        const member = await db.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
        }

        const organization = await db.organization.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                defaultAppointmentLength: true,
            },
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        return NextResponse.json({ organization });
    } catch (error) {
        console.error("Error fetching organization:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is an admin of this organization
        const member = await db.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
                role: "admin",
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { defaultAppointmentLength } = body;

        const organization = await db.organization.update({
            where: { id },
            data: {
                defaultAppointmentLength: defaultAppointmentLength ? parseInt(defaultAppointmentLength) : null,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                defaultAppointmentLength: true,
            },
        });

        return NextResponse.json({ organization });
    } catch (error) {
        console.error("Error updating organization:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
