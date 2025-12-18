import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarClient } from "./lib/payments";
import prisma from "@my-better-t-app/db";
import { organization } from "better-auth/plugins/organization";
import { sendVerificationEmail } from "./utils/sendVerificationEmail";
import { sendInvitationEmail } from "./utils/sendInvitationEmail";

export const auth = betterAuth({
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

Please verify your email address by clicking the link below:

${url}

If you did not create an account, you can safely ignore this email.`,
      });
    },
  },

  plugins: [
    // Organization plugin with invitation email
    organization({
      async sendInvitationEmail(data) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/accept-invitation/${data.id}`;

        await sendInvitationEmail({
          to: data.email,
          subject: "You're invited to join Clinicore",
          text: `Hi,

You have been invited to join ${data.organization.name} on Clinicore.

Invited by: ${data.inviter.user.name} (${data.inviter.user.email})
Team: ${data.organization.name}

Accept your invitation: ${inviteLink}

If you weren't expecting this, you can ignore this email.`,
        });
      },
    }),

    // Polar payment integration
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
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