import { Button } from "@/components/ui buttons/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui buttons/popover";
import { BorderColor } from "@mui/icons-material";
import { red } from "@mui/material/colors";
import { JSX, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

interface ShiftNameSelectorProps {
  value: string;
  onChange: (val: string) => void;
  shifts?: { label: string }[]; // new prop
}

const ShiftNameSelector: React.FC<ShiftNameSelectorProps> = ({
  value,
  onChange,
  shifts: dynamicShifts,
}) => {
  const [open, setOpen] = useState(false);

  // Default shifts if dynamicShifts not provided
  const defaultShifts = [
    { label: "Day Shift" },
    { label: "Night Shift" },
    { label: "Other Shift" },
  ];

  const shifts = dynamicShifts && dynamicShifts.length > 0 ? dynamicShifts : defaultShifts;


  const handleSelect = (label: string) => {
    onChange(label);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className=" w-full justify-between text-sm text-left font-normal flex items-left">
          {value ? (
            <div className="flex text-sm items-center gap-2 cursor-pointer">
              <span>{value}</span>
            </div>
          ) : (
            "Select shift name"
          )}
          {/* Arrow Icon */}
          <FiChevronDown className="ml-2 text-gray-500" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start"
  sideOffset={4} 
       className="w-[570px] p-2 space-y-1 al " >
        {shifts.map((shift) => (
          <button
            key={shift.label}
            className={`flex items-center w-full gap-2 p-2 cursor-pointer border-b-1 border-black-500 capitalize ${value === shift.label
              ? " bg-gray-100"
              : "hover:bg-gray-100"
              }`}
            onClick={() => handleSelect(shift.label)}
          >
            <span>{shift.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ShiftNameSelector;
