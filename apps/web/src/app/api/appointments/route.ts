import { NextRequest, NextResponse } from "next/server";
import { db } from "@my-better-t-app/db";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { patientId, doctorName, time, type, status, notes, duration } = body;

		if (!patientId || !doctorName || !time || !type) {
			return NextResponse.json(
				{ error: "patientId, doctorName, time, and type are required" },
				{ status: 400 }
			);
		}

		const appointment = await db.appointment.create({
			data: {
				patientId,
				doctorName,
				time: new Date(time),
				duration: duration || 30,
				type,
				status: status || "scheduled",
				notes: notes || null,
			},
			include: {
				patient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
					},
				},
			},
		});

		return NextResponse.json({ appointment }, { status: 201 });
	} catch (error) {
		console.error("Error creating appointment:", error);
		return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
	}
}
