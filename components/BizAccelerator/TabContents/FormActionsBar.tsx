"use client";

import React, { useState } from "react";
import { Mail, SlidersHorizontal, Search, Settings, X, Calendar } from "lucide-react";
import Image from "next/image";
import { useTheme } from '@/store/hooks';
import { ActivityModal } from "./ActivityModal";

interface Filter {
  id: number;
  activity: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface RelatedItem {
  type: string;
}

export interface FormActionsBarProps {
  showEmailButton?: boolean;
  showActivityDropdown?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  onEmailClick?: () => void;
  onActivityClick?: () => void;
  onFilterClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
  relatedItem?: RelatedItem;
  filters?: Filter[];
  onFiltersChange?: (filters: Filter[]) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onAddActivity?: (type: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => void;
}

export const FormActionsBar: React.FC<FormActionsBarProps> = ({
  showEmailButton = true,
  showActivityDropdown = true,
  showFilters = true,
  showSearch = true,
  showSettings = true,
  onEmailClick,
  onActivityClick,
  onFilterClick,
  onSettingsClick,
  className = "",
  relatedItem,
  filters: externalFilters,
  onFiltersChange,
  searchQuery: externalSearchQuery,
  onSearchChange,
  onAddActivity,
}) => {
  const [activityType, setActivityType] = useState<null | "meeting" | "call" | "notes" | "todo" | "email">(null);
  const [showActivityDropdownState, setShowActivityDropdownState] = useState<number | null>(null);
  // new states
  const [globalActivityDropdownOpen, setGlobalActivityDropdownOpen] = useState(false);
  const [filterActivityDropdown, setFilterActivityDropdown] = useState<number | null>(null);

  const [showFiltersState, setShowFiltersState] = useState(false);
  const { isDark, colors, companyThemeColor } = useTheme();

  // Use external filters if provided, otherwise use internal state
  const [internalFilters, setInternalFilters] = useState<Filter[]>([
    { id: Date.now(), activity: null, startDate: null, endDate: null },
  ]);

  const filters = externalFilters || internalFilters;
  const setFilters = onFiltersChange || setInternalFilters;

  // Use external search query if provided, otherwise use internal state
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

  const addFilter = () => {
    setFilters([
      ...filters,
      { id: Date.now(), activity: null, startDate: null, endDate: null },
    ]);
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: number, field: keyof Filter, value: string | null) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };
  const handleActivityClick = (type: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => {
    console.log("🎯 Activity button clicked:", type);
    if (onAddActivity) {
      onAddActivity(type);
    } else {
      setActivityType(type);
    }
    setGlobalActivityDropdownOpen(false);
  };

  return (
    <>
      <div className={`flex items-center gap-3 px-3 py-2 bg-white rounded-lg ${className}`}>
        {/* Email Button */}
        {showEmailButton && (
          <div className="relative">
            <button
              onClick={onEmailClick}
              className="flex items-center gap-2 text-white px-3 py-1.5 text-sm rounded-[5px]"
              style={{ backgroundColor: "#C81C1F" }}
            >
              <Mail size={14} />
              <span className="font-inter font-[400] text-[14px] whitespace-nowrap">New Email</span>
            </button>
          </div>
        )}

        {/* Activity Dropdown */}

        {showActivityDropdown && (
          <div className="relative">
            <button
              onClick={() => setGlobalActivityDropdownOpen(!globalActivityDropdownOpen)}
              className="flex items-center gap-2 border-r text-[#727374] font-inter font-[500] px-3 py-1.5 text-sm whitespace-nowrap"
            >
              + New Activity
            </button>
            {globalActivityDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow z-10">

                {/* Search Bar */}
                <div className="relative p-2">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search.."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"
                  />
                </div>

                {/* Activity Options */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleActivityClick("meeting")}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <div className="w-7 h-7 flex items-center justify-center rounded  text-white">
                      <Image src="/icons/schedule-meeting.png" alt="Meeting" width={30} height={30} />
                    </div>
                    <span>Meeting</span>
                  </button>

                  <button
                    onClick={() => handleActivityClick("call")}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <div className="w-7 h-7 flex items-center justify-center rounded  text-white">
                      <Image src="/icons/schedulecall.png" alt="Call" width={30} height={30} />
                    </div>
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() => handleActivityClick("notes")}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <div className="w-7 h-7 flex items-center justify-center rounded  text-white">
                      <Image src="/icons/notes.png" alt="Notes" width={30} height={30} />
                    </div>
                    <span>Notes</span>
                  </button>

                  <button
                    onClick={() => handleActivityClick("todo")}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <div className="w-7 h-7 flex items-center justify-center rounded  text-white">
                      <Image src="/todoo.svg" alt="To Do" width={30} height={30} />
                    </div>
                    <span>To Do</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}


        {/* Filters */}
        {showFilters && (
          <div className="relative">
            <button
              onClick={() => setShowFiltersState(!showFiltersState)}
              className="flex items-center gap-2 border border-gray-300 p-1 rounded-[5px] w-[92px] h-[30px]"
            >
              {/* <Image src="/filter-icon.png" alt="Filters" width={16} height={16} /> */}
              <span className="font-inter font-[400] text-[14px] text-[#4F5051] whitespace-nowrap">Filters</span>
            </button>

            {showFiltersState && (
              <div className="absolute top-full left-[-105px] mt-4 bg-white border border-[#00000042] rounded shadow p-4 z-10">

                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center gap-3 p-3 rounded  relative"
                    >
                      <span className="whitespace-nowrap">Select activities</span>
                      {/* Activity Dropdown Trigger */}
                      <div className="relative border border-[#00000026]">
                        <button
                          onClick={() =>
                            setFilterActivityDropdown(filterActivityDropdown === filter.id ? null : filter.id)
                          }
                          className={` m-1 flex items-center gap-2 px-3 py-1.5 rounded-2xl text-sm w-45 border whitespace-nowrap ${filter.activity ? "bg-[#D9D9D980] border-[#00000038]" : "border-gray-300"
                            }`}
                        >

                          {filter.activity ? (
                            <>
                              <Image
                                src={
                                  filter.activity === "Meeting"
                                    ? "/icons/schedule-meeting.png"
                                    : filter.activity === "Call"
                                      ? "/icons/schedulecall.png"
                                      : filter.activity === "Notes"
                                        ? "/icons/notes.png"
                                        : "/icons/todo.png"
                                }
                                alt={filter.activity}
                                width={20}
                                height={20}
                              />
                              <span>{filter.activity}</span>
                              <X
                                size={14}
                                className="ml-auto text-gray-500 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateFilter(filter.id, "activity", null);
                                }}
                              />
                            </>
                          ) : (
                            "Select activities"
                          )}
                        </button>

                        {filterActivityDropdown === filter.id && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow z-10">


                            {/* Activity Options */}
                            <div className="flex flex-col">
                              <button
                                onClick={() => {
                                  updateFilter(filter.id, "activity", "Meeting");
                                  setFilterActivityDropdown(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                              >
                                <Image
                                  src="/icons/schedule-meeting.png"
                                  alt="Meeting"
                                  width={24}
                                  height={24}
                                />
                                <span>Meeting</span>
                              </button>

                              <button
                                onClick={() => {
                                  updateFilter(filter.id, "activity", "Call");
                                  setFilterActivityDropdown(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                              >
                                <Image
                                  src="/icons/schedulecall.png"
                                  alt="Call"
                                  width={24}
                                  height={24}
                                />
                                <span>Call</span>
                              </button>

                              <button
                                onClick={() => {
                                  updateFilter(filter.id, "activity", "Notes");
                                  setFilterActivityDropdown(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                              >
                                <Image src="/icons/notes.png" alt="Notes" width={24} height={24} />
                                <span>Notes</span>
                              </button>

                              <button
                                onClick={() => {
                                  updateFilter(filter.id, "activity", "To Do");
                                  setFilterActivityDropdown(null);
                                }}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                              >
                                <Image src="/icons/todo.png" alt="To Do" width={24} height={24} />
                                <span>To Do</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-sm">between</span>

                      {/* Start Date */}
                      <div className="relative">
                        <input
                          type="date"
                          value={filter.startDate ?? ""}
                          onChange={(e) =>
                            updateFilter(filter.id, "startDate", e.target.value)
                          }
                          className="border border-[#00000026] px-3 py-1.5 rounded text-sm pr-8"
                          placeholder="Choose date"
                        />

                      </div>

                      {/* End Date */}
                      <div className="relative">
                        <input
                          type="date"
                          value={filter.endDate ?? ""}
                          onChange={(e) =>
                            updateFilter(filter.id, "endDate", e.target.value)
                          }
                          className="border border-[#00000026] px-3 py-1.5 rounded text-sm pr-8"
                          placeholder="Choose date"
                        />

                      </div>

                      {/* Remove filter */}
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new filter / Save */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={addFilter}
                    className="px-3 py-1.5 bg-[#C81C1F] text-white text-sm rounded"
                  >
                    + Add filter
                  </button>
                  <button className="px-3 py-1.5 bg-[#C81C1F] text-white text-sm rounded">
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {showSearch && (
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search activities by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[248px] h-[30px] pl-8 py-1.5 border border-gray-300 rounded-[5px] text-[400] text-[14px] bg-transparent"
            />
          </div>
        )}

        {/* Settings */}
        {showSettings && (
          <div className="relative flex items-center gap-2">
            {/* WhatsApp Icon */}
            <button
              onClick={() => console.log("WhatsApp clicked")}
              className="border-r border-[#4F5051] pr-2"
            >
              <Image
                src="/faWhatsapp.svg"
                alt="WhatsApp"
                width={20}
                height={20}
              />
            </button>

            {/* Settings Icon */}
            <button
              onClick={onSettingsClick}
              className=""
            >
              <Image
                src="/settings.svg"
                alt="Settings"
                width={20}
                height={20}
              />
            </button>
          </div>
        )}

      </div>
      {activityType && !onAddActivity && (
        <ActivityModal
          isOpen={true}
          onClose={() => setActivityType(null)}
          type={activityType}
        />
      )}

    </>
  );
};