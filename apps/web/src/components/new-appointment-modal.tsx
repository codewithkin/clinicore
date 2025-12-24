"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "sonner";
import axios from "@/utils/axios";
import { QUERY_KEYS } from "@/utils/query-keys";
import { queryClient } from "@/utils/trpc";

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

type SchedulingSettings = {
    defaultDuration?: number;
    bufferTime?: number;
    bookingWindow?: number;
    cancellationPolicy?: number;
};

type Organization = {
    defaultAppointmentLength?: number;
};

export default function NewAppointmentModal({ open, onClose, onCreate, organizationId }: Props) {
    const [patientId, setPatientId] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [schedulingSettings, setSchedulingSettings] = useState<SchedulingSettings | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [doctorName, setDoctorName] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState<number>(30);
    const [type, setType] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && organizationId) {
            // Fetch patients
            fetch(`/api/patients?organizationId=${organizationId}`)
                .then(res => res.json())
                .then(data => setPatients(data.patients || []))
                .catch(err => console.error("Failed to fetch patients:", err));

            // Fetch scheduling settings
            fetch(`/api/settings?organizationId=${organizationId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.settings?.scheduling) {
                        setSchedulingSettings(data.settings.scheduling);
                    }
                })
                .catch(err => console.error("Failed to fetch settings:", err));

            // Fetch organization details
            fetch(`/api/organizations/${organizationId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.organization) {
                        setOrganization(data.organization);
                        setDuration(data.organization.defaultAppointmentLength || 30);
                    }
                })
                .catch(err => console.error("Failed to fetch organization:", err));
        }
    }, [open, organizationId]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            setError("Please select a patient");
            return;
        }

        // Validate booking window if set
        if (schedulingSettings?.bookingWindow && time) {
            const appointmentDate = new Date(time);
            const maxBookingDate = new Date();
            maxBookingDate.setDate(maxBookingDate.getDate() + schedulingSettings.bookingWindow);

            if (appointmentDate > maxBookingDate) {
                setError(`Appointments can only be booked up to ${schedulingSettings.bookingWindow} days in advance`);
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            const payload = { patientId, doctorName, time, type, duration };
            const response = await axios.post("/api/appointments", payload);
            const data = response.data;
            onCreate?.(data.appointment);
            onClose();
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.appointments as unknown as any
            });
            toast.success("Appointment created");
            // Reset form
            setPatientId("");
            setDoctorName("");
            setTime("");
            setType("");
            setDuration(organization?.defaultAppointmentLength || 30);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err.message || "Failed to create appointment";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">New Appointment</h3>
                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{error}</div>}
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
                    <DatePicker value={time} onChange={setTime} mode="datetime-local" className="w-full" />
                    <div className="w-full">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
                        <Input
                            type="number"
                            min="5"
                            max="480"
                            value={duration}
                            onChange={e => setDuration(parseInt(e.target.value) || 30)}
                            placeholder="30"
                            className="w-full"
                        />
                    </div>
                    <Input value={type} onChange={e => setType(e.target.value)} placeholder="Type (e.g., Consultation)" className="w-full" />
                    <div className="flex justify-end gap-2 mt-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-4 py-2">Cancel</Button>
                        <Button type="submit" disabled={loading} className="px-4 py-2">{loading ? "Creating..." : "Create"}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
