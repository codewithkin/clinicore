import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import { getUserOrganization } from "@/lib/dashboard-helpers";
import polar from "@/lib/polar";

export async function GET() {
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

		// Revert to using customer ID instead of email
		const customerSession = await polar.customerSessions.create({
			externalCustomerId: session.user.id,
		});

		const sessionToken = customerSession.token;
		if (!sessionToken) {
			return NextResponse.json({ subscription: null, orders: [] });
		}

		// Fetch subscriptions and orders using customer ID
		const subscriptionsResponse = await fetch(
			"https://sandbox-api.polar.sh/v1/customer-portal/subscriptions",
			{
				headers: {
					Authorization: `Bearer ${sessionToken}`,
				},
			}
		);

		const subscriptions = await subscriptionsResponse.json();
		const activeSubscription = subscriptions.items?.find(
			(sub: any) => sub.status === "active" || sub.status === "trialing"
		);

		const ordersResponse = await fetch(
			"https://sandbox-api.polar.sh/v1/customer-portal/orders?limit=10",
			{
				headers: {
					Authorization: `Bearer ${sessionToken}`,
				},
			}
		);

		const orders = await ordersResponse.json();
		return NextResponse.json({ subscription: activeSubscription, orders: orders.items });
	} catch (error) {
		console.error("Error fetching Polar data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch subscription data", subscription: null, orders: [] },
			{ status: 500 }
		);
	}
}
