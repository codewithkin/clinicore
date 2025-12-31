"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Calendar,
    Bell,
    Clock,
    Mail,
    MessageSquare,
    ChevronDown,
    Info,
    Ruler,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { authClient } from "@/lib/auth-client";

type Plan = {
    id: string;
    name: string;
    price: number;
    perAdditionalSeat: number;
    limits: {
        doctors: number;
        receptionists: number;
        patients: number;
        emailsPerMonth: number;
        storageGB: number;
    };
};

type Usage = {
    seats: { used: number; limit: number };
    patients: { used: number; limit: number };
    emails: { used: number; limit: number };
    storage: { used: number; limit: number };
};

type OrganizationSettings = {
    // Scheduling
    defaultAppointmentLength: number;
    bufferTime: number;
    bookingWindow: number;
    cancellationPolicy: number;
    // Notifications
    emailReminders: boolean;
    reminderTiming: number;
    appointmentConfirmation: boolean;
    appointmentReminder: boolean;
    appointmentCancellation: boolean;
    patientRegistration: boolean;
    // Metrics
    weightUnit: string;
    heightUnit: string;
    temperatureUnit: string;
};

type Props = {
    organizationName: string;
    organizationId: string;
    currentPlan: Plan;
    usage: Usage;
    initialSettings: OrganizationSettings;
};

export default function SettingsClient({
    organizationName,
    organizationId,
    currentPlan,
    usage,
    initialSettings,
}: Props) {
    const [activeTab, setActiveTab] = useState("billing");
    const [customerState, setCustomerState] = useState<any>(null);
    const [loadingPolar, setLoadingPolar] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSettings, setSavedSettings] = useState<OrganizationSettings>(initialSettings);
    const [openCards, setOpenCards] = useState({
        currentPlan: true,
        appointmentDefaults: true,
        emailReminders: true,
        smsReminders: true,
        notificationPreferences: true,
        unitPreferences: true,
    });

    const toggleCard = (cardName: keyof typeof openCards) => {
        setOpenCards(prev => ({ ...prev, [cardName]: !prev[cardName] }));
    };

    // Settings state - all settings in one object
    const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);

    // Track if any settings have changed
    const hasChanges = useMemo(() => {
        return JSON.stringify(settings) !== JSON.stringify(savedSettings);
    }, [settings, savedSettings]);

    // Fetch Polar customer state and subscriptions via Better Auth portal plugin
    useEffect(() => {
        const fetchPolarData = async () => {
            try {
                const stateResponse = await authClient.customer.state();
                if (stateResponse.data) {
                    setCustomerState(stateResponse.data);
                }
            } catch (error) {
                console.error("Error fetching Polar customer state:", error);
            } finally {
                setLoadingPolar(false);
            }
        };

        fetchPolarData();
    }, []);

    // Unified save handler - saves all settings at once
    const saveAllSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/organizations/${organizationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save settings");
            }

            toast.success("Settings saved successfully");
            // Update saved settings to match current (reset dirty state)
            setSavedSettings({ ...settings });
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // Helper to update a single setting
    const updateSetting = <K extends keyof OrganizationSettings>(
        key: K,
        value: OrganizationSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="flex items-center gap-2">
                    <TabsTrigger value="billing" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Billing & Plan</span>
                    </TabsTrigger>
                    <TabsTrigger value="scheduling" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Scheduling</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="gap-2">
                        <Ruler className="h-4 w-4" />
                        <span className="hidden sm:inline">Metrics</span>
                    </TabsTrigger>
                </TabsList>

                {/* Billing & Plan Tab */}
                <TabsContent value="billing" className="space-y-6">
                    <Collapsible open={openCards.currentPlan} onOpenChange={() => toggleCard('currentPlan')}>
                        <Card className="border-gray-200 rounded-2xl">
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Current Plan</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Manage your subscription and view usage limits
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.currentPlan ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4">
                                    {loadingPolar ? (
                                        <p className="text-sm text-gray-500">Loading subscription data...</p>
                                    ) : customerState?.subscriptions && customerState.subscriptions.length > 0 ? (
                                        <>
                                            {customerState.subscriptions.map((sub: any) => (
                                                <div key={sub.id} className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-xl">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-xl font-bold text-gray-900">{sub.product?.name || "Plan"}</h3>
                                                            <Badge className={`${sub.status === "active" ? "bg-teal-600" : sub.status === "trialing" ? "bg-blue-600" : "bg-gray-600"} text-white`}>
                                                                {sub.status || "Active"}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {sub.current_period_start && sub.current_period_end && (
                                                                <>Next billing: {new Date(sub.current_period_end).toLocaleDateString()}</>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-xl">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl font-bold text-gray-900">{currentPlan.name}</h3>
                                                    <Badge className="bg-teal-600 text-white">Active</Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    ${currentPlan.price}/month + ${currentPlan.perAdditionalSeat} per additional seat
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                Change Plan
                                            </Button>
                                        </div>
                                    )}

                                    {/* Usage Limits */}
                                    <div className="space-y-3 pt-4">
                                        <p className="text-sm font-medium text-gray-900">Plan Limits</p>

                                        <div className="space-y-3">
                                            {[
                                                { label: "Seats", used: usage.seats.used, limit: usage.seats.limit, unit: "seats" },
                                                { label: "Patients", used: usage.patients.used, limit: usage.patients.limit, unit: "patients" },
                                                { label: "Emails", used: usage.emails.used, limit: usage.emails.limit, unit: "per month" },
                                                { label: "Storage", used: usage.storage.used.toFixed(1), limit: usage.storage.limit, unit: "GB" },
                                            ].map((item) => {
                                                const percentage = (Number(item.used) / item.limit) * 100;
                                                const isNearLimit = percentage >= 80;
                                                return (
                                                    <div key={item.label} className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-700">{item.label}</span>
                                                            <span className={`font-medium ${isNearLimit ? "text-orange-600" : "text-gray-900"}`}>
                                                                {item.used} / {item.limit} {item.unit}
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${isNearLimit ? "bg-orange-600" : "bg-teal-600"}`}
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                </TabsContent>

                {/* Scheduling Tab */}
                <TabsContent value="scheduling" className="space-y-6">
                    <Collapsible open={openCards.appointmentDefaults} onOpenChange={() => toggleCard('appointmentDefaults')}>
                        <Card className="border-gray-200 rounded-2xl">
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Appointment Scheduling</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Set default appointment duration, buffers, and booking rules
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.appointmentDefaults ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    {/* Time Management */}
                                    <div className="space-y-4">
                                        <div className="pb-4 border-b border-gray-100">
                                            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-teal-600" />
                                                Time Management
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="defaultAppointmentLength" className="text-gray-700 font-medium">Default Appointment Length (minutes)</Label>
                                                    <div className="relative group inline-block">
                                                        <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                            Default length shown when creating new appointments
                                                        </div>
                                                    </div>
                                                </div>
                                                <Input
                                                    id="defaultAppointmentLength"
                                                    type="number"
                                                    min="5"
                                                    max="480"
                                                    value={settings.defaultAppointmentLength}
                                                    onChange={(e) => updateSetting('defaultAppointmentLength', Math.max(5, Math.min(480, parseInt(e.target.value) || 30)))}
                                                    className="bg-white"
                                                    placeholder="30"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="bufferTime" className="text-gray-700 font-medium">Buffer Time Between Appointments (minutes)</Label>
                                                    <div className="relative group inline-block">
                                                        <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                            Time between appointments for preparation/cleanup
                                                        </div>
                                                    </div>
                                                </div>
                                                <Input
                                                    id="bufferTime"
                                                    type="number"
                                                    min="0"
                                                    max="240"
                                                    value={settings.bufferTime}
                                                    onChange={(e) => updateSetting('bufferTime', Math.max(0, Math.min(240, parseInt(e.target.value) || 15)))}
                                                    className="bg-white"
                                                    placeholder="15"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Booking Rules */}
                                    <div className="space-y-4">
                                        <div className="pb-4 border-b border-gray-100">
                                            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-teal-600" />
                                                Booking Rules
                                            </h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="bookingWindow" className="text-gray-700 font-medium">Booking Window (days in advance)</Label>
                                                    <div className="relative group inline-block">
                                                        <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                            How far in advance appointments can be booked
                                                        </div>
                                                    </div>
                                                </div>
                                                <Input
                                                    id="bookingWindow"
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={settings.bookingWindow}
                                                    onChange={(e) => updateSetting('bookingWindow', Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                                                    className="bg-white"
                                                    placeholder="30"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="cancellationPolicy" className="text-gray-700 font-medium">Cancellation Notice Period (hours)</Label>
                                                    <div className="relative group inline-block">
                                                        <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                            Minimum notice required for cancellations
                                                        </div>
                                                    </div>
                                                </div>
                                                <Input
                                                    id="cancellationPolicy"
                                                    type="number"
                                                    min="0"
                                                    max="168"
                                                    value={settings.cancellationPolicy}
                                                    onChange={(e) => updateSetting('cancellationPolicy', Math.max(0, Math.min(168, parseInt(e.target.value) || 24)))}
                                                    className="bg-white"
                                                    placeholder="24"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={saveAllSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!hasChanges || saving}
                                    >
                                        {saving ? "Saving..." : hasChanges ? "Save Settings" : "No Changes"}
                                    </Button>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>

                    {/* Working Hours Reference */}
                    <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-600/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Clinic Operating Hours</p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Set your clinic's working hours and holiday schedules in{" "}
                                        <a href="/dashboard/clinic" className="text-blue-600 hover:text-blue-700 underline font-medium">
                                            Clinic Management
                                        </a>
                                        . These settings control when appointments can be scheduled.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Collapsible open={openCards.emailReminders} onOpenChange={() => toggleCard('emailReminders')}>
                        <Card className="border-gray-200 rounded-2xl">
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Email Reminders</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Configure automatic email notifications for appointments
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.emailReminders ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-teal-600" />
                                            <div>
                                                <p className="font-medium text-gray-900">Send Email Reminders</p>
                                                <p className="text-sm text-gray-500">Notify patients before appointments</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.emailReminders}
                                            onCheckedChange={(checked) => updateSetting('emailReminders', checked)}
                                        />
                                    </div>

                                    <div className="space-y-3 pl-8">
                                        <div className="space-y-2">
                                            <Label htmlFor="reminderTiming">Reminder Timing</Label>
                                            <Select
                                                value={String(settings.reminderTiming)}
                                                onValueChange={(v) => updateSetting('reminderTiming', Number(v))}
                                            >
                                                <SelectTrigger id="reminderTiming">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 hour before</SelectItem>
                                                    <SelectItem value="2">2 hours before</SelectItem>
                                                    <SelectItem value="4">4 hours before</SelectItem>
                                                    <SelectItem value="24">24 hours before</SelectItem>
                                                    <SelectItem value="48">48 hours before</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={saveAllSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!hasChanges || saving}
                                    >
                                        {saving ? "Saving..." : hasChanges ? "Save Settings" : "No Changes"}
                                    </Button>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>

                    <Collapsible open={openCards.smsReminders} onOpenChange={() => toggleCard('smsReminders')}>
                        <Card className="border-gray-200 rounded-2xl">
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">SMS Reminders</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Send text message reminders to patients
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.smsReminders ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="h-5 w-5 text-teal-600" />
                                            <div>
                                                <p className="font-medium text-gray-900">Send SMS Reminders</p>
                                                <p className="text-sm text-gray-500">Text patients before appointments</p>
                                            </div>
                                        </div>
                                        <Switch disabled />
                                    </div>

                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">SMS feature coming soon.</span> Text message reminders will be available in a future update. Email reminders are currently active.
                                        </p>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>

                    <Collapsible open={openCards.notificationPreferences} onOpenChange={() => toggleCard('notificationPreferences')}>
                        <Card className="border-gray-200 rounded-2xl">
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Notification Preferences</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Choose which events trigger notifications
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.notificationPreferences ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-3">
                                    {[
                                        {
                                            key: "appointmentConfirmation" as const,
                                            label: "Appointment Confirmation",
                                            description: "When a patient schedules an appointment"
                                        },
                                        {
                                            key: "appointmentReminder" as const,
                                            label: "Appointment Reminder",
                                            description: "Reminder sent before appointment time"
                                        },
                                        {
                                            key: "appointmentCancellation" as const,
                                            label: "Appointment Cancellation",
                                            description: "When a patient cancels an appointment"
                                        },
                                        {
                                            key: "patientRegistration" as const,
                                            label: "New Patient Registration",
                                            description: "When a new patient is registered in the system"
                                        },
                                    ].map((pref) => (
                                        <div
                                            key={pref.key}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{pref.label}</p>
                                                <p className="text-sm text-gray-500">{pref.description}</p>
                                            </div>
                                            <Switch
                                                checked={settings[pref.key]}
                                                onCheckedChange={(checked) => updateSetting(pref.key, checked)}
                                            />
                                        </div>
                                    ))}

                                    <Button
                                        onClick={saveAllSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!hasChanges || saving}
                                    >
                                        {saving ? "Saving..." : hasChanges ? "Save Settings" : "No Changes"}
                                    </Button>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                </TabsContent>

                {/* Metrics Tab */}
                <TabsContent value="metrics" className="space-y-6">
                    <Collapsible open={openCards.unitPreferences} onOpenChange={() => toggleCard('unitPreferences')}>
                        <Card className="border-gray-200 rounded-2xl">
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold text-gray-900">Units of Measurement</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Configure preferred units for weight, height, and temperature across your clinic
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.unitPreferences ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Weight Unit */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="weightUnit" className="text-gray-700 font-medium">Weight</Label>
                                                <div className="relative group inline-block">
                                                    <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                        Unit used for patient weight measurements
                                                    </div>
                                                </div>
                                            </div>
                                            <Select
                                                value={settings.weightUnit}
                                                onValueChange={(v) => updateSetting('weightUnit', v)}
                                            >
                                                <SelectTrigger id="weightUnit">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Height Unit */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="heightUnit" className="text-gray-700 font-medium">Height</Label>
                                                <div className="relative group inline-block">
                                                    <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                        Unit used for patient height measurements
                                                    </div>
                                                </div>
                                            </div>
                                            <Select
                                                value={settings.heightUnit}
                                                onValueChange={(v) => updateSetting('heightUnit', v)}
                                            >
                                                <SelectTrigger id="heightUnit">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                                    <SelectItem value="m">Meters (m)</SelectItem>
                                                    <SelectItem value="ft_in">Feet & Inches (ft/in)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Temperature Unit */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="temperatureUnit" className="text-gray-700 font-medium">Temperature</Label>
                                                <div className="relative group inline-block">
                                                    <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                                        Unit used for patient temperature measurements
                                                    </div>
                                                </div>
                                            </div>
                                            <Select
                                                value={settings.temperatureUnit}
                                                onValueChange={(v) => updateSetting('temperatureUnit', v)}
                                            >
                                                <SelectTrigger id="temperatureUnit">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                                                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">Note:</span> These unit preferences will be applied across the application, including medical records and patient vitals. Existing records will display in the new units.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={saveAllSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!hasChanges || saving}
                                    >
                                        {saving ? "Saving..." : hasChanges ? "Save Settings" : "No Changes"}
                                    </Button>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                </TabsContent>
            </Tabs>
        </div>
    );
}
