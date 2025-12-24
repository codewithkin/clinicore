import { NextResponse } from "next/server";
import { db } from "@my-better-t-app/db";
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a member of this organization
        const member = await db.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
        }

        const organization = await db.organization.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                // Scheduling settings
                defaultAppointmentLength: true,
                bufferTime: true,
                bookingWindow: true,
                cancellationPolicy: true,
                // Notification settings
                emailReminders: true,
                reminderTiming: true,
                appointmentConfirmation: true,
                appointmentReminder: true,
                appointmentCancellation: true,
                patientRegistration: true,
            },
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        return NextResponse.json({ organization });
    } catch (error) {
        console.error("Error fetching organization:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a member of this organization (any member can update settings)
        const member = await db.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
        }

        const body = await request.json();

        // Build update data from request body
        const updateData: Record<string, number | boolean | null> = {};

        // Scheduling settings
        if (body.defaultAppointmentLength !== undefined) {
            updateData.defaultAppointmentLength = body.defaultAppointmentLength ? parseInt(body.defaultAppointmentLength) : null;
        }
        if (body.bufferTime !== undefined) {
            updateData.bufferTime = body.bufferTime ? parseInt(body.bufferTime) : null;
        }
        if (body.bookingWindow !== undefined) {
            updateData.bookingWindow = body.bookingWindow ? parseInt(body.bookingWindow) : null;
        }
        if (body.cancellationPolicy !== undefined) {
            updateData.cancellationPolicy = body.cancellationPolicy ? parseInt(body.cancellationPolicy) : null;
        }

        // Notification settings
        if (body.emailReminders !== undefined) {
            updateData.emailReminders = Boolean(body.emailReminders);
        }
        if (body.reminderTiming !== undefined) {
            updateData.reminderTiming = body.reminderTiming ? parseInt(body.reminderTiming) : null;
        }
        if (body.appointmentConfirmation !== undefined) {
            updateData.appointmentConfirmation = Boolean(body.appointmentConfirmation);
        }
        if (body.appointmentReminder !== undefined) {
            updateData.appointmentReminder = Boolean(body.appointmentReminder);
        }
        if (body.appointmentCancellation !== undefined) {
            updateData.appointmentCancellation = Boolean(body.appointmentCancellation);
        }
        if (body.patientRegistration !== undefined) {
            updateData.patientRegistration = Boolean(body.patientRegistration);
        }

        const organization = await db.organization.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                defaultAppointmentLength: true,
                bufferTime: true,
                bookingWindow: true,
                cancellationPolicy: true,
                emailReminders: true,
                reminderTiming: true,
                appointmentConfirmation: true,
                appointmentReminder: true,
                appointmentCancellation: true,
                patientRegistration: true,
            },
        });

        return NextResponse.json({ organization });
    } catch (error) {
        console.error("Error updating organization:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
