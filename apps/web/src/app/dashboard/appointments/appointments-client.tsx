"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    MoreVertical,
    Check,
    X,
    Calendar,
    List,
    Filter,
    Mail,
} from "lucide-react";
import { toast } from "sonner";
import axios from "@/utils/axios";

type Patient = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
};

type Appointment = {
    id: string;
    patientId: string;
    patient: Patient;
    doctorId?: string | null;
    doctorName: string;
    time: string | Date;
    duration: number;
    type: string;
    status: string;
    notes?: string | null;
    reminderSent: boolean;
};

type Doctor = {
    id: string;
    name: string;
};

type Props = {
    initialAppointments: Appointment[];
    patients: { id: string; firstName: string; lastName: string }[];
    doctors: Doctor[];
    organizationId: string;
    settings: {
        defaultDuration: number;
        emailReminders: boolean;
        reminderTiming: number;
    };
    isAdmin: boolean;
    userRole: string;
};

const APPOINTMENT_TYPES = [
    "Consultation",
    "Follow-up",
    "Procedure",
    "Checkup",
    "Emergency",
    "Vaccination",
];

const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    confirmed: "bg-teal-100 text-teal-800 border-teal-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    "no-show": "bg-orange-100 text-orange-800 border-orange-200",
};

export default function AppointmentsClient({
    initialAppointments,
    patients,
    doctors,
    organizationId,
    settings,
    isAdmin,
    userRole,
}: Props) {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterDoctor, setFilterDoctor] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        patientId: "",
        doctorId: "",
        doctorName: "",
        date: "",
        time: "",
        duration: settings.defaultDuration,
        type: "Consultation",
        notes: "",
    });
    const [loading, setLoading] = useState(false);

    // Calendar helpers
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        // Add empty slots for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Add the days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [firstDayOfMonth, daysInMonth]);

    const getAppointmentsForDay = (day: number) => {
        return appointments.filter((apt) => {
            const aptDate = new Date(apt.time);
            return (
                aptDate.getDate() === day &&
                aptDate.getMonth() === currentDate.getMonth() &&
                aptDate.getFullYear() === currentDate.getFullYear() &&
                (!filterStatus || apt.status === filterStatus) &&
                (!filterDoctor || apt.doctorName === filterDoctor)
            );
        });
    };

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter((apt) => {
                const aptDate = new Date(apt.time);
                return (
                    aptDate.getMonth() === currentDate.getMonth() &&
                    aptDate.getFullYear() === currentDate.getFullYear() &&
                    (!filterStatus || apt.status === filterStatus) &&
                    (!filterDoctor || apt.doctorName === filterDoctor)
                );
            })
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }, [appointments, currentDate, filterStatus, filterDoctor]);

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return newDate;
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

            const response = await axios.post("/api/appointments", {
                patientId: formData.patientId,
                doctorId: formData.doctorId || null,
                doctorName: selectedDoctor?.name || formData.doctorName || "Unassigned",
                time: dateTime.toISOString(),
                duration: formData.duration,
                type: formData.type,
                notes: formData.notes || null,
                organizationId,
            });

            setAppointments((prev) => [...prev, response.data.appointment]);
            setShowNewModal(false);
            resetForm();
            toast.success("Appointment created successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to create appointment");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}`, { status: newStatus });
            setAppointments((prev) =>
                prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: newStatus } : apt))
            );
            toast.success(`Appointment marked as ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update appointment");
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}`, { status: "cancelled" });
            setAppointments((prev) =>
                prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt))
            );
            toast.success("Appointment cancelled");
        } catch (error) {
            toast.error("Failed to cancel appointment");
        }
    };

    const handleSendReminder = async (appointment: Appointment) => {
        try {
            await axios.post(`/api/reminders/${appointment.id}`);
            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === appointment.id ? { ...apt, reminderSent: true } : apt
                )
            );
            toast.success(`Reminder sent to ${appointment.patient.firstName}`);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to send reminder");
        }
    };

    const resetForm = () => {
        setFormData({
            patientId: "",
            doctorId: "",
            doctorName: "",
            date: "",
            time: "",
            duration: settings.defaultDuration,
            type: "Consultation",
            notes: "",
        });
    };

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

    return (
        <div className="space-y-6 p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your clinic's schedule</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
                    >
                        {viewMode === "calendar" ? (
                            <>
                                <List className="h-4 w-4 mr-2" />
                                List View
                            </>
                        ) : (
                            <>
                                <Calendar className="h-4 w-4 mr-2" />
                                Calendar
                            </>
                        )}
                    </Button>
                    <Button onClick={() => setShowNewModal(true)} className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Appointment
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Status: {filterStatus || "All"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFilterStatus(null)}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("scheduled")}>Scheduled</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("confirmed")}>Confirmed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterStatus("cancelled")}>Cancelled</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {doctors.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <User className="h-4 w-4 mr-2" />
                                Doctor: {filterDoctor || "All"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setFilterDoctor(null)}>All Doctors</DropdownMenuItem>
                            {doctors.map((doc) => (
                                <DropdownMenuItem key={doc.id} onClick={() => setFilterDoctor(doc.name)}>
                                    {doc.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Calendar View */}
            {viewMode === "calendar" && (
                <Card className="rounded-2xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">{monthName}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentDate(new Date())}
                                >
                                    Today
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                const dayAppointments = day ? getAppointmentsForDay(day) : [];
                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[100px] p-1 border rounded-lg ${day
                                            ? isToday(day)
                                                ? "bg-teal-50 border-teal-200"
                                                : "bg-white border-gray-100 hover:border-gray-200"
                                            : "bg-gray-50 border-transparent"
                                            }`}
                                    >
                                        {day && (
                                            <>
                                                <div
                                                    className={`text-sm font-medium mb-1 ${isToday(day) ? "text-teal-700" : "text-gray-700"
                                                        }`}
                                                >
                                                    {day}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayAppointments.slice(0, 3).map((apt) => (
                                                        <div
                                                            key={apt.id}
                                                            onClick={() => setSelectedAppointment(apt)}
                                                            className={`text-xs p-1 rounded cursor-pointer truncate ${STATUS_COLORS[apt.status] || "bg-gray-100 text-gray-700"
                                                                }`}
                                                        >
                                                            {new Date(apt.time).toLocaleTimeString("en-US", {
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                            })}{" "}
                                                            {apt.patient.lastName}
                                                        </div>
                                                    ))}
                                                    {dayAppointments.length > 3 && (
                                                        <div className="text-xs text-gray-500 text-center">
                                                            +{dayAppointments.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <Card className="rounded-2xl border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">{monthName} Appointments</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No appointments this month</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="p-4 hover:bg-gray-50 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[60px]">
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {new Date(apt.time).getDate()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(apt.time).toLocaleString("default", { month: "short" })}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {apt.patient.firstName} {apt.patient.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(apt.time).toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                    <span className="text-gray-300">|</span>
                                                    <User className="h-3 w-3" />
                                                    {apt.doctorName}
                                                    <span className="text-gray-300">|</span>
                                                    {apt.type}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${STATUS_COLORS[apt.status]} border font-medium`}>
                                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSelectedAppointment(apt)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {apt.status === "scheduled" && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateStatus(apt.id, "confirmed")}
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Confirm
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(apt.status === "scheduled" || apt.status === "confirmed") && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => handleUpdateStatus(apt.id, "completed")}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Mark Completed
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleCancelAppointment(apt.id)}
                                                                className="text-red-600"
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                Cancel
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {(apt.status === "scheduled" || apt.status === "confirmed") &&
                                                        !apt.reminderSent && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleSendReminder(apt)}
                                                            >
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Send Reminder
                                                            </DropdownMenuItem>
                                                        )}
                                                    {apt.reminderSent && (
                                                        <DropdownMenuItem disabled className="text-gray-400">
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Reminder Sent
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* New Appointment Modal */}
            <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
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
                            <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={loading}>
                                {loading ? "Creating..." : "Create Appointment"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Appointment Details Modal */}
            <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Appointment Details</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge className={`${STATUS_COLORS[selectedAppointment.status]} border font-medium`}>
                                    {selectedAppointment.status.charAt(0).toUpperCase() +
                                        selectedAppointment.status.slice(1)}
                                </Badge>
                                {selectedAppointment.reminderSent && (
                                    <span className="text-xs text-gray-500">Reminder sent</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Patient</label>
                                    <p className="font-medium">
                                        {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Doctor</label>
                                    <p className="font-medium">{selectedAppointment.doctorName}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Date & Time</label>
                                    <p className="font-medium">
                                        {new Date(selectedAppointment.time).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })}{" "}
                                        at{" "}
                                        {new Date(selectedAppointment.time).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Duration</label>
                                    <p className="font-medium">{selectedAppointment.duration} min</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Type</label>
                                    <p className="font-medium">{selectedAppointment.type}</p>
                                </div>
                                {selectedAppointment.patient.email && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Email</label>
                                        <p className="font-medium text-sm">{selectedAppointment.patient.email}</p>
                                    </div>
                                )}
                            </div>

                            {selectedAppointment.notes && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500">Notes</label>
                                    <p className="text-sm text-gray-700 mt-1">{selectedAppointment.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                {selectedAppointment.status === "scheduled" && (
                                    <Button
                                        onClick={() => {
                                            handleUpdateStatus(selectedAppointment.id, "confirmed");
                                            setSelectedAppointment(null);
                                        }}
                                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                                    >
                                        Confirm
                                    </Button>
                                )}
                                {(selectedAppointment.status === "scheduled" ||
                                    selectedAppointment.status === "confirmed") && (
                                        <>
                                            <Button
                                                onClick={() => {
                                                    handleUpdateStatus(selectedAppointment.id, "completed");
                                                    setSelectedAppointment(null);
                                                }}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Complete
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    handleCancelAppointment(selectedAppointment.id);
                                                    setSelectedAppointment(null);
                                                }}
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                {(selectedAppointment.status === "scheduled" ||
                                    selectedAppointment.status === "confirmed") &&
                                    !selectedAppointment.reminderSent &&
                                    selectedAppointment.patient.email && (
                                        <Button
                                            onClick={() => {
                                                handleSendReminder(selectedAppointment);
                                            }}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Send Reminder
                                        </Button>
                                    )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
