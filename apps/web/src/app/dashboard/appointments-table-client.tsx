"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import ScheduleAppointmentClient from "@/components/schedule-appointment-client";
import ExportButton from "@/components/export-button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

type Appointment = {
    id: string;
    time: Date;
    doctorName: string;
    type: string | null;
    status: string;
    patient: {
        firstName: string;
        lastName: string;
    };
};

type Props = {
    appointments: Appointment[];
    organizationId?: string;
    isAdminUser: boolean;
};

export default function AppointmentsTableClient({ appointments, organizationId, isAdminUser }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const now = new Date();

    const totalPages = Math.ceil(appointments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAppointments = appointments.slice(startIndex, endIndex);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "bg-green-100 text-green-800 border-green-200";
            case "in progress":
                return "bg-teal-100 text-teal-800 border-teal-200";
            case "scheduled":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "cancelled":
                return "bg-red-100 text-red-800 border-red-200";
            case "no-show":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "confirmed":
                return "bg-purple-100 text-purple-800 border-purple-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const capitalizeStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    return (
        <Card className="border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1">
            <CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Today's Appointments</CardTitle>
                        <CardDescription className="text-sm text-gray-500 mt-0.5">
                            Overview of scheduled and completed appointments
                        </CardDescription>
                    </div>
                    <div className="flex items-start md:items-center gap-2">
                        <Badge className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1">
                            <Clock className="h-3 w-3 mr-1.5" />
                            {appointments.length} total
                        </Badge>
                        <ExportButton
                            data={paginatedAppointments}
                            allData={appointments}
                            filename="appointments"
                            title="Today's Appointments"
                            columns={[
                                { header: "Time", accessor: (a) => new Date(a.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
                                { header: "Patient", accessor: (a) => `${a.patient.firstName} ${a.patient.lastName}` },
                                { header: "Doctor", accessor: (a) => a.doctorName },
                                { header: "Type", accessor: (a) => a.type || "N/A" },
                                { header: "Status", accessor: (a) => capitalizeStatus(a.status) },
                            ]}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {appointments.length === 0 ? (
                    <div className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No appointments scheduled for today</p>
                        <ScheduleAppointmentClient organizationId={organizationId} />
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
                                    {!isAdminUser && (
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Action
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginatedAppointments.map((appointment) => (
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
                                                className={`${getStatusColor(appointment.status)} border font-medium px-2.5 py-1`}
                                            >
                                                {capitalizeStatus(appointment.status)}
                                            </Badge>
                                        </td>
                                        {!isAdminUser && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {appointment.status === "scheduled" && new Date(appointment.time) <= now ? (
                                                    <button className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-md hover:bg-teal-700 transition-colors">
                                                        Check-in
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
            {totalPages > 1 && (
                <div className="border-t border-gray-100 px-6 py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i + 1}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(i + 1);
                                        }}
                                        isActive={currentPage === i + 1}
                                        className="cursor-pointer"
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                    }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </Card>
    );
}
