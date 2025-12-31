/**
 * Queue Worker Entry Point
 * 
 * Run this as a standalone process to process queue jobs.
 * Usage: bun run packages/queue/src/worker.ts
 */

import { createReportsWorker } from "./workers/reports.worker";
import { setupRecurringReportSchedule, getQueueStats } from "./queues/reports.queue";

console.log("🚀 Starting Clinicore Queue Worker...");

// Create workers
const reportsWorker = createReportsWorker();
console.log("✅ Reports worker started");

// Setup recurring schedule for reports (daily at 8 AM)
async function init() {
	try {
		await setupRecurringReportSchedule();
		console.log("✅ Recurring report schedule configured");

		// Log initial stats
		const stats = await getQueueStats();
		console.log("📊 Initial queue stats:", stats);
	} catch (error) {
		console.error("❌ Failed to setup recurring schedule:", error);
	}
}

init();

// Graceful shutdown
async function shutdown() {
	console.log("\n🛑 Shutting down workers...");
	await reportsWorker.close();
	console.log("👋 Workers closed. Goodbye!");
	process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Keep the process alive
console.log("🎧 Listening for jobs...");
