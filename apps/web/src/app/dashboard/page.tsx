import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	Users,
	Calendar,
	DollarSign,
	TrendingUp,
	Clock,
	ArrowUpRight,
	UserCheck,
	UserCog,
	ChevronDown,
	UserPlus,
	CalendarPlus,
	Mail
} from "lucide-react";
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
				title: "Total Patients",
				value: totalPatients.toLocaleString(),
				change: `+${patientGrowth}% from last month`,
				trend: "up" as const,
				icon: Users,
				color: "text-white",
				bgColor: "bg-teal-600",
				borderColor: "border-teal-600"
			},
			{
				title: "Appointments Today",
				value: todayAppointmentsCount.toString(),
				change: `${pendingAppointmentsCount} pending confirmation`,
				trend: "neutral" as const,
				icon: Calendar,
				color: "text-gray-700",
				bgColor: "bg-white",
				borderColor: "border-gray-200"
			},
			{
				title: "Monthly Revenue",
				value: formatPrice(monthlyRevenue),
				change: "+18% from last month",
				trend: "up" as const,
				icon: DollarSign,
				color: "text-gray-700",
				bgColor: "bg-white",
				borderColor: "border-gray-200"
			},
			{
				title: "Active Staff",
				value: activeStaffCount.toString(),
				change: "Total staff members",
				trend: "neutral" as const,
				icon: UserCog,
				color: "text-gray-700",
				bgColor: "bg-white",
				borderColor: "border-gray-200"
			}
		]
		: [
			{
				title: "Today's Appointments",
				value: todayAppointmentsCount.toString(),
				change: nextAppointment
					? `Next at ${new Date(nextAppointment.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
					: "No more today",
				trend: "neutral" as const,
				icon: Calendar,
				color: "text-white",
				bgColor: "bg-teal-600",
				borderColor: "border-teal-600"
			},
			{
				title: "Pending Check-ins",
				value: pendingCheckIns.toString(),
				change: pendingCheckIns > 0 ? "Overdue check-ins" : "All checked in",
				trend: "neutral" as const,
				icon: UserCheck,
				color: "text-gray-700",
				bgColor: "bg-white",
				borderColor: "border-gray-200"
			},
			{
				title: "Total Patients",
				value: totalPatients.toLocaleString(),
				change: `${recentPatients} registered this week`,
				trend: "neutral" as const,
				icon: Users,
				color: "text-gray-700",
				bgColor: "bg-white",
				borderColor: "border-gray-200"
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

			{/* Stats Cards */}
			<div className="flex flex-wrap gap-4">
				{statsData.map((stat, index) => {
					const Icon = stat.icon;
					const isFirst = index === 0;
					return (
						<Card key={stat.title} className={`${isFirst ? stat.bgColor : "bg-white"} border ${stat.borderColor} rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex-1 min-w-[200px]`}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className={`text-sm font-medium ${isFirst ? "text-white/90" : "text-gray-600"}`}>
									{stat.title}
								</CardTitle>
								<button className={`p-2 rounded-full ${isFirst ? "bg-white/20" : "bg-gray-100"} hover:scale-110 transition-transform`}>
									<ArrowUpRight className={`h-4 w-4 ${isFirst ? "text-white" : "text-gray-700"}`} />
								</button>
							</CardHeader>
							<CardContent className="space-y-1">
								<div className={`text-3xl font-bold ${isFirst ? "text-white" : "text-gray-900"}`}>
									{stat.value}
								</div>
								<div className="flex items-center gap-1.5">
									{stat.trend === "up" && (
										<div className={`flex items-center gap-1 text-xs ${isFirst ? "text-white/80" : "text-green-600"}`}>
											<TrendingUp className="h-3 w-3" />
											{isFirst ? "Increased from last month" : stat.change}
										</div>
									)}
									{stat.trend !== "up" && (
										<p className={`text-xs ${isFirst ? "text-white/80" : "text-gray-500"}`}>
											{stat.change}
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
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
