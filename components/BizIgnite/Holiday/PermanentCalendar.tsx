"use client";
import { useState } from "react";
import { toast } from "react-toastify";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday","Sunday" ];

interface Props {
  existingHolidays?: number[]; // Store as numbers: 0-6
  onClose: () => void;
  onSave?: (savedDayNumber: number) => void; // notify parent after successful save
}

export default function WeekdayCalendar({ onSave, existingHolidays = [], onClose }: Props) {
  const [selected, setSelected] = useState<number | null>(null); // store selected day number
console.log("exist holiday=",existingHolidays)
  const handleWeekDayClick = async(dayIndex: number) => {
    setSelected(dayIndex);
    const handleSave = async() => {
    if (dayIndex === null) {  
      toast.error("Please select a day!");
      return;
    }

   
console.log("dayIndex=",dayIndex)
    onSave?.(dayIndex);
    onClose();
    // toast.success(`${weekdays[selected]} marked as permanent holiday`);
  };
  handleSave()
  };

  

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 overflow-auto" style={{ scrollbarWidth: "none" }}>
        {weekdays.map((day, index) => {
          const isSelected = selected === index;
          const isPermanent = existingHolidays.includes(index);
          const bgColor = isPermanent ? "bg-red-600 text-white" : isSelected ? "bg-yellow-400" : "bg-gray-200";

          return (
            <div
              key={day}
              onClick={() => {handleWeekDayClick(index)}}
              className={`cursor-pointer px-4 py-2 rounded text-center ${bgColor} flex-1`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-red-600"
      >
        Save Permanent Holiday
      </button> */}

      {/* <button
        onClick={handleCancel}
        className="ml-2 mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 hover:text-white"
      >
        Close Week Calendar
      </button> */}
    </div>
  );
}
