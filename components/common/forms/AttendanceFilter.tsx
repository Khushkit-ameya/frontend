"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import ShiftNameSelector from "./ShiftNameSelector";
import { BorderAll } from "@mui/icons-material";

interface AttendanceFilterProps {
  onFilter: (filters: {
    name?: string;
    fromDate?: string;
    toDate?: string;
    shiftName?: string;
    status?: string;
  }) => void;
  onCancel: () => void;
  shifts: { label: string }[];
}

const AttendanceFilter: React.FC<AttendanceFilterProps> = ({ onFilter, onCancel, shifts, }) => {
  const [name, setName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [shiftName, setShiftName] = useState("");
  const [status, setStatus] = useState("");

 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters = { name, fromDate, toDate, shiftName, status };

    // Show all selected filter values in console
    console.log("Selected Filter Values:", filters);

    // Optional: Trigger parent filter logic
    onFilter(filters);
  };

  const handleCancel = () => {
    setName("");
    setFromDate("");
    setToDate("");
    setShiftName("");
    setStatus("");
    onCancel();
  };


  const statusOptions = [
    { label: "Late Arrival", value: "Late Arrival", color: "#4F5051" },
    { label: "On Time", value: "On Time", color: "#4F5051" },
    { label: "Early Arrival", value: "Early Arrival", color: "#4F5051" },
    { label: "Over Time", value: "Over Time", color: "#4F5051" },
  ];

  // Find selected color for current status
  const selectedColor =
    statusOptions.find((s) => s.value === status)?.color || "#000000"; // default gray

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-xl p-6 flex flex-col gap-5 w-full max-w-3xl"
    >
       {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filter</h2>
                <button
                  onClick={onCancel}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white capitalize"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Shift Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Shift</label>
        <ShiftNameSelector
          value={shiftName}
          onChange={(val: string) => setShiftName(val)}
         shifts={shifts}
        />
        
      </div>

      {/* Status Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white cursor-pointer"
          style={{ color: selectedColor }}
        >
          <option value="" style={{ color: "#6B7280" }}>
            Select Status
          </option>
          {statusOptions.map((s) => (
            <option
              key={s.value}
              value={s.value}
              style={{ color: s.color, fontWeight: "400"}}
            >
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-start gap-4 mt-4">
        <button
          type="submit"
          className="px-5 py-2 text-sm font-medium rounded bg-red-600 hover:bg-red-700 text-white cursor-pointer"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-5 py-2 text-sm font-medium rounded border border-gray-400 text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
        >
          Cancel
        </button>
        
      </div>
    </form>
  );
};

export default AttendanceFilter;
