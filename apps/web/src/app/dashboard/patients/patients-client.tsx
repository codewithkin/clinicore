"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Mail, Phone, Calendar, MoreVertical, Eye, Trash2 } from "lucide-react";
import NewPatientModal from "@/components/new-patient-modal";
import ExportButton from "@/components/export-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

type Patient = {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    createdAt: Date;
    _count?: {
        appointments: number;
    };
};

type Props = {
    initialPatients: Patient[];
    organizationId?: string;
};

export default function PatientsClient({ initialPatients, organizationId }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [openNewPatient, setOpenNewPatient] = useState(false);
    const [patients, setPatients] = useState(initialPatients);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const router = useRouter();

    const filteredPatients = patients.filter((patient) => {
        const query = searchQuery.toLowerCase();
        return (
            patient.firstName.toLowerCase().includes(query) ||
            patient.lastName.toLowerCase().includes(query) ||
            patient.email?.toLowerCase().includes(query) ||
            patient.phone?.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handlePatientCreated = (newPatient: any) => {
        setPatients([newPatient, ...patients]);
    };

    const handleDeletePatient = async (patientId: string) => {
        if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
            return;
        }

        try {
            await axios.delete(`/api/patients/${patientId}`);
            setPatients(patients.filter(p => p.id !== patientId));
            toast.success("Patient deleted successfully");
        } catch (error) {
            console.error("Error deleting patient:", error);
            toast.error("Failed to delete patient");
        }
    };

    const handleViewDetails = (patientId: string) => {
        router.push(`/dashboard/patients/${patientId}`);
    };

    return (
        <div className="space-y-6 p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="text-gray-500 mt-1">
                        Manage patient records and information
                    </p>
                </div>
                <Button onClick={() => setOpenNewPatient(true)} className="bg-teal-600 hover:bg-teal-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    New Patient
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search patients by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Patients List */}
            <Card className="border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">All Patients</CardTitle>
                            <CardDescription className="text-sm text-gray-500 mt-0.5">
                                {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
                            </CardDescription>
                        </div>
                        <ExportButton
                            data={paginatedPatients}
                            allData={filteredPatients}
                            filename="patients"
                            title="Patients List"
                            columns={[
                                { header: "Name", accessor: (p) => `${p.firstName} ${p.lastName}` },
                                { header: "Email", accessor: (p) => p.email || "N/A" },
                                { header: "Phone", accessor: (p) => p.phone || "N/A" },
                                { header: "Date of Birth", accessor: (p) => p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-US") : "Not set" },
                                { header: "Appointments", accessor: (p) => p._count?.appointments || 0 },
                                { header: "Registered", accessor: (p) => new Date(p.createdAt).toLocaleDateString("en-US") },
                            ]}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredPatients.length === 0 ? (
                        <div className="py-12 text-center">
                            <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                                {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
                            </p>
                            {!searchQuery && (
                                <Button
                                    onClick={() => setOpenNewPatient(true)}
                                    variant="outline"
                                    className="mt-4"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Your First Patient
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Name
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Date of Birth
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Appointments
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Registered
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                                        <span className="text-sm font-semibold text-teal-700">
                                                            {patient.firstName[0]}{patient.lastName[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {patient.firstName} {patient.lastName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {patient.email && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="h-3 w-3 text-gray-400" />
                                                            {patient.email}
                                                        </div>
                                                    )}
                                                    {patient.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="h-3 w-3 text-gray-400" />
                                                            {patient.phone}
                                                        </div>
                                                    )}
                                                    {!patient.email && !patient.phone && (
                                                        <span className="text-sm text-gray-400">No contact info</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {patient.dateOfBirth ? (
                                                        <>
                                                            <Calendar className="h-3 w-3 text-gray-400" />
                                                            {new Date(patient.dateOfBirth).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric"
                                                            })}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">Not set</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {patient._count?.appointments || 0} {(patient._count?.appointments ?? 0) === 1 ? 'appointment' : 'appointments'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(patient.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleViewDetails(patient.id)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleDeletePatient(patient.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Patient
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
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

            <NewPatientModal
                open={openNewPatient}
                onClose={() => setOpenNewPatient(false)}
                onCreate={handlePatientCreated}
                organizationId={organizationId}
            />
        </div>
    );
}
