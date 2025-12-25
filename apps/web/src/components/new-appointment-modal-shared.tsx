"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "@/utils/axios";

type Patient = {
    id: string;
    firstName: string;
    lastName: string;
};

type Doctor = {
    id: string;
    name: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    organizationId: string;
    onSuccess?: () => void;
};

const APPOINTMENT_TYPES = [
    "Consultation",
    "Follow-up",
    "Procedure",
    "Checkup",
    "Emergency",
    "Vaccination",
];

export default function NewAppointmentModal({ open, onClose, organizationId, onSuccess }: Props) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patientId: "",
        doctorId: "",
        doctorName: "",
        date: "",
        time: "",
        duration: 30,
        type: "Consultation",
        notes: "",
    });

    // Fetch patients and doctors when modal opens
    useEffect(() => {
        if (open && organizationId) {
            fetchData();
        }
    }, [open, organizationId]);

    const fetchData = async () => {
        try {
            const [patientsRes, doctorsRes] = await Promise.all([
                axios.get(`/api/patients?organizationId=${organizationId}`),
                axios.get(`/api/doctors?organizationId=${organizationId}`)
            ]);
            setPatients(patientsRes.data.patients || []);
            setDoctors(doctorsRes.data.doctors || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            // Set empty arrays if endpoints don't exist
            setPatients([]);
            setDoctors([]);
        }
    };

    const resetForm = () => {
        setFormData({
            patientId: "",
            doctorId: "",
            doctorName: "",
            date: "",
            time: "",
            duration: 30,
            type: "Consultation",
            notes: "",
        });
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId || !formData.date || !formData.time) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);
            const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);

            await axios.post("/api/appointments", {
                patientId: formData.patientId,
                doctorId: formData.doctorId || null,
                doctorName: selectedDoctor?.name || formData.doctorName || "Unassigned",
                time: dateTime.toISOString(),
                duration: formData.duration,
                type: formData.type,
                notes: formData.notes || null,
                organizationId,
            });

            toast.success("Appointment created successfully");
            resetForm();
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to create appointment");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New Appointment</DialogTitle>
                    <DialogDescription>Schedule a new appointment for a patient</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Patient *</label>
                        <select
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            required
                        >
                            <option value="">Select a patient</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Doctor</label>
                        <select
                            value={formData.doctorId}
                            onChange={(e) => {
                                const doc = doctors.find((d) => d.id === e.target.value);
                                setFormData({
                                    ...formData,
                                    doctorId: e.target.value,
                                    doctorName: doc?.name || "",
                                });
                            }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">Select a doctor</option>
                            {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Date *</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                min={new Date().toISOString().split("T")[0]}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Time *</label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                                {APPOINTMENT_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Duration</label>
                            <select
                                value={formData.duration}
                                onChange={(e) =>
                                    setFormData({ ...formData, duration: parseInt(e.target.value) })
                                }
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                            rows={2}
                            placeholder="Optional notes for this appointment"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={loading}>
                            {loading ? "Creating..." : "Create Appointment"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}