import { NextRequest, NextResponse } from "next/server";
import { db } from "@my-better-t-app/db";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const organizationId = searchParams.get("organizationId");

	if (!organizationId) {
		return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
	}

	try {
		const patients = await db.patient.findMany({
			where: { organizationId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
			},
			orderBy: {
				firstName: "asc",
			},
		});

		return NextResponse.json({ patients });
	} catch (error) {
		console.error("Error fetching patients:", error);
		return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { firstName, lastName, email, phone, dob, organizationId } = body;

		if (!firstName || !lastName || !organizationId) {
			return NextResponse.json(
				{ error: "firstName, lastName, and organizationId are required" },
				{ status: 400 }
			);
		}

		const patient = await db.patient.create({
			data: {
				firstName,
				lastName,
				email: email || null,
				phone: phone || null,
				dateOfBirth: dob ? new Date(dob) : null,
				organizationId,
			},
		});

		return NextResponse.json({ patient }, { status: 201 });
	} catch (error) {
		console.error("Error creating patient:", error);
		return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
	}
}
