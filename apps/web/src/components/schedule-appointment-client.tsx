"use client";

import React, { useState } from "react";
import NewAppointmentModal from "./new-appointment-modal";

export default function ScheduleAppointmentClient({ organizationId }: { organizationId?: string }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
                Schedule Appointment
            </button>

            <NewAppointmentModal
                open={open}
                onClose={() => setOpen(false)}
                onCreate={(payload) => {
                    console.log("create appointment (frontend only):", payload);
                }}
                organizationId={organizationId}
            />
        </>
    );
}
