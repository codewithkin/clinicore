"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = {
    value: string;
    onChange: (v: string) => void;
    mode?: "date" | "datetime-local";
    className?: string;
};

export default function DatePicker({ value, onChange, mode = "date", className }: Props) {
    return (
        <Input
            type={mode}
            value={value}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            className={className}
        />
    );
}
