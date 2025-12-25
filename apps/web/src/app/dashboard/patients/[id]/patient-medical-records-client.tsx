"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    FileText,
    Stethoscope,
    Pill,
    Calendar,
    Activity,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import axios from "@/utils/axios";

type Appointment = {
    id: string;
    time: string | Date;
    type: string;
    doctorName: string;
};

type MedicalRecord = {
    id: string;
    patientId: string;
    appointmentId?: string | null;
    appointment?: Appointment | null;
    visitDate: string | Date;
    visitType: string;
    chiefComplaint?: string | null;
    diagnosis?: string | null;
    symptoms?: string | null;
    treatment?: string | null;
    prescription?: string | null;
    notes?: string | null;
    bloodPressure?: string | null;
    heartRate?: number | null;
    temperature?: number | null;
    weight?: number | null;
    height?: number | null;
    followUpDate?: string | Date | null;
    followUpNotes?: string | null;
    createdBy: string;
    createdAt: string | Date;
};

type Props = {
    patientId: string;
    patientName: string;
    initialRecords: MedicalRecord[];
    appointments: Appointment[];
};

const VISIT_TYPES = [
    "Consultation",
    "Follow-up",
    "Procedure",
    "Emergency",
    "Checkup",
    "Vaccination",
];

export default function PatientMedicalRecordsClient({
    patientId,
    patientName,
    initialRecords,
    appointments,
}: Props) {
    const [records, setRecords] = useState<MedicalRecord[]>(initialRecords);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        appointmentId: "",
        visitType: "Consultation",
        chiefComplaint: "",
        diagnosis: "",
        symptoms: "",
        treatment: "",
        prescription: "",
        notes: "",
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: "",
        followUpDate: "",
        followUpNotes: "",
    });

    const resetForm = () => {
        setFormData({
            appointmentId: "",
            visitType: "Consultation",
            chiefComplaint: "",
            diagnosis: "",
            symptoms: "",
            treatment: "",
            prescription: "",
            notes: "",
            bloodPressure: "",
            heartRate: "",
            temperature: "",
            weight: "",
            height: "",
            followUpDate: "",
            followUpNotes: "",
        });
    };

    const handleCreateRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post("/api/medical-records", {
                patientId,
                ...formData,
            });

            setRecords((prev) => [response.data.record, ...prev]);
            setShowNewModal(false);
            resetForm();
            toast.success("Medical record created successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to create record");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <>
            <Card className="border-gray-200 rounded-2xl">
                <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-teal-600" />
                                Medical Records
                            </CardTitle>
                            <CardDescription>Clinical notes, diagnoses, and treatment history</CardDescription>
                        </div>
                        <Button onClick={() => setShowNewModal(true)} className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="h-4 w-4 mr-2" />
                            New Record
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {records.length === 0 ? (
                        <div className="py-12 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No medical records yet</p>
                            <Button
                                onClick={() => setShowNewModal(true)}
                                variant="outline"
                                size="sm"
                                className="mt-3"
                            >
                                Create First Record
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {records.map((record) => (
                                <div
                                    key={record.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedRecord(record)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-teal-50 rounded-lg">
                                                <FileText className="h-5 w-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">
                                                        {record.visitType}
                                                    </span>
                                                    <Badge
                                                        className="text-xs border border-gray-200 bg-gray-100 text-gray-700"
                                                    >
                                                        {formatDate(record.visitDate)}
                                                    </Badge>
                                                </div>
                                                {record.chiefComplaint && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {record.chiefComplaint}
                                                    </p>
                                                )}
                                                {record.diagnosis && (
                                                    <p className="text-sm text-gray-700 mt-1">
                                                        <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    By {record.createdBy}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Record Modal */}
            <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New Medical Record</DialogTitle>
                        <DialogDescription>
                            Create a new medical record for {patientName}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateRecord} className="space-y-6">
                        {/* Visit Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Visit Type *
                                </label>
                                <select
                                    value={formData.visitType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, visitType: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    {VISIT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Linked Appointment
                                </label>
                                <select
                                    value={formData.appointmentId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, appointmentId: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">None</option>
                                    {appointments.map((apt) => (
                                        <option key={apt.id} value={apt.id}>
                                            {formatDate(apt.time)} - {apt.type} ({apt.doctorName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Chief Complaint */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Chief Complaint
                            </label>
                            <Input
                                value={formData.chiefComplaint}
                                onChange={(e) =>
                                    setFormData({ ...formData, chiefComplaint: e.target.value })
                                }
                                placeholder="Main reason for the visit"
                            />
                        </div>

                        {/* Symptoms & Diagnosis */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Symptoms
                                </label>
                                <textarea
                                    value={formData.symptoms}
                                    onChange={(e) =>
                                        setFormData({ ...formData, symptoms: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                                    rows={3}
                                    placeholder="Observed symptoms"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Diagnosis
                                </label>
                                <textarea
                                    value={formData.diagnosis}
                                    onChange={(e) =>
                                        setFormData({ ...formData, diagnosis: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                                    rows={3}
                                    placeholder="Clinical diagnosis"
                                />
                            </div>
                        </div>

                        {/* Treatment & Prescription */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Treatment Plan
                                </label>
                                <textarea
                                    value={formData.treatment}
                                    onChange={(e) =>
                                        setFormData({ ...formData, treatment: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                                    rows={3}
                                    placeholder="Recommended treatment"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Prescription
                                </label>
                                <textarea
                                    value={formData.prescription}
                                    onChange={(e) =>
                                        setFormData({ ...formData, prescription: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                                    rows={3}
                                    placeholder="Medications prescribed"
                                />
                            </div>
                        </div>

                        {/* Vitals */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Vitals (Optional)
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Blood Pressure</label>
                                    <Input
                                        value={formData.bloodPressure}
                                        onChange={(e) =>
                                            setFormData({ ...formData, bloodPressure: e.target.value })
                                        }
                                        placeholder="120/80"
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Heart Rate</label>
                                    <Input
                                        type="number"
                                        value={formData.heartRate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, heartRate: e.target.value })
                                        }
                                        placeholder="72"
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Temp (°F)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formData.temperature}
                                        onChange={(e) =>
                                            setFormData({ ...formData, temperature: e.target.value })
                                        }
                                        placeholder="98.6"
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Weight (kg)</label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={formData.weight}
                                        onChange={(e) =>
                                            setFormData({ ...formData, weight: e.target.value })
                                        }
                                        placeholder="70"
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Height (cm)</label>
                                    <Input
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) =>
                                            setFormData({ ...formData, height: e.target.value })
                                        }
                                        placeholder="170"
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                Additional Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                                rows={2}
                                placeholder="Any additional observations or notes"
                            />
                        </div>

                        {/* Follow-up */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Follow-up Date
                                </label>
                                <Input
                                    type="date"
                                    value={formData.followUpDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, followUpDate: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Follow-up Notes
                                </label>
                                <Input
                                    value={formData.followUpNotes}
                                    onChange={(e) =>
                                        setFormData({ ...formData, followUpNotes: e.target.value })
                                    }
                                    placeholder="Instructions for follow-up"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowNewModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-teal-600 hover:bg-teal-700"
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Create Record"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Record Modal */}
            <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-teal-600" />
                            Medical Record
                        </DialogTitle>
                        <DialogDescription>
                            {selectedRecord && formatDate(selectedRecord.visitDate)} - {selectedRecord?.visitType}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-6">
                            {/* Record Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                        Visit Type
                                    </label>
                                    <p className="text-gray-900 mt-1">{selectedRecord.visitType}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                        Created By
                                    </label>
                                    <p className="text-gray-900 mt-1">{selectedRecord.createdBy}</p>
                                </div>
                            </div>

                            {selectedRecord.chiefComplaint && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                        Chief Complaint
                                    </label>
                                    <p className="text-gray-900 mt-1">{selectedRecord.chiefComplaint}</p>
                                </div>
                            )}

                            {selectedRecord.symptoms && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                        Symptoms
                                    </label>
                                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                                        {selectedRecord.symptoms}
                                    </p>
                                </div>
                            )}

                            {selectedRecord.diagnosis && (
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <label className="text-xs font-medium text-teal-700 uppercase flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4" />
                                        Diagnosis
                                    </label>
                                    <p className="text-teal-900 mt-1 font-medium">
                                        {selectedRecord.diagnosis}
                                    </p>
                                </div>
                            )}

                            {selectedRecord.treatment && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                        Treatment Plan
                                    </label>
                                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                                        {selectedRecord.treatment}
                                    </p>
                                </div>
                            )}

                            {selectedRecord.prescription && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <label className="text-xs font-medium text-blue-700 uppercase flex items-center gap-2">
                                        <Pill className="h-4 w-4" />
                                        Prescription
                                    </label>
                                    <p className="text-blue-900 mt-1 whitespace-pre-wrap">
                                        {selectedRecord.prescription}
                                    </p>
                                </div>
                            )}

                            {/* Vitals */}
                            {(selectedRecord.bloodPressure ||
                                selectedRecord.heartRate ||
                                selectedRecord.temperature ||
                                selectedRecord.weight ||
                                selectedRecord.height) && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2 mb-2">
                                            <Activity className="h-4 w-4" />
                                            Vitals
                                        </label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {selectedRecord.bloodPressure && (
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-500">BP</p>
                                                    <p className="font-medium">{selectedRecord.bloodPressure}</p>
                                                </div>
                                            )}
                                            {selectedRecord.heartRate && (
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-500">HR</p>
                                                    <p className="font-medium">{selectedRecord.heartRate} bpm</p>
                                                </div>
                                            )}
                                            {selectedRecord.temperature && (
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-500">Temp</p>
                                                    <p className="font-medium">{selectedRecord.temperature}°F</p>
                                                </div>
                                            )}
                                            {selectedRecord.weight && (
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-500">Weight</p>
                                                    <p className="font-medium">{selectedRecord.weight} kg</p>
                                                </div>
                                            )}
                                            {selectedRecord.height && (
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-500">Height</p>
                                                    <p className="font-medium">{selectedRecord.height} cm</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {selectedRecord.notes && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">
                                        Additional Notes
                                    </label>
                                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                                        {selectedRecord.notes}
                                    </p>
                                </div>
                            )}

                            {/* Follow-up */}
                            {selectedRecord.followUpDate && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <label className="text-xs font-medium text-orange-700 uppercase flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Follow-up Scheduled
                                    </label>
                                    <p className="text-orange-900 mt-1 font-medium">
                                        {formatDate(selectedRecord.followUpDate)}
                                    </p>
                                    {selectedRecord.followUpNotes && (
                                        <p className="text-orange-700 mt-1 text-sm">
                                            {selectedRecord.followUpNotes}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
