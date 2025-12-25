import { TrendingUp, TrendingDown } from "lucide-react";
import type React from "react";

type StatItemProps = {
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    iconBgColor?: string;
    value: string | number;
    label: string;
    change?: string;
    trend?: "up" | "down" | "neutral";
};

export default function StatItem({
    icon: Icon,
    iconColor = "text-teal-600",
    iconBgColor = "bg-teal-50",
    value,
    label,
    change,
    trend = "neutral",
}: StatItemProps) {
    return (
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${iconBgColor}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
                {change && (
                    <div className="flex items-center gap-1 mt-0.5">
                        {trend === "up" && (
                            <>
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600 font-medium">{change}</span>
                            </>
                        )}
                        {trend === "down" && (
                            <>
                                <TrendingDown className="h-3 w-3 text-red-600" />
                                <span className="text-xs text-red-600 font-medium">{change}</span>
                            </>
                        )}
                        {trend === "neutral" && (
                            <span className="text-xs text-gray-500">{change}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
