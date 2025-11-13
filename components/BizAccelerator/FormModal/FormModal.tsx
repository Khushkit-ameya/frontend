"use client";

import React from "react";
import { X } from "lucide-react";

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    disabled?: boolean;
    onBack?: () => void;
    showBackButton?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = "lg",
    className = "",
    disabled = false,
    onBack,
    showBackButton = false,
}) => {
    if (!isOpen) return null;

    const shouldShowBackButton = showBackButton || title === "New Email";

    const handleCloseClick = () => {
        if (shouldShowBackButton && onBack) {
            onBack(); // Go back to previous view
        } else {
            onClose(); // Close entire modal
        }
    };

    const sizeClasses = {
        sm: "w-[400px]",
        md: "w-[600px]",
        lg: "w-[800px]",
        xl: "w-[90%]",
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div
                className={`bg-white rounded-lg shadow-xl overflow-hidden flex flex-col ${sizeClasses[size]} ${className}`}
                style={{ maxHeight: '90vh' }}
            >
                <div className="flex items-center justify-between p-4 bg-white">
                    <h2 className="font-inter font-[500] text-[25px] text-gray-900">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        style={{ backgroundColor: "#C81C1F" }}
                    >
                        <X size={16} className="text-white dark:text-gray-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};