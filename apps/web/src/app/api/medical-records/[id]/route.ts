import { NextRequest, NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { headers } from "next/headers";
import { getUserOrganization } from "@/lib/dashboard-helpers";

// GET - Fetch a single medical record
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

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

		const record = await db.medicalRecord.findUnique({
			where: { id },
			include: {
				patient: true,
				appointment: true,
			},
		});

		if (!record || record.patient.organizationId !== organizationId) {
			return NextResponse.json({ error: "Record not found" }, { status: 404 });
		}

		return NextResponse.json({ record });
	} catch (error) {
		console.error("Error fetching medical record:", error);
		return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
	}
}

// PATCH - Update a medical record
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();

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

		// Verify record belongs to organization
		const existing = await db.medicalRecord.findUnique({
			where: { id },
			include: { patient: true },
		});

		if (!existing || existing.patient.organizationId !== organizationId) {
			return NextResponse.json({ error: "Record not found" }, { status: 404 });
		}

		// Build update data
		const updateData: any = {};
		const fields = [
			"visitType",
			"chiefComplaint",
			"diagnosis",
			"symptoms",
			"treatment",
			"prescription",
			"notes",
			"bloodPressure",
			"followUpNotes",
		];

		fields.forEach((field) => {
			if (body[field] !== undefined) {
				updateData[field] = body[field] || null;
			}
		});

		if (body.heartRate !== undefined) {
			updateData.heartRate = body.heartRate ? parseInt(body.heartRate) : null;
		}
		if (body.temperature !== undefined) {
			updateData.temperature = body.temperature ? parseFloat(body.temperature) : null;
		}
		if (body.weight !== undefined) {
			updateData.weight = body.weight ? parseFloat(body.weight) : null;
		}
		if (body.height !== undefined) {
			updateData.height = body.height ? parseFloat(body.height) : null;
		}
		if (body.followUpDate !== undefined) {
			updateData.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
		}

		const record = await db.medicalRecord.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json({ record });
	} catch (error) {
		console.error("Error updating medical record:", error);
		return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
	}
}

// DELETE - Delete a medical record
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

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

		// Verify record belongs to organization
		const existing = await db.medicalRecord.findUnique({
			where: { id },
			include: { patient: true },
		});

		if (!existing || existing.patient.organizationId !== organizationId) {
			return NextResponse.json({ error: "Record not found" }, { status: 404 });
		}

		await db.medicalRecord.delete({ where: { id } });

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting medical record:", error);
		return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
	}
}
