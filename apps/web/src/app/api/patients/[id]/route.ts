import { NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { headers } from "next/headers";
import { getUserOrganization } from "@/lib/dashboard-helpers";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
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

        // Verify the patient belongs to the user's organization
        const patient = await db.patient.findUnique({
            where: { id: params.id },
        });

        if (!patient || patient.organizationId !== organizationId) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        }

        // Delete the patient (this will cascade delete appointments due to schema)
        await db.patient.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting patient:", error);
        return NextResponse.json(
            { error: "Failed to delete patient" },
            { status: 500 }
        );
    }
}
