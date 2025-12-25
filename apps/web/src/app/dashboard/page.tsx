import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Users,
	Calendar,
	DollarSign,
	UserCheck,
	UserCog,
} from "lucide-react";
import StatItem from "@/components/stat-item";
import { getUserRole, isAdmin, getUserOrganization } from "@/lib/dashboard-helpers";
import { formatPrice } from "@/lib/formatters";
import { getStartOfToday, getStartOfTomorrow } from "@/utils/date-helpers";
import {
	getTotalPatients,
	getPatientsFromMonthsAgo,
	getRecentPatients,
	getTodayAppointmentsCount,
	getPendingAppointmentsCount,
	getPendingCheckIns,
	getStaffCount,
	getTodayAppointments,
	calculateGrowthPercentage,
	getMonthlyRevenue,
} from "@/utils/dashboard-stats";
import DashboardQuickActions from "./dashboard-quick-actions";
import ScheduleAppointmentClient from "@/components/schedule-appointment-client";
import AppointmentsTableClient from "./appointments-table-client";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	// Get user's organization and role
	const organizationId = await getUserOrganization(session.user.id);
	const userRole = organizationId
		? await getUserRole(session.user.id, organizationId)
		: "receptionist";

	const isAdminUser = isAdmin(userRole);

	// Fetch organization data for branding
	let organization = null;
	if (organizationId) {
		const { db } = await import("@my-better-t-app/db");
		organization = await db.organization.findUnique({
			where: { id: organizationId },
			select: { name: true, logo: true },
		});
	}
	const totalPatients = await getTotalPatients(organizationId);
	const lastMonthPatients = await getPatientsFromMonthsAgo(1, organizationId);
	const recentPatients = await getRecentPatients(1, organizationId);
	const todayAppointmentsCount = await getTodayAppointmentsCount(organizationId);
	const pendingAppointmentsCount = await getPendingAppointmentsCount(organizationId);
	const pendingCheckIns = await getPendingCheckIns(organizationId);

	// Get staff count and revenue (admin only)
	let activeStaffCount = 0;
	let monthlyRevenue = 0;
	if (isAdminUser && organizationId) {
		activeStaffCount = await getStaffCount(organizationId);
		monthlyRevenue = await getMonthlyRevenue(organizationId);
	}

	// Get today's appointments
	const appointments = await getTodayAppointments(organizationId, 10);

	// Get next appointment time for receptionist
	const now = new Date();
	const nextAppointment = appointments.find(apt => new Date(apt.time) > now);

	// Get latest patients
	const { db } = await import("@my-better-t-app/db");
	const latestPatients = organizationId ? await db.patient.findMany({
		where: { organizationId },
		orderBy: { createdAt: 'desc' },
		take: 5,
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			createdAt: true,
		}
	}) : [];

	// Calculate patient growth
	const patientGrowth = calculateGrowthPercentage(totalPatients, lastMonthPatients);
	// Role-based stats configuration
	const statsData = isAdminUser
		? [
			{
				label: "Total Patients",
				value: totalPatients.toLocaleString(),
				change: `+${patientGrowth}% vs last month`,
				trend: "up" as const,
				icon: Users,
				iconColor: "text-teal-600",
				iconBgColor: "bg-teal-50",
			},
			{
				label: "Today's Appointments",
				value: todayAppointmentsCount.toString(),
				change: `${pendingAppointmentsCount} pending`,
				trend: "neutral" as const,
				icon: Calendar,
				iconColor: "text-blue-600",
				iconBgColor: "bg-blue-50",
			},
			{
				label: "Monthly Revenue",
				value: formatPrice(monthlyRevenue),
				change: "+18% vs last month",
				trend: "up" as const,
				icon: DollarSign,
				iconColor: "text-green-600",
				iconBgColor: "bg-green-50",
			},
			{
				label: "Active Staff",
				value: activeStaffCount.toString(),
				change: "Total members",
				trend: "neutral" as const,
				icon: UserCog,
				iconColor: "text-purple-600",
				iconBgColor: "bg-purple-50",
			}
		]
		: [
			{
				label: "Today's Appointments",
				value: todayAppointmentsCount.toString(),
				change: nextAppointment
					? `Next at ${new Date(nextAppointment.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
					: "No more today",
				trend: "neutral" as const,
				icon: Calendar,
				iconColor: "text-teal-600",
				iconBgColor: "bg-teal-50",
			},
			{
				label: "Pending Check-ins",
				value: pendingCheckIns.toString(),
				change: pendingCheckIns > 0 ? "Overdue" : "All checked in",
				trend: "neutral" as const,
				icon: UserCheck,
				iconColor: "text-orange-600",
				iconBgColor: "bg-orange-50",
			},
			{
				label: "Total Patients",
				value: totalPatients.toLocaleString(),
				change: `${recentPatients} this week`,
				trend: "neutral" as const,
				icon: Users,
				iconColor: "text-blue-600",
				iconBgColor: "bg-blue-50",
			}
		];

	return (
		<div className="space-y-6 p-3 md:p-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
				<div>
					<div className="flex flex-col md:flex-row items-start md:items-center gap-3">
						{organization?.logo && (
							<img
								src={organization.logo}
								alt={organization.name || "Organization"}
								className="h-10 w-10 rounded-lg object-cover"
							/>
						)}
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-3xl font-bold text-gray-900">
									{organization?.name || "Dashboard"}
								</h1>
								<Badge className="text-xs">
									{isAdminUser ? "Admin" : "Receptionist"}
								</Badge>
							</div>
							<p className="text-gray-500 mt-1">
								{isAdminUser
									? "Manage your clinic operations and view analytics"
									: "Check-in patients and manage appointments"}
							</p>
						</div>
					</div>
				</div>
				<div className="flex gap-3">
					<DashboardQuickActions isAdmin={isAdminUser} organizationId={organizationId || undefined} />
				</div>
			</div>

			{/* Stats */}
			<div className="flex flex-wrap gap-8">
				{statsData.map((stat) => (
					<StatItem
						key={stat.label}
						icon={stat.icon}
						iconColor={stat.iconColor}
						iconBgColor={stat.iconBgColor}
						value={stat.value}
						label={stat.label}
						change={stat.change}
						trend={stat.trend}
					/>
				))}
			</div>

			{/* Appointments and Patients Section */}
			<div className="flex flex-col md:flex-row gap-4">
				{/* Appointments Table */}
				<AppointmentsTableClient
					appointments={appointments}
					organizationId={organizationId || undefined}
					isAdminUser={isAdminUser}
				/>

				{/* New Patients Card */}
				<Card className="border-gray-200 rounded-2xl overflow-hidden shadow-sm md:w-80">
					<CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
						<div className="flex items-center justify-between">
							<CardTitle className="text-lg font-semibold text-gray-900">New Patients</CardTitle>
							<Badge className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs">
								{latestPatients.length}
							</Badge>
						</div>
						<CardDescription className="text-sm text-gray-500 mt-0.5">
							Recently registered
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{latestPatients.length === 0 ? (
							<div className="py-12 text-center">
								<Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
								<p className="text-gray-500 text-sm">No patients yet</p>
							</div>
						) : (
							<div className="divide-y divide-gray-100">
								{latestPatients.map((patient) => (
									<div key={patient.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-gray-900 truncate">
													{patient.firstName} {patient.lastName}
												</p>
												<p className="text-xs text-gray-500 truncate mt-0.5">
													{patient.email || 'No email'}
												</p>
											</div>
											<div className="text-xs text-gray-400 whitespace-nowrap">
												{new Date(patient.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric"
												})}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
