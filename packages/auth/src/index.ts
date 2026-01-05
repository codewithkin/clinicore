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

async function ensureInvitedUserExists(
  email: string
): Promise<{ exists: boolean; created: boolean; password?: string }> {
  const lowerEmail = email.toLowerCase();

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
  if (existing) {
    return { exists: true, created: false };
  }

  // User doesn't exist - create with temporary password
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
      const message = result.error?.message || "";
      const alreadyExists = message.toLowerCase().includes("already") || message.toLowerCase().includes("exists");
      if (alreadyExists) {
        return { exists: true, created: false };
      }
      throw new Error(message || "Failed to create user for invitation");
    }

    return { exists: false, created: true, password };
  } catch (err) {
    console.error("Failed to auto-create user for invitation", err);
    return { exists: false, created: false };
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
      // Check if this user has a pending invitation (invited flow)
      const pendingInvite = await prisma.invitation.findFirst({
        where: {
          email: user.email.toLowerCase(),
          status: "pending",
        },
        include: {
          organization: true,
          user: true, // This is the inviter
        },
      });

      if (pendingInvite) {
        // This is an invited user - send invitation-styled verification
        const subject = `Verify your email to join ${pendingInvite.organization.name} on Clinicore`;
        const text = `Welcome to Clinicore 👋

You've been invited by ${pendingInvite.user.name} to join ${pendingInvite.organization.name}.

First, please verify your email address by clicking the link below:
${url}

Next Steps:
1. Click the verification link above
2. Once verified, you'll be redirected to accept your invitation
3. Sign in and start collaborating with your team

Didn't request this?
Someone invited you to their clinic on Clinicore. If you weren't expecting this, you can safely ignore this email.`;

        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <p style="font-size: 18px;">Welcome to Clinicore 👋</p>
            <p>You've been invited by <strong>${pendingInvite.user.name}</strong> to join <strong>${pendingInvite.organization.name}</strong>.</p>
            <p>First, please verify your email address by clicking the button below:</p>
            <p>
              <a href="${url}" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block;">Verify email & join team</a>
            </p>

            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #22c55e; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">Next Steps:</p>
              <ol style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 4px;">Click the verification link above</li>
                <li style="margin-bottom: 4px;">Once verified, you'll be redirected to accept your invitation</li>
                <li>Sign in and start collaborating with your team</li>
              </ol>
            </div>

            <div style="margin-top: 24px; padding: 12px; background-color: #fef3c7; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #78350f;">
                <strong>Didn't request this?</strong><br>
                Someone invited you to their clinic on Clinicore. If you weren't expecting this, you can safely ignore this email.
              </p>
            </div>
          </div>
        `;

        await sendVerificationEmail({
          to: user.email,
          subject,
          text,
          html,
        });
      } else {
        // Regular verification email
        await sendVerificationEmail({
          to: user.email,
          subject: "Verify your Clinicore email address",
          text: `Welcome to Clinicore 👋

Please verify your email address by clicking the link below:
${url}

Next Steps:
1. Click the verification link above
2. Complete your profile setup
3. Start using Clinicore

Didn't request this?
If you didn't create a Clinicore account, you can safely ignore this email.`,
          html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <p>Welcome to Clinicore 👋</p>
            <p>Please verify your email address by clicking the button below:</p>
            <p>
              <a href="${url}" style="background:#22c55e;color:#fff;padding:10px 16px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block;">Verify email</a>
            </p>
            
            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #22c55e; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f172a;">Next Steps:</p>
              <ol style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 4px;">Click the verification link above</li>
                <li style="margin-bottom: 4px;">Complete your profile setup</li>
                <li>Start using Clinicore</li>
              </ol>
            </div>

            <div style="margin-top: 24px; padding: 12px; background-color: #fef3c7; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #78350f;">
                <strong>Didn't request this?</strong><br>
                If you didn't create a Clinicore account, you can safely ignore this email.
              </p>
            </div>
          </div>
        `,
        });
      }
    },
  },

  plugins: [
    // Organization plugin with invitation email
    organization({
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        // Check if user exists - if not, create them and skip sending invitation email
        // (it will be sent after they verify their email)
        const userResult = await ensureInvitedUserExists(data.email);

        // If user was just created (doesn't exist), don't send invitation email yet
        // The verification email will handle the invitation flow
        if (userResult.created) {
          console.log(`User ${data.email} created for invitation. Verification email will handle invite flow.`);
          return;
        }

        // User already exists - send standard invitation email
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/accept-invitation/${data.id}`;

        try {
          await sendInvitationEmail({
            to: data.email,
            subject: "You're invited to join Clinicore",
            text: `Hi,

You have been invited to join ${data.organization.name} on Clinicore.

Invited by: ${data.inviter.user.name} (${data.inviter.user.email})
Team: ${data.organization.name}

Accept your invitation: ${inviteLink}

If you weren't expecting this, you can ignore this email.`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                <p>Hi,</p>
                <p>You have been invited to join <strong>${data.organization.name}</strong> on Clinicore.</p>
                <p style="color: #64748b;">
                  Invited by: ${data.inviter.user.name} (${data.inviter.user.email})<br>
                  Team: ${data.organization.name}
                </p>
                <p style="margin-top: 20px;">
                  <a href="${inviteLink}" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block;">Accept invitation</a>
                </p>
                <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
                  If you weren't expecting this, you can ignore this email.
                </p>
              </div>
            `,
          });
        } catch (err) {
          console.error("Failed to send invitation email", err);
        }
      },
    }),

    // Polar payment integration
    polar({
      client: polarClient as any,
      createCustomerOnSignUp: true, // Enable automatic customer creation
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
export { sendAppointmentReminder } from "./utils/sendAppointmentReminder";
export { sendClinicReport } from "./utils/sendClinicReport";