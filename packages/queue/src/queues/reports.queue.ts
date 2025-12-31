import { Queue } from "bullmq";
import { redisConnection, QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from "./config";

// Report job data types
export interface ClinicReportJobData {
	organizationId: string;
	organizationName: string;
	adminEmails: string[];
	periodDays: number;
}

export interface ScheduleReportsJobData {
	type: "schedule-all";
}

export type ReportJobData = ClinicReportJobData | ScheduleReportsJobData;

// Create the clinic reports queue
export const clinicReportsQueue = new Queue<ReportJobData>(
	QUEUE_NAMES.CLINIC_REPORTS,
	{
		connection: redisConnection,
		defaultJobOptions: DEFAULT_JOB_OPTIONS,
	}
);

// Add a single organization report job
export async function addReportJob(data: ClinicReportJobData) {
	return clinicReportsQueue.add(
		`report-${data.organizationId}`,
		data,
		{
			jobId: `report-${data.organizationId}-${Date.now()}`,
		}
	);
}

// Schedule report generation for all organizations
export async function scheduleAllReports() {
	return clinicReportsQueue.add(
		"schedule-all-reports",
		{ type: "schedule-all" } as ScheduleReportsJobData,
		{
			jobId: `schedule-all-${Date.now()}`,
		}
	);
}

// Add recurring job to check and generate reports daily
export async function setupRecurringReportSchedule() {
	// Remove existing repeatable jobs first
	const repeatableJobs = await clinicReportsQueue.getRepeatableJobs();
	for (const job of repeatableJobs) {
		if (job.name === "daily-report-check") {
			await clinicReportsQueue.removeRepeatableByKey(job.key);
		}
	}

	// Add new repeatable job - runs daily at 8 AM
	return clinicReportsQueue.add(
		"daily-report-check",
		{ type: "schedule-all" } as ScheduleReportsJobData,
		{
			repeat: {
				pattern: "0 8 * * *", // Every day at 8 AM
			},
			jobId: "daily-report-check",
		}
	);
}

// Get queue statistics
export async function getQueueStats() {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		clinicReportsQueue.getWaitingCount(),
		clinicReportsQueue.getActiveCount(),
		clinicReportsQueue.getCompletedCount(),
		clinicReportsQueue.getFailedCount(),
		clinicReportsQueue.getDelayedCount(),
	]);

	return { waiting, active, completed, failed, delayed };
}
