import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { getUserOrganization, getUserRole, isAdmin as checkIsAdmin } from "@/lib/dashboard-helpers";
import AppointmentsClient from "./appointments-client";

export default async function AppointmentsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/auth/signup");
    }

    const organizationId = await getUserOrganization(session.user.id);
    const userRole = organizationId
        ? await getUserRole(session.user.id, organizationId)
        : "receptionist";
    const isAdminUser = checkIsAdmin(userRole);

    if (!organizationId) {
        redirect("/auth/onboarding");
    }

    // Fetch appointments for the current month (and surrounding weeks)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Include next month too

    const appointments = await db.appointment.findMany({
        where: {
            patient: {
                organizationId,
            },
            time: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
        include: {
            patient: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            },
        },
        orderBy: { time: "asc" },
    });

    // Fetch patients for the new appointment modal
    const patients = await db.patient.findMany({
        where: { organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
        },
        orderBy: { lastName: "asc" },
    });

    // Fetch staff members (doctors) for assignment
    const staff = await db.member.findMany({
        where: {
            organizationId,
            role: { in: ["admin", "doctor"] },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    const doctors = staff.map((m) => ({
        id: m.user.id,
        name: m.user.name,
    }));

    // Get organization settings
    const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: {
            id: true,
            name: true,
            defaultAppointmentLength: true,
            emailReminders: true,
            reminderTiming: true,
        },
    });

    return (
        <AppointmentsClient
            initialAppointments={appointments}
            patients={patients}
            doctors={doctors}
            organizationId={organizationId}
            settings={{
                defaultDuration: organization?.defaultAppointmentLength || 30,
                emailReminders: organization?.emailReminders ?? true,
                reminderTiming: organization?.reminderTiming || 24,
            }}
            isAdmin={isAdminUser}
            userRole={userRole}
        />
    );
}
