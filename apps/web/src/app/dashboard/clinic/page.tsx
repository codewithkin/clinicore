"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Users,
    Palette,
    Plus,
    Mail,
    Trash2,
    UserCog,
    Shield,
    Upload,
    Globe,
    MapPin,
    Phone,
    Clock,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ClinicPage() {
    const [activeTab, setActiveTab] = useState("staff");

    return (
        <div className="space-y-6 p-3 md:p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
                <p className="text-gray-500 mt-1">
                    Manage your clinic's staff, information, and branding
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                    <TabsTrigger value="staff" className="gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Staff</span>
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Organization</span>
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Branding</span>
                    </TabsTrigger>
                </TabsList>

                {/* Staff Management Tab */}
                <TabsContent value="staff" className="space-y-6">
                    <Card className="border-gray-200 rounded-2xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-gray-900">Team Members</CardTitle>
                                    <CardDescription className="text-sm text-gray-500 mt-1">
                                        Invite and manage staff members, assign roles and permissions
                                    </CardDescription>
                                </div>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Invite Staff
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Seat Usage */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Seats Used</p>
                                        <p className="text-xs text-gray-600 mt-0.5">3 of 7 seats occupied</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-teal-600">3/7</p>
                                        <p className="text-xs text-gray-500">4 available</p>
                                    </div>
                                </div>
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-teal-600 h-2 rounded-full" style={{ width: "43%" }}></div>
                                </div>
                            </div>

                            {/* Staff List */}
                            <div className="space-y-3">
                                {[
                                    { name: "Dr. Sarah Johnson", email: "sarah@clinic.com", role: "Doctor", seats: 1 },
                                    { name: "Dr. Michael Chen", email: "michael@clinic.com", role: "Doctor", seats: 1 },
                                    { name: "Emma Wilson", email: "emma@clinic.com", role: "Receptionist", seats: 1 },
                                ].map((member, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                                <span className="text-teal-700 font-semibold text-sm">
                                                    {member.name.split(" ").map(n => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{member.name}</p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                                                {member.role}
                                            </Badge>
                                            <span className="text-sm text-gray-500">{member.seats} seat</span>
                                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role & Permissions Settings */}
                    <Card className="border-gray-200 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">Role Settings</CardTitle>
                            <CardDescription className="text-sm text-gray-500 mt-1">
                                Configure default roles and permissions for new invites
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="defaultRole">Default Role for New Invites</Label>
                                <Select defaultValue="receptionist">
                                    <SelectTrigger id="defaultRole">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="doctor">Doctor</SelectItem>
                                        <SelectItem value="receptionist">Receptionist</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    New staff members will be assigned this role by default
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                                <Input
                                    id="sessionTimeout"
                                    type="number"
                                    defaultValue="60"
                                    min="15"
                                    max="480"
                                />
                                <p className="text-xs text-gray-500">
                                    Users will be logged out after this period of inactivity
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-teal-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">Admin-Only Actions</p>
                                        <p className="text-sm text-gray-600">Staff management, billing, plan changes</p>
                                    </div>
                                </div>
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                    Enforced
                                </Badge>
                            </div>

                            <Button className="w-full bg-teal-600 hover:bg-teal-700">
                                Save Role Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Organization Info Tab */}
                <TabsContent value="organization" className="space-y-6">
                    <Card className="border-gray-200 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
                            <CardDescription className="text-sm text-gray-500 mt-1">
                                Update your clinic's core details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clinicName">Clinic Name</Label>
                                    <Input id="clinicName" defaultValue="Downtown Medical Clinic" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input id="displayName" defaultValue="Downtown Medical" />
                                    <p className="text-xs text-gray-500">Shown in patient communications</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="publicSlug">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-gray-500" />
                                        Public Slug
                                    </div>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">clinicore.space/</span>
                                    <Input id="publicSlug" defaultValue="downtown-medical" className="flex-1" />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Used for public booking links and patient portal access
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        Address
                                    </div>
                                </Label>
                                <Input id="address" defaultValue="123 Main Street, Suite 200" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            Phone Number
                                        </div>
                                    </Label>
                                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select defaultValue="america/new_york">
                                        <SelectTrigger id="timezone">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="america/new_york">Eastern Time (ET)</SelectItem>
                                            <SelectItem value="america/chicago">Central Time (CT)</SelectItem>
                                            <SelectItem value="america/denver">Mountain Time (MT)</SelectItem>
                                            <SelectItem value="america/los_angeles">Pacific Time (PT)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button className="w-full bg-teal-600 hover:bg-teal-700">
                                Save Organization Info
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Business Hours */}
                    <Card className="border-gray-200 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-teal-600" />
                                    Business Hours
                                </div>
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-500 mt-1">
                                Set your clinic's operating hours for appointments
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { day: "Monday", open: "09:00", close: "17:00", enabled: true },
                                { day: "Tuesday", open: "09:00", close: "17:00", enabled: true },
                                { day: "Wednesday", open: "09:00", close: "17:00", enabled: true },
                                { day: "Thursday", open: "09:00", close: "17:00", enabled: true },
                                { day: "Friday", open: "09:00", close: "17:00", enabled: true },
                                { day: "Saturday", open: "10:00", close: "14:00", enabled: false },
                                { day: "Sunday", open: "10:00", close: "14:00", enabled: false },
                            ].map((schedule) => (
                                <div
                                    key={schedule.day}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            defaultChecked={schedule.enabled}
                                            className="w-4 h-4 text-teal-600 rounded"
                                        />
                                        <span className="font-medium text-gray-900 w-24">{schedule.day}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            defaultValue={schedule.open}
                                            className="w-32"
                                            disabled={!schedule.enabled}
                                        />
                                        <span className="text-gray-500">to</span>
                                        <Input
                                            type="time"
                                            defaultValue={schedule.close}
                                            className="w-32"
                                            disabled={!schedule.enabled}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button className="w-full bg-teal-600 hover:bg-teal-700 mt-4">
                                Save Business Hours
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-6">
                    <Card className="border-gray-200 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">Logo & Visual Identity</CardTitle>
                            <CardDescription className="text-sm text-gray-500 mt-1">
                                Customize your clinic's appearance in the dashboard and patient-facing materials
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Clinic Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                        <Building2 className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <Button variant="outline" className="gap-2">
                                            <Upload className="h-4 w-4" />
                                            Upload Logo
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Recommended: 512x512px, PNG or SVG, max 2MB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <p className="text-sm font-medium text-gray-900 mb-4">Brand Colors</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="primaryColor">Primary Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="primaryColor"
                                                type="color"
                                                defaultValue="#0D9488"
                                                className="w-16 h-10"
                                            />
                                            <Input defaultValue="#0D9488" className="flex-1" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accentColor">Accent Color</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="accentColor"
                                                type="color"
                                                defaultValue="#F97316"
                                                className="w-16 h-10"
                                            />
                                            <Input defaultValue="#F97316" className="flex-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full bg-teal-600 hover:bg-teal-700">
                                Save Branding
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 rounded-2xl bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Branding Guidelines</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Your logo and brand colors will appear in the dashboard, patient emails, appointment reminders, and public booking pages. Choose colors that reflect your clinic's professional identity.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
