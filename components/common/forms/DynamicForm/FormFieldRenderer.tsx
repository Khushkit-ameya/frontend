import React, { useState, useEffect, useRef } from "react";
import {
  Control,
  FieldValues,
  UseFormSetValue,
  FieldErrors,
  Controller,
} from 'react-hook-form';
import {
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  FormControl,
  Chip,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import {
  useCreatePriorityOptionMutation,
  useUpdatePriorityOptionMutation,
  useDeletePriorityOptionMutation,
  useUpdateFieldOptionMutation,
  useCreateFieldOptionMutation,
  useDeleteFieldOptionMutation,
  useUpdateFieldOptionSequenceMutation,
} from "@/store/api_query/LazyKill/project.api";
import {
  useCreateTaskStatusOptionMutation,
  useUpdateTaskStatusOptionMutation,
  useDeleteTaskStatusOptionMutation,
  useCreateTaskPriorityOptionMutation,
  useUpdateTaskPriorityOptionMutation,
  useDeleteTaskPriorityOptionMutation,
  useGetTaskMDMFieldsQuery,
} from "@/store/api_query/LazyKill/lazyKill.api";
import StatusDropdown from "@/components/dropdowns/StatusDropdown";
import PriorityDropdown from "@/components/dropdowns/PriorityDropdown";
import { DatePicker, TimePicker, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ErrorMessage } from "@hookform/error-message";
import { FieldDefinition, User, FieldOptionChoice } from "./types";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { projectFieldConfig } from "@/components/common/forms/DynamicForm/projectFieldConfig";
import { getDynamicFieldConfig } from "@/components/common/forms/DynamicForm/dynamicFieldConfig";
import Image from "next/image";
import { setTheme, setCompanyThemeColor } from '@/store/api_query/global';
import { useTheme, useCompanyTheme } from '@/store/hooks';
import type { FC, SVGProps } from 'react';
import { UseFormReturn } from 'react-hook-form';

/* If you only care about className/size (Lucide, Tabler, …) */
type IconProps = { className?: string; size?: number };

import { Tooltip } from "@mui/material";
import * as LucideIcons from "lucide-react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import searchIcon from "@/public/icons/search 1.svg";
import homeIcon from "@/public/icons/home (1) 1.svg";
import updateIcon from "@/public/icons/gallery-_1_ 1.svg";
import { Plus } from "lucide-react";
import { useAddDropdownStatusChoiceMutation, useDeleteDropdownChoiceMutation, useReorderDropdownStatusChoicesMutation, useUpdateDropdownStatusChoiceMutation } from '@/store/api_query/BizAcceleractorContact.api';
import { UserDropdown } from "../UserDropdown";
import customToast from "@/utils/toast";

// Types for custom dropdown props
interface CustomDropdownProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: (string | number | FieldOptionChoice)[];
  placeholder?: string;
  error?: boolean;
}
type Props<TFieldValues extends FieldValues = FieldValues> = {
  field: FieldDefinition;
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
}
// Types for date range
interface DateRangeValue {
  start?: string;
  end?: string;
}

interface CustomDateRangeProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  error?: boolean;
}

// Custom Dropdown Component
const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayValue = () => {
    if (!value) return placeholder;
    const selectedOption = options.find(opt =>
      typeof opt === 'object' ? opt.value === value : opt === value
    );
    return typeof selectedOption === 'object' ? selectedOption.label : selectedOption;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 uniform-field ${error ? 'border-red-500' : ''}`}
      >
        <span className="text-gray-700 dark:text-gray-300">{getDisplayValue()}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(optionValue as string | number | null);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${value === optionValue ? 'bg-red-50 dark:bg-red-900' : ''
                    }`}
                >
                  <span className="text-gray-700 dark:text-gray-300">{optionLabel}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const CustomDateRange: React.FC<CustomDateRangeProps> = ({
  value,
  onChange,
  placeholder = "Set Dates",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getDisplayValue = () => {
    if (value?.start && value?.end) {
      const start = new Date(value.start);
      const end = new Date(value.end);
      return `${formatDate(start)} – ${formatDate(end)}`;
    }
    return placeholder;
  };

  const handleDateSelect = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setSelectedDate(date);
    } else if (startDate && !endDate) {
      // Complete selection
      const sortedStart = date < startDate ? date : startDate;
      const sortedEnd = date < startDate ? startDate : date;
      setStartDate(sortedStart);
      setEndDate(sortedEnd);
      setSelectedDate(null);

      onChange({
        start: sortedStart.toISOString(),
        end: sortedEnd.toISOString()
      });
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate || today;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    return (
      <div className="p-4 bg-white dark:bg-gray-700 shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          >
            ‹
          </button>
          <span className="font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array(firstDay.getDay()).fill(null).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {days.map(date => {
            const isStart = startDate && date.getTime() === startDate.getTime();
            const isEnd = endDate && date.getTime() === endDate.getTime();
            const inRange = isDateInRange(date);
            const isToday = date.toDateString() === today.toDateString();

            return (
              <button
                key={date.getTime()}
                type="button"
                onClick={() => handleDateSelect(date)}
                className={`
                  w-8 h-8 text-sm rounded-full transition-colors
                  ${isStart || isEnd ? 'bg-red-600 text-white' : ''}
                  ${inRange && !isStart && !isEnd ? 'bg-red-100 dark:bg-red-900' : ''}
                  ${isToday && !isStart && !isEnd ? 'border border-red-500' : ''}
                  hover:bg-red-200 dark:hover:bg-red-800
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[48px] min-h-[48px] rounded-[5px] items-center px-4 py-3 text-centerx border dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 ${error ? 'border-red-500' : ''
          }`}
      >
        <span
          className={`border border-[#8F8E8CB2] 
    ${value?.start && value?.end ? 'bg-[#8F8E8C] text-white' : 'bg-white text-[#8F8E8C]'}
    rounded-4xl p-2`}
        >
          {getDisplayValue()}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1">
            {renderCalendar()}
          </div>
        </>
      )}
    </div>
  );
};

const iconMap: Record<string, string> = {
  search: searchIcon,
  home: homeIcon,
  update: updateIcon,
};

const getFieldTooltip = (field: FieldDefinition) => {
  return (
    field.helpText ||
    field.tooltip ||
    (field.fieldType === "EMAIL"
      ? "Enter a valid email address"
      : field.fieldType === "PHONE"
        ? "Enter phone number with country code"
        : field.fieldType === "TEXT"
          ? "Enter text here"
          : field.fieldType === "DROPDOWN"
            ? "Select an option from the list"
            : `Fill out this ${field.fieldType.toLowerCase()} field`)
  );
};

const renderIconWithBg = (
  icon?: string | React.ComponentType<IconProps>,   // ← no more `any`
  iconBg?: string | boolean
) => {
  if (!icon) return null;

  const bgColor =
    iconBg && typeof iconBg === 'string' ? iconBg : '#C81C1F';

  /* ---------- string (file name / path) ---------- */
  if (typeof icon === 'string') {
    const iconSrc = iconMap[icon];

    return (
      <span
        className="w-7 h-7 flex items-center justify-center rounded-lg mr-2 text-white"
        style={{ backgroundColor: bgColor }}
      >
        <Image
          src={iconSrc || icon}
          alt="icon"
          width={16}
          height={16}
          className="text-white"
        />
      </span>
    );
  }

  /* ---------- React component (Lucide icon, …) ---------- */
  const IconComp = icon;
  return (
    <span
      className="w-7 h-7 flex items-center justify-center rounded-full mr-2 text-white"
      style={{ backgroundColor: bgColor }}
    >
      <IconComp size={16} className="text-white" />
    </span>
  );
};

const renderLabel = (
  displayName: string,
  tooltip?: string,
  isRequired?: boolean
) => (
  <div className="flex items-center gap-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {displayName}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </label>

    {/* Tooltip */}
    {tooltip && (
      <Tooltip title={tooltip} arrow>
        <span className="ml-1 text-gray-500 cursor-pointer">
          <InfoOutlinedIcon fontSize="small" />
        </span>
      </Tooltip>
    )}
  </div>
);


interface FormFieldRendererProps<TFieldValues extends FieldValues = FieldValues> {
  field: FieldDefinition;
  form: UseFormReturn<TFieldValues>;
  watch: UseFormReturn<TFieldValues>['watch'];
  setValue: UseFormReturn<TFieldValues>['setValue'];
  customOptions: Record<string, string[]>;
  setCustomOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  mdmId?: string;
  onFieldOptionsUpdate?: (fieldKey: string, updatedOptions: any[]) => void;
  onFieldChange?: (field: string, value: any) => void; // Add this line
}

// File Upload Component
const FileUploadComponent: React.FC<{
  field: FieldDefinition;
  control: Control;
  setValue: UseFormSetValue<FieldValues>;
  errors: FieldErrors<FieldValues>;
}> = ({ field, control, setValue, errors }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<
    Array<
      | { type: "file"; file: File; id: string }
      | { type: "link"; url: string; displayText: string; id: string }
    >
  >([]);
  const [linkForm, setLinkForm] = useState({ url: "", displayText: "" });

  // Generate unique ID for each item
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        type: "file" as const,
        file,
        id: generateId(),
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Update form value
      setValue(field.fieldKey, [...selectedFiles, ...newFiles]);
    }
  };

  // Handle link submission
  const handleLinkSubmit = () => {
    if (linkForm.url && linkForm.displayText) {
      const newLink = {
        type: "link" as const,
        url: linkForm.url,
        displayText: linkForm.displayText,
        id: generateId(),
      };
      setSelectedFiles((prev) => [...prev, newLink]);
      setLinkForm({ url: "", displayText: "" });
      setShowLinkForm(false);

      // Update form value
      setValue(field.fieldKey, [...selectedFiles, newLink]);
    }
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    const updatedFiles = selectedFiles.filter((item) => item.id !== id);
    setSelectedFiles(updatedFiles);
    setValue(field.fieldKey, updatedFiles);
  };
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        {renderIconWithBg(field.icon, field.iconBg || "#C81C1F")}
        {renderLabel(field.displayName, getFieldTooltip(field), field.isRequired)}
      </div>

      {/* Main input */}
      <div className="relative">
        <div
          onClick={() => setShowOptions(!showOptions)}
          className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-sm cursor-pointer"
        >
          {/* Pills for selected files/links */}
          {selectedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200"
            >
              {item.type === "file" ? item.file.name : item.displayText}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveItem(item.id);
                }}
                className="ml-2 text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Placeholder */}
          {selectedFiles.length === 0 && (
            <span className="text-white dark:text-gray-400 bg-gray-500 p-2 rounded-lg">Choose File</span>
          )}
        </div>

        {/* Dropdown */}
        {showOptions && (
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3">
            {/* Link form if active */}
            {linkForm.url !== "" || linkForm.displayText !== "" ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) =>
                    setLinkForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="Paste any type of link"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={linkForm.displayText}
                  onChange={(e) =>
                    setLinkForm((prev) => ({
                      ...prev,
                      displayText: e.target.value,
                    }))
                  }
                  placeholder="Text to display"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkSubmit();
                  }}
                  disabled={!linkForm.url || !linkForm.displayText}
                  className="w-full py-2 bg-red-600 text-white rounded text-sm disabled:bg-gray-400"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                {/* From Computer Option */}
                <label className="block px-4 py-2 hover:bg-red-100 dark:hover:bg-gray-600 cursor-pointer">
                  From Computer
                  <input
                    type="file"
                    multiple={field.options?.multiple}
                    accept={field.options?.fileTypes}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>

                {/* Link Option */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLinkForm({ url: "", displayText: " " });
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-red-100 dark:hover:bg-gray-600"
                >
                  Link
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Allowed types hint */}
      {field.options?.fileTypes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Allowed types: {field.options.fileTypes}
        </p>
      )}

      <ErrorMessage
        errors={errors}
        name={field.fieldKey}
        render={({ message }) => (
          <FormHelperText error className="text-sm mt-1">
            {message}
          </FormHelperText>
        )}
      />
    </div>
  );
};

// MultiSelect Tags Component
const MultiSelectTagsComponent: React.FC<{
  field: FieldDefinition;
  control: Control<FieldValues>;
  errors: FieldErrors<FieldValues>;
}> = ({ field, control, errors }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedOptions = field.options?.choices || [];
  const allowMultiple = true; // tags should always be multiple

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        {renderIconWithBg(field.icon, field.iconBg || "#C81C1F")}
        {renderLabel(field.displayName, getFieldTooltip(field), field.isRequired)}
      </div>

      <Controller
        name={field.fieldKey}
        control={control}
        rules={field.isRequired ? { required: `${field.displayName} is required` } : {}}
        render={({ field: { onChange, value } }) => {
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];

          // Filter options based on input
          const filteredOptions = predefinedOptions.filter((option: string | FieldOptionChoice | unknown | undefined | object | null) => {
            const optionLabel = typeof option === 'object' && option !== null ? (option as FieldOptionChoice).label : String(option);
            return optionLabel && optionLabel.toLowerCase().includes(inputValue.toLowerCase());
          });

          // // Click outside handler
          // useEffect(() => {
          //   const handleClickOutside = (event: MouseEvent) => {
          //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          //       setIsDropdownOpen(false);
          //     }
          //   };
          //   document.addEventListener('mousedown', handleClickOutside);
          //   return () => document.removeEventListener('mousedown', handleClickOutside);
          // }, []);

          // Add tag function
          const addTag = (tagValue: string, tagLabel?: string) => {
            const newTag = {
              value: tagValue,
              label: tagLabel || tagValue,
              color: '#D9D9D980' // Default color for custom tags
            };
            const newValues = [...currentValues, newTag];
            onChange(newValues);
            setInputValue('');
            setIsDropdownOpen(false);
          };

          // Remove tag function
          const removeTag = (index: number) => {
            const newValues = currentValues.filter((_, i) => i !== index);
            onChange(newValues);
          };

          // Handle input key events
          const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const trimmedValue = inputValue.trim();

              if (trimmedValue) {
                // Check if it matches any predefined option
                const matchingOption = predefinedOptions.find((option) => {
                  const optionLabel = typeof option === 'object' && option !== null ? (option as FieldOptionChoice).label : String(option);
                  return optionLabel && optionLabel.toLowerCase() === trimmedValue.toLowerCase();
                });

                if (matchingOption) {
                  // Use the predefined option
                  const optionValue = typeof matchingOption === 'object' && matchingOption !== null ?
                    (matchingOption as FieldOptionChoice).value :
                    String(matchingOption);
                  const optionLabel = typeof matchingOption === 'object' && matchingOption !== null ?
                    (matchingOption as FieldOptionChoice).label :
                    String(matchingOption);

                  if (optionValue && optionLabel) {
                    addTag(optionValue, optionLabel);
                  } else {
                    // Fallback if values are undefined
                    addTag(trimmedValue);
                  }
                } else {
                  // Add as custom tag
                  addTag(trimmedValue);
                }
              }
            } else if (e.key === 'Backspace' && !inputValue && currentValues.length > 0) {
              // Remove last tag on backspace
              removeTag(currentValues.length - 1);
            }
          };

          return (
            <div className="space-y-2 relative" ref={dropdownRef}>
              {/* Tags container with input */}
              <div
                className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-text min-h-[52px] bg-white dark:bg-gray-700"
                onClick={() => inputRef.current?.focus()}
              >
                {/* Selected tags */}
                {currentValues.map((tag, index: number) => {
                  const tagLabel = typeof tag === 'object' ? tag.label : String(tag);
                  const tagColor = typeof tag === 'object' ? tag.color : '#D9D9D980';

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: tagColor,
                        color: '#000000' // Ensure text is readable
                      }}
                    >
                      <span className="text-xs font-medium">{tagLabel}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(index);
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* Input field */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={currentValues.length === 0 ? "Type and press Enter to add tags..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent focus:outline-none px-1 py-1 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Dropdown for predefined options */}
              {isDropdownOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {/* Predefined options */}
                  {filteredOptions.map((option: string | FieldOptionChoice, index: number) => {
                    const optionValue = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).value :
                      option;
                    const optionLabel = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).label :
                      String(option);
                    const optionColor = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).color :
                      undefined;

                    // Check if already selected
                    const isSelected = currentValues.some((tag) =>
                      (typeof tag === 'object' ? tag.value : tag) === optionValue
                    );

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!isSelected && optionValue && optionLabel) {
                            addTag(optionValue, optionLabel);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-between ${isSelected ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {optionColor && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: optionColor }}
                            />
                          )}
                          <span>{optionLabel}</span>
                        </div>
                        {isSelected && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}

                  {inputValue.trim() && !filteredOptions.some((option: string | FieldOptionChoice) => {
                    const optionLabel = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).label :
                      String(option);
                    return optionLabel && optionLabel.toLowerCase() === inputValue.trim().toLowerCase();
                  }) && (
                      <button
                        type="button"
                        onClick={() => addTag(inputValue.trim())}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2 border-t border-gray-200 dark:border-gray-600"
                      >
                        <Plus size={16} />
                        Add &quot;{inputValue.trim()}&quot;
                      </button>
                    )}

                  {/* No results message */}
                  {filteredOptions.length === 0 && !inputValue.trim() && (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                      No tags available
                    </div>
                  )}
                </div>
              )}


            </div>
          );
        }}
      />
      <ErrorMessage
        errors={errors}
        name={field.fieldKey}
        render={({ message }) => (
          <FormHelperText error className="text-sm mt-1">
            {message}
          </FormHelperText>
        )}
      />
    </div>
  );
};

// Project Type Component
const ProjectTypeComponent: React.FC<{
  field: FieldDefinition;
  control: Control<FieldValues>;
  errors: FieldErrors<FieldValues>;
}> = ({ field, control, errors }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedOptions = (field.options?.choices as FieldOptionChoice[]) || [];
  const allowMultiple = field.options?.multiple;
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        {renderIconWithBg(field.icon, field.iconBg || "#C81C1F")}
        {renderLabel(field.displayName, getFieldTooltip(field), field.isRequired)}
      </div>

      <Controller
        name={field.fieldKey}
        control={control}
        rules={field.isRequired ? { required: `${field.displayName} is required` } : {}}

        render={({ field: { onChange, value } }) => {

          // Normalize current value to array
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];

          // Filter options based on input
          const filteredOptions = predefinedOptions.filter((option: string | FieldOptionChoice | unknown | undefined | object | null) => {
            const optionLabel = typeof option === 'object' && option !== null ? (option as FieldOptionChoice).label : String(option);
            return optionLabel && optionLabel.toLowerCase().includes(inputValue.toLowerCase());
          });



          // Add tag function
          const addTag = (tagValue: string, tagLabel?: string) => {
            const newTag = tagLabel ? { value: tagValue, label: tagLabel } : tagValue;
            const newValues = allowMultiple ? [...currentValues, newTag] : [newTag];
            onChange(newValues);
            setInputValue('');
            setIsDropdownOpen(false);
          };

          // Remove tag function
          const removeTag = (index: number) => {
            const newValues = currentValues.filter((_, i) => i !== index);
            onChange(allowMultiple ? newValues : []);
          };

          const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const trimmedValue = inputValue.trim();

              if (trimmedValue) {
                // Check if it matches any predefined option
                const matchingOption = predefinedOptions.find((option: string | FieldOptionChoice | unknown | undefined | object | null) => {
                  const optionLabel = typeof option === 'object' && option !== null ? (option as FieldOptionChoice).label : String(option);
                  return optionLabel && optionLabel.toLowerCase().includes(inputValue.toLowerCase());
                });

                if (matchingOption) {
                  // Use the predefined option - normalize possible shapes: { value, label } | User | primitive
                  let optionValue: string;
                  let optionLabel: string;

                  if (typeof matchingOption === 'object' && matchingOption !== null) {
                    if ('value' in matchingOption) {
                      // { value, label } shape
                      optionValue = String((matchingOption as { value: unknown }).value);
                      optionLabel = 'label' in matchingOption ? String((matchingOption as { label: unknown }).label) : optionValue;
                    } else if ('id' in matchingOption) {
                      // User shape: { id, firstName, lastName, email }
                      const user = matchingOption as { id: unknown; firstName?: string; lastName?: string; email?: string };
                      optionValue = String(user.id);
                      const name = `${user.firstName || ''}${user.lastName ? ' ' + user.lastName : ''}`.trim();
                      optionLabel = name || user.email || optionValue;
                    } else {
                      // Fallback for unknown object shapes
                      optionValue = String(matchingOption);
                      optionLabel = String(matchingOption);
                    }
                  } else {
                    // primitive (string/number)
                    optionValue = String(matchingOption);
                    optionLabel = String(matchingOption);
                  }

                  addTag(optionValue, optionLabel);
                } else {
                  // Add as custom tag
                  addTag(trimmedValue);
                }
              }
            } else if (e.key === 'Backspace' && !inputValue && currentValues.length > 0) {
              // Remove last tag on backspace
              removeTag(currentValues.length - 1);
            }
          };

          return (
            <div className="space-y-2 relative" ref={dropdownRef}>
              {/* Tags container with input */}
              <div
                className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-text min-h-[52px] bg-white dark:bg-gray-700"
                onClick={() => inputRef.current?.focus()}
              >
                {/* Selected tags */}
                {currentValues.map((tag, index: number) => {
                  const tagLabel = typeof tag === 'object' ? tag.label : String(tag);
                  const tagColor = typeof tag === 'object' ? tag.color : '#6b7280';

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500"
                      style={{ backgroundColor: tagColor ? `${tagColor}20` : undefined }}
                    >
                      <span className="text-xs font-medium">{tagLabel}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(index);
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* Input field */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={currentValues.length === 0 ? "Type and press Enter to add..." : ""}
                  className="flex-1 min-w-[120px] bg-transparent focus:outline-none px-1 py-1 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Dropdown for predefined options */}
              {isDropdownOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {/* Predefined options */}
                  {filteredOptions.map((option: string | FieldOptionChoice, index: number) => {
                    const optionValue = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).value :
                      String(option);
                    const optionLabel = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).label || String(option) :
                      String(option);
                    const optionColor = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).color :
                      undefined;

                    // Check if already selected
                    const isSelected = currentValues.some((tag) =>
                      (typeof tag === 'object' ? tag.value : tag) === optionValue
                    );

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!isSelected && optionValue && optionLabel) {
                            addTag(optionValue, optionLabel);
                          }
                        }}
                        disabled={isSelected || !optionValue || !optionLabel}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-between ${isSelected ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {optionColor && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: optionColor }}
                            />
                          )}
                          <span>{optionLabel}</span>
                        </div>
                        {isSelected && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom option */}
                  {inputValue.trim() && !filteredOptions.some((option: string | FieldOptionChoice) => {
                    const optionLabel = typeof option === 'object' && option !== null ?
                      (option as FieldOptionChoice).label :
                      String(option);
                    return optionLabel && optionLabel.toLowerCase() === inputValue.trim().toLowerCase();
                  }) && (
                      <button
                        type="button"
                        onClick={() => addTag(inputValue.trim())}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2 border-t border-gray-200 dark:border-gray-600"
                      >
                        <Plus size={16} />
                        Add &quot;{inputValue.trim()}&quot;
                      </button>
                    )}

                  {/* No results message */}
                  {filteredOptions.length === 0 && !inputValue.trim() && (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                      No options available
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }}
      />
      <ErrorMessage
        errors={errors}
        name={field.fieldKey}
        render={({ message }) => (
          <FormHelperText error className="text-sm mt-1">
            {message}
          </FormHelperText>
        )}
      />
    </div>
  );
};

export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  form: { control, register, formState: { errors } },
  watch,
  setValue,
  customOptions,
  setCustomOptions,
  mdmId,
}) => {
  const { refetch: refetchTaskMDMFields } = useGetTaskMDMFieldsQuery();
  const [createTaskStatusOption] = useCreateTaskStatusOptionMutation();
  const [updateTaskStatusOption] = useUpdateTaskStatusOptionMutation();
  const [deleteTaskStatusOption] = useDeleteTaskStatusOptionMutation();
  const [createTaskPriorityOption] = useCreateTaskPriorityOptionMutation();
  const [updateTaskPriorityOption] = useUpdateTaskPriorityOptionMutation();
  const [deleteTaskPriorityOption] = useDeleteTaskPriorityOptionMutation();

  const { isDark, colors, companyThemeColor } = useTheme();
  const [createPriorityOption] = useCreatePriorityOptionMutation();
  const [updatePriorityOption] = useUpdatePriorityOptionMutation();
  const [deletePriorityOption] = useDeletePriorityOptionMutation();

  const [addContactChoice] = useAddDropdownStatusChoiceMutation();
  const [updateContactChoice] = useUpdateDropdownStatusChoiceMutation();
  const [deleteContactChoice] = useDeleteDropdownChoiceMutation();
  const [reorderContactChoices] = useReorderDropdownStatusChoicesMutation();

  // New project API hooks for field options
  const [updateFieldOption] = useUpdateFieldOptionMutation();
  const [createFieldOption] = useCreateFieldOptionMutation();
  const [deleteFieldOption] = useDeleteFieldOptionMutation();
  // Local text store for JSON fields keyed by fieldKey to avoid calling hooks inside render callbacks
  const [jsonTextMap, setJsonTextMap] = useState<Record<string, string>>({});
  const [updateFieldOptionSequence] = useUpdateFieldOptionSequenceMutation();
  
  // Check if field should be visible based on isVisible property
  if ('isVisible' in field && (field as any).isVisible === false) {
    return null;
  }
  // Switch Component
  const SwitchComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, errors }) => {
    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <Controller
          name={field.fieldKey}
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Company Job Bucket
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={value || false}
                onClick={() => onChange(!value)}
                className={`
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                ${value ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-600'}
                            `}
              >
                <span
                  className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${value ? 'translate-x-6' : 'translate-x-1'}
                                `}
                />
              </button>
            </div>
          )}
        />
        <ErrorMessage
          errors={errors}
          name={field.fieldKey}
          render={({ message }) => (
            <FormHelperText error className="text-sm mt-1">
              {message}
            </FormHelperText>
          )}
        />
      </FieldWrapper>
    );
  };
  // Custom Estimate Time Component
  const EstimateTimeComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, errors }) => {
    const timeUnits = [
      { value: 'minutes', label: 'Minutes' },
      { value: 'hours', label: 'Hours' },
      // { value: 'days', label: 'Days' }
    ];

    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <Controller
          name={field.fieldKey}
          control={control}
          render={({ field: { onChange, value } }) => {
            const currentValue = value || { value: 60, unit: 'minutes' };

            const handleValueChange = (newValue: number) => {
              onChange({ ...currentValue, value: newValue });
            };

            const handleUnitChange = (newUnit: string) => {
              onChange({ ...currentValue, unit: newUnit });
            };

            // Convert to seconds for backend
            const convertToSeconds = (val: number, unit: string) => {
              switch (unit) {
                case 'minutes': return val * 60;
                case 'hours': return val * 3600;
                case 'days': return val * 86400;
                default: return val;
              }
            };

            return (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <TextField
                    type="number"
                    value={currentValue.value || ''}
                    onChange={(e) => handleValueChange(Number(e.target.value))}
                    slotProps={{
                      input: {
                        className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                      },
                      htmlInput: {
                        min: 1,
                      },
                    }}
                    className="flex-1 [&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                  />
                  <FormControl className="w-32">
                    <Select
                      value={currentValue.unit || 'minutes'}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="h-[48px]"
                    >
                      {timeUnits.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="text-xs text-gray-500">
                  Estimated time: {convertToSeconds(currentValue.value, currentValue.unit)} seconds
                </div>
              </div>
            );
          }}
        />
        <ErrorMessage
          errors={errors}
          name={field.fieldKey}
          render={({ message }) => (
            <FormHelperText error className="text-sm mt-1">
              {message}
            </FormHelperText>
          )}
        />
      </FieldWrapper>
    );
  };
  // Daily Configuration Component
  const DailyConfigComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, setValue, errors }) => {
    const daysOfWeek = [
      { value: 'monday', label: 'M', fullLabel: 'Monday' },
      { value: 'tuesday', label: 'T', fullLabel: 'Tuesday' },
      { value: 'wednesday', label: 'W', fullLabel: 'Wednesday' },
      { value: 'thursday', label: 'Th', fullLabel: 'Thursday' },
      { value: 'friday', label: 'F', fullLabel: 'Friday' },
      { value: 'saturday', label: 'S', fullLabel: 'Saturday' },
      { value: 'sunday', label: 'Sn', fullLabel: 'Sunday' }
    ];

    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <div className="space-y-4">
          {/* Days Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat On Days
            </label>
            <div className="flex gap-2 flex-wrap">
              {daysOfWeek.map((day) => (
                <Controller
                  key={day.value}
                  name={`day.days`}
                  control={control}
                  render={({ field: { value, onChange } }) => {
                    const selectedDays = Array.isArray(value) ? value : [];
                    const isSelected = selectedDays.includes(day.value);

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const newSelectedDays = isSelected
                            ? selectedDays.filter(d => d !== day.value)
                            : [...selectedDays, day.value];
                          onChange(newSelectedDays);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isSelected
                          ? 'bg-red-500 text-white border-2 border-red-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                          }`}
                        title={day.fullLabel}
                      >
                        {day.label}
                      </button>
                    );
                  }}
                />
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <Controller
              name="day.time"
              control={control}
              render={({ field: { onChange, value } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    value={value ? new Date(`1970-01-01T${value}`) : null}
                    onChange={(date) => {
                      if (date) {
                        const timeString = date.toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        onChange(timeString);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </div>
        </div>
      </FieldWrapper>
    );
  };

  // Weekly Configuration Component
  const WeeklyConfigComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, setValue, errors }) => {
    const daysOfWeek = [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' }
    ];

    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <div className="space-y-4">
          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat On Day
            </label>
            <Controller
              name="week.day"
              control={control}
              render={({ field: { onChange, value } }) => (
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => onChange(day.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${value === day.value
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <Controller
              name="week.time"
              control={control}
              render={({ field: { onChange, value } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    value={value ? new Date(`1970-01-01T${value}`) : null}
                    onChange={(date) => {
                      if (date) {
                        const timeString = date.toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        onChange(timeString);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </div>
        </div>
      </FieldWrapper>
    );
  };

  // Monthly Configuration Component
  const MonthlyConfigComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, setValue, errors }) => {
    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <div className="space-y-4">
          {/* Day of Month with Validation (1-28) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Day of Month (1-28)
            </label>
            <Controller
              name="month.day"
              control={control}
              rules={{
                min: { value: 1, message: 'Day must be at least 1' },
                max: { value: 28, message: 'Day cannot exceed 28' }
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TextField
                  type="number"
                  value={value || ''}
                  onChange={(e) => {
                    const day = parseInt(e.target.value);
                    if (day >= 1 && day <= 28) {
                      onChange(day);
                    } else if (e.target.value === '') {
                      onChange('');
                    }
                  }}
                  error={!!error}
                  helperText={error?.message}
                  fullWidth
                  slotProps={{
                    input: {
                      className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                    },
                    htmlInput: {
                      min: 1,
                      max: 28,
                    },
                  }}
                  className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                />
              )}
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <Controller
              name="month.time"
              control={control}
              render={({ field: { onChange, value } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    value={value ? new Date(`1970-01-01T${value}`) : null}
                    onChange={(date) => {
                      if (date) {
                        const timeString = date.toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        onChange(timeString);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </div>
        </div>
      </FieldWrapper>
    );
  };

  // Quarterly Configuration Component with Day Validation
  const QuarterlyConfigComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, setValue, errors }) => {
    const quarters = [
      { value: 1, label: 'January' },
      { value: 4, label: 'April' },
      { value: 7, label: 'July' },
      { value: 10, label: 'October' }
    ];

    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <div className="space-y-4">
          {/* Months Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat In Months
            </label>
            <Controller
              name="quartly.months"
              control={control}
              defaultValue={[1, 4, 7, 10]}
              render={({ field: { value, onChange } }) => {
                const selectedMonths = Array.isArray(value) ? value : [1, 4, 7, 10];

                return (
                  <div className="grid grid-cols-2 gap-2">
                    {quarters.map((quarter) => (
                      <button
                        key={quarter.value}
                        type="button"
                        onClick={() => {
                          const newSelectedMonths = selectedMonths.includes(quarter.value)
                            ? selectedMonths.filter(m => m !== quarter.value)
                            : [...selectedMonths, quarter.value];
                          onChange(newSelectedMonths);
                        }}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${selectedMonths.includes(quarter.value)
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {quarter.label}
                      </button>
                    ))}
                  </div>
                );
              }}
            />
          </div>

          {/* Day of Month with Validation (1-28) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Day of Month (1-28)
            </label>
            <Controller
              name="quartly.day"
              control={control}
              rules={{
                min: { value: 1, message: 'Day must be at least 1' },
                max: { value: 28, message: 'Day cannot exceed 28' }
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TextField
                  type="number"
                  value={value || ''}
                  onChange={(e) => {
                    const day = parseInt(e.target.value);
                    if (day >= 1 && day <= 28) {
                      onChange(day);
                    } else if (e.target.value === '') {
                      onChange('');
                    }
                  }}
                  error={!!error}
                  helperText={error?.message}
                  fullWidth
                  slotProps={{
                    input: {
                      className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                    },
                    htmlInput: {
                      min: 1,
                      max: 28,
                    },
                  }}
                  className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                />
              )}
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <Controller
              name="quartly.time"
              control={control}
              render={({ field: { onChange, value } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    value={value ? new Date(`1970-01-01T${value}`) : null}
                    onChange={(date) => {
                      if (date) {
                        const timeString = date.toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        onChange(timeString);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </div>
        </div>
      </FieldWrapper>
    );
  };

  // Yearly Configuration Component
  const YearlyConfigComponent: React.FC<{
    field: FieldDefinition;
    control: Control<FieldValues>;
    setValue: UseFormSetValue<FieldValues>;
    errors: FieldErrors<FieldValues>;
  }> = ({ field, control, setValue, errors }) => {
    return (
      <FieldWrapper>
        <FieldHeader field={field} />
        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <Controller
              name="yearly.date"
              control={control}
              render={({ field: { onChange, value } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={value ? new Date(value) : null}
                    onChange={(date) => onChange(date?.toISOString().split('T')[0])}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <Controller
              name="yearly.time"
              control={control}
              render={({ field: { onChange, value } }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    value={value ? new Date(`1970-01-01T${value}`) : null}
                    onChange={(date) => {
                      if (date) {
                        const timeString = date.toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        onChange(timeString);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </div>
        </div>
      </FieldWrapper>
    );
  };
  const { fieldKey, displayName, fieldType, isRequired, options, icon } = field;
  const filter = createFilterOptions<string>();


  const isFieldEditable = (field: FieldDefinition) => {
    if (field.isEditable === undefined) return true;
    return field.isEditable;
  };

  if (!isFieldEditable(field)) return null;

  const rules: Record<string, string | { value: string; message: string } | { value: number; message: string } | { value: RegExp; message: string }> = {};
  if (isRequired) rules.required = `${displayName} is required`;

  if (options?.min !== undefined) {
    if (fieldType === "NUMBER" || fieldType === "CURRENCY") {
      rules.min = { value: options.min, message: `Minimum value is ${options.min}` };
    } else if (fieldType === "TEXT" || fieldType === "TEXTAREA") {
      rules.minLength = { value: options.min, message: `Minimum length is ${options.min} characters` };
    }
  }

  if (options?.max !== undefined) {
    if (fieldType === "NUMBER" || fieldType === "CURRENCY") {
      rules.max = { value: options.max, message: `Maximum value is ${options.max}` };
    } else if (fieldType === "TEXT" || fieldType === "TEXTAREA") {
      rules.maxLength = { value: options.max, message: `Maximum length is ${options.max} characters` };
    }
  }

  if (fieldType === "EMAIL") {
    rules.pattern = {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address",
    };
  }

  if (fieldType === "PHONE") {
    rules.pattern = {
      value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      message: "Invalid phone number",
    };
  }

  if (fieldType === "URL") {
    rules.pattern = {
      value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      message: "Invalid URL",
    };
  }

  // Common field wrapper component
  const FieldWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div key={fieldKey} className={`mb-4 ${className}`}>
      {children}
    </div>
  );

  // Common field header component - UPDATED
  const FieldHeader = ({ field }: { field: FieldDefinition }) => (
    <div className="flex items-center mb-2">
      {renderIconWithBg(field.icon, field.iconBg || "#C81C1F")}
      {renderLabel(field.displayName, getFieldTooltip(field), field.isRequired)}
    </div>
  );

  switch (fieldType) {
    case "TEXT":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <TextField
            {...register(fieldKey, rules)}
            type="text"
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            helperText={errors[fieldKey]?.message as string}
            slotProps={{
              input: {
                className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                // Add focus and input tracking
                onFocus: (e) => {
                  console.log(`TEXT field ${fieldKey} focused`);
                  e.target.select(); // Select all text on focus for testing
                },
                onInput: (e) => {
                  const target = e.target as HTMLInputElement;
                  console.log(`TEXT field ${fieldKey} input:`, target.value);
                },
                onKeyDown: (e) => {
                  console.log(`TEXT field ${fieldKey} key down:`, e.key);
                },
              },
            }}
            className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
            // Add direct onChange handler
            onChange={(e) => {
              console.log(`TEXT field ${fieldKey} direct onChange:`, e.target.value);
            }}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }: { message: string }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "EMAIL":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            defaultValue=""
            render={({ field: controllerField, fieldState: { error } }) => (
              <TextField
                {...controllerField}
                value={controllerField.value || ''}
                type="email"
                fullWidth
                variant="outlined"
                error={!!error}
                helperText={error?.message}
                slotProps={{
                  input: {
                    className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                    onFocus: (e) => {
                      console.log(`EMAIL field ${fieldKey} focused`);
                    },
                    onInput: (e) => {
                      const target = e.target as HTMLInputElement;
                      console.log(`EMAIL field ${fieldKey} input:`, target.value);
                    },
                  },
                }}
                className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                onChange={(e) => {
                  console.log(`EMAIL field ${fieldKey} changing to:`, e.target.value);
                  controllerField.onChange(e.target.value);
                }}
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }: { message: string }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "PHONE":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <input
            type="tel"
            {...register(fieldKey, rules)}
            className="w-full h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            onFocus={(e) => {
              console.log(`PHONE field ${fieldKey} focused`);
            }}
            onInput={(e) => {
              console.log(`PHONE field ${fieldKey} input:`, e.currentTarget.value);
            }}
            onChange={(e) => {
              console.log(`PHONE field ${fieldKey} change:`, e.target.value);
            }}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }: { message: string }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "URL":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <TextField
            {...register(fieldKey, rules)}
            type="url"
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            helperText={errors[fieldKey]?.message as string}
            slotProps={{
              input: {
                className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                // Simple approach without extra handlers
              },
            }}
            className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }: { message: string }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );


    case "NUMBER":
    case "CURRENCY":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <TextField
            {...register(fieldKey, {
              ...rules,
              valueAsNumber: true,
            })}
            type="number"
            fullWidth
            variant="outlined"
            error={!!errors[fieldKey]}
            slotProps={{
              input: {
                className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
              },
            }}
            className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }: { message: string }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );
    case "USER_DROPDOWN":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              try {
                console.log('USER_DROPDOWN - Raw value:', value);
                console.log('USER_DROPDOWN - Field key:', fieldKey);

                const userOptions: User[] = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  // Handle string case
                  if (typeof choice === 'string') {
                    return {
                      id: choice,
                      firstName: 'User',
                      lastName: '',
                      email: choice,
                      role: 'Team Member',
                      avatar: undefined,
                    };
                  }

                  // Handle FieldOptionChoice case - check if it has user properties
                  const choiceObj = choice as FieldOptionChoice & Partial<User>;
                  return {
                    id: choiceObj.value || String(choice),
                    firstName: choiceObj.firstName || 'User',
                    lastName: choiceObj.lastName || '',
                    email: choiceObj.label || String(choice),
                    role: choiceObj.role || 'Team Member',
                    avatar: choiceObj.avatar,
                  };
                });

                console.log('USER_DROPDOWN - User options:', userOptions);

                const getSelectedUsers = (val: string | User | User[] | null): User | User[] | null => {
                  if (!val) return null;

                  console.log('getSelectedUsers - input:', val);

                  // If it's already a User object (has id, firstName, etc.)
                  if (typeof val === 'object' && !Array.isArray(val) && 'id' in val && (val.firstName || val.email)) {
                    return field.options?.multiple ? [val] : val;
                  }

                  // If it's an array of User objects
                  if (Array.isArray(val)) {
                    return val.filter((item: User) =>
                      item && typeof item === 'object' && 'id' in item && (item.firstName || item.email)
                    );
                  }

                  // If it's just an ID string, find the matching user
                  if (typeof val === 'string') {
                    const foundUser = userOptions.find(user => user.id === val);
                    return field.options?.multiple ? (foundUser ? [foundUser] : []) : foundUser || null;
                  }

                  return null;
                };

                const handleUserChange = (newValue: User | User[] | null) => {
                  console.log('UserDropdown onChange:', newValue);

                  if (field.options?.multiple) {
                    // For multiple selection, return array of user objects
                    const users = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : []);
                    onChange(users);
                  } else {
                    // For single selection, return the user object or null
                    onChange(newValue);
                  }
                };

                const selectedUsers = getSelectedUsers(value);
                console.log('USER_DROPDOWN - Selected users:', selectedUsers);

                return (
                  <UserDropdown
                    value={selectedUsers}
                    onChange={handleUserChange}
                    options={userOptions}
                    multiple={field.options?.multiple || false}
                    error={!!error}
                  />
                );
              } catch (err) {
                console.error('Error in USER_DROPDOWN:', err);
                const errMsg = err instanceof Error ? err.message : String(err);
                return (
                  <div className="text-red-500 text-sm">
                    Error loading user dropdown: {errMsg}
                  </div>
                );
              }
            }}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );
    case "TEXTAREA":
      const value = watch(fieldKey);
      const { wordLimit, rows } = options || {};
      const wordCount = typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean).length : 0;
      return (
        <FieldWrapper>
          <div className="flex items-center justify-between mb-2">
            <FieldHeader field={field} />
            {wordLimit && (
              <span className={`text-xs ${wordCount > wordLimit ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                {wordCount}/{wordLimit} words
              </span>
            )}
          </div>
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <TextField
                value={value || ''}
                onChange={onChange}
                onBlur={onBlur}
                fullWidth
                multiline
                rows={rows || 4}
                variant="outlined"
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </FieldWrapper>
      );

    case "CHECKBOX":
      return (
        <FieldWrapper>
          <FormControlLabel
            control={
              <Checkbox
                {...register(fieldKey, rules)}
                className="text-red-600 dark:text-red-400"
              />
            }
            label={
              <div className="flex items-center">
                {renderIconWithBg(field.icon, field.iconBg)}
                <span className="text-gray-700 dark:text-gray-300">
                  {displayName}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </span>
              </div>
            }
            className="text-gray-700 dark:text-gray-300"
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "RADIO":
      return (
        <FieldWrapper>
          <div className="flex items-center mb-2">
            {renderIconWithBg(icon, companyThemeColor)}
            <label className="font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: radioField }) => (
              <RadioGroup {...radioField} row className="text-gray-700 dark:text-gray-300">
                {options?.choices?.map((choice) => {
                  const choiceValue = typeof choice === 'object'
                    ? ('value' in choice
                      ? (choice).value
                      : 'id' in choice
                        ? (choice).id
                        : String(choice))
                    : choice;
                  const choiceLabel = typeof choice === 'object'
                    ? ('label' in choice
                      ? (choice).label
                      : 'firstName' in choice
                        ? `${(choice).firstName || ''}${(choice).lastName ? ' ' + (choice).lastName : ''}`.trim() || (choice).email || String((choice).id)
                        : String(choice))
                    : String(choice);
                  return (
                    <FormControlLabel
                      key={choiceValue}
                      value={choiceValue}
                      control={<Radio className="text-red-600 dark:text-red-400" />}
                      label={choiceLabel}
                    />
                  );
                })}
              </RadioGroup>
            )}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );


    case "DROPDOWN":
      if (fieldKey === 'taskType') {
        // Use CustomDropdown but ensure single selection
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <CustomDropdown
                  value={value}
                  onChange={onChange}
                  options={field.options?.choices || []}
                  placeholder={`Select ${displayName}`}
                  error={!!error}
                />
              )}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (fieldKey === 'leadType') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const options = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      fieldKey: choice,
                      displayName: choice,
                      color: '#6b7280'
                    };
                  }

                  return {
                    fieldKey: (choice as FieldOptionChoice).value || String(choice),
                    displayName: (choice as FieldOptionChoice).label || String((choice as FieldOptionChoice).value || choice),
                    color: (choice as FieldOptionChoice).color || '#6b7280'
                  };
                });

                const currentValue = value?.value || value;
                const fieldId = (field)?.id;

                return (
                  <div className="dropdown-height-fix">
                    <StatusDropdown
                      currentStatus={currentValue || ''}
                      options={options}
                      onStatusChange={(newValue) => {
                        const selectedOption = options.find(opt => opt.fieldKey === newValue);
                        onChange(selectedOption ? {
                          value: selectedOption.fieldKey,
                          label: selectedOption.displayName,
                          color: selectedOption.color
                        } : newValue);
                      }}
                      onUpdateOption={async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                        try {
                          if (!fieldId) return;
                          const apiUpdates: { label?: string; color?: string } = {};
                          if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
                          if (typeof updates.color === 'string') apiUpdates.color = updates.color;
                          if (Object.keys(apiUpdates).length === 0) return;

                          await updateContactChoice({
                            fieldId,
                            choiceValue: choiceKey,
                            updates: apiUpdates
                          }).unwrap();
                          console.log("Lead type option updated successfully");
                        } catch (error) {
                          console.error("Failed to update lead type option:", error);
                        }
                      }}
                      onAddOption={async (option: { displayName: string; color: string }) => {
                        try {
                          if (!fieldId) return;
                          const base = option.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                          let val = base;
                          const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                          let i = 1;
                          while (existing.has(val)) { val = `${base}_${i++}`; }

                          const choiceData = {
                            value: val,
                            label: option.displayName,
                            color: option.color,
                            order: options.length + 1,
                            isActive: true
                          };

                          await addContactChoice({
                            fieldId,
                            choiceData
                          }).unwrap();
                          console.log("Lead type option added successfully");
                          customToast.success("Lead type option added successfully", { type: "success" });
                        } catch (error) {
                          console.error("Failed to add lead type option:", error);
                        }
                      }}
                      onDeleteOption={async (choiceKey: string) => {
                        try {
                          if (!fieldId) return;
                          await deleteContactChoice({
                            fieldId,
                            choiceValue: choiceKey
                          }).unwrap();
                          console.log("Lead type option deleted successfully");
                        } catch (error) {
                          console.error("Failed to delete lead type option:", error);
                        }
                      }}
                      onReorderOptions={async (ordered: { fieldKey: string; displayName: string; color: string }[]) => {
                        try {
                          if (!fieldId) return;
                          const payload = ordered.map((o, idx) => ({
                            value: o.fieldKey,
                            order: idx + 1,
                            label: o.displayName,
                            color: o.color
                          }));
                          await reorderContactChoices({
                            fieldId,
                            choices: payload
                          }).unwrap();
                          console.log("Lead type options reordered successfully");
                        } catch (error) {
                          console.error("Failed to reorder lead type options:", error);
                        }
                      }}
                      fullWidth={true}
                      className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center"
                    />
                  </div>
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (fieldKey === 'source') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const options = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      fieldKey: choice,
                      displayName: choice,
                      color: '#6b7280'
                    };
                  }

                  return {
                    fieldKey: (choice as FieldOptionChoice).value || String(choice),
                    displayName: (choice as FieldOptionChoice).label || String((choice as FieldOptionChoice).value || choice),
                    color: (choice as FieldOptionChoice).color || '#6b7280'
                  };
                });

                const currentValue = value?.value || value;
                const fieldId = (field)?.id;

                return (
                  <div className="dropdown-height-fix">
                    <StatusDropdown
                      currentStatus={currentValue || ''}
                      options={options}
                      onStatusChange={(newValue) => {
                        const selectedOption = options.find(opt => opt.fieldKey === newValue);
                        onChange(selectedOption ? {
                          value: selectedOption.fieldKey,
                          label: selectedOption.displayName,
                          color: selectedOption.color
                        } : newValue);
                      }}
                      onUpdateOption={async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                        try {
                          if (!fieldId) return;
                          const apiUpdates: { label?: string; color?: string } = {};
                          if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
                          if (typeof updates.color === 'string') apiUpdates.color = updates.color;
                          if (Object.keys(apiUpdates).length === 0) return;

                          await updateContactChoice({
                            fieldId,
                            choiceValue: choiceKey,
                            updates: apiUpdates
                          }).unwrap();
                          console.log("Source option updated successfully");
                        } catch (error) {
                          console.error("Failed to update source option:", error);
                        }
                      }}
                      onAddOption={async (option: { displayName: string; color: string }) => {
                        try {
                          if (!fieldId) return;
                          const base = option.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                          let val = base;
                          const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                          let i = 1;
                          while (existing.has(val)) { val = `${base}_${i++}`; }

                          const choiceData = {
                            value: val,
                            label: option.displayName,
                            color: option.color,
                            order: options.length + 1,
                            isActive: true
                          };

                          await addContactChoice({
                            fieldId,
                            choiceData
                          }).unwrap();
                          console.log("Source option added successfully");
                          customToast.success("Source option added successfully", { type: "success" });
                        } catch (error) {
                          console.error("Failed to add source option:", error);
                        }
                      }}
                      onDeleteOption={async (choiceKey: string) => {
                        try {
                          if (!fieldId) return;
                          await deleteContactChoice({
                            fieldId,
                            choiceValue: choiceKey
                          }).unwrap();
                          console.log("Source option deleted successfully");
                        } catch (error) {
                          console.error("Failed to delete source option:", error);
                        }
                      }}
                      onReorderOptions={async (ordered: { fieldKey: string; displayName: string; color: string }[]) => {
                        try {
                          if (!fieldId) return;
                          const payload = ordered.map((o, idx) => ({
                            value: o.fieldKey,
                            order: idx + 1,
                            label: o.displayName,
                            color: o.color
                          }));
                          await reorderContactChoices({
                            fieldId,
                            choices: payload
                          }).unwrap();
                          console.log("Source options reordered successfully");
                        } catch (error) {
                          console.error("Failed to reorder source options:", error);
                        }
                      }}
                      fullWidth={true}
                      className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center"
                    />
                  </div>
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (fieldKey === 'priority') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const options = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      fieldKey: choice,
                      displayName: choice,
                      color: '#6b7280'
                    };
                  }
                  return {
                    fieldKey: (choice as FieldOptionChoice).value || String(choice),
                    displayName: (choice as FieldOptionChoice).label || String((choice as FieldOptionChoice).value || choice),
                    color: (choice as FieldOptionChoice).color || '#6b7280'
                  };
                });

                const currentValue = value?.value || value;

                // Determine context: Project vs Task vs Subtask
                const isTaskFieldFlag = Boolean((field as any).isTaskField);
                const isSubtaskFieldFlag = Boolean((field as any).isSubtaskField);
                const isProjectContext = !!mdmId && !isTaskFieldFlag && !isSubtaskFieldFlag;
                const isTaskContext = !!mdmId && isTaskFieldFlag;
                const isSubtaskContext = !!mdmId && isSubtaskFieldFlag;

                // Handle option updates based on context
                const handleUpdateOption = async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                  try {
                    if (isProjectContext) {
                      // Use project API for project priority fields
                      if (!mdmId) return;
                      const option = {
                        label: updates.displayName || choiceKey,
                        value: choiceKey,
                        color: updates.color || '#6b7280'
                      };
                      await updatePriorityOption({
                        projectId: mdmId, // Using mdmId as projectId
                        optionData: option
                      }).unwrap();
                      console.log("Project priority option updated successfully");
                      refetchTaskMDMFields();
                      customToast.success("Project priority option updated successfully", { type: "success" });
                    } else if (isTaskContext || isSubtaskContext) {
                      // Use task API for task and subtask priority fields
                      if (!mdmId) return;
                      const option = {
                        label: updates.displayName || choiceKey,
                        value: choiceKey,
                        color: updates.color || '#6b7280'
                      };
                      await updateTaskPriorityOption({
                        id: mdmId, // This should be the task MDM ID
                        fieldKey: 'priority',
                        option
                      }).unwrap();
                      console.log("Priority option updated successfully");
                      customToast.success("Priority option updated successfully", { type: "success" });
                      refetchTaskMDMFields();
                    }
                  } catch (error) {
                    console.error("Failed to update priority option:", error);
                  }
                };

                // Handle adding new options
                const handleAddOption = async (optionData: { displayName: string; color: string }) => {
                  try {
                    if (isProjectContext) {
                      // Use project API for project priority fields
                      if (!mdmId) return;
                      const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                      let val = base;
                      const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                      let i = 1;
                      while (existing.has(val)) { val = `${base}_${i++}`; }

                      const newOption = {
                        label: optionData.displayName,
                        value: val,
                        color: optionData.color
                      };
                      await createPriorityOption({
                        projectId: mdmId,
                        optionData: newOption
                      }).unwrap();
                      console.log("Project priority option added successfully");
                      customToast.success("Project priority option added successfully", { type: "success" });
                      refetchTaskMDMFields();
                    } else if (isTaskContext || isSubtaskContext) {
                      // Use task API for task and subtask priority fields
                      if (!mdmId) return;
                      const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                      let val = base;
                      const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                      let i = 1;
                      while (existing.has(val)) { val = `${base}_${i++}`; }

                      const newOption = {
                        label: optionData.displayName,
                        value: val,
                        color: optionData.color
                      };
                      await createTaskPriorityOption({
                        id: mdmId, // This should be the task MDM ID
                        fieldKey: 'priority',
                        option: newOption
                      }).unwrap();
                      console.log("Priority option added successfully");
                      customToast.success("Priority option added successfully", { type: "success" });
                      refetchTaskMDMFields();
                    }
                  } catch (error) {
                    console.error("Failed to add priority option:", error);
                  }
                };

                const handleDeleteOption = async (choiceKey: string) => {
                  try {
                    if (isProjectContext) {
                      // Use project API for project priority fields
                      if (!mdmId) return;
                      await deletePriorityOption({
                        projectId: mdmId,
                        optionValue: choiceKey,
                      }).unwrap();
                      console.log("Project priority option deleted successfully");
                      customToast.success("Project priority option deleted successfully", { type: "success" });
                      refetchTaskMDMFields();
                    } else if (isTaskContext || isSubtaskContext) {
                      // Use task API for task and subtask priority fields
                      if (!mdmId) return;
                      await deleteTaskPriorityOption({
                        id: mdmId,
                        fieldKey: 'priority',
                        option: { value: choiceKey }
                      }).unwrap();
                      console.log("Priority option deleted successfully");
                      customToast.success("Priority option deleted successfully", { type: "success" });
                      refetchTaskMDMFields();
                    }
                  } catch (error) {
                    console.error("Failed to delete priority option:", error);
                  }
                };

                return (
                  <div className="dropdown-height-fix">
                    <PriorityDropdown
                      currentPriority={currentValue || ''}
                      options={options}
                      onPriorityChange={(newValue: string) => {
                        const selectedOption = options.find(opt => opt.fieldKey === newValue);
                        onChange(selectedOption ? {
                          value: selectedOption.fieldKey,
                          label: selectedOption.displayName,
                          color: selectedOption.color
                        } : newValue);
                      }}
                      onDeleteOption={handleDeleteOption}
                      onUpdateOption={handleUpdateOption}
                      onAddOption={handleAddOption}
                      onReorderOptions={async (ordered) => {
                        console.log("Reordering priority options:", ordered);
                      }}
                      fullWidth={true}
                      className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center"
                    />
                  </div>
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (fieldKey === 'status') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const options = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      fieldKey: choice,
                      displayName: choice,
                      color: '#6b7280'
                    };
                  }
                  return {
                    fieldKey: (choice as FieldOptionChoice).value || String(choice),
                    displayName: (choice as FieldOptionChoice).label || String((choice as FieldOptionChoice).value || choice),
                    color: (choice as FieldOptionChoice).color || '#6b7280'
                  };
                });

                const currentValue = value?.value || value;

                // Enhanced context detection for MDM operations
                const isTaskFieldFlag = Boolean((field as any).isTaskField);
                const isSubtaskFieldFlag = Boolean((field as any).isSubtaskField);
                const isProjectContext = !!mdmId && !isTaskFieldFlag && !isSubtaskFieldFlag;
                const isTaskContext = !!mdmId && (isTaskFieldFlag || (!isProjectContext && !isSubtaskFieldFlag));
                const isSubtaskContext = !!mdmId && isSubtaskFieldFlag;

                console.log('Status field context:', {
                  mdmId,
                  isProjectContext,
                  isTaskContext,
                  isSubtaskContext,
                  fieldKey: field.fieldKey,
                  isTaskField: isTaskFieldFlag,
                  isSubtaskField: isSubtaskFieldFlag
                });

                // Handle option updates based on context
                const handleUpdateOption = async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                  try {
                    if (isTaskContext) {
                      // Use task API for task status fields
                      if (!mdmId) {
                        console.warn('mdmId is missing for task status option');
                        return;
                      }
                      const option = {
                        label: updates.displayName || choiceKey,
                        value: choiceKey,
                        color: updates.color || '#6b7280'
                      };
                      await updateTaskStatusOption({
                        id: mdmId, // This should be the task MDM ID
                        fieldKey: 'status',
                        option
                      }).unwrap();
                      console.log("Task status option updated successfully");
                      customToast.success("Task status option updated successfully", { type: "success" });
                      refetchTaskMDMFields();
                    } else if (isSubtaskContext) {
                      // Use task API for subtask status fields (using same task MDM endpoints for subtasks)
                      if (!mdmId) {
                        console.warn('mdmId is missing for subtask status option');
                        return;
                      }
                      const option = {
                        label: updates.displayName || choiceKey,
                        value: choiceKey,
                        color: updates.color || '#6b7280'
                      };
                      await updateTaskStatusOption({
                        id: mdmId, // Using task MDM ID for subtasks
                        fieldKey: 'status',
                        option
                      }).unwrap();
                      console.log("Subtask status option updated successfully");
                      customToast.success("Subtask status option updated successfully", { type: "success" });
                      refetchTaskMDMFields();
                    } else {
                      // Use project API for project status fields
                      if (!mdmId) {
                        console.warn('mdmId is missing, cannot update project status option');
                        return;
                      }
                      const option = {
                        label: updates.displayName || choiceKey,
                        value: choiceKey,
                        color: updates.color || '#6b7280'
                      };
                      await updateFieldOption({
                        mdmId,
                        fieldKey: 'status',
                        option
                      }).unwrap();
                      console.log("Project status option updated successfully");
                      customToast.success("Status option updated successfully", { type: "success" });
                      refetchTaskMDMFields();
                    }
                  } catch (error) {
                    console.error("Failed to update status option:", error);
                  }
                };

                // Handle adding new options
                const handleAddOption = async (optionData: { displayName: string; color: string }) => {
                  try {
                    if (isTaskContext) {
                      // Use task API for task status fields
                      if (!mdmId) {
                        console.warn('mdmId is missing for task status option');
                        return;
                      }
                      const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                      let val = base;
                      const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                      let i = 1;
                      while (existing.has(val)) { val = `${base}_${i++}`; }

                      const newOption = {
                        label: optionData.displayName,
                        value: val,
                        color: optionData.color
                      };
                      await createTaskStatusOption({
                        id: mdmId, // This should be the task MDM ID
                        fieldKey: 'status',
                        option: newOption
                      }).unwrap();
                      refetchTaskMDMFields();
                      console.log("Task status option added successfully");
                      customToast.success("Status option added successfully", { type: "success" });
                    } else if (isSubtaskContext) {
                      // Use task API for subtask status fields
                      if (!mdmId) {
                        console.warn('mdmId is missing for subtask status option');
                        return;
                      }
                      const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                      let val = base;
                      const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                      let i = 1;
                      while (existing.has(val)) { val = `${base}_${i++}`; }

                      const newOption = {
                        label: optionData.displayName,
                        value: val,
                        color: optionData.color
                      };
                      await createTaskStatusOption({
                        id: mdmId, // Using task MDM ID for subtasks
                        fieldKey: 'status',
                        option: newOption
                      }).unwrap();
                      console.log("Subtask status option added successfully");
                      customToast.success("Subtask status option added successfully", { type: "success" });
                    } else {
                      // Use project API for project status fields
                      if (!mdmId) {
                        console.warn('mdmId is missing, cannot add project status option');
                        return;
                      }
                      const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                      let val = base;
                      const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                      let i = 1;
                      while (existing.has(val)) { val = `${base}_${i++}`; }

                      const newOption = {
                        label: optionData.displayName,
                        value: val,
                        color: optionData.color
                      };
                      await createFieldOption({
                        mdmId,
                        fieldKey: 'status',
                        option: newOption
                      }).unwrap();
                      console.log("Project status option added successfully");
                      customToast.success("Status option added successfully", { type: "success" });
                    }
                  } catch (error) {
                    console.error("Failed to add status option:", error);
                  }
                };

                const handleDeleteOption = async (choiceKey: string) => {
                  try {
                    if (isTaskContext) {
                      // Use task API for task status fields
                      if (!mdmId) return;
                      await deleteTaskStatusOption({
                        id: mdmId,
                        fieldKey: 'status',
                        option: { value: choiceKey }
                      }).unwrap();
                      console.log("Task status option deleted successfully");
                      refetchTaskMDMFields();
                      customToast.success("Task status option deleted successfully", { type: "success" });
                    } else if (isSubtaskContext) {
                      // Use task API for subtask status fields
                      if (!mdmId) return;
                      await deleteTaskStatusOption({
                        id: mdmId,
                        fieldKey: 'status',
                        option: { value: choiceKey }
                      }).unwrap();
                      console.log("Subtask status option deleted successfully");
                      customToast.success("Subtask status option deleted successfully", { type: "success" });
                      refetchTaskMDMFields();
                    } else {
                      // Use project API for project status fields
                      if (!mdmId) return;
                      const option = {
                        value: choiceKey,
                        label: choiceKey
                      };
                      await deleteFieldOption({
                        mdmId,
                        fieldKey: 'status',
                        option
                      }).unwrap();
                      console.log("Project status option deleted successfully");
                      customToast.success("Status option deleted successfully", { type: "success" });
                      refetchTaskMDMFields();
                    }
                  } catch (error) {
                    console.error("Failed to delete status option:", error);
                  }
                };

                return (
                  <div className="dropdown-height-fix">
                    <StatusDropdown
                      currentStatus={currentValue || ''}
                      options={options}
                      onStatusChange={(newValue) => {
                        const selectedOption = options.find(opt => opt.fieldKey === newValue);
                        onChange(selectedOption ? {
                          value: selectedOption.fieldKey,
                          label: selectedOption.displayName,
                          color: selectedOption.color
                        } : newValue);
                      }}
                      onUpdateOption={handleUpdateOption}
                      onAddOption={handleAddOption}
                      onDeleteOption={handleDeleteOption}
                      onReorderOptions={async (ordered) => {
                        // Reordering logic would go here
                        console.log("Reordering status options:", ordered);
                      }}
                      fullWidth={true}
                      className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center"
                    />
                  </div>
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (fieldKey === 'projectType') {
        return <ProjectTypeComponent field={field} control={control} errors={errors} />;
      }
      if (fieldKey === 'manager') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const userOptions: User[] = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      id: choice,
                      firstName: 'User',
                      lastName: '',
                      email: choice,
                      role: 'Team Member',
                      avatar: undefined,
                    };
                  }

                  const choiceObj = choice as FieldOptionChoice & {
                    id?: string;
                    firstName?: string;
                    lastName?: string;
                    email?: string;
                    role?: string | { name?: string };
                    avatar?: string;
                  };

                  return {
                    id: choiceObj.id || choiceObj.value || String(choice),
                    firstName: choiceObj.firstName || 'User',
                    lastName: choiceObj.lastName || '',
                    email: choiceObj.email || String(choice),
                    role: typeof choiceObj.role === 'string' ? choiceObj.role : choiceObj.role?.name || 'Team Member',
                    avatar: choiceObj.avatar,
                  };
                });

                return (
                  <UserDropdown
                    value={value}
                    onChange={onChange}
                    options={userOptions}
                    multiple={true}
                    error={!!error}
                  />
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }

      if (fieldKey === 'team') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const userOptions: User[] = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      id: choice,
                      firstName: 'User',
                      lastName: '',
                      email: choice,
                      role: 'Team Member',
                      avatar: undefined,
                    };
                  }

                  const choiceObj = choice as FieldOptionChoice & {
                    id?: string;
                    firstName?: string;
                    lastName?: string;
                    email?: string;
                    role?: string | { name?: string };
                    avatar?: string;
                  };

                  return {
                    id: choiceObj.id || choiceObj.value || String(choice),
                    firstName: choiceObj.firstName || 'User',
                    lastName: choiceObj.lastName || '',
                    email: choiceObj.email || String(choice),
                    role: typeof choiceObj.role === 'string' ? choiceObj.role : choiceObj.role?.name || 'Team Member',
                    avatar: choiceObj.avatar,
                  };
                });
                return (
                  <UserDropdown
                    value={value}
                    onChange={onChange}
                    options={userOptions}
                    multiple={true}
                    error={!!error}
                  />
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      // if (fieldKey === 'priority') {
      //   return (
      //     <FieldWrapper>
      //       <FieldHeader field={field} />
      //       <Controller
      //         name={fieldKey}
      //         control={control}
      //         rules={rules}
      //         render={({ field: { onChange, value }, fieldState: { error } }) => {
      //           const options = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
      //             if (typeof choice === 'string') {
      //               return {
      //                 fieldKey: choice,
      //                 displayName: choice,
      //                 color: '#6b7280'
      //               };
      //             }
      //             return {
      //               fieldKey: (choice as FieldOptionChoice).value || String(choice),
      //               displayName: (choice as FieldOptionChoice).label || String((choice as FieldOptionChoice).value || choice),
      //               color: (choice as FieldOptionChoice).color || '#6b7280'
      //             };
      //           });

      //           const currentValue = value?.value || value;

      //           // Determine context: Project vs Task
      //           const isTaskFieldFlag = Boolean((field as any).isTaskField);
      //           const isProjectContext = !!mdmId && !isTaskFieldFlag;
      //           const isTaskContext = !isProjectContext;

      //           // Handle option updates based on context
      //           const handleUpdateOption = async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
      //             try {
      //               if (isProjectContext) {
      //                 // Use project API for project priority fields
      //                 if (!mdmId) return;
      //                 const option = {
      //                   label: updates.displayName || choiceKey,
      //                   value: choiceKey,
      //                   color: updates.color || '#6b7280'
      //                 };
      //                 await updatePriorityOption({
      //                   projectId: mdmId, // Using mdmId as projectId
      //                   optionData: option
      //                 }).unwrap();
      //                 console.log("Project priority option updated successfully");
      //                 refetchTaskMDMFields();
      //                 customToast.success("Project priority option updated successfully", { type: "success" });
      //               } else {
      //                 // Use task API for task priority fields
      //                 if (!mdmId) return;
      //                 const option = {
      //                   label: updates.displayName || choiceKey,
      //                   value: choiceKey,
      //                   color: updates.color || '#6b7280'
      //                 };
      //                 await updateTaskPriorityOption({
      //                   id: mdmId, // This should be the task MDM ID
      //                   fieldKey: 'priority',
      //                   option
      //                 }).unwrap();
      //                 console.log("Task priority option updated successfully");
      //                 customToast.success("Task priority option updated successfully", { type: "success" });
      //                 refetchTaskMDMFields();
      //               }
      //             } catch (error) {
      //               console.error("Failed to update priority option:", error);
      //             }
      //           };

      //           // Handle adding new options
      //           const handleAddOption = async (optionData: { displayName: string; color: string }) => {
      //             try {
      //               if (isProjectContext) {
      //                 // Use project API for project priority fields
      //                 if (!mdmId) return;
      //                 const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
      //                 let val = base;
      //                 const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
      //                 let i = 1;
      //                 while (existing.has(val)) { val = `${base}_${i++}`; }

      //                 const newOption = {
      //                   label: optionData.displayName,
      //                   value: val,
      //                   color: optionData.color
      //                 };
      //                 await createPriorityOption({
      //                   projectId: mdmId,
      //                   optionData: newOption
      //                 }).unwrap();
      //                 console.log("Project priority option added successfully");
      //                 customToast.success("Project priority option added successfully", { type: "success" });
      //                 refetchTaskMDMFields();
      //               } else {
      //                 // Use task API for task priority fields
      //                 if (!mdmId) return;
      //                 const base = optionData.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
      //                 let val = base;
      //                 const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
      //                 let i = 1;
      //                 while (existing.has(val)) { val = `${base}_${i++}`; }

      //                 const newOption = {
      //                   label: optionData.displayName,
      //                   value: val,
      //                   color: optionData.color
      //                 };
      //                 await createTaskPriorityOption({
      //                   id: mdmId, // This should be the task MDM ID
      //                   fieldKey: 'priority',
      //                   option: newOption
      //                 }).unwrap();
      //                 console.log("Task priority option added successfully");
      //                 customToast.success("Task priority option added successfully", { type: "success" });
      //                 refetchTaskMDMFields();
      //               }
      //             } catch (error) {
      //               console.error("Failed to add priority option:", error);
      //             }
      //           };


      //           const handleDeleteOption = async (choiceKey: string) => {
      //             try {
      //               if (isProjectContext) {
      //                 // Use project API for project priority fields
      //                 if (!mdmId) return;
      //                 await deletePriorityOption({
      //                   projectId: mdmId,
      //                   optionValue: choiceKey,
      //                 }).unwrap();
      //                 console.log("Project priority option deleted successfully");
      //                 customToast.success("Project priority option deleted successfully", { type: "success" });
      //                 refetchTaskMDMFields();
      //               } else {
      //                 // Use task API for task priority fields
      //                 if (!mdmId) return;
      //                 await deleteTaskPriorityOption({
      //                   id: mdmId,
      //                   fieldKey: 'priority',
      //                   option: { value: choiceKey }  // ✅ Send as object with value property
      //                 }).unwrap();
      //                 console.log("Task priority option deleted successfully");
      //                 customToast.success("Task priority option deleted successfully", { type: "success" });
      //                 refetchTaskMDMFields();
      //               }
      //             } catch (error) {
      //               console.error("Failed to delete priority option:", error);
      //             }
      //           };

      //           return (
      //             <div className="dropdown-height-fix">
      //               <PriorityDropdown
      //                 currentPriority={currentValue || ''}
      //                 options={options}
      //                 onPriorityChange={(newValue: string) => {
      //                   const selectedOption = options.find(opt => opt.fieldKey === newValue);
      //                   onChange(selectedOption ? {
      //                     value: selectedOption.fieldKey,
      //                     label: selectedOption.displayName,
      //                     color: selectedOption.color
      //                   } : newValue);
      //                 }}
      //                 onDeleteOption={handleDeleteOption}
      //                 onUpdateOption={handleUpdateOption}
      //                 onAddOption={handleAddOption}
      //                 onReorderOptions={async (ordered) => {
      //                   console.log("Reordering priority options:", ordered);
      //                 }}
      //                 fullWidth={true}
      //                 className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center"
      //               />
      //             </div>
      //           );
      //         }}
      //       />
      //       <ErrorMessage
      //         errors={errors}
      //         name={fieldKey}
      //         render={({ message }) => (
      //           <FormHelperText error className="text-sm mt-1">
      //             {message}
      //           </FormHelperText>
      //         )}
      //       />
      //     </FieldWrapper>
      //   );
      // }
      if (fieldKey === 'contactStatus') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const options = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      fieldKey: choice,
                      displayName: choice,
                      color: '#6b7280'
                    };
                  }

                  return {
                    fieldKey: (choice as FieldOptionChoice).value || String(choice),
                    displayName: (choice as FieldOptionChoice).label || String((choice as FieldOptionChoice).value || choice),
                    color: (choice as FieldOptionChoice).color || '#6b7280'
                  };
                });

                const currentValue = value?.value || value;
                const fieldId = (field)?.id;

                return (
                  <div className="dropdown-height-fix">
                    <StatusDropdown
                      currentStatus={currentValue || ''}
                      options={options}
                      onStatusChange={(newValue) => {
                        const selectedOption = options.find(opt => opt.fieldKey === newValue);
                        onChange(selectedOption ? {
                          value: selectedOption.fieldKey,
                          label: selectedOption.displayName,
                          color: selectedOption.color
                        } : newValue);
                      }}
                      onUpdateOption={async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                        try {
                          if (!fieldId) return;
                          const apiUpdates: { label?: string; color?: string } = {};
                          if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
                          if (typeof updates.color === 'string') apiUpdates.color = updates.color;
                          if (Object.keys(apiUpdates).length === 0) return;

                          await updateContactChoice({
                            fieldId,
                            choiceValue: choiceKey,
                            updates: apiUpdates
                          }).unwrap();
                          console.log("Contact status option updated successfully");
                        } catch (error) {
                          console.error("Failed to update contact status option:", error);
                        }
                      }}
                      onAddOption={async (option: { displayName: string; color: string }) => {
                        try {
                          if (!fieldId) return;
                          const base = option.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                          let val = base;
                          const existing = new Set(options.map((o: { fieldKey: string; displayName: string; color: string }) => o.fieldKey));
                          let i = 1;
                          while (existing.has(val)) { val = `${base}_${i++}`; }

                          const choiceData = {
                            value: val,
                            label: option.displayName,
                            color: option.color,
                            order: options.length + 1,
                            isActive: true
                          };

                          await addContactChoice({
                            fieldId,
                            choiceData
                          }).unwrap();
                          console.log("Contact status option added successfully");
                          customToast.success("Contact status option added successfully", { type: "success" });
                        } catch (error) {
                          console.error("Failed to add contact status option:", error);
                        }
                      }}
                      onDeleteOption={async (choiceKey: string) => {
                        try {
                          if (!fieldId) return;
                          await deleteContactChoice({
                            fieldId,
                            choiceValue: choiceKey
                          }).unwrap();
                          console.log("Contact status option deleted successfully");
                        } catch (error) {
                          console.error("Failed to delete contact status option:", error);
                        }
                      }}
                      onReorderOptions={async (ordered: { fieldKey: string; displayName: string; color: string }[]) => {
                        try {
                          if (!fieldId) return;
                          const payload = ordered.map((o, idx) => ({
                            value: o.fieldKey,
                            order: idx + 1,
                            label: o.displayName,
                            color: o.color
                          }));
                          await reorderContactChoices({
                            fieldId,
                            choices: payload
                          }).unwrap();
                          console.log("Contact status options reordered successfully");
                        } catch (error) {
                          console.error("Failed to reorder contact status options:", error);
                        }
                      }}
                      fullWidth={true}
                      className="w-full h-[48px] min-h-[48px] rounded-[8px] items-center"
                    />
                  </div>
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        )
      }
      if (fieldKey === 'tags') {
        return <MultiSelectTagsComponent field={field} control={control} errors={errors} />;
      }
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomDropdown
                value={value}
                onChange={onChange}
                options={field.options?.choices || []}
                placeholder={`Select ${displayName}`}
                error={!!error}
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "CREATABLE_DROPDOWN":
      const optionChoices = options?.choices || [];
      const isMultiSelect:any = options?.multiple !== false;

      const getChoiceValue = (choice: any): string => {
        if (choice && typeof choice === 'object') {
          if ('value' in choice && choice.value !== undefined) return String(choice.value);
          if ('id' in choice && choice.id !== undefined) return String(choice.id);
          if ('fieldKey' in choice && choice.fieldKey !== undefined) return String(choice.fieldKey);
        }
        return String(choice ?? '');
      };

      const getChoiceLabel = (choice: any): string => {
        if (choice && typeof choice === 'object') {
          if ('label' in choice && choice.label) return String(choice.label);
          if ('displayName' in choice && choice.displayName) return String(choice.displayName);
          if ('firstName' in choice || 'lastName' in choice) {
            const fn = (choice as any).firstName ?? '';
            const ln = (choice as any).lastName ?? '';
            const full = `${fn} ${ln}`.trim();
            if (full) return full;
          }
          if ('name' in choice && choice.name) return String(choice.name);
        }
        return String(choice ?? '');
      };

      const toPrimitiveValue = (val: unknown): string => {
        if (val === undefined || val === null) return '';
        if (Array.isArray(val)) {
          return val.length > 0 ? toPrimitiveValue(val[0]) : '';
        }
        if (typeof val === 'object') {
          const rec = val as Record<string, unknown>;
          if (rec.value !== undefined) return String(rec.value);
          if (rec.id !== undefined) return String(rec.id);
          if (rec.fieldKey !== undefined) return String(rec.fieldKey);
        }
        return String(val);
      };

      const resolveLabel = (primitive: string): string => {
        if (!primitive) return '';
        const match = optionChoices.find(choice => getChoiceValue(choice) === primitive);
        return match !== undefined ? getChoiceLabel(match) : primitive;
      };

      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <FormControl fullWidth error={!!errors[fieldKey]} className="bg-white dark:bg-gray-700">
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value } }) => {
                const allOptions = [
                  ...(options?.choices || []),
                  ...(customOptions[fieldKey] || [])
                ];

                return (
                  <Autocomplete
                    value={value || null}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        onChange(newValue);
                      } else if (newValue && newValue.inputValue) {
                        const newOption = newValue.inputValue;
                        setCustomOptions(prev => ({
                          ...prev,
                          [fieldKey]: [...(prev[fieldKey] || []), newOption]
                        }));
                        onChange(newOption);
                      } else {
                        onChange(newValue);
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some((option) => inputValue === option);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push(inputValue);
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    options={allOptions}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      if (option.inputValue) return option.inputValue;
                      return option;
                    }}
                    renderOption={(props, option) => <li {...props}>{option}</li>}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!errors[fieldKey]}
                        slotProps={{
                          input: {
                            className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                          },
                        }}
                        className="[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      />
                    )}
                  />
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error>{message}</FormHelperText>
              )}
            />
          </FormControl>
        </div>
      );

    case "MULTI_SELECT":
      if (field.fieldKey === 'manager') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const userOptions: User[] = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      id: choice,
                      firstName: 'User',
                      lastName: '',
                      email: choice,
                      role: 'Team Member',
                      avatar: undefined,
                    };
                  }

                  const choiceObj = choice as FieldOptionChoice & Partial<User>;
                  return {
                    id: choiceObj.value || String(choice),
                    firstName: choiceObj.firstName || 'User',
                    lastName: choiceObj.lastName || '',
                    email: choiceObj.label || String(choice),
                    role: choiceObj.role || 'Team Member',
                    avatar: choiceObj.avatar,
                  };
                });

                return (
                  <UserDropdown
                    value={value}
                    onChange={onChange}
                    options={userOptions}
                    multiple={true}
                    error={!!error}
                  />
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (field.fieldKey === 'team') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const userOptions: User[] = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      id: choice,
                      firstName: 'User',
                      lastName: '',
                      email: choice,
                      role: 'Team Member',
                      avatar: undefined,
                    };
                  }

                  const choiceObj = choice as FieldOptionChoice & Partial<User>;
                  return {
                    id: choiceObj.value || String(choice),
                    firstName: choiceObj.firstName || 'User',
                    lastName: choiceObj.lastName || '',
                    email: choiceObj.label || String(choice),
                    role: choiceObj.role || 'Team Member',
                    avatar: choiceObj.avatar,
                  };
                });

                return (
                  <UserDropdown
                    value={value}
                    onChange={onChange}
                    options={userOptions}
                    multiple={true}
                    error={!!error}
                  />
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      if (field.fieldKey === 'tags') {
        return <MultiSelectTagsComponent field={field} control={control} errors={errors} />;
      }
      if (field.fieldKey === 'assignedTo' || field.fieldKey === 'assignedBy') {
        return (
          <FieldWrapper>
            <FieldHeader field={field} />
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                const userOptions: User[] = (field.options?.choices || []).map((choice: string | FieldOptionChoice) => {
                  if (typeof choice === 'string') {
                    return {
                      id: choice,
                      firstName: 'User',
                      lastName: '',
                      email: choice,
                      role: 'Team Member',
                      avatar: undefined,
                    };
                  }

                  const choiceObj = choice as FieldOptionChoice & Partial<User>;
                  return {
                    id: choiceObj.value || String(choice),
                    firstName: choiceObj.firstName || 'User',
                    lastName: choiceObj.lastName || '',
                    email: choiceObj.label || String(choice),
                    role: choiceObj.role || (field.fieldKey === 'assignedBy' ? 'Assigner' : 'Team Member'),
                    avatar: choiceObj.avatar,
                  };
                });

                return (
                  <UserDropdown
                    value={value}
                    onChange={onChange}
                    options={userOptions}
                    multiple={true}
                    error={!!error}
                  />
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error className="text-sm mt-1">
                  {message}
                </FormHelperText>
              )}
            />
          </FieldWrapper>
        );
      }
      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <FormControl fullWidth error={!!errors[fieldKey]} className="bg-white dark:bg-gray-700">
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              defaultValue={isMultiSelect ? [] : ''}
              render={({ field: { onChange, value } }) => {
                const normalizedValue = isMultiSelect
                  ? (Array.isArray(value)
                      ? value.map(v => toPrimitiveValue(v)).filter(Boolean)
                      : value
                        ? [toPrimitiveValue(value)]
                        : [])
                  : toPrimitiveValue(value);

                return (
                  <Select
                    multiple={isMultiSelect}
                    value={normalizedValue as any}
                    displayEmpty={!isMultiSelect}
                    onChange={(event) => {
                      const newValue = event.target.value;
                      if (isMultiSelect) {
                        const nextValue = Array.isArray(newValue) ? newValue : [newValue];
                        onChange(nextValue.filter(Boolean));
                      } else {
                        onChange(Array.isArray(newValue) ? newValue[0] ?? '' : newValue);
                      }
                    }}
                    className="text-gray-900 dark:text-white"
                    renderValue={(selected: unknown[]) => {
                      if (!isMultiSelect) {
                        const primitive = Array.isArray(selected)
                          ? selected.length > 0
                            ? toPrimitiveValue(selected[0])
                            : ''
                          : typeof selected === 'string'
                            ? selected
                            : toPrimitiveValue(selected);
                        const label = resolveLabel(primitive);
                        return label || (options?.placeholder || `Select ${displayName}`);
                      }

                      const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];
                      if (selectedArray.length === 0) {
                        return (
                          <span className="text-gray-500">
                            {options?.placeholder || `Select ${displayName}`}
                          </span>
                        );
                      }
                      return (
                        <div className="flex flex-wrap gap-1">
                          {selectedArray.map((val, index) => {
                            const primitive = toPrimitiveValue(val);
                            const displayValue = resolveLabel(primitive);
                            const chipKey = primitive || `chip-${index}`;
                            return (
                              <Chip
                                key={chipKey}
                                label={displayValue}
                                size="small"
                                className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                              />
                            );
                          })}
                        </div>
                      );
                    }}
                  >
                    {optionChoices.map((choice) => {
                      const choiceValue = getChoiceValue(choice);
                      const choiceLabel = getChoiceLabel(choice);
                      const isSelected = isMultiSelect
                        ? (normalizedValue as string[]).includes(choiceValue)
                        : (normalizedValue as string) === choiceValue;
                      return (
                        <MenuItem key={choiceValue} value={choiceValue} className="text-gray-900 dark:text-white">
                          {isMultiSelect && (
                            <Checkbox checked={isSelected} className="text-red-600 dark:text-red-400" />
                          )}
                          {choiceLabel}
                        </MenuItem>
                      );
                    })}
                  </Select>
                );
              }}
            />
            <ErrorMessage
              errors={errors}
              name={fieldKey}
              render={({ message }) => (
                <FormHelperText error>{message}</FormHelperText>
              )}
            />
          </FormControl>
        </div>
      );
    case "DATE":
      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <DatePicker
                  value={value ? new Date(value) : null}
                  onChange={(date) => onChange(date?.toISOString())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                      inputProps: {
                        className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                      },
                      className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </div>
      );

    case "DATETIME":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <DateTimePicker
                  value={value ? new Date(value) : null}
                  onChange={(date) => onChange(date?.toISOString())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                      inputProps: {
                        className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                      },
                      className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );
    case "JSON":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              // Safely stringify the incoming JSON value
              const raw = (() => {
                try {
                  return typeof value === "string"
                    ? value
                    : JSON.stringify(value ?? {}, null, 2);
                } catch {
                  return "{}";
                }
              })();

              // Use component-level map for JSON field text to avoid calling hooks inside this render callback
              const text = jsonTextMap[fieldKey] ?? raw;

              // Validate & parse on blur
              const handleBlur = () => {
                try {
                  const parsed = JSON.parse(text);
                  onChange(parsed);
                } catch (err) {
                  // If invalid JSON, keep the current value without saving
                  console.warn("Invalid JSON entered:", err);
                }
              };

              return (
                <>
                  <TextField
                    multiline
                    fullWidth
                    rows={options?.rows ?? 6}
                    value={text}
                    onChange={(e) => setJsonTextMap(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                    onBlur={handleBlur}
                    error={!!error}
                    helperText={
                      error?.message ??
                      (() => {
                        try {
                          JSON.parse(text);
                          return "Valid JSON";
                        } catch {
                          return "Invalid JSON – will not be saved until fixed";
                        }
                      })()
                    }
                    spellCheck={false}
                    placeholder='{"key": "value"}'
                    slotProps={{
                      input: {
                        className:
                          "font-mono text-sm leading-relaxed tracking-wide",
                      },
                    }}
                  />
                </>
              );
            }}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "DATE_TIME":
      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <DateTimePicker
                  value={value ? new Date(value) : null}
                  onChange={(date) => onChange(date?.toISOString())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                      inputProps: {
                        className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                      },
                      className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </div>
      );

    case "DATE_RANGE":
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <Controller
            name={fieldKey}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomDateRange
                value={value || {}}
                onChange={onChange}
                placeholder={"Set Dates"}
                error={!!error}
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name={fieldKey}
            render={({ message }) => (
              <FormHelperText error className="text-sm mt-1">
                {message}
              </FormHelperText>
            )}
          />
        </FieldWrapper>
      );

    case "DATE_TIME_RANGE":
      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                name={`${fieldKey}.start`}
                control={control}
                rules={isRequired ? { required: `${displayName} start date is required` } : {}}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <DateTimePicker
                    label="Start Date & Time"
                    value={value ? new Date(value) : null}
                    onChange={(date) => onChange(date?.toISOString())}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error,
                        helperText: error?.message,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                )}
              />
              <Controller
                name={`${fieldKey}.end`}
                control={control}
                rules={isRequired ? { required: `${displayName} end date is required` } : {}}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <DateTimePicker
                    label="End Date & Time"
                    value={value ? new Date(value) : null}
                    onChange={(date) => onChange(date?.toISOString())}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error,
                        helperText: error?.message,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </div>
        </div>
      );

    case "TIME":
      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name={fieldKey}
              control={control}
              rules={rules}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TimePicker
                  value={value ? new Date(value) : null}
                  onChange={(date) => onChange(date?.toISOString())}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                      inputProps: {
                        className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                      },
                      className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </div>
      );

    case "TIME_RANGE":
      return (
        <div key={fieldKey} className="mb-4">
          <div className="flex items-center mb-1">
            {renderIconWithBg(icon)}
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                name={`${fieldKey}.start`}
                control={control}
                rules={isRequired ? { required: `${displayName} start time is required` } : {}}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <TimePicker
                    label="Start Time"
                    value={value ? new Date(value) : null}
                    onChange={(date) => onChange(date?.toISOString())}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error,
                        helperText: error?.message,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                )}
              />
              <Controller
                name={`${fieldKey}.end`}
                control={control}
                rules={isRequired ? { required: `${displayName} end time is required` } : {}}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <TimePicker
                    label="End Time"
                    value={value ? new Date(value) : null}
                    onChange={(date) => onChange(date?.toISOString())}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error,
                        helperText: error?.message,
                        inputProps: {
                          className: "h-[48px] min-h-[48px] rounded-[8px] py-0 px-4 flex items-center",
                        },
                        className: "[&_.MuiOutlinedInput-root]:h-[48px] [&_.MuiOutlinedInput-root]:min-h-[48px]"
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </div>
        </div>
      );

    case "FILE_UPLOAD":
      return <FileUploadComponent field={field} control={control} setValue={setValue} errors={errors} />;

    // Add these cases to the switch statement in FormFieldRenderer.tsx

    case "CUSTOM_DAILY":
      return <DailyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    case "CUSTOM_WEEKLY":
      return <WeeklyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    case "CUSTOM_MONTHLY":
      return <MonthlyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    case "CUSTOM_QUARTERLY":
      return <QuarterlyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    case "CUSTOM_YEARLY":
      return <YearlyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    case "SWITCH":
      return <SwitchComponent field={field} control={control} errors={errors} />;

    case "CUSTOM_ESTIMATE_TIME":
      return <EstimateTimeComponent field={field} control={control} errors={errors} />;

    case "CUSTOM_MONTHLY_VALIDATED":
      return <MonthlyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    case "CUSTOM_QUARTERLY_VALIDATED":
      return <QuarterlyConfigComponent field={field} control={control} setValue={setValue} errors={errors} />;

    default:
      return (
        <FieldWrapper>
          <FieldHeader field={field} />
          <div className="text-gray-500 dark:text-gray-400">
            Field type &quot;{fieldType}&quot; not implemented yet.
          </div>
        </FieldWrapper>
      );
  }
};
