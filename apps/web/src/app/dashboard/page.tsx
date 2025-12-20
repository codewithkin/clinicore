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
	Clock
} from "lucide-react";

// Sample data - in production this would come from your database
const statsData = [
	{
		title: "Total Patients",
		value: "1,234",
		change: "+12% from last month",
		trend: "up",
		icon: Users,
		color: "text-teal-600",
		bgColor: "bg-teal-50"
	},
	{
		title: "Appointments Today",
		value: "23",
		change: "5 pending confirmation",
		trend: "neutral",
		icon: Calendar,
		color: "text-blue-600",
		bgColor: "bg-blue-50"
	},
	{
		title: "Monthly Revenue",
		value: "$45,230",
		change: "+18% from last month",
		trend: "up",
		icon: DollarSign,
		color: "text-orange-600",
		bgColor: "bg-orange-50"
	},
	{
		title: "Active Sessions",
		value: "8",
		change: "2 doctors available",
		trend: "neutral",
		icon: Activity,
		color: "text-green-600",
		bgColor: "bg-green-50"
	}
];

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

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Completed":
				return "bg-green-100 text-green-800";
			case "In Progress":
				return "bg-blue-100 text-blue-800";
			case "Scheduled":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
				<p className="text-gray-600 mt-2">Welcome back, {session.user.name}! Here's what's happening today.</p>
			</div>

			{/* Organization Info */}
			<div className="bg-white rounded-lg border border-gray-200 p-4">
				<ActiveOrganizationClient />
			</div>

			{/* Stats Cards */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{statsData.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card key={stat.title} className="border-gray-200">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-gray-700">
									{stat.title}
								</CardTitle>
								<div className={`p-2 rounded-lg ${stat.bgColor}`}>
									<Icon className={`h-4 w-4 ${stat.color}`} />
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-gray-900">{stat.value}</div>
								<p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
									{stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
									{stat.change}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Recent Appointments Table */}
			<Card className="border-gray-200">
				<CardHeader className="border-b border-gray-200 bg-gray-50/50">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-gray-900">Today's Appointments</CardTitle>
							<CardDescription className="text-gray-600">
								Overview of scheduled and completed appointments
							</CardDescription>
						</div>
						<Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
							<Clock className="h-3 w-3 mr-1" />
							{recentAppointments.length} total
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Time
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Patient
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Doctor
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{recentAppointments.map((appointment) => (
									<tr
										key={appointment.id}
										className="hover:bg-gray-50 transition-colors"
									>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center gap-2">
												<Clock className="h-4 w-4 text-gray-400" />
												<span className="text-sm font-medium text-gray-900">
													{appointment.time}
												</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{appointment.patient}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-700">
												{appointment.doctor}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-600">
												{appointment.type}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<Badge
												className={`${getStatusColor(appointment.status)} border-none`}
											>
												{appointment.status}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<div className="grid gap-6 md:grid-cols-3">
				<Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white hover:shadow-md transition-shadow cursor-pointer">
					<CardHeader>
						<CardTitle className="text-teal-900 flex items-center gap-2">
							<Users className="h-5 w-5" />
							Add New Patient
						</CardTitle>
						<CardDescription className="text-teal-700">
							Register a new patient to your clinic
						</CardDescription>
					</CardHeader>
				</Card>

				<Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow cursor-pointer">
					<CardHeader>
						<CardTitle className="text-blue-900 flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Schedule Appointment
						</CardTitle>
						<CardDescription className="text-blue-700">
							Book a new appointment slot
						</CardDescription>
					</CardHeader>
				</Card>

				<Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow cursor-pointer">
					<CardHeader>
						<CardTitle className="text-orange-900 flex items-center gap-2">
							<Activity className="h-5 w-5" />
							View Reports
						</CardTitle>
						<CardDescription className="text-orange-700">
							Access clinic analytics and reports
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
