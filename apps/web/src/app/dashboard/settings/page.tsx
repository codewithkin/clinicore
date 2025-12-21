import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { getUserOrganization } from "@/lib/dashboard-helpers";
import plans from "@/data/plans";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	const organizationId = await getUserOrganization(session.user.id);

	if (!organizationId) {
		redirect("/auth/onboarding");
	}

	// Fetch organization data and user
	const organization = await db.organization.findUnique({
		where: { id: organizationId },
		select: {
			id: true,
			name: true,
			metadata: true,
			members: {
				select: {
					role: true,
					user: {
						select: {
							wanted_plan: true,
						},
					},
				},
			},
		},
	});

	if (!organization) {
		redirect("/auth/onboarding");
	}

	// Count patients
	const patientCount = await db.patient.count({
		where: { organizationId },
	});

	// Count appointments this month (for email usage approximation)
	const now = new Date();
	const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const appointmentsThisMonth = await db.appointment.count({
		where: {
			patient: { organizationId },
			createdAt: { gte: firstDayOfMonth },
		},
	});

	// Calculate seat usage
	const doctors = organization.members.filter((m) => m.role === "doctor").length;
	const receptionists = organization.members.filter((m) => m.role === "receptionist").length;
	const totalSeats = doctors + receptionists;

	// Get plan details (use wanted_plan from first admin user, or default to starter)
	const adminMember = organization.members.find((m) => m.role === "admin");
	const currentPlanId = (adminMember?.user.wanted_plan as "starter" | "small_clinic" | "growing_clinic" | null) || "starter";
	const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[0];

	// Calculate approximate email usage (2 emails per appointment: confirmation + reminder)
	const estimatedEmailsThisMonth = appointmentsThisMonth * 2;

	// Mock storage usage (would need actual file storage tracking)
	const storageUsedGB = 8.3;

	// Parse settings from metadata
	const settings = organization.metadata ? JSON.parse(organization.metadata) : {};

	return (
		<div className="space-y-6 p-3 md:p-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Settings</h1>
				<p className="text-gray-500 mt-1">
					Manage billing, scheduling preferences, and notification settings
				</p>
			</div>

			<SettingsClient
				organizationName={organization.name}
				currentPlan={currentPlan}
				usage={{
					seats: {
						used: totalSeats,
						limit: currentPlan.limits.doctors + currentPlan.limits.receptionists,
					},
					patients: {
						used: patientCount,
						limit: currentPlan.limits.patients,
					},
					emails: {
						used: estimatedEmailsThisMonth,
						limit: currentPlan.limits.emailsPerMonth,
					},
					storage: {
						used: storageUsedGB,
						limit: currentPlan.limits.storageGB,
					},
				}}
				schedulingSettings={settings.scheduling}
				notificationSettings={settings.notifications}
			/>
		</div>
	);
}
