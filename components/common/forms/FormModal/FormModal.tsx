"use client";

import React from "react";
import { X } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  maxHeight?: string;
  className?: string;
  disabled?: boolean;
  // Add these new props for back navigation
  onBack?: () => void;
  showBackButton?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  maxHeight = "95vh",
  className = "",
  disabled = false,
  onBack,
  showBackButton = false,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-[400px]",
    md: "w-[600px]",
    lg: "w-[800px]",
    xl: "w-[90%]",
  };

  // Determine if we should show back button instead of close
  const shouldShowBackButton = showBackButton || title === "New Email";

  const handleCloseClick = () => {
    if (shouldShowBackButton && onBack) {
      onBack(); // Go back to previous view
    } else {
      onClose(); // Close entire modal
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col ${sizeClasses[size]} ${className}`}
        style={{ maxHeight }}
      >
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 relative z-10">
          <h2 className="font-inter font-[500] text-[25px] leading-[100%] tracking-normal text-[#4F5051] dark:text-white">
            {title}
          </h2>
          <button
            onClick={handleCloseClick}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ backgroundColor: "#C81C1F" }}
          >
            <X size={16} className="text-white dark:text-gray-400" />
          </button>
        </div>
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    </div>
  );
};