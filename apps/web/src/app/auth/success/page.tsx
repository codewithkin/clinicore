"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { MailCheck, ArrowRight } from "lucide-react";

/**
 * Shown after successful signup
 * - Confirms account creation
 * - Prompts email verification
 * - Guides user to next step
 */
export default function AuthSuccessPage() {
    return (
        <section className="min-h-screen flex items-center justify-center px-4">
            <motion.article
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md flex flex-col gap-10 text-center"
            >
                {/* Branding */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-green-500 font-medium text-sm">
                        Clinicore
                    </span>

                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50">
                        <MailCheck className="w-7 h-7 text-green-500" />
                    </div>

                    <h1 className="text-2xl font-medium mt-2">
                        Account created
                    </h1>

                    <p className="text-sm text-gray-500 max-w-sm">
                        We’ve sent a verification link to your email address.
                        Please verify your email to continue.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-gray-500">
                        Didn’t receive the email? Check your spam folder or{" "}
                        <Link
                            href="/auth/signup"
                            className="text-green-500 hover:text-green-600 font-medium"
                        >
                            sign up again
                        </Link>
                        .
                    </p>
                </div>
            </motion.article>
        </section>
    );
}