import { NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { headers } from "next/headers";
import { getUserOrganization } from "@/lib/dashboard-helpers";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing appointment id" }, { status: 400 });
        }

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = await getUserOrganization(session.user.id);

        if (!organizationId) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Verify the appointment belongs to the user's organization
        const appointment = await db.appointment.findUnique({
            where: { id },
            include: { patient: true },
        });

        if (!appointment || appointment.patient.organizationId !== organizationId) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        // Update appointment status to cancelled instead of deleting
        await db.appointment.update({
            where: { id },
            data: { status: "cancelled" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        return NextResponse.json(
            { error: "Failed to cancel appointment" },
            { status: 500 }
        );
    }
}
