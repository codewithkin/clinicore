import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarClient } from "./lib/payments";
import prisma from "@my-better-t-app/db";
import { organization } from "better-auth/plugins/organization";
import { sendVerificationEmail } from "./utils/sendVerificationEmail";
import { sendInvitationEmail } from "./utils/sendInvitationEmail";
import { randomBytes } from "crypto";

let authRef: ReturnType<typeof betterAuth>;

async function ensureInvitedUserExists(email: string) {
  const lowerEmail = email.toLowerCase();

  // Short-circuit if user already exists
  const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existing) {
    return { created: false as const, password: undefined as string | undefined };
  }

  const password = randomBytes(12).toString("base64url").slice(0, 16);
  try {
    const nameFallback = lowerEmail.split("@")[0] || "Clinicore user";
    const result: any = await (authRef?.api as any)?.signUpEmail?.({
      body: {
        name: nameFallback,
        email: lowerEmail,
        password,
        rememberMe: true,
      },
    });

    if (result?.error) {
      // If the error is "already exists", treat as not created; otherwise bubble up
      const message = result.error?.message || "";
      const alreadyExists = message.toLowerCase().includes("already") || message.toLowerCase().includes("exists");
      if (!alreadyExists) throw new Error(message || "Failed to create user for invitation");
      return { created: false as const, password: undefined as string | undefined };
    }

    return { created: true as const, password };
  } catch (err) {
    // Log and continue; invitation should still go out
    console.error("Failed to auto-create user for invitation", err);
    return { created: false as const, password: undefined as string | undefined };
  }
}

export const auth = authRef = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [process.env.NEXT_PUBLIC_CORS_ORIGIN || ""],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async (
      { user, url },
      _request
    ) => {
      await sendVerificationEmail({
        to: user.email,
        subject: "Verify your Clinicore email address",
        text: `Welcome to Clinicore 👋

Please verify your email address by clicking the button below:
${url}

If you did not create an account, you can safely ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <p>Welcome to Clinicore 👋</p>
            <p>Please verify your email address by clicking the button below:</p>
            <p>
              <a href="${url}" style="background:#22c55e;color:#fff;padding:10px 16px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block;">Verify email</a>
            </p>
            <p>If you did not create an account, you can safely ignore this email.</p>
          </div>
        `,
      });
    },
  },

  plugins: [
    // Organization plugin with invitation email
    organization({
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const userResult = await ensureInvitedUserExists(data.email);
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/accept-invitation/${data.id}`;

        const passwordText = userResult.created
          ? `\nTemporary password: ${userResult.password}\nPlease sign in and change your password after verifying your email.`
          : "";

        const passwordHtml = userResult.created
          ? `<p><strong>Temporary password:</strong> ${userResult.password}</p><p>Please verify your email, then sign in and change your password.</p>`
          : "";

        try {
          await sendInvitationEmail({
            to: data.email,
            subject: "You're invited to join Clinicore",
            text: `Hi,

You have been invited to join ${data.organization.name} on Clinicore.

Invited by: ${data.inviter.user.name} (${data.inviter.user.email})
Team: ${data.organization.name}

Accept your invitation: ${inviteLink}
${passwordText}

If you weren't expecting this, you can ignore this email.`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                <p>Hi,</p>
                <p>You have been invited to join <strong>${data.organization.name}</strong> on Clinicore.</p>
                <p>Invited by: ${data.inviter.user.name} (${data.inviter.user.email})</p>
                <p>Team: ${data.organization.name}</p>
                ${passwordHtml}
                <p>
                  <a href="${inviteLink}" style="background:#22c55e;color:#fff;padding:10px 16px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block;">Accept invitation</a>
                </p>
                <p>If you weren't expecting this, you can ignore this email.</p>
              </div>
            `,
          });
        } catch (err) {
          // Do not fail the invitation if email delivery fails; log for ops visibility
          console.error("Failed to send invitation email", err);
        }
      },
    }),

    // Polar payment integration
    polar({
      client: polarClient,
      // Skip customer creation during sign-up to avoid blocking invitation auto-provision
      // (customers will be created during checkout flows instead).
      createCustomerOnSignUp: false,
      enableCustomerPortal: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_STARTER_PRODUCT_ID || "",
              slug: process.env.POLAR_STARTER_PRODUCT_SLUG || "",
            },
            {
              productId: process.env.POLAR_SMALL_CLINIC_PRODUCT_ID || "",
              slug: process.env.POLAR_SMALL_CLINIC_PRODUCT_SLUG || "",
            },
            {
              productId: process.env.POLAR_GROWING_CLINIC_PRODUCT_ID || "",
              slug: process.env.POLAR_GROWING_CLINIC_PRODUCT_SLUG || "",
            },
          ],
          successUrl: process.env.NEXT_PUBLIC_POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }) as any,

    nextCookies(),
  ],
});

export const yearlyPlans = {
  starter: 312,
  small_clinic: 550,
  growing_clinic: 1020,
};

export { sendInvitationEmail } from "./utils/sendInvitationEmail";