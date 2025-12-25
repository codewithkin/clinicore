import { NextRequest, NextResponse } from "next/server";
import { db } from "@my-better-t-app/db";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { patientId, doctorId, doctorName, time, type, status, notes, duration, organizationId } = body;

		if (!patientId || !doctorName || !time || !type) {
			return NextResponse.json(
				{ error: "patientId, doctorName, time, and type are required" },
				{ status: 400 }
			);
		}

		const appointment = await db.appointment.create({
			data: {
				patientId,
				doctorId: doctorId || null,
				doctorName,
				time: new Date(time),
				duration: duration || 30,
				type,
				status: status || "scheduled",
				notes: notes || null,
				organizationId: organizationId || null,
			},
			include: {
				patient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						phone: true,
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

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");

		if (!organizationId) {
			return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
		}

		const where: any = {
			patient: { organizationId },
		};

		if (startDate && endDate) {
			where.time = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		const appointments = await db.appointment.findMany({
			where,
			include: {
				patient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						phone: true,
					},
				},
			},
			orderBy: { time: "asc" },
		});

		return NextResponse.json({ appointments });
	} catch (error) {
		console.error("Error fetching appointments:", error);
		return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
	}
}
