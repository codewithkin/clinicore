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
