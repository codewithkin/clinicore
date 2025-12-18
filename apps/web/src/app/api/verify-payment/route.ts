import { NextRequest, NextResponse } from "next/server";
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";
import prisma from "@my-better-t-app/db";
import polar from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { customerSessionToken } = await req.json();

    if (!customerSessionToken) {
      return NextResponse.json(
        { error: "Customer session token is required" },
        { status: 400 }
      );
    }

    try {
      // Verify the customer session with Polar
      const customerData = await polar.customerPortal.customers.get({
        customerSession: customerSessionToken,
      });

      if (!customerData || !customerData.email) {
        return NextResponse.json(
          { error: "Invalid customer session" },
          { status: 400 }
        );
      }

      // Verify the customer email matches the logged-in user
      if (customerData.email !== session.user.email) {
        return NextResponse.json(
          { error: "Customer email does not match user" },
          { status: 403 }
        );
      }

      // Get user's wanted_plan
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { wanted_plan: true },
      });

      if (!user?.wanted_plan) {
        return NextResponse.json(
          { error: "No plan selected" },
          { status: 400 }
        );
      }

      // Payment verified! Update user's plan to their wanted_plan
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          plan: user.wanted_plan,
          // Optionally clear wanted_plan after setting it
          // wanted_plan: null,
        },
      });

      return NextResponse.json({
        success: true,
        plan: user.wanted_plan,
      });
    } catch (polarError: any) {
      console.error("Polar verification error:", polarError);
      return NextResponse.json(
        { error: "Failed to verify payment with Polar" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
