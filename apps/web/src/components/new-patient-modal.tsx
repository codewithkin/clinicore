"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "sonner";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreate?: (data: any) => void;
    organizationId?: string;
};

export default function NewPatientModal({ open, onClose, onCreate, organizationId }: Props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = { firstName, lastName, email, phone, dob, organizationId };
            const response = await fetch("/api/patients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create patient");
            }

            const data = await response.json();
            onCreate?.(data.patient);
            onClose();
            toast.success("Patient created");
            // Reset form
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setDob("");
        } catch (err: any) {
            const msg = err.message || "Failed to create patient";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">New Patient</h3>
                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <Input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="flex-1" />
                        <Input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="flex-1" />
                    </div>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full" />
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full" />
                    <DatePicker value={dob} onChange={setDob} mode="date" className="w-full" />
                    <div className="flex justify-end gap-2 mt-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-4 py-2">Cancel</Button>
                        <Button type="submit" disabled={loading} className="px-4 py-2">{loading ? "Creating..." : "Create"}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
