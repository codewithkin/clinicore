import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { }

export function Badge({ className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full bg-teal-100 text-teal-800 text-xs font-medium px-2 py-0.5",
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export default Badge;
