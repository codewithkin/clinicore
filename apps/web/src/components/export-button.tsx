"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Table } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ExportFormat = "pdf" | "csv";

type ExportButtonProps<T> = {
    data: T[];
    allData: T[];
    filename: string;
    columns: {
        header: string;
        accessor: (item: T) => string | number;
    }[];
    title?: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
};

export default function ExportButton<T>({
    data,
    allData,
    filename,
    columns,
    title = "Export Data",
    variant = "outline",
    size = "sm",
    className = "",
}: ExportButtonProps<T>) {
    const [showScopeModal, setShowScopeModal] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);

    const handleFormatSelect = (format: ExportFormat) => {
        setSelectedFormat(format);
        setShowScopeModal(true);
    };

    const handleExport = (useAllData: boolean) => {
        const dataToExport = useAllData ? allData : data;

        if (selectedFormat === "csv") {
            exportToCSV(dataToExport);
        } else if (selectedFormat === "pdf") {
            exportToPDF(dataToExport);
        }

        setShowScopeModal(false);
        setSelectedFormat(null);
    };

    const exportToCSV = (dataToExport: T[]) => {
        // Create CSV header
        const headers = columns.map(col => col.header).join(",");

        // Create CSV rows
        const rows = dataToExport.map(item =>
            columns.map(col => {
                const value = col.accessor(item);
                // Escape values that contain commas or quotes
                const stringValue = String(value);
                if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(",")
        );

        const csvContent = [headers, ...rows].join("\n");

        // Create and download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = (dataToExport: T[]) => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text(title, 14, 15);

        // Add date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })}`, 14, 22);

        // Prepare table data
        const headers = columns.map(col => col.header);
        const rows = dataToExport.map(item =>
            columns.map(col => String(col.accessor(item)))
        );

        // Add table
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 28,
            theme: "grid",
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [13, 148, 136], // teal-600
                textColor: [255, 255, 255],
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251], // gray-50
            },
        });

        // Save the PDF
        doc.save(`${filename}.pdf`);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={variant} size={size} className={className}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleFormatSelect("csv")}>
                        <Table className="h-4 w-4 mr-2" />
                        Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFormatSelect("pdf")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as PDF
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showScopeModal} onOpenChange={setShowScopeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Data</DialogTitle>
                        <DialogDescription>
                            Would you like to export all data or just the current page?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => handleExport(false)}
                                variant="outline"
                                className="w-full justify-start h-auto py-4"
                            >
                                <div className="text-left">
                                    <div className="font-semibold">Current Page</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Export {data.length} {data.length === 1 ? 'item' : 'items'} from the current page
                                    </div>
                                </div>
                            </Button>
                            <Button
                                onClick={() => handleExport(true)}
                                variant="outline"
                                className="w-full justify-start h-auto py-4"
                            >
                                <div className="text-left">
                                    <div className="font-semibold">All Data</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Export all {allData.length} {allData.length === 1 ? 'item' : 'items'}
                                    </div>
                                </div>
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowScopeModal(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
