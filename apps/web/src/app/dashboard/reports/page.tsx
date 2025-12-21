import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	TrendingUp,
	TrendingDown,
	Users,
	Calendar,
	DollarSign,
	Activity,
	Clock,
	UserCheck
} from "lucide-react";
import { getUserOrganization } from "@/lib/dashboard-helpers";
import { formatPrice } from "@/lib/formatters";
import { db } from "@my-better-t-app/db";
import ExportButton from "@/components/export-button";

export default async function ReportsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/auth/signup");
	}

	const organizationId = await getUserOrganization(session.user.id);

	// Get current month data
	const now = new Date();
	const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	// Total patients
	const totalPatients = organizationId ? await db.patient.count({
		where: { organizationId }
	}) : 0;

	// Patients this month
	const patientsThisMonth = organizationId ? await db.patient.count({
		where: {
			organizationId,
			createdAt: { gte: firstDayOfMonth }
		}
	}) : 0;

	// Patients last month
	const patientsLastMonth = organizationId ? await db.patient.count({
		where: {
			organizationId,
			createdAt: {
				gte: firstDayOfLastMonth,
				lt: firstDayOfCurrentMonth
			}
		}
	}) : 0;

	// Total appointments
	const totalAppointments = organizationId ? await db.appointment.count({
		where: { patient: { organizationId } }
	}) : 0;

	// Appointments this month
	const appointmentsThisMonth = organizationId ? await db.appointment.count({
		where: {
			patient: { organizationId },
			time: { gte: firstDayOfMonth }
		}
	}) : 0;

	// Appointments last month
	const appointmentsLastMonth = organizationId ? await db.appointment.count({
		where: {
			patient: { organizationId },
			time: {
				gte: firstDayOfLastMonth,
				lt: firstDayOfCurrentMonth
			}
		}
	}) : 0;

	// Appointment status breakdown (all time)
	const completedAppointments = organizationId ? await db.appointment.count({
		where: { patient: { organizationId }, status: "completed" }
	}) : 0;

	const cancelledAppointments = organizationId ? await db.appointment.count({
		where: { patient: { organizationId }, status: "cancelled" }
	}) : 0;

	const noShowAppointments = organizationId ? await db.appointment.count({
		where: { patient: { organizationId }, status: "no-show" }
	}) : 0;

	// Calculate growth percentages
	const patientGrowth = patientsLastMonth > 0
		? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth * 100).toFixed(1)
		: "0";

	const appointmentGrowth = appointmentsLastMonth > 0
		? ((appointmentsThisMonth - appointmentsLastMonth) / appointmentsLastMonth * 100).toFixed(1)
		: "0";

	// Calculate completion rate
	const completionRate = totalAppointments > 0
		? ((completedAppointments / totalAppointments) * 100).toFixed(1)
		: "0";

	// Calculate no-show rate
	const noShowRate = totalAppointments > 0
		? ((noShowAppointments / totalAppointments) * 100).toFixed(1)
		: "0";

	// Recent activity - last 10 appointments
	const recentAppointments = organizationId ? await db.appointment.findMany({
		where: { patient: { organizationId } },
		take: 10,
		orderBy: { time: 'desc' },
		include: {
			patient: {
				select: {
					firstName: true,
					lastName: true
				}
			}
		}
	}) : [];

	return (
		<div className="space-y-6 p-3 md:p-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
					<p className="text-gray-500 mt-1">
						Track your clinic's performance and key metrics
					</p>
				</div>
				<ExportButton
					data={[
						["Total Patients", totalPatients.toString()],
						["Patients This Month", patientsThisMonth.toString()],
						["Patients Last Month", patientsLastMonth.toString()],
						["Patient Growth", `${patientGrowth}%`],
						["", ""],
						["Total Appointments", totalAppointments.toString()],
						["Appointments This Month", appointmentsThisMonth.toString()],
						["Appointments Last Month", appointmentsLastMonth.toString()],
						["Appointment Growth", `${appointmentGrowth}%`],
						["", ""],
						["Completed Appointments", completedAppointments.toString()],
						["Cancelled Appointments", cancelledAppointments.toString()],
						["No-Show Appointments", noShowAppointments.toString()],
						["Completion Rate", `${completionRate}%`],
						["No-Show Rate", `${noShowRate}%`],
						["", ""],
						...recentAppointments.map(apt => [
							`${new Date(apt.time).toLocaleDateString()} - ${apt.patient.firstName} ${apt.patient.lastName}`,
							`${apt.doctorName} | ${apt.type || "N/A"} | ${apt.status}`
						] as [string, string])
					]}
					allData={[
						["Total Patients", totalPatients.toString()],
						["Patients This Month", patientsThisMonth.toString()],
						["Patients Last Month", patientsLastMonth.toString()],
						["Patient Growth", `${patientGrowth}%`],
						["", ""],
						["Total Appointments", totalAppointments.toString()],
						["Appointments This Month", appointmentsThisMonth.toString()],
						["Appointments Last Month", appointmentsLastMonth.toString()],
						["Appointment Growth", `${appointmentGrowth}%`],
						["", ""],
						["Completed Appointments", completedAppointments.toString()],
						["Cancelled Appointments", cancelledAppointments.toString()],
						["No-Show Appointments", noShowAppointments.toString()],
						["Completion Rate", `${completionRate}%`],
						["No-Show Rate", `${noShowRate}%`],
						["", ""],
						...recentAppointments.map(apt => [
							`${new Date(apt.time).toLocaleDateString()} - ${apt.patient.firstName} ${apt.patient.lastName}`,
							`${apt.doctorName} | ${apt.type || "N/A"} | ${apt.status}`
						] as [string, string])
					]}
					filename={`clinic-report-${new Date().toISOString().split('T')[0]}`}
					headers={["Metric", "Value"]}
					title="Clinic Analytics Report"
				/>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border-gray-200 rounded-2xl">
					<CardHeader className="pb-2">
						<CardDescription className="text-gray-600">Total Patients</CardDescription>
						<CardTitle className="text-3xl font-bold text-gray-900">{totalPatients}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-1.5">
							{parseFloat(patientGrowth) >= 0 ? (
								<>
									<TrendingUp className="h-4 w-4 text-green-600" />
									<span className="text-sm text-green-600 font-medium">+{patientGrowth}%</span>
								</>
							) : (
								<>
									<TrendingDown className="h-4 w-4 text-red-600" />
									<span className="text-sm text-red-600 font-medium">{patientGrowth}%</span>
								</>
							)}
							<span className="text-sm text-gray-500 ml-1">vs last month</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-gray-200 rounded-2xl">
					<CardHeader className="pb-2">
						<CardDescription className="text-gray-600">Total Appointments</CardDescription>
						<CardTitle className="text-3xl font-bold text-gray-900">{totalAppointments}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-1.5">
							{parseFloat(appointmentGrowth) >= 0 ? (
								<>
									<TrendingUp className="h-4 w-4 text-green-600" />
									<span className="text-sm text-green-600 font-medium">+{appointmentGrowth}%</span>
								</>
							) : (
								<>
									<TrendingDown className="h-4 w-4 text-red-600" />
									<span className="text-sm text-red-600 font-medium">{appointmentGrowth}%</span>
								</>
							)}
							<span className="text-sm text-gray-500 ml-1">vs last month</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-gray-200 rounded-2xl">
					<CardHeader className="pb-2">
						<CardDescription className="text-gray-600">Completion Rate</CardDescription>
						<CardTitle className="text-3xl font-bold text-gray-900">{completionRate}%</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-1.5">
							<UserCheck className="h-4 w-4 text-blue-600" />
							<span className="text-sm text-gray-500">{completedAppointments} completed</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border-gray-200 rounded-2xl">
					<CardHeader className="pb-2">
						<CardDescription className="text-gray-600">No-Show Rate</CardDescription>
						<CardTitle className="text-3xl font-bold text-gray-900">{noShowRate}%</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-1.5">
							<Activity className="h-4 w-4 text-orange-600" />
							<span className="text-sm text-gray-500">{noShowAppointments} no-shows</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Monthly Comparison */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="border-gray-200 rounded-2xl">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-gray-900">Monthly Patient Growth</CardTitle>
						<CardDescription className="text-sm text-gray-500">
							Comparison between current and previous month
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-3 h-3 rounded-full bg-teal-600"></div>
									<span className="text-sm text-gray-700">This Month</span>
								</div>
								<span className="text-lg font-semibold text-gray-900">{patientsThisMonth}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-3 h-3 rounded-full bg-gray-300"></div>
									<span className="text-sm text-gray-700">Last Month</span>
								</div>
								<span className="text-lg font-semibold text-gray-900">{patientsLastMonth}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-gray-200 rounded-2xl">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-gray-900">Monthly Appointments</CardTitle>
						<CardDescription className="text-sm text-gray-500">
							Comparison between current and previous month
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-3 h-3 rounded-full bg-blue-600"></div>
									<span className="text-sm text-gray-700">This Month</span>
								</div>
								<span className="text-lg font-semibold text-gray-900">{appointmentsThisMonth}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-3 h-3 rounded-full bg-gray-300"></div>
									<span className="text-sm text-gray-700">Last Month</span>
								</div>
								<span className="text-lg font-semibold text-gray-900">{appointmentsLastMonth}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Appointment Status Breakdown */}
			<Card className="border-gray-200 rounded-2xl">
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-gray-900">Appointment Status Breakdown</CardTitle>
					<CardDescription className="text-sm text-gray-500">
						All-time appointment statistics
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
							<div>
								<p className="text-sm text-gray-600 mb-1">Completed</p>
								<p className="text-2xl font-bold text-gray-900">{completedAppointments}</p>
							</div>
							<UserCheck className="h-8 w-8 text-green-600" />
						</div>
						<div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
							<div>
								<p className="text-sm text-gray-600 mb-1">Cancelled</p>
								<p className="text-2xl font-bold text-gray-900">{cancelledAppointments}</p>
							</div>
							<Calendar className="h-8 w-8 text-red-600" />
						</div>
						<div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
							<div>
								<p className="text-sm text-gray-600 mb-1">No-Show</p>
								<p className="text-2xl font-bold text-gray-900">{noShowAppointments}</p>
							</div>
							<Activity className="h-8 w-8 text-orange-600" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card className="border-gray-200 rounded-2xl">
				<CardHeader>
					<CardTitle className="text-lg font-semibold text-gray-900">Recent Appointments</CardTitle>
					<CardDescription className="text-sm text-gray-500">
						Latest 10 appointments across all statuses
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{recentAppointments.length === 0 ? (
						<div className="py-12 text-center">
							<Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
							<p className="text-gray-500 text-sm">No appointments yet</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50/80 border-b border-gray-100">
									<tr>
										<th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
											Date & Time
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
									{recentAppointments.map((appointment) => (
										<tr key={appointment.id} className="hover:bg-gray-50/50 transition-colors">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">
													{new Date(appointment.time).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric"
													})}
												</div>
												<div className="text-xs text-gray-500">
													{new Date(appointment.time).toLocaleTimeString("en-US", {
														hour: "2-digit",
														minute: "2-digit"
													})}
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
													{appointment.type || "N/A"}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge
													className={`
														${appointment.status === "completed" ? "bg-green-100 text-green-800 border-green-200" : ""}
														${appointment.status === "cancelled" ? "bg-red-100 text-red-800 border-red-200" : ""}
														${appointment.status === "no-show" ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
														${appointment.status === "scheduled" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
														${appointment.status === "confirmed" ? "bg-purple-100 text-purple-800 border-purple-200" : ""}
														${appointment.status === "in progress" ? "bg-teal-100 text-teal-800 border-teal-200" : ""}
														border font-medium px-2.5 py-1
													`}
												>
													{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
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
