import { ConnectionOptions } from "bullmq";

// Redis connection configuration for BullMQ
export const redisConnection: ConnectionOptions = {
	host: process.env.REDIS_HOST || "localhost",
	port: parseInt(process.env.REDIS_PORT || "6379", 10),
	password: process.env.REDIS_PASSWORD || undefined,
	maxRetriesPerRequest: null,
};

// Queue names
export const QUEUE_NAMES = {
	CLINIC_REPORTS: "clinic-reports",
	EMAIL_NOTIFICATIONS: "email-notifications",
} as const;

// Default job options
export const DEFAULT_JOB_OPTIONS = {
	attempts: 3,
	backoff: {
		type: "exponential" as const,
		delay: 1000,
	},
	removeOnComplete: {
		count: 100,
		age: 24 * 60 * 60, // 24 hours
	},
	removeOnFail: {
		count: 500,
	},
};
