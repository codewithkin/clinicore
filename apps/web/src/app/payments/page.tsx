"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Polar } from "@polar-sh/sdk";
import { Button } from "@/components/ui/button";

function PaymentsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = authClient.useSession();

    const plan = searchParams.get("plan");
    const customerSessionToken = searchParams.get("customer_session_token");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        async function verifyPayment() {
            if (!customerSessionToken) {
                setError("Payment information not found");
                setLoading(false);
                return;
            }

            setVerifying(true);

            try {
                // Verify payment with Polar
                const response = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerSessionToken
                    }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    setError(result.error || "Payment verification failed");
                    setLoading(false);
                    return;
                }

                // Payment verified successfully
                setLoading(false);
            } catch (err) {
                console.error('Payment verification error:', err);
                setError("Failed to verify payment");
                setLoading(false);
            } finally {
                setVerifying(false);
            }
        }

        verifyPayment();
    }, [customerSessionToken]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/auth/onboarding?step=2")}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                    <p className="text-gray-600 mb-1">
                        Welcome to Clinicore
                    </p>
                    {plan && (
                        <p className="text-lg font-semibold text-teal-600">
                            {plan} Plan
                        </p>
                    )}
                    {plan && (
                        <p className="text-sm text-gray-500 mt-2">
                            Your account has been upgraded
                        </p>
                    )}
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 className="font-semibold mb-3">What's Next?</h2>
                    <ul className="text-left space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>Your 3-day free trial has started</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>Full access to all features</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span>Cancel anytime before trial ends</span>
                        </li>
                    </ul>
                </div>

                <Button
                    onClick={() => router.push("/auth/onboarding?step=3")}
                    size="lg"
                    className="w-full"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}

export default function PaymentsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <PaymentsContent />
        </Suspense>
    );
}
