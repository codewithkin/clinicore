"use client";

import React, { useState, useMemo, useCallback } from "react";
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
    DropdownMenuSeparator,
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
    CalendarDays,
    Grid3X3,
    Search,
    Bell,
    Phone,
    FileText,
    ArrowLeft,
    CalendarPlus,
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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    scheduled: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
    confirmed: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
    completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
    "no-show": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
};

const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
];

type ViewMode = "month" | "week" | "list";

export default function AppointmentsClient({
    initialAppointments,
    patients,
    doctors,
    organizationId,
    settings,
}: Props) {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterDoctor, setFilterDoctor] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);

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

    // Week helpers
    const getWeekDays = useCallback((date: Date) => {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    }, []);

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [firstDayOfMonth, daysInMonth]);

    const getAppointmentsForDay = useCallback((day: number | Date) => {
        let targetDate: Date;
        if (typeof day === "number") {
            targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        } else {
            targetDate = day;
        }

        return appointments.filter((apt) => {
            const aptDate = new Date(apt.time);
            return (
                aptDate.getDate() === targetDate.getDate() &&
                aptDate.getMonth() === targetDate.getMonth() &&
                aptDate.getFullYear() === targetDate.getFullYear() &&
                (!filterStatus || apt.status === filterStatus) &&
                (!filterDoctor || apt.doctorName === filterDoctor) &&
                (!searchQuery ||
                    `${apt.patient.firstName} ${apt.patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        });
    }, [appointments, currentDate, filterStatus, filterDoctor, searchQuery]);

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter((apt) => {
                const aptDate = new Date(apt.time);
                const matchesMonth = aptDate.getMonth() === currentDate.getMonth() &&
                    aptDate.getFullYear() === currentDate.getFullYear();
                const matchesStatus = !filterStatus || apt.status === filterStatus;
                const matchesDoctor = !filterDoctor || apt.doctorName === filterDoctor;
                const matchesSearch = !searchQuery ||
                    `${apt.patient.firstName} ${apt.patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase());

                return matchesMonth && matchesStatus && matchesDoctor && matchesSearch;
            })
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }, [appointments, currentDate, filterStatus, filterDoctor, searchQuery]);

    // Selected date appointments
    const selectedDateAppointments = useMemo(() => {
        if (!selectedDate) return [];
        return getAppointmentsForDay(selectedDate);
    }, [selectedDate, getAppointmentsForDay]);

    // Navigation functions
    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return newDate;
        });
    };

    const navigateWeek = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    // CRUD operations
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
            setSelectedAppointment(null);
            toast.success(`Appointment marked as ${newStatus}`);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to update appointment");
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            await axios.patch(`/api/appointments/${appointmentId}`, { status: "cancelled" });
            setAppointments((prev) =>
                prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt))
            );
            setSelectedAppointment(null);
            toast.success("Appointment cancelled");
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to cancel appointment");
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

    const openNewAppointmentWithDate = (date: Date, time?: string) => {
        setFormData({
            ...formData,
            date: date.toISOString().split("T")[0],
            time: time || "",
        });
        setShowNewModal(true);
    };

    // Date helpers
    const today = new Date();
    const isToday = (day: number | Date) => {
        const targetDate = typeof day === "number"
            ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            : day;
        return (
            targetDate.getDate() === today.getDate() &&
            targetDate.getMonth() === today.getMonth() &&
            targetDate.getFullYear() === today.getFullYear()
        );
    };

    const formatTime = (date: Date | string) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Stats
    const todayAppointments = getAppointmentsForDay(today);
    const upcomingCount = filteredAppointments.filter(a =>
        new Date(a.time) > new Date() && a.status !== "cancelled"
    ).length;

    const hasActiveFilters = filterStatus || filterDoctor || searchQuery;

    // Render functions for modals
    function renderNewAppointmentModal() {
        return (
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
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
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
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
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
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
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
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
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
        );
    }

    function renderAppointmentDetailsModal() {
        return (
            <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            Appointment Details
                            {selectedAppointment && (
                                <Badge className={`${STATUS_COLORS[selectedAppointment.status]?.bg} ${STATUS_COLORS[selectedAppointment.status]?.text}`}>
                                    {selectedAppointment.status}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-6">
                            {/* Patient Info */}
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-teal-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                        {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                                    </p>
                                    {selectedAppointment.patient.email && (
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Mail className="h-3.5 w-3.5" />
                                            {selectedAppointment.patient.email}
                                        </p>
                                    )}
                                    {selectedAppointment.patient.phone && (
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Phone className="h-3.5 w-3.5" />
                                            {selectedAppointment.patient.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Appointment Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Date & Time</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {new Date(selectedAppointment.time).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                        {" at "}
                                        {formatTime(selectedAppointment.time)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Duration</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        {selectedAppointment.duration} minutes
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
                                    <p className="font-medium">{selectedAppointment.type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Doctor</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        {selectedAppointment.doctorName}
                                    </p>
                                </div>
                            </div>

                            {selectedAppointment.notes && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5" />
                                        Notes
                                    </p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                                        {selectedAppointment.notes}
                                    </p>
                                </div>
                            )}

                            {selectedAppointment.reminderSent && (
                                <div className="flex items-center gap-2 text-sm text-teal-600 bg-teal-50 rounded-lg p-3">
                                    <Bell className="h-4 w-4" />
                                    Reminder sent to patient
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                                {selectedAppointment.status === "scheduled" && (
                                    <Button
                                        onClick={() => handleUpdateStatus(selectedAppointment.id, "confirmed")}
                                        className="bg-teal-600 hover:bg-teal-700"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Confirm
                                    </Button>
                                )}
                                {(selectedAppointment.status === "scheduled" || selectedAppointment.status === "confirmed") && (
                                    <>
                                        <Button
                                            onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
                                            variant="outline"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Complete
                                        </Button>
                                        {!selectedAppointment.reminderSent && selectedAppointment.patient.email && (
                                            <Button
                                                onClick={() => handleSendReminder(selectedAppointment)}
                                                variant="outline"
                                            >
                                                <Mail className="h-4 w-4 mr-2" />
                                                Send Reminder
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleCancelAppointment(selectedAppointment.id)}
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

    // If a date is selected, show the date detail view
    if (selectedDate) {
        return (
            <div className="p-4 md:p-6 space-y-4">
                {/* Back Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDate(null)}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Calendar
                        </Button>
                    </div>
                    <Button
                        onClick={() => openNewAppointmentWithDate(selectedDate)}
                        className="bg-teal-600 hover:bg-teal-700 gap-2"
                    >
                        <CalendarPlus className="h-4 w-4" />
                        Add Appointment
                    </Button>
                </div>

                {/* Date Header */}
                <Card className="border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${isToday(selectedDate) ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{selectedDate.getDate()}</p>
                                    <p className="text-xs uppercase">{selectedDate.toLocaleDateString("en-US", { weekday: "short" })}</p>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                                </h1>
                                <p className="text-gray-500 mt-0.5">
                                    {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? "s" : ""} scheduled
                                    {isToday(selectedDate) && <span className="ml-2 text-teal-600 font-medium">• Today</span>}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointments List */}
                <Card className="border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-base">Appointments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {selectedDateAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 mb-4">No appointments on this day</p>
                                <Button
                                    onClick={() => openNewAppointmentWithDate(selectedDate)}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Schedule Appointment
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {selectedDateAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedAppointment(apt)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-1 h-full min-h-12 rounded-full ${STATUS_COLORS[apt.status]?.dot || "bg-gray-400"}`} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">
                                                            {apt.patient.firstName} {apt.patient.lastName}
                                                        </p>
                                                        <Badge className={`${STATUS_COLORS[apt.status]?.bg || "bg-gray-100"} ${STATUS_COLORS[apt.status]?.text || "text-gray-700"} text-xs`}>
                                                            {apt.status}
                                                        </Badge>
                                                        {apt.reminderSent && (
                                                            <Bell className="h-3.5 w-3.5 text-teal-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatTime(apt.time)} ({apt.duration} min)
                                                        </span>
                                                        <span>•</span>
                                                        <span>{apt.type}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3.5 w-3.5" />
                                                            {apt.doctorName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {(apt.status === "scheduled" || apt.status === "confirmed") && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(apt.id, "completed"); }}
                                                            className="h-8 text-green-600 hover:bg-green-50"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt.id); }}
                                                            className="h-8 text-red-600 hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modals */}
                {renderNewAppointmentModal()}
                {renderAppointmentDetailsModal()}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* Header with cleaner toolbar */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {todayAppointments.length} today • {upcomingCount} upcoming
                        </p>
                    </div>
                    <Button onClick={() => setShowNewModal(true)} className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Appointment
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-2">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <Button variant="ghost" size="sm" onClick={() => viewMode === "month" ? navigateMonth("prev") : navigateWeek("prev")}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-40 text-center">
                                {viewMode === "week"
                                    ? `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                    : monthName
                                }
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => viewMode === "month" ? navigateMonth("next") : navigateWeek("next")}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={goToToday} className="text-teal-600 hover:text-teal-700">
                            Today
                        </Button>
                    </div>

                    {/* Center: View Switcher */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        {[
                            { mode: "month" as ViewMode, icon: Grid3X3, label: "Month" },
                            { mode: "week" as ViewMode, icon: CalendarDays, label: "Week" },
                            { mode: "list" as ViewMode, icon: List, label: "List" },
                        ].map(({ mode, icon: Icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${viewMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Right: Search & Filters */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-8 w-40 text-sm"
                            />
                        </div>
                        <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className={hasActiveFilters ? "text-teal-600" : ""}>
                                    <Filter className="h-4 w-4" />
                                    {hasActiveFilters && (
                                        <span className="ml-1 h-4 w-4 bg-teal-600 text-white rounded-full text-[10px] flex items-center justify-center">
                                            {(filterStatus ? 1 : 0) + (filterDoctor ? 1 : 0)}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="p-2">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
                                    <div className="flex flex-wrap gap-1">
                                        {["scheduled", "confirmed", "completed", "cancelled"].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                                                className={`px-2 py-1 text-xs rounded-full capitalize transition-colors ${filterStatus === status
                                                    ? `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text}`
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <div className="p-2">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Doctor</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {doctors.map((doc) => (
                                            <button
                                                key={doc.id}
                                                onClick={() => setFilterDoctor(filterDoctor === doc.name ? null : doc.name)}
                                                className={`w-full px-2 py-1.5 text-xs text-left rounded transition-colors ${filterDoctor === doc.name
                                                    ? "bg-teal-50 text-teal-700"
                                                    : "hover:bg-gray-100"
                                                    }`}
                                            >
                                                {doc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {hasActiveFilters && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { setFilterStatus(null); setFilterDoctor(null); setSearchQuery(""); }}>
                                            Clear all filters
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Month View */}
            {viewMode === "month" && (
                <Card className="border-gray-200 rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, index) => {
                                const dayAppointments = day ? getAppointmentsForDay(day) : [];

                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            if (day) {
                                                setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                                            }
                                        }}
                                        className={`
                                            min-h-24 p-1.5 border-b border-r border-gray-100 cursor-pointer transition-colors
                                            ${day ? "hover:bg-teal-50" : "bg-gray-50/50"}
                                        `}
                                    >
                                        {day && (
                                            <>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span
                                                        className={`
                                                            text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full
                                                            ${isToday(day) ? "bg-teal-600 text-white" : "text-gray-700"}
                                                        `}
                                                    >
                                                        {day}
                                                    </span>
                                                    {dayAppointments.length > 0 && (
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {dayAppointments.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {dayAppointments.slice(0, 2).map((apt) => (
                                                        <div
                                                            key={apt.id}
                                                            className={`
                                                                text-[10px] px-1.5 py-0.5 rounded truncate
                                                                ${STATUS_COLORS[apt.status]?.bg || "bg-gray-100"} ${STATUS_COLORS[apt.status]?.text || "text-gray-700"}
                                                            `}
                                                        >
                                                            {formatTime(apt.time)} {apt.patient.firstName}
                                                        </div>
                                                    ))}
                                                    {dayAppointments.length > 2 && (
                                                        <div className="text-[10px] text-gray-400 pl-1">
                                                            +{dayAppointments.length - 2} more
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

            {/* Week View */}
            {viewMode === "week" && (
                <Card className="border-gray-200 rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                        {/* Day headers */}
                        <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50">
                            <div className="py-3 px-2"></div>
                            {weekDays.map((day, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedDate(day)}
                                    className={`py-2 text-center cursor-pointer hover:bg-teal-50 border-l border-gray-100 ${isToday(day) ? "bg-teal-50" : ""}`}
                                >
                                    <p className="text-xs font-medium text-gray-500 uppercase">
                                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                                    </p>
                                    <p className={`text-lg font-bold ${isToday(day) ? "text-teal-600" : "text-gray-900"}`}>
                                        {day.getDate()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Time slots */}
                        <div className="max-h-[500px] overflow-y-auto">
                            {TIME_SLOTS.map((time) => (
                                <div key={time} className="grid grid-cols-8 border-b border-gray-50">
                                    <div className="py-2 px-2 text-xs text-gray-400 text-right">
                                        {time}
                                    </div>
                                    {weekDays.map((day, dayIndex) => {
                                        const dayAppointments = getAppointmentsForDay(day);
                                        const slotAppointments = dayAppointments.filter((apt) => {
                                            const aptTime = new Date(apt.time);
                                            const aptHour = aptTime.getHours().toString().padStart(2, "0");
                                            const aptMinute = aptTime.getMinutes() < 30 ? "00" : "30";
                                            return `${aptHour}:${aptMinute}` === time;
                                        });

                                        return (
                                            <div
                                                key={dayIndex}
                                                onClick={() => openNewAppointmentWithDate(day, time)}
                                                className={`min-h-10 p-0.5 border-l border-gray-100 cursor-pointer hover:bg-teal-50 ${isToday(day) ? "bg-teal-50/30" : ""}`}
                                            >
                                                {slotAppointments.map((apt) => (
                                                    <div
                                                        key={apt.id}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                                        className={`text-[10px] p-1 rounded mb-0.5 ${STATUS_COLORS[apt.status]?.bg} ${STATUS_COLORS[apt.status]?.text} cursor-pointer hover:opacity-80`}
                                                    >
                                                        <p className="font-medium truncate">{apt.patient.firstName}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <Card className="border-gray-200 rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gray-50 py-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {monthName}
                            </CardTitle>
                            <span className="text-xs text-gray-500">{filteredAppointments.length} appointments</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 mb-3">No appointments found</p>
                                <Button onClick={() => setShowNewModal(true)} variant="outline" size="sm">
                                    Schedule one now
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedAppointment(apt)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-10 rounded-full ${STATUS_COLORS[apt.status]?.dot || "bg-gray-300"}`} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900 text-sm">
                                                        {apt.patient.firstName} {apt.patient.lastName}
                                                    </p>
                                                    <Badge className={`${STATUS_COLORS[apt.status]?.bg} ${STATUS_COLORS[apt.status]?.text} text-[10px] px-1.5 py-0`}>
                                                        {apt.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                    <span>{new Date(apt.time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                                                    <span>•</span>
                                                    <span>{formatTime(apt.time)}</span>
                                                    <span>•</span>
                                                    <span>{apt.doctorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedAppointment(apt)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                {apt.status === "scheduled" && (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(apt.id, "confirmed")}>
                                                        Confirm
                                                    </DropdownMenuItem>
                                                )}
                                                {(apt.status === "scheduled" || apt.status === "confirmed") && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(apt.id, "completed")}>
                                                            Mark Completed
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCancelAppointment(apt.id)} className="text-red-600">
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {!apt.reminderSent && apt.patient.email && (apt.status === "scheduled" || apt.status === "confirmed") && (
                                                    <DropdownMenuItem onClick={() => handleSendReminder(apt)}>
                                                        Send Reminder
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Modals */}
            {renderNewAppointmentModal()}
            {renderAppointmentDetailsModal()}
        </div>
    );
}

