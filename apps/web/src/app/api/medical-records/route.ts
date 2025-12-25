import { NextRequest, NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { headers } from "next/headers";
import { getUserOrganization } from "@/lib/dashboard-helpers";

// GET - Fetch medical records for a patient
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const patientId = searchParams.get("patientId");

		if (!patientId) {
			return NextResponse.json({ error: "patientId is required" }, { status: 400 });
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

		// Verify patient belongs to organization
		const patient = await db.patient.findUnique({
			where: { id: patientId },
		});

		if (!patient || patient.organizationId !== organizationId) {
			return NextResponse.json({ error: "Patient not found" }, { status: 404 });
		}

		const records = await db.medicalRecord.findMany({
			where: { patientId },
			include: {
				appointment: {
					select: {
						id: true,
						time: true,
						type: true,
						doctorName: true,
					},
				},
			},
			orderBy: { visitDate: "desc" },
		});

		return NextResponse.json({ records });
	} catch (error) {
		console.error("Error fetching medical records:", error);
		return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
	}
}

// POST - Create a new medical record
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			patientId,
			appointmentId,
			visitType,
			chiefComplaint,
			diagnosis,
			symptoms,
			treatment,
			prescription,
			notes,
			bloodPressure,
			heartRate,
			temperature,
			weight,
			height,
			followUpDate,
			followUpNotes,
		} = body;

		if (!patientId || !visitType) {
			return NextResponse.json(
				{ error: "patientId and visitType are required" },
				{ status: 400 }
			);
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

		// Verify patient belongs to organization
		const patient = await db.patient.findUnique({
			where: { id: patientId },
		});

		if (!patient || patient.organizationId !== organizationId) {
			return NextResponse.json({ error: "Patient not found" }, { status: 404 });
		}

		const record = await db.medicalRecord.create({
			data: {
				patientId,
				appointmentId: appointmentId || null,
				visitType,
				chiefComplaint: chiefComplaint || null,
				diagnosis: diagnosis || null,
				symptoms: symptoms || null,
				treatment: treatment || null,
				prescription: prescription || null,
				notes: notes || null,
				bloodPressure: bloodPressure || null,
				heartRate: heartRate ? parseInt(heartRate) : null,
				temperature: temperature ? parseFloat(temperature) : null,
				weight: weight ? parseFloat(weight) : null,
				height: height ? parseFloat(height) : null,
				followUpDate: followUpDate ? new Date(followUpDate) : null,
				followUpNotes: followUpNotes || null,
				createdBy: session.user.name || session.user.email,
			},
			include: {
				appointment: {
					select: {
						id: true,
						time: true,
						type: true,
						doctorName: true,
					},
				},
			},
		});

		return NextResponse.json({ record }, { status: 201 });
	} catch (error) {
		console.error("Error creating medical record:", error);
		return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
	}
}
