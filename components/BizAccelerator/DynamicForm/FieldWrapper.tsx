"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HelpCircle } from "lucide-react";
import { getDynamicFieldConfig } from "@/components/common/forms/DynamicForm/dynamicFieldConfig";
import { FieldDefinition } from "./types";

interface FieldWrapperProps {
  field: FieldDefinition;
  children: React.ReactNode;
  error?: boolean;
  required?: boolean;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  field,
  children,
  error = false,
  required = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // 🧠 Get icon and tooltip using dynamic config
  const fieldConfig = getDynamicFieldConfig(field.fieldKey, field.fieldType, field.displayName);
  const iconUrl = fieldConfig.icon;
  const tooltipText = field.helpText || fieldConfig.tooltip;

  return (
    <div className="mb-6 relative">
      {/* Field Header with Icon and Label */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-[29px] h-[29px] bg-[#C81C1F] rounded-lg">
          {iconUrl && (
            <Image
              src={iconUrl}
              alt={`${field.displayName} icon`}
              width={16}
              height={16}
              className="object-contain"
            />
          )}
        </div>

        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {field.displayName}
          {required && <span className="text-red-500">*</span>}
        </label>

        {/* Help Tooltip */}
        {tooltipText && (
          <div className="relative">
            <Image src="/preview.svg" alt="Help" width={16} height={16}
              className="text-gray-400 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                {tooltipText}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field Input */}
      {children}

      {/* Error State */}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {field.displayName} is required
        </p>
      )}
    </div>
  );
};

export const FieldHeader: React.FC<{ field: FieldDefinition }> = ({ field }) => {
  const fieldConfig = getDynamicFieldConfig(field.fieldKey, field.fieldType, field.displayName);
  const iconUrl = fieldConfig.icon;

  return (
    <div className="flex items-center gap-2 mb-2">
      {iconUrl && (
        <Image
          src={iconUrl}
          alt={`${field.displayName} icon`}
          width={16}
          height={16}
          className="object-contain"
        />
      )}
      <span className="text-sm font-medium text-gray-700">
        {field.displayName}
        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
      </span>
    </div>
  );
};
