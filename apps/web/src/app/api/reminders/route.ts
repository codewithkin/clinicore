import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@my-better-t-app/db";
import { sendAppointmentReminder } from "@my-better-t-app/auth";

// This endpoint processes appointment reminders
// Should be called by a cron job every hour or triggered manually
export async function POST(request: NextRequest) {
	try {
		// Verify this is a legitimate cron request (via secret header or API key)
		const authHeader = request.headers.get("Authorization");
		const cronSecret = process.env.CRON_SECRET;

		// In development, allow without secret
		if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setHours(now.getHours() + 24);

		// Find appointments in the next 24 hours that haven't had reminders sent
		const upcomingAppointments = await prisma.appointment.findMany({
			where: {
				time: {
					gte: now,
					lte: tomorrow,
				},
				status: "scheduled",
				reminderSent: false,
			},
			include: {
				patient: true,
			},
		});

		const results = {
			total: upcomingAppointments.length,
			sent: 0,
			failed: 0,
			skipped: 0,
			errors: [] as string[],
		};

		for (const appointment of upcomingAppointments) {
			// Skip if patient has no email
			if (!appointment.patient.email) {
				results.skipped++;
				continue;
			}

			// Skip if no organization ID
			if (!appointment.organizationId) {
				results.skipped++;
				continue;
			}

			// Get organization name for the email
			const organization = await prisma.organization.findUnique({
				where: { id: appointment.organizationId },
			});

			if (!organization) {
				results.skipped++;
				continue;
			}

			// Check email limits for the organization
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			const emailCount = await prisma.emailLog.count({
				where: {
					organizationId: appointment.organizationId,
					sentAt: {
						gte: startOfMonth,
					},
				},
			});

			// Get organization's plan limit (this would need to be fetched from Polar or stored)
			// For now, we'll use a reasonable default of 1000 emails/month
			const EMAIL_LIMIT = 1000;

			if (emailCount >= EMAIL_LIMIT) {
				results.skipped++;
				results.errors.push(
					`Org ${appointment.organizationId}: Monthly email limit reached`
				);
				continue;
			}

			try {
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

				// Mark appointment as reminder sent
				await prisma.appointment.update({
					where: { id: appointment.id },
					data: {
						reminderSent: true,
						reminderSentAt: new Date(),
					},
				});

				results.sent++;
			} catch (error: any) {
				results.failed++;
				results.errors.push(
					`Appointment ${appointment.id}: ${error.message || "Unknown error"}`
				);

				// Log the failed email attempt
				await prisma.emailLog.create({
					data: {
						organizationId: appointment.organizationId,
						recipientEmail: appointment.patient.email,
						emailType: "appointment_reminder",
						subject: `Appointment Reminder`,
						status: "failed",
						appointmentId: appointment.id,
					},
				});
			}
		}

		return NextResponse.json({
			success: true,
			message: `Processed ${results.total} appointments`,
			results,
		});
	} catch (error: any) {
		console.error("Error processing reminders:", error);
		return NextResponse.json(
			{ error: "Failed to process reminders", details: error.message },
			{ status: 500 }
		);
	}
}

// GET endpoint to check upcoming reminders without sending
export async function GET() {
	try {
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setHours(now.getHours() + 24);

		const upcomingAppointments = await prisma.appointment.findMany({
			where: {
				time: {
					gte: now,
					lte: tomorrow,
				},
				status: "scheduled",
				reminderSent: false,
			},
			include: {
				patient: {
					select: {
						firstName: true,
						lastName: true,
						email: true,
					},
				},
			},
			orderBy: {
				time: "asc",
			},
		});

		// Get organization names
		const orgIds = [...new Set(upcomingAppointments.map((a) => a.organizationId).filter(Boolean))] as string[];
		const organizations = await prisma.organization.findMany({
			where: { id: { in: orgIds } },
			select: { id: true, name: true },
		});
		const orgMap = new Map(organizations.map((o) => [o.id, o.name]));

		return NextResponse.json({
			pendingReminders: upcomingAppointments.length,
			appointments: upcomingAppointments.map((apt) => ({
				id: apt.id,
				patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
				patientEmail: apt.patient.email,
				time: apt.time,
				type: apt.type,
				organization: apt.organizationId ? orgMap.get(apt.organizationId) || "Unknown" : "Unknown",
			})),
		});
	} catch (error: any) {
		console.error("Error fetching pending reminders:", error);
		return NextResponse.json(
			{ error: "Failed to fetch pending reminders" },
			{ status: 500 }
		);
	}
}
