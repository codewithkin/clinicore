import { Worker, type Job } from "bullmq";
import { redisConnection, QUEUE_NAMES } from "../config";
import type { ClinicReportJobData, ReportJobData, ScheduleReportsJobData } from "../queues/reports.queue";
import { addReportJob } from "../queues/reports.queue";

// Default report interval in days
const REPORT_INTERVAL_DAYS = parseInt(process.env.CLINIC_REPORT_INTERVAL_DAYS || "3", 10);

// Worker processor function
async function processReportJob(job: Job<ReportJobData>) {
	// Dynamic import to avoid circular dependencies
	const { db } = await import("@my-better-t-app/db");
	const { sendClinicReport } = await import("@my-better-t-app/auth");

	// Check if this is a schedule-all job
	if ("type" in job.data && job.data.type === "schedule-all") {
		return processScheduleAllJob(job as unknown as Job<ScheduleReportsJobData>, db);
	}

	// Process individual organization report
	const data = job.data as ClinicReportJobData;
	
	job.updateProgress(10);
	console.log(`[ReportWorker] Processing report for org: ${data.organizationName}`);

	const now = new Date();
	const intervalMs = data.periodDays * 24 * 60 * 60 * 1000;
	const periodStart = new Date(now.getTime() - intervalMs);
	const periodEnd = now;

	job.updateProgress(20);

	// Gather report data
	const [
		totalPatients,
		newPatientsThisPeriod,
		totalAppointments,
		appointmentsThisPeriod,
		completedAppointments,
		cancelledAppointments,
		noShowAppointments,
	] = await Promise.all([
		db.patient.count({
			where: { organizationId: data.organizationId },
		}),
		db.patient.count({
			where: {
				organizationId: data.organizationId,
				createdAt: { gte: periodStart },
			},
		}),
		db.appointment.count({
			where: { patient: { organizationId: data.organizationId } },
		}),
		db.appointment.count({
			where: {
				patient: { organizationId: data.organizationId },
				time: { gte: periodStart, lte: periodEnd },
			},
		}),
		db.appointment.count({
			where: {
				patient: { organizationId: data.organizationId },
				time: { gte: periodStart, lte: periodEnd },
				status: "completed",
			},
		}),
		db.appointment.count({
			where: {
				patient: { organizationId: data.organizationId },
				time: { gte: periodStart, lte: periodEnd },
				status: "cancelled",
			},
		}),
		db.appointment.count({
			where: {
				patient: { organizationId: data.organizationId },
				time: { gte: periodStart, lte: periodEnd },
				status: "no-show",
			},
		}),
	]);

	job.updateProgress(60);

	const completionRate = appointmentsThisPeriod > 0
		? ((completedAppointments / appointmentsThisPeriod) * 100).toFixed(1)
		: "0";

	const noShowRate = appointmentsThisPeriod > 0
		? ((noShowAppointments / appointmentsThisPeriod) * 100).toFixed(1)
		: "0";

	// Get admin names for personalization
	const adminMembers = await db.member.findMany({
		where: {
			organizationId: data.organizationId,
			role: "admin",
		},
		include: {
			user: true,
		},
	});

	job.updateProgress(70);

	// Send report to all admins
	const results = [];
	for (const admin of adminMembers) {
		if (!admin.user.email) continue;

		try {
			await sendClinicReport({
				to: admin.user.email,
				adminName: admin.user.name || "Admin",
				clinicName: data.organizationName,
				reportData: {
					totalPatients,
					newPatientsThisPeriod,
					totalAppointments,
					appointmentsThisPeriod,
					completedAppointments,
					cancelledAppointments,
					noShowAppointments,
					completionRate,
					noShowRate,
					periodDays: data.periodDays,
				},
				periodStart,
				periodEnd,
			});
			results.push({ email: admin.user.email, status: "sent" });
		} catch (error: any) {
			results.push({ email: admin.user.email, status: "failed", error: error.message });
		}
	}

	job.updateProgress(90);

	// Update last report generated timestamp
	await db.organization.update({
		where: { id: data.organizationId },
		data: { lastReportGeneratedAt: now },
	});

	job.updateProgress(100);

	console.log(`[ReportWorker] Completed report for org: ${data.organizationName}`);
	
	return {
		organizationId: data.organizationId,
		organizationName: data.organizationName,
		emailsSent: results.filter(r => r.status === "sent").length,
		emailsFailed: results.filter(r => r.status === "failed").length,
		results,
	};
}

// Process schedule-all job - finds orgs needing reports and queues individual jobs
async function processScheduleAllJob(job: Job<ScheduleReportsJobData>, db: any) {
	console.log("[ReportWorker] Scheduling reports for all organizations...");
	
	job.updateProgress(10);

	const now = new Date();
	const intervalMs = REPORT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
	const cutoffDate = new Date(now.getTime() - intervalMs);

	// Find organizations that need reports
	const organizationsNeedingReports = await db.organization.findMany({
		where: {
			autoReportsEnabled: true,
			OR: [
				{ lastReportGeneratedAt: null },
				{ lastReportGeneratedAt: { lt: cutoffDate } },
			],
		},
		include: {
			members: {
				where: { role: "admin" },
				include: { user: true },
			},
		},
	});

	job.updateProgress(50);

	const queuedJobs = [];
	for (const org of organizationsNeedingReports) {
		const adminEmails = org.members
			.map((m: any) => m.user.email)
			.filter((email: string | null): email is string => !!email);

		if (adminEmails.length === 0) {
			console.log(`[ReportWorker] Skipping org ${org.id}: No admin emails`);
			continue;
		}

		// Add individual report job to queue
		const queuedJob = await addReportJob({
			organizationId: org.id,
			organizationName: org.name,
			adminEmails,
			periodDays: REPORT_INTERVAL_DAYS,
		});

		queuedJobs.push({
			organizationId: org.id,
			organizationName: org.name,
			jobId: queuedJob.id,
		});
	}

	job.updateProgress(100);

	console.log(`[ReportWorker] Queued ${queuedJobs.length} report jobs`);

	return {
		totalOrganizations: organizationsNeedingReports.length,
		jobsQueued: queuedJobs.length,
		jobs: queuedJobs,
	};
}

// Create the worker
export function createReportsWorker() {
	const worker = new Worker<ReportJobData>(
		QUEUE_NAMES.CLINIC_REPORTS,
		processReportJob,
		{
			connection: redisConnection,
			concurrency: 5, // Process up to 5 reports concurrently
		}
	);

	worker.on("completed", (job, result) => {
		console.log(`[ReportWorker] Job ${job.id} completed:`, result);
	});

	worker.on("failed", (job, error) => {
		console.error(`[ReportWorker] Job ${job?.id} failed:`, error.message);
	});

	worker.on("error", (error) => {
		console.error("[ReportWorker] Worker error:", error);
	});

	return worker;
}

export { processReportJob };
