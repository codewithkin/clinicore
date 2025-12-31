import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@my-better-t-app/db";
import {
	addReportJob,
	scheduleAllReports,
	getQueueStats,
} from "@my-better-t-app/queue";

// Default report interval in days (configurable via env variable)
const REPORT_INTERVAL_DAYS = parseInt(process.env.CLINIC_REPORT_INTERVAL_DAYS || "3", 10);

// This endpoint queues clinic report jobs for all organizations
// Should be called by a cron job daily to check which organizations need reports
export async function POST(request: NextRequest) {
	try {
		// Verify this is a legitimate cron request (via secret header or API key)
		const authHeader = request.headers.get("Authorization");
		const cronSecret = process.env.CRON_SECRET;

		// In development, allow without secret
		if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if request wants to queue a specific org or schedule all
		const body = await request.json().catch(() => ({}));

		if (body.organizationId) {
			// Queue a specific organization's report
			const org = await prisma.organization.findUnique({
				where: { id: body.organizationId },
				include: {
					members: {
						where: { role: "admin" },
						include: { user: true },
					},
				},
			});

			if (!org) {
				return NextResponse.json({ error: "Organization not found" }, { status: 404 });
			}

			const adminEmails = org.members
				.map((m) => m.user.email)
				.filter((email): email is string => !!email);

			if (adminEmails.length === 0) {
				return NextResponse.json({ error: "No admin emails found" }, { status: 400 });
			}

			const job = await addReportJob({
				organizationId: org.id,
				organizationName: org.name,
				adminEmails,
				periodDays: body.periodDays || REPORT_INTERVAL_DAYS,
			});

			return NextResponse.json({
				success: true,
				message: "Report job queued",
				jobId: job.id,
				jobName: job.name,
			});
		}

		// Schedule reports for all organizations that need them
		const result = await scheduleAllReports();

		return NextResponse.json({
			success: true,
			message: `Queued ${result.jobsQueued} report jobs`,
			...result,
			intervalDays: REPORT_INTERVAL_DAYS,
		});
	} catch (error: any) {
		console.error("Error queuing clinic reports:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: error.message },
			{ status: 500 }
		);
	}
}

// GET endpoint to check report status for organizations and queue stats
export async function GET(request: NextRequest) {
	try {
		const authHeader = request.headers.get("Authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const now = new Date();
		const intervalMs = REPORT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
		const cutoffDate = new Date(now.getTime() - intervalMs);

		const [organizations, queueStats] = await Promise.all([
			prisma.organization.findMany({
				select: {
					id: true,
					name: true,
					autoReportsEnabled: true,
					lastReportGeneratedAt: true,
				},
			}),
			getQueueStats(),
		]);

		const status = organizations.map((org) => ({
			...org,
			needsReport:
				org.autoReportsEnabled &&
				(!org.lastReportGeneratedAt || org.lastReportGeneratedAt < cutoffDate),
		}));

		return NextResponse.json({
			intervalDays: REPORT_INTERVAL_DAYS,
			organizations: status,
			queue: queueStats,
		});
	} catch (error: any) {
		console.error("Error fetching report status:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
