"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreate?: (data: any) => void;
};

export default function NewPatientModal({ open, onClose, onCreate }: Props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { firstName, lastName, email, phone, dob };
        onCreate?.(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">New Patient</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <Input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="flex-1" />
                        <Input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="flex-1" />
                    </div>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full" />
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full" />
                    <DatePicker value={dob} onChange={setDob} mode="date" className="w-full" />
                    <div className="flex justify-end gap-2 mt-3">
                        <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2">Cancel</Button>
                        <Button type="submit" className="px-4 py-2">Create</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
