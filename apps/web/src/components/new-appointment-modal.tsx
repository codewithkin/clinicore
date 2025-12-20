"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreate?: (data: any) => void;
    organizationId?: string;
};

type Patient = {
    id: string;
    firstName: string;
    lastName: string;
};

export default function NewAppointmentModal({ open, onClose, onCreate, organizationId }: Props) {
    const [patientId, setPatientId] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctorName, setDoctorName] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("");

    useEffect(() => {
        if (open && organizationId) {
            fetch(`/api/patients?organizationId=${organizationId}`)
                .then(res => res.json())
                .then(data => setPatients(data.patients || []))
                .catch(err => console.error("Failed to fetch patients:", err));
        }
    }, [open, organizationId]);

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            alert("Please select a patient");
            return;
        }
        const payload = { patientId, doctorName, time, type };
        onCreate?.(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">New Appointment</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="w-full">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Patient</label>
                        <select
                            required
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select a patient</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input required value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Doctor name" className="w-full" />
                    <DatePicker required value={time} onChange={setTime} mode="datetime-local" className="w-full" />
                    <Input value={type} onChange={e => setType(e.target.value)} placeholder="Type (e.g., Consultation)" className="w-full" />
                    <div className="flex justify-end gap-2 mt-3">
                        <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2">Cancel</Button>
                        <Button type="submit" className="px-4 py-2">Create</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
