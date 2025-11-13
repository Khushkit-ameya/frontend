"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";

interface Tab {
  key: string;
  label: string;
  icon?: string | StaticImageData; // Allow optional; TabbedFormLayout may omit
  disabled?: boolean;
}

interface FormTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
}

export const FormTabs: React.FC<FormTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div className={`flex border-b border-gray-200 px-4 bg-white ${className}`}>
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
          >
            {icon ? (
              <Image
                src={icon}
                alt={label}
                width={16}
                height={16}
                className={disabled ? "opacity-50" : ""}
              />
            ) : (
              <span className="w-4" /> // placeholder to keep alignment
            )}
            {label}

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