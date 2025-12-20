"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreate?: (data: any) => void;
};

export default function NewAppointmentModal({ open, onClose, onCreate }: Props) {
    const [patientName, setPatientName] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("");

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { patientName, doctorName, time, type };
        onCreate?.(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">New Appointment</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input required value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Patient name" className="w-full px-3 py-2 border rounded" />
                    <input required value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Doctor name" className="w-full px-3 py-2 border rounded" />
                    <input required type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 border rounded" />
                    <input value={type} onChange={e => setType(e.target.value)} placeholder="Type (e.g., Consultation)" className="w-full px-3 py-2 border rounded" />
                    <div className="flex justify-end gap-2 mt-3">
                        <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2">Cancel</Button>
                        <Button type="submit" className="px-4 py-2">Create</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
