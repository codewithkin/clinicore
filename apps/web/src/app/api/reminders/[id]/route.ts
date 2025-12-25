import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@my-better-t-app/db";
import { sendAppointmentReminder, auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";

// Manually send a reminder for a specific appointment
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const appointment = await prisma.appointment.findUnique({
			where: { id },
			include: {
				patient: true,
			},
		});

		if (!appointment) {
			return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
		}

		if (!appointment.organizationId) {
			return NextResponse.json({ error: "Appointment has no organization" }, { status: 400 });
		}

		// Verify user belongs to this organization
		const userOrg = await prisma.member.findFirst({
			where: {
				userId: session.user.id,
				organizationId: appointment.organizationId,
			},
		});

		if (!userOrg) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		if (!appointment.patient.email) {
			return NextResponse.json(
				{ error: "Patient does not have an email address" },
				{ status: 400 }
			);
		}

		// Get organization name
		const organization = await prisma.organization.findUnique({
			where: { id: appointment.organizationId },
		});

		if (!organization) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		// Check email limits
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const emailCount = await prisma.emailLog.count({
			where: {
				organizationId: appointment.organizationId,
				sentAt: {
					gte: startOfMonth,
				},
			},
		});

		const EMAIL_LIMIT = 1000;
		if (emailCount >= EMAIL_LIMIT) {
			return NextResponse.json(
				{ error: "Monthly email limit reached. Please upgrade your plan." },
				{ status: 429 }
			);
		}

		const appointmentTime = new Date(appointment.time);
		const timeString = appointmentTime.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});

		const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;

		await sendAppointmentReminder({
			to: appointment.patient.email,
			patientName,
			appointmentDate: appointmentTime,
			appointmentTime: timeString,
			appointmentType: appointment.type,
			doctorName: appointment.doctorName || undefined,
			clinicName: organization.name,
			notes: appointment.notes || undefined,
		});

		// Log the email
		await prisma.emailLog.create({
			data: {
				organizationId: appointment.organizationId,
				recipientEmail: appointment.patient.email,
				emailType: "appointment_reminder",
				subject: `Appointment Reminder - ${appointmentTime.toLocaleDateString()}`,
				status: "sent",
				appointmentId: appointment.id,
			},
		});

		// Update appointment
		await prisma.appointment.update({
			where: { id },
			data: {
				reminderSent: true,
				reminderSentAt: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: `Reminder sent to ${appointment.patient.email}`,
		});
	} catch (error: any) {
		console.error("Error sending reminder:", error);
		return NextResponse.json(
			{ error: "Failed to send reminder", details: error.message },
			{ status: 500 }
		);
	}
}
