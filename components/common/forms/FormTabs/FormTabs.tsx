// components/common/forms/FormTabs/FormTabs.tsx
"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";

interface Tab {
  key: string;
  label: string;
  icon: string | StaticImageData;
  disabled?: boolean; // Add disabled prop
}

interface FormTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  companyThemeColor?: string;
  className?: string;
}

export const FormTabs: React.FC<FormTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  companyThemeColor,
  className = "",
}) => {
  return (
    <div
      className={`flex border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-gray-900 ${className}`}
    >
      {tabs.map(({ key, label, icon, disabled = false }, index) => {
        const isActive = activeTab === key;
        const isLast = index === tabs.length - 1;

        return (
          <button
            key={key}
            className={`relative flex items-center gap-2 px-4 pr-5 py-2 text-sm font-inter font-[400] transition-colors capitalize
              ${isActive
                ? "text-[#C81C1F] border-b-2 border-[#C81C1F]"
                : disabled 
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900"}
            `}
            onClick={() => !disabled && onTabChange(key)}
            disabled={disabled}
            style={
              isActive
                ? { borderBottomColor: "#C81C1F", color: "#C81C1F" }
                : {}
            }
          >
            <Image 
              src={icon} 
              alt={label} 
              width={16} 
              height={16} 
              className={disabled ? "opacity-50" : ""}
            />
            {label}

            {/* right divider, slightly inset to avoid overlap */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute right-[-0.5px] top-2 bottom-2 w-px bg-gray-300"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};