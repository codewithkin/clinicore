import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarClient } from "./lib/payments";
import prisma from "@my-better-t-app/db";
import { organization } from "better-auth/plugins/organization";
import { sendVerificationEmail } from "./utils/sendVerificationEmail";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [process.env.CORS_ORIGIN || ""],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification: {
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
    // Organization plugin
    organization(),

    // Polar payment integration
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRODUCT_ID || "",
              slug: process.env.POLAR_PRODUCT_SLUG || "",
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL || "",
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }) as any,

    nextCookies(),
  ],
});