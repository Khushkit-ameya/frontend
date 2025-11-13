"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import ShiftNameSelector from "@/components/common/forms/ShiftNameSelector";

// Define the type for the shift form
export interface ShiftFormData {
  id?: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  gracePeriodMinutes: number;
}


interface CreateShiftDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftFormData) => void;
  themeColor?: string;
  initialValues?: ShiftFormData; //  Add this
}

const CreateShift: React.FC<CreateShiftDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  themeColor = "#b61f21",
  initialValues, //  receive initial values
}) => {
  const initialForm: ShiftFormData = initialValues || {
    shiftName: "",
    startTime: "",
    endTime: "",
    breakDuration: 30,
    gracePeriodMinutes: 10,
  };

  const [form, setForm] = useState<ShiftFormData>(initialForm);
  const predefinedShifts = ["Day Shift", "Night Shift"];
  const [selectedShiftType, setSelectedShiftType] = useState(
    initialValues?.shiftName
      ? predefinedShifts.includes(initialValues.shiftName.toUpperCase())
        ? initialValues.shiftName.toUpperCase()
        : "Other Shift"
      : ""
  );

  const [showOtherInput, setShowOtherInput] = useState(
    initialValues
      ? !predefinedShifts.includes(initialValues.shiftName.toUpperCase())
      : false
  );

  React.useEffect(() => {
    if (open) {
      setForm(initialValues || { shiftName: "", startTime: "", endTime: "", breakDuration: 30, gracePeriodMinutes: 10 });
      setSelectedShiftType(
        initialValues?.shiftName
          ? predefinedShifts.includes(initialValues.shiftName.toUpperCase())
            ? initialValues.shiftName.toUpperCase()
            : "Other Shift"
          : ""
      );
      setShowOtherInput(
        initialValues
          ? !predefinedShifts.includes(initialValues.shiftName.toUpperCase())
          : false
      );
    }
  }, [open, initialValues]);

  if (!open) return null;

  //  reset helper
  const resetForm = () => {
    setForm(initialForm);
    setSelectedShiftType("");
    setShowOtherInput(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let newValue: string | number = value;

    if (name === "breakDuration") {
      newValue = Math.max(0, Number(value));
    }

    if (name === "gracePeriodMinutes") {
      const num = Number(value);
      newValue = Math.min(30, Math.max(0, num));
    }

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedShiftType === "Other Shift" && !form.shiftName.trim()) {
      alert("Please enter custom shift name");
      return;
    }

    const isEditing = !!initialValues?.id; //  agar id hai to edit mode me ho
    onSubmit({ ...form, id: initialValues?.id });

    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className={`
          w-[650px] shadow-lg overflow-y-auto right-0 relative  
          bg-white text-gray-900  
          dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-center pt-2 pb-2 pl-4 pr-4 " style={{
          backgroundColor: "#656462", color: "white"
        }}>
          <h2 className="text-base font-semibold">Create Shift</h2>
          <button
            onClick={handleCancel}
            className="cursor-pointer p-0.5 rounded-[3px] hover:bg-gray-100 dark:hover:bg-gray-800" style={{
          backgroundColor: "#ffffff", color: "#656462"
        }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shift Name */}
          <div className=" p-4 ">
            <div className=" p-6  rounded-[5px] border" style={{
          backgroundColor: "#f3f3f3",
        }}>
              <div className=" pb-5 ">
                <label className="block text-sm mb-1" style={{color:"#4F5051"}}>Shift Name</label>


                <ShiftNameSelector
                  value={selectedShiftType}
                  onChange={(val) => {
                    setSelectedShiftType(val);

                    if (val === "Other Shift") {
                      setShowOtherInput(true);
                      setForm((prev) => ({ ...prev, shiftName: initialValues?.shiftName || "" }));
                    } else {
                      setShowOtherInput(false);
                      setForm((prev) => ({ ...prev, shiftName: val }));
                    }
                  }}
                />


                {showOtherInput && (
                  <input
                    type="text"
                    placeholder="Enter custom shift name"
                    value={form.shiftName}
                    onChange={handleInputChange}
                    name="shiftName"
                    className="w-full border rounded p-2 mt-2 bg-white dark:bg-gray-800 dark:border-gray-600 capitalize"
                    required
                  />
                )}
              </div>

              {/* Start & End Time */}
              <div className="flex gap-2 pb-5">
                <div className="flex-1">
                  <label className="block text-sm mb-1" style={{color:"#4F5051"}}>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleInputChange}
                    className="cursor-pointer text-sm w-full border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-600"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1" style={{color:"#4F5051"}}>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleInputChange}
                    className="w-full text-sm border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-600"
                    required
                  />
                </div>
              </div>

              {/* Break Time */}
              <div className="flex justify-between items-center pb-5 gap-2">
                <div className="flex-1">
                  <label className="block text-sm mb-1" style={{color:"#4F5051"}}>Break Time</label>
                  <input
                    type="number"
                    name="breakDuration"
                    value={form.breakDuration}
                    onChange={handleInputChange}
                    className="cursor-pointer text-sm w-[100%] border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-600"
                    min={0}
                    required
                  />
                </div>
                <div className="border rounded p-2 text-sm bg-white w-[50%] flex items-end mt-6">Minutes</div>
              </div>

              {/* Grace Period */}
              <div className="flex justify-between items-center pb-5 gap-2">
                <div className="flex-1">
                  <label className="block text-sm mb-1" style={{color:"#4F5051"}}>Grace Period</label>
                  <input
                    type="number"
                    name="gracePeriodMinutes"
                    value={form.gracePeriodMinutes}
                    onChange={handleInputChange}
                    className="cursor-pointer text-sm w-[100%] border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-600"
                    min={0}
                    max={30}
                    required
                  />
                </div>
                <div className="border rounded p-2 text-sm bg-white w-[50%] flex items-end mt-6">Minutes</div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-6 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border px-6 py-1 text-base rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" style={ {  color: "#88898a", borderColor: "#88898a" } }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-1 text-base rounded text-white cursor-pointer"  style={ { backgroundColor: '#b61f21', color: '#ffffff' } }
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShift;
