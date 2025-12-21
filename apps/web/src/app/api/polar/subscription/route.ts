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

		// Create a customer portal session to get subscription data
		const customerSession = await polar.customerSessions.create({
			customerEmail: session.user.email,
		});

		if (!customerSession.customerSessionToken) {
			return NextResponse.json({ subscription: null, orders: [] });
		}

		// Get subscriptions
		const subscriptionsResponse = await fetch(
			"https://sandbox-api.polar.sh/v1/customer-portal/subscriptions",
			{
				headers: {
					Authorization: `Bearer ${customerSession.customerSessionToken}`,
				},
			}
		);

		const subscriptions = await subscriptionsResponse.json();
		const activeSubscription = subscriptions.items?.find(
			(sub: any) => sub.status === "active" || sub.status === "trialing"
		);

		// Get orders (for invoices)
		const ordersResponse = await fetch(
			"https://sandbox-api.polar.sh/v1/customer-portal/orders?limit=10",
			{
				headers: {
					Authorization: `Bearer ${customerSession.customerSessionToken}`,
				},
			}
		);

		const orders = await ordersResponse.json();

		return NextResponse.json({
			subscription: activeSubscription || null,
			orders: orders.items || [],
		});
	} catch (error) {
		console.error("Error fetching Polar data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch subscription data", subscription: null, orders: [] },
			{ status: 500 }
		);
	}
}
