import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { getUserOrganization } from "@/lib/dashboard-helpers";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const queryOrgId = searchParams.get("organizationId");

		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const organizationId = queryOrgId || await getUserOrganization(session.user.id);
		if (!organizationId) {
			return NextResponse.json({ error: "No organization found" }, { status: 404 });
		}

		const organization = await db.organization.findUnique({
			where: { id: organizationId },
			select: {
				defaultAppointmentLength: true,
				bufferTime: true,
				bookingWindow: true,
				cancellationPolicy: true,
				emailReminders: true,
				reminderTiming: true,
				appointmentConfirmation: true,
				appointmentReminder: true,
				appointmentCancellation: true,
				patientRegistration: true,
			},
		});

		if (!organization) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		// Return settings in the format expected by consumers (for backwards compatibility)
		return NextResponse.json({
			settings: {
				scheduling: {
					defaultDuration: organization.defaultAppointmentLength ?? 30,
					bufferTime: organization.bufferTime ?? 15,
					bookingWindow: organization.bookingWindow ?? 30,
					cancellationPolicy: organization.cancellationPolicy ?? 24,
				},
				notifications: {
					emailReminders: organization.emailReminders ?? true,
					reminderTiming: organization.reminderTiming ?? 24,
					appointmentConfirmation: organization.appointmentConfirmation ?? true,
					appointmentReminder: organization.appointmentReminder ?? true,
					appointmentCancellation: organization.appointmentCancellation ?? true,
					patientRegistration: organization.patientRegistration ?? false,
				},
			}
		});
	} catch (error) {
		console.error("Error fetching settings:", error);
		return NextResponse.json(
			{ error: "Failed to fetch settings" },
			{ status: 500 }
		);
	}
}
