"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Upload, ArrowLeft, Camera } from "lucide-react";
import { uploadLogo } from "@/lib/s3Client";

/* ---------------------------------------------
   Plan definitions (client mirror of server)
---------------------------------------------- */

type PlanId = "starter" | "small_clinic" | "growing_clinic";

const PLAN_LIMITS: Record<PlanId, Record<string, number>> = {
    starter: {
        doctors: 1,
        receptionists: 1,
        patients: 300,
        emailsPerMonth: 500,
        storageGB: 1,
    },
    small_clinic: {
        doctors: 3,
        receptionists: 3,
        patients: 1500,
        emailsPerMonth: 2000,
        storageGB: 5,
    },
    growing_clinic: {
        doctors: 7,
        receptionists: 7,
        patients: 5000,
        emailsPerMonth: 6000,
        storageGB: 20,
    },
};

/* ---------------------------------------------
   Component
---------------------------------------------- */

export default function Onboarding() {
    const { data: session } = authClient.useSession();

    const [step, setStep] = useState<1 | 2>(1);

    // Org state
    const [orgName, setOrgName] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [creatingOrg, setCreatingOrg] = useState(false);

    // Plan state
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

    /* ---------------------------------------------
       Logo upload (S3)
    ---------------------------------------------- */

    async function handleLogoUpload(file: File) {
        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error("Logo must be smaller than 2MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        setUploadingLogo(true);

        try {
            const { url } = await uploadLogo(file, session?.user?.id);
            setLogoUrl(url);
            toast.success("Logo uploaded successfully!");
        } catch (error) {
            console.error('Logo upload error:', error);
            toast.error("Failed to upload logo. Please try again.");
        } finally {
            setUploadingLogo(false);
        }
    }

    /* ---------------------------------------------
       Step 1: Create Organization
    ---------------------------------------------- */

    async function createOrganization() {
        if (!session?.user) return;

        setCreatingOrg(true);

        const slug = orgName.split(" ").join("-").toLowerCase();

        const { error } = await authClient.organization.create({
            name: orgName,
            slug,
            logo: logoUrl ?? undefined,
            userId: session.user.id,
            keepCurrentActiveOrganization: false,
        });

        setCreatingOrg(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        setStep(2);
    }

    /* ---------------------------------------------
       Step 2: Start Polar Checkout
    ---------------------------------------------- */

    async function startCheckout() {
        if (!selectedPlan) return;

        const productMap: Record<PlanId, string> = {
            starter: process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID!,
            small_clinic: process.env.NEXT_PUBLIC_POLAR_SMALL_CLINIC_PRODUCT_ID!,
            growing_clinic: process.env.NEXT_PUBLIC_POLAR_GROWING_CLINIC_PRODUCT_ID!,
        };

        const { data, error } = await authClient.checkout({
            products: [productMap[selectedPlan]],
        });

        if (error || !data?.url) {
            toast.error("Failed to start checkout");
            return;
        }

        window.location.href = data.url;
    }

    /* ---------------------------------------------
       Render
    ---------------------------------------------- */

    return (
        <section className="min-h-screen flex items-center justify-center px-4">
            <article className="w-full max-w-xl flex flex-col gap-10">
                {/* Progress Indicator */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <div className="flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                        >
                            <motion.div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                animate={{ scale: step === 1 ? [1, 1.1, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {step > 1 ? '✓' : '1'}
                            </motion.div>
                            <span className={`text-sm ${step === 1 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                Create hospital
                            </span>
                        </motion.div>
                        <motion.div
                            className="flex-1 mx-4"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                            style={{ transformOrigin: "left" }}
                        >
                            <Progress value={step === 1 ? 50 : 100} className="h-2" />
                        </motion.div>
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <motion.div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                animate={{ scale: step === 2 ? [1, 1.1, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                2
                            </motion.div>
                            <span className={`text-sm ${step === 2 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                Choose plan
                            </span>
                        </motion.div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                        >
                            <h1 className="text-2xl font-medium mb-2">
                                Create your hospital
                            </h1>
                            <p className="text-sm text-gray-500 mb-6">
                                Set up your hospital to continue
                            </p>


                            <div className="flex flex-col items-center gap-4">
                                <Label className="self-start">Logo (optional)</Label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) =>
                                            e.target.files &&
                                            handleLogoUpload(e.target.files[0])
                                        }
                                        disabled={uploadingLogo}
                                    />
                                    <div className={`w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center transition-all hover:border-gray-400 hover:bg-gray-50 ${uploadingLogo ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                        {uploadingLogo ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                                        ) : logoUrl ? (
                                            <img
                                                src={logoUrl}
                                                alt="Logo"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <Camera className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mb-4">
                                    {logoUrl ? 'Click to change logo' : 'Click to upload logo'}
                                    <br />PNG, JPG up to 2MB
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <Label>Hospital name</Label>
                                    <Input
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                    />
                                </div>

                                <Button
                                    disabled={!orgName || creatingOrg}
                                    onClick={createOrganization}
                                >
                                    {creatingOrg ? "Creating..." : "Next"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                        >
                            <h1 className="text-2xl font-medium mb-6">
                                Choose a plan
                            </h1>

                            <div className="grid gap-4">
                                {(Object.keys(PLAN_LIMITS) as PlanId[]).map((plan) => (
                                    <button
                                        key={plan}
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`border rounded-xl p-4 text-left ${selectedPlan === plan
                                            ? "border-green-500"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium capitalize">
                                                {plan.replace("_", " ")}
                                            </span>
                                            {selectedPlan === plan && (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <Button
                                className="mt-6"
                                disabled={!selectedPlan}
                                onClick={startCheckout}
                            >
                                Continue to payment
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </article>
        </section>
    );
}