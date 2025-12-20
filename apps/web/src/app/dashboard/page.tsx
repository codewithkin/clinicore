import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { authClient } from "@/lib/auth-client";
import ActiveOrganizationClient from "@/components/active-organization-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Users,
	Calendar,
	DollarSign,
	Activity,
	TrendingUp,
	Clock,
	ArrowUpRight
} from "lucide-react";
import { db } from "@my-better-t-app/db";

const recentAppointments = [
	{
		id: 1,
		patient: "Sarah Johnson",
		doctor: "Dr. Smith",
		time: "09:00 AM",
		type: "Consultation",
		status: "Completed"
	},
	{
		id: 2,
		patient: "Michael Chen",
		doctor: "Dr. Williams",
		time: "09:30 AM",
		type: "Follow-up",
		status: "Completed"
	},
	{
		id: 3,
		patient: "Emma Davis",
		doctor: "Dr. Smith",
		time: "10:00 AM",
		type: "Check-up",
		status: "In Progress"
	},
	{
		id: 4,
		patient: "James Wilson",
		doctor: "Dr. Brown",
		time: "10:30 AM",
		type: "Consultation",
		status: "Scheduled"
	},
	{
		id: 5,
		patient: "Olivia Martinez",
		doctor: "Dr. Williams",
		time: "11:00 AM",
		type: "Treatment",
		status: "Scheduled"
	},
	{
		id: 6,
		patient: "Noah Anderson",
		doctor: "Dr. Smith",
		time: "11:30 AM",
		type: "Follow-up",
		status: "Scheduled"
	}
];

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	// Fetch active organization server-side (if available) and log it
	try {
		// some SDKs return { data, error } shape, others return data directly
		const orgResult: any = await authClient.organization.getFullOrganization?.({
			fetchOptions: {
				headers: await headers(),
			},
		});

		const orgData = orgResult?.data ?? orgResult;
		const org = orgData?.organization ?? orgData?.organization?.id ? orgData.organization : orgData;
		console.log("Server: active organization:", org);
	} catch (err) {
		console.error("Failed to load organization server-side", err);
	}

	const { data: customerState } = await authClient.customer.state({
		fetchOptions: {
			headers: await headers(),
		},
	});

	// Fetch dashboard data
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const lastMonth = new Date();
	lastMonth.setMonth(lastMonth.getMonth() - 1);

	// Get stats
	const totalPatients = await db.patient.count();
	const lastMonthPatients = await db.patient.count({
		where: {
			createdAt: {
				lt: lastMonth,
			},
		},
	});

	const todayAppointmentsCount = await db.appointment.count({
		where: {
			time: {
				gte: today,
				lt: tomorrow,
			},
		},
	});

	const pendingAppointmentsCount = await db.appointment.count({
		where: {
			time: {
				gte: today,
				lt: tomorrow,
			},
			status: "scheduled",
		},
	});

	// Get today's appointments
	const appointments = await db.appointment.findMany({
		where: {
			time: {
				gte: today,
				lt: tomorrow,
			},
		},
		include: {
			patient: true,
		},
		orderBy: {
			time: "asc",
		},
		take: 10,
	});

	// Calculate patient growth
	const patientGrowth = lastMonthPatients > 0
		? ((totalPatients - lastMonthPatients) / lastMonthPatients * 100).toFixed(0)
		: "0";

	const statsData = [
		{
			title: "Total Patients",
			value: totalPatients.toLocaleString(),
			change: `+${patientGrowth}% from last month`,
			trend: "up",
			icon: Users,
			color: "text-white",
			bgColor: "bg-teal-600",
			borderColor: "border-teal-600"
		},
		{
			title: "Appointments Today",
			value: todayAppointmentsCount.toString(),
			change: `${pendingAppointmentsCount} pending confirmation`,
			trend: "neutral",
			icon: Calendar,
			color: "text-gray-700",
			bgColor: "bg-white",
			borderColor: "border-gray-200"
		},
		{
			title: "Monthly Revenue",
			value: "$45,230",
			change: "+18% from last month",
			trend: "up",
			icon: DollarSign,
			color: "text-gray-700",
			bgColor: "bg-white",
			borderColor: "border-gray-200"
		},
		{
			title: "Active Sessions",
			value: "8",
			change: "2 doctors available",
			trend: "neutral",
			icon: Activity,
			color: "text-gray-700",
			bgColor: "bg-white",
			borderColor: "border-gray-200"
		}
	];

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "in progress":
				return "bg-teal-100 text-teal-800";
			case "scheduled":
				return "bg-gray-100 text-gray-700";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const capitalizeStatus = (status: string) => {
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
					<p className="text-gray-500 mt-1">Plan, prioritize, and accomplish your tasks with ease.</p>
				</div>
				<div className="flex gap-3">
					<button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
						Import Data
					</button>
					<button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2">
						<span className="text-lg">+</span>
						Add Patient
					</button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{statsData.map((stat, index) => {
					const Icon = stat.icon;
					const isFirst = index === 0;
					return (
						<Card key={stat.title} className={`${isFirst ? stat.bgColor : "bg-white"} border ${stat.borderColor} rounded-2xl overflow-hidden hover:shadow-lg transition-shadow`}>
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

			{/* Appointments Table */}
			<Card className="border-gray-200 rounded-2xl overflow-hidden shadow-sm">
				<CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg font-semibold text-gray-900">Today's Appointments</CardTitle>
							<CardDescription className="text-sm text-gray-500 mt-0.5">
								Overview of scheduled and completed appointments
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
								<Clock className="h-3 w-3 mr-1.5" />
								{appointments.length} total
							</Badge>
							<button className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
								+ New
							</button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{appointments.length === 0 ? (
						<div className="py-12 text-center">
							<Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
							<p className="text-gray-500 text-sm">No appointments scheduled for today</p>
							<button className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
								Schedule Appointment
							</button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50/80 border-b border-gray-100">
									<tr>
										<th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
											Time
										</th>
										<th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
											Patient
										</th>
										<th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
											Doctor
										</th>
										<th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
											Type
										</th>
										<th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
											Status
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-100">
									{appointments.map((appointment) => (
										<tr
											key={appointment.id}
											className="hover:bg-gray-50/50 transition-colors group"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2.5">
													<div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
													<span className="text-sm font-medium text-gray-900">
														{new Date(appointment.time).toLocaleTimeString("en-US", {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{appointment.patient.firstName} {appointment.patient.lastName}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-700">
													{appointment.doctorName}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-600">
													{appointment.type}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge
													className={`${getStatusColor(appointment.status)} border-none font-medium px-2.5 py-1`}
												>
													{capitalizeStatus(appointment.status)}
												</Badge>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
