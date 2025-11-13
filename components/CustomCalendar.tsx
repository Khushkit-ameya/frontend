"use client";

import React, { useState } from "react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface Props {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
  themeColor: string;
}

export default function CustomCalendar({
  startDate,
  endDate,
  onChange,
  onClose,
  themeColor,
}: Props) {
  const [localStart, setLocalStart] = useState<Date | null>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | null>(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false); // Track if we're selecting end date

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Get first day of month grid
  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const startDay = startOfMonth.getDay();

  // Total days in month
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      localStart ? localStart.getHours() : 0,
      localStart ? localStart.getMinutes() : 0
    );

    if (!localStart || selectingEnd) {
      // If no start date yet, or we're selecting end date
      if (!localStart) {
        setLocalStart(selectedDate);
        // Auto-set end date to same day with 1 hour later
        const endDate = new Date(selectedDate);
        endDate.setHours(selectedDate.getHours() + 1);
        setLocalEnd(endDate);
        setSelectingEnd(false);
      } else {
        // Setting end date
        const endDateTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          localEnd ? localEnd.getHours() : (localStart.getHours() + 1),
          localEnd ? localEnd.getMinutes() : localStart.getMinutes()
        );
        
        // Ensure end is after start
        if (endDateTime > localStart) {
          setLocalEnd(endDateTime);
        } else {
          // If selected end is before start, swap them
          setLocalEnd(localStart);
          setLocalStart(endDateTime);
        }
        setSelectingEnd(false);
      }
    } else {
      // If start date exists and we're not in end selection mode, start new selection
      setLocalStart(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setHours(selectedDate.getHours() + 1);
      setLocalEnd(endDate);
      setSelectingEnd(false);
    }
  };

  const isDateInRange = (day: number): boolean => {
    if (!localStart || !localEnd) return false;
    
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    
    const startDay = new Date(localStart.getFullYear(), localStart.getMonth(), localStart.getDate());
    const endDay = new Date(localEnd.getFullYear(), localEnd.getMonth(), localEnd.getDate());
    
    return date >= startDay && date <= endDay;
  };

  const isStartDate = (day: number): boolean => {
    if (!localStart) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return isSameDay(date, localStart);
  };

  const isEndDate = (day: number): boolean => {
    if (!localEnd) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return isSameDay(date, localEnd);
  };

  return (
    <div className="absolute z-50 mt-10 bg-white border border-[#00000040] rounded p-4 w-[370px] shadow-[0px_4px_4px_0px_#00000040]">
      {/* Date Range Display */}
      <div className="flex flex-col mb-3">
        <label className="text-sm mb-1 font-medium">Date Range</label>
        <div className="relative">
          <input
            type="text"
            value={
              localStart && localEnd
                ? `${format(localStart, "dd/MM/yyyy")} - ${format(localEnd, "dd/MM/yyyy")}`
                : localStart
                ? format(localStart, "dd/MM/yyyy")
                : ""
            }
            readOnly
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <Calendar className="absolute right-2 top-2.5 w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Time row */}
      <div className="flex gap-4 mb-3">
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1 font-medium">Start time</label>
          <input
            type="time"
            value={localStart ? format(localStart, "HH:mm") : ""}
            onChange={(e) => {
              if (localStart) {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                const newStart = new Date(localStart);
                newStart.setHours(hours, minutes);
                setLocalStart(newStart);
                
                // Auto-update end time if it's the same day
                if (localEnd && isSameDay(localStart, localEnd)) {
                  const newEnd = new Date(newStart);
                  newEnd.setHours(hours + 1, minutes);
                  setLocalEnd(newEnd);
                }
              }
            }}
            className="border px-2 py-1 rounded text-sm"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1 font-medium">End time</label>
          <input
            type="time"
            value={localEnd ? format(localEnd, "HH:mm") : ""}
            onChange={(e) => {
              if (localEnd) {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                const newEnd = new Date(localEnd);
                newEnd.setHours(hours, minutes);
                
                // Validate that end time is after start time
                if (localStart && newEnd > localStart) {
                  setLocalEnd(newEnd);
                } else if (localStart) {
                  // If end time is before start, show warning but still set it
                  setLocalEnd(newEnd);
                }
              }
            }}
            className="border px-2 py-1 rounded text-sm"
          />
        </div>
      </div>

      {/* Selection mode toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setSelectingEnd(false)}
          className={`flex-1 px-3 py-1 text-sm rounded ${
            !selectingEnd
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Start Date
        </button>
        <button
          type="button"
          onClick={() => setSelectingEnd(true)}
          className={`flex-1 px-3 py-1 text-sm rounded ${
            selectingEnd
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          End Date
        </button>
      </div>

      {/* Calendar header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1)
              )
            }
            className="border rounded px-2 py-1"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {format(new Date(2000, i, 1), "MMM")}
              </option>
            ))}
          </select>

          <select
            value={currentMonth.getFullYear()}
            onChange={(e) =>
              setCurrentMonth(
                new Date(parseInt(e.target.value), currentMonth.getMonth(), 1)
              )
            }
            className="border rounded px-2 py-1"
          >
            {Array.from({ length: 50 }).map((_, i) => {
              const year = 2000 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-3">
        {daysOfWeek.map((day) => (
          <div key={day} className="font-medium text-gray-600">
            {day}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isStart = isStartDate(day);
          const isEnd = isEndDate(day);
          const inRange = isDateInRange(day);

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`py-2 rounded-full transition-colors ${
                isStart || isEnd
                  ? "bg-red-500 text-white font-semibold"
                  : inRange
                  ? "bg-red-100 text-red-700"
                  : "hover:bg-gray-200 text-gray-700"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-500 mb-3 text-center">
        {selectingEnd ? "Select end date" : "Select start date"}
      </div>

      {/* Done button */}
      <button
        onClick={() => {
          if (localStart && localEnd && localStart > localEnd) {
            alert("Start time must be before end time");
            return;
          }
          onChange(localStart, localEnd);
          onClose();
        }}
        className="mt-3 w-full text-white px-4 py-2 rounded font-medium hover:opacity-90 transition-opacity"
        style={{ backgroundColor: themeColor }}
      >
        Done
      </button>
    </div>
  );
}
