"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
    Plus,
    Download,
    ExternalLink,
    Check,
    Clock,
    Mail,
    MessageSquare,
    ChevronDown,
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
import { trpc, queryClient } from "@/utils/trpc";

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

type SchedulingSettings = {
    defaultDuration?: number;
    bufferTime?: number;
    bookingWindow?: number;
    cancellationPolicy?: number;
};

type NotificationSettings = {
    emailReminders?: boolean;
    reminderTiming?: number;
    fromEmail?: string;
    replyToEmail?: string;
    appointmentConfirmation?: boolean;
    appointmentReminder?: boolean;
    appointmentCancellation?: boolean;
    patientRegistration?: boolean;
};

type Props = {
    organizationName: string;
    organizationId: string;
    currentPlan: Plan;
    usage: Usage;
    schedulingSettings?: SchedulingSettings;
    notificationSettings?: NotificationSettings;
};

export default function SettingsClient({
    organizationName,
    organizationId,
    currentPlan,
    usage,
    schedulingSettings: initialScheduling,
    notificationSettings: initialNotifications,
}: Props) {
    const [activeTab, setActiveTab] = useState("billing");
    const [customerState, setCustomerState] = useState<any>(null);
    const [loadingPolar, setLoadingPolar] = useState(true);
    const [openCards, setOpenCards] = useState({
        currentPlan: true,
        appointmentDefaults: true,
        emailReminders: true,
        smsReminders: true,
        notificationPreferences: true,
    });

    const toggleCard = (cardName: keyof typeof openCards) => {
        setOpenCards(prev => ({ ...prev, [cardName]: !prev[cardName] }));
    };

    // Settings state
    const [scheduling, setScheduling] = useState<SchedulingSettings>(initialScheduling || {
        defaultDuration: 30,
        bufferTime: 15,
        bookingWindow: 30,
        cancellationPolicy: 24,
    });

    const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications || {
        emailReminders: true,
        reminderTiming: 24,
        fromEmail: "appointments@clinicore.com",
        replyToEmail: "noreply@clinicore.com",
        appointmentConfirmation: true,
        appointmentReminder: true,
        appointmentCancellation: true,
        patientRegistration: false,
    });

    // Fetch Polar customer state and subscriptions via Better Auth portal plugin
    useEffect(() => {
        const fetchPolarData = async () => {
            try {
                // Get customer state (includes customer data, subscriptions, benefits, meters)
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

    // Mutation for saving settings
    const saveSettingsMutation = useMutation({
        mutationFn: async () => {
            return trpc.settings.updateOrganizationSettings.mutate({
                organizationId,
                scheduling,
                notifications,
            });
        },
        onSuccess: () => {
            toast.success("Settings saved successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save settings");
        },
    });

    // Save settings handler
    const saveSettings = () => {
        saveSettingsMutation.mutate();
    };


    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
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
                </TabsList>

                {/* Billing & Plan Tab */}
                <TabsContent value="billing" className="space-y-6">
                    {/* Current Plan */}
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
                                            <CardTitle className="text-lg font-semibold text-gray-900">Appointment Defaults</CardTitle>
                                            <CardDescription className="text-sm text-gray-500 mt-1">
                                                Configure default settings for new appointments
                                            </CardDescription>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${openCards.appointmentDefaults ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="defaultDuration">Default Appointment Duration</Label>
                                            <Select
                                                value={String(scheduling.defaultDuration || 30)}
                                                onValueChange={(v) => setScheduling({ ...scheduling, defaultDuration: Number(v) })}
                                            >
                                                <SelectTrigger id="defaultDuration">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="15">15 minutes</SelectItem>
                                                    <SelectItem value="30">30 minutes</SelectItem>
                                                    <SelectItem value="45">45 minutes</SelectItem>
                                                    <SelectItem value="60">60 minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bufferTime">Buffer Time Between Appointments</Label>
                                            <Select
                                                value={String(scheduling.bufferTime || 15)}
                                                onValueChange={(v) => setScheduling({ ...scheduling, bufferTime: Number(v) })}
                                            >
                                                <SelectTrigger id="bufferTime">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">No buffer</SelectItem>
                                                    <SelectItem value="5">5 minutes</SelectItem>
                                                    <SelectItem value="10">10 minutes</SelectItem>
                                                    <SelectItem value="15">15 minutes</SelectItem>
                                                    <SelectItem value="30">30 minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bookingWindow">Booking Window</Label>
                                        <Select
                                            value={String(scheduling.bookingWindow || 30)}
                                            onValueChange={(v) => setScheduling({ ...scheduling, bookingWindow: Number(v) })}
                                        >
                                            <SelectTrigger id="bookingWindow">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7">7 days in advance</SelectItem>
                                                <SelectItem value="14">14 days in advance</SelectItem>
                                                <SelectItem value="30">30 days in advance</SelectItem>
                                                <SelectItem value="60">60 days in advance</SelectItem>
                                                <SelectItem value="90">90 days in advance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">
                                            How far in advance patients can book appointments
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                                        <Select
                                            value={String(scheduling.cancellationPolicy || 24)}
                                            onValueChange={(v) => setScheduling({ ...scheduling, cancellationPolicy: Number(v) })}
                                        >
                                            <SelectTrigger id="cancellationPolicy">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">No restriction</SelectItem>
                                                <SelectItem value="12">12 hours before</SelectItem>
                                                <SelectItem value="24">24 hours before</SelectItem>
                                                <SelectItem value="48">48 hours before</SelectItem>
                                                <SelectItem value="72">72 hours before</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">
                                            Minimum notice required for cancellations
                                        </p>
                                    </div>

                                    <Button
                                        onClick={saveSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700"
                                        disabled={saveSettingsMutation.isPending}
                                    >
                                        {saveSettingsMutation.isPending ? "Saving..." : "Save Scheduling Preferences"}
                                    </Button>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>

                    {/* Working Hours Reference */}
                    <Card className="rounded-2xl bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Clinic Working Hours</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        To modify your clinic's operating hours and business schedule, visit the{" "}
                                        <a href="/dashboard/clinic" className="text-teal-600 hover:underline font-medium">
                                            Clinic Management
                                        </a>{" "}
                                        page.
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
                                            checked={notifications.emailReminders ?? true}
                                            onCheckedChange={(checked) => setNotifications({ ...notifications, emailReminders: checked })}
                                        />
                                    </div>

                                    <div className="space-y-3 pl-8">
                                        <div className="space-y-2">
                                            <Label htmlFor="emailReminderTime">Reminder Timing</Label>
                                            <Select
                                                value={String(notifications.reminderTiming || 24)}
                                                onValueChange={(v) => setNotifications({ ...notifications, reminderTiming: Number(v) })}
                                            >
                                                <SelectTrigger id="emailReminderTime">
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

                                        <div className="space-y-2">
                                            <Label htmlFor="fromEmail">From Email Address</Label>
                                            <Input
                                                id="fromEmail"
                                                type="email"
                                                value={notifications.fromEmail || ""}
                                                onChange={(e) => setNotifications({ ...notifications, fromEmail: e.target.value })}
                                                placeholder="noreply@clinic.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="replyToEmail">Reply-To Email</Label>
                                            <Input
                                                id="replyToEmail"
                                                type="email"
                                                value={notifications.replyToEmail || ""}
                                                onChange={(e) => setNotifications({ ...notifications, replyToEmail: e.target.value })}
                                                placeholder="contact@clinic.com"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={saveSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700"
                                        disabled={saveSettingsMutation.isPending}
                                    >
                                        {saveSettingsMutation.isPending ? "Saving..." : "Save Email Settings"}
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
                                        <Switch />
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
                                                checked={notifications[pref.key] ?? true}
                                                onCheckedChange={(checked) => setNotifications({ ...notifications, [pref.key]: checked })}
                                            />
                                        </div>
                                    ))}

                                    <Button
                                        onClick={saveSettings}
                                        className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
                                        disabled={saveSettingsMutation.isPending}
                                    >
                                        {saveSettingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
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
