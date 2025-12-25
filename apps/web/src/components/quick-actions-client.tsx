"use client";

import React, { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, UserPlus, CalendarPlus, Mail } from "lucide-react";
import NewPatientModal from "./new-patient-modal";
import NewAppointmentModalShared from "./new-appointment-modal-shared";

type Props = {
    isAdmin: boolean;
    organizationId?: string;
    onRefresh?: () => void;
};

export default function QuickActionsClient({ isAdmin, organizationId, onRefresh }: Props) {
    const [openPatient, setOpenPatient] = useState(false);
    const [openAppointment, setOpenAppointment] = useState(false);

    const handlePatientSuccess = () => {
        if (onRefresh) {
            onRefresh();
        }
    };

    const handleAppointmentSuccess = () => {
        if (onRefresh) {
            onRefresh();
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2">
                        <span className="text-lg">+</span>
                        Quick Actions
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setOpenPatient(true)} className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Add Patient</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenAppointment(true)} className="cursor-pointer">
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>Create Appointment</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Invite User</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <NewPatientModal
                open={openPatient}
                onClose={() => setOpenPatient(false)}
                onCreate={handlePatientSuccess}
                organizationId={organizationId}
            />

            {organizationId && (
                <NewAppointmentModalShared
                    open={openAppointment}
                    onClose={() => setOpenAppointment(false)}
                    organizationId={organizationId}
                    onSuccess={handleAppointmentSuccess}
                />
            )}
        </>
    );
}
