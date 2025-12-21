import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, MapPin, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getUserOrganization } from "@/lib/dashboard-helpers";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/auth/signup");
    }

    const organizationId = await getUserOrganization(session.user.id);

    // Fetch patient details
    if (!id) {
        redirect("/dashboard/patients");
    }

    const patient = await db.patient.findUnique({
        where: { id },
        include: {
            appointments: {
                orderBy: { time: "desc" },
                take: 10,
            },
        },
    });

    if (!patient || patient.organizationId !== organizationId) {
        redirect("/dashboard/patients");
    }

    return (
        <div className="space-y-6 p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/patients">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {patient.firstName} {patient.lastName}
                        </h1>
                        <p className="text-gray-500 mt-1">Patient Details</p>
                    </div>
                </div>
            </div>

            {/* Patient Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card className="lg:col-span-2 border-gray-200 rounded-2xl">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
                        <CardDescription>Patient's personal and contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">{patient.firstName} {patient.lastName}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">
                                        {patient.dateOfBirth
                                            ? new Date(patient.dateOfBirth).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : "Not set"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">{patient.email || "Not provided"}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phone</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">{patient.phone || "Not provided"}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-500">Address</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <p className="text-gray-900">{patient.address || "Not provided"}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="border-gray-200 rounded-2xl">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Appointments</label>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{patient.appointments.length}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Patient Since</label>
                                <p className="text-gray-900 mt-1">
                                    {new Date(patient.createdAt).toLocaleDateString("en-US", {
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Appointment History */}
            <Card className="border-gray-200 rounded-2xl">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-900">Appointment History</CardTitle>
                    <CardDescription>Recent appointments for this patient</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {patient.appointments.length === 0 ? (
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
                                    {patient.appointments.map((appointment) => (
                                        <tr key={appointment.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(appointment.time).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(appointment.time).toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{appointment.doctorName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{appointment.type || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    className={`
                                                        ${appointment.status === "completed" ? "bg-green-100 text-green-800 border-green-200" : ""}
                                                        ${appointment.status === "cancelled" ? "bg-red-100 text-red-800 border-red-200" : ""}
                                                        ${appointment.status === "scheduled" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
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
