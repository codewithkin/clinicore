import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { db } from "@my-better-t-app/db";
import { getUserOrganization } from "@/lib/dashboard-helpers";

type OrganizationSettings = {
	scheduling?: {
		defaultDuration?: number;
		bufferTime?: number;
		bookingWindow?: number;
		cancellationPolicy?: number;
	};
	notifications?: {
		emailReminders?: boolean;
		reminderTiming?: number;
		fromEmail?: string;
		replyToEmail?: string;
		appointmentConfirmation?: boolean;
		appointmentReminder?: boolean;
		appointmentCancellation?: boolean;
		patientRegistration?: boolean;
	};
};

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const queryOrgId = searchParams.get("organizationId");

		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const organizationId = queryOrgId || await getUserOrganization(session.user.id);
		if (!organizationId) {
			return NextResponse.json({ error: "No organization found" }, { status: 404 });
		}

		const organization = await db.organization.findUnique({
			where: { id: organizationId },
			select: { metadata: true },
		});

		if (!organization) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		const settings: OrganizationSettings = organization.metadata
			? JSON.parse(organization.metadata)
			: {};

		return NextResponse.json({
			settings: {
				scheduling: settings.scheduling || {
					defaultDuration: 30,
					bufferTime: 15,
					bookingWindow: 30,
					cancellationPolicy: 24,
				},
				notifications: settings.notifications || {
					emailReminders: true,
					reminderTiming: 24,
					fromEmail: "appointments@clinicore.com",
					replyToEmail: "noreply@clinicore.com",
					appointmentConfirmation: true,
					appointmentReminder: true,
					appointmentCancellation: true,
					patientRegistration: false,
				},
			}
		});
	} catch (error) {
		console.error("Error fetching settings:", error);
		return NextResponse.json(
			{ error: "Failed to fetch settings" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const organizationId = await getUserOrganization(session.user.id);
		if (!organizationId) {
			return NextResponse.json({ error: "No organization found" }, { status: 404 });
		}

		const body = await request.json();

		const organization = await db.organization.findUnique({
			where: { id: organizationId },
			select: { metadata: true },
		});

		if (!organization) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		const currentSettings: OrganizationSettings = organization.metadata
			? JSON.parse(organization.metadata)
			: {};

		const updatedSettings: OrganizationSettings = {
			...currentSettings,
			...body,
		};

		await db.organization.update({
			where: { id: organizationId },
			data: { metadata: JSON.stringify(updatedSettings) },
		});

		return NextResponse.json({ success: true, settings: updatedSettings });
	} catch (error) {
		console.error("Error updating settings:", error);
		return NextResponse.json(
			{ error: "Failed to update settings" },
			{ status: 500 }
		);
	}
}
