"use client"; // safe to include if using app router; no-op for pages router

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Holiday } from "@/app/biz-ignite/Holiday/page";
import DropDown from "@/components/BizIgnite/Holiday/HolidayDropDown";


interface Option {
  key: string
  label: string
  icon: string
  Bgcolor: string
}

export default function HolidayModal({ isOpen, onClose, onSaved, holiday}: {
  isOpen: boolean;
  onClose: () => void;
  // allow async or sync handlers and accept any payload (keeps caller typing flexible)
  onSaved?: (payload: any) => void | Promise<void>;
  holiday?: {
    name?: string;
    fromDate?: string;
    toDate?: string;
    holidayType?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
  } | null;
}) {
  const [form, setForm] = useState({
    name: "",
    fromDate: "",
    toDate: "",
    holidayType: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<string>("");

   // Pre-fill form when editing
  useEffect(() => {
    if (holiday) {
      setForm({
        name: holiday.name || "",
        fromDate: holiday.fromDate ? formatDate(holiday.fromDate) : "",
        toDate: holiday.toDate ? formatDate(holiday.toDate) : "",
        holidayType: holiday.holidayType || "",
        startTime: holiday.startTime || "",
        endTime: holiday.endTime || "",
        description: holiday.description || "",
      });
      setType(holiday.holidayType || "");
    } else {
      // Reset form when adding new holiday
      setForm({
        name: "",
        fromDate: "",
        toDate: "",
        holidayType: "",
        startTime: "",
        endTime: "",
        description: "",
      });
      setType("");
    }
  }, [holiday]);

 const options: Option[] =[
  { key: "PUBLIC", label: "PUBLIC", icon: "👥", Bgcolor: "" },
  { key: "COMPANY", label: "COMPANY", icon:"🏢", Bgcolor:"" },
  { key: "REGIONAL", label: "REGIONAL", icon: '🔒', Bgcolor: "" },
  { key: "OPTIONAL", label: "OPTIONAL", icon:'⚙️', Bgcolor: "" },
]

  if (!isOpen) return null;

  const handleChange = (e: { target: { name: string , value: string }; }) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

   // convert yyyy-mm-dd -> dd-mm-yyyy
  const formatDate = (isDate: string) => {
    if (!isDate) return "";
    const [y, m, d] = isDate.split("-");
    return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
  };

  const validate = () => {
    if (!form.name) return "Holiday Name is required";
    if (!form.fromDate) return "From Date is required";
    if (!form.toDate) return "To Date is required";
   
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (from > to ) return "From Date cannot be after To Date";

    // If both times provided, ensure start <= end (for same day or general check)
    if (form.startTime && form.endTime) {
      // times are "HH:MM"
      const [sh, sm] = form.startTime.split(":").map(Number);
      const [eh, em] = form.endTime.split(":").map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      if (startMinutes > endMinutes) return "Start Time cannot be after End Time";
    }

    return null;
  };

  const handleType = (value: string | number) => {
    setType(value.toString());   // convert to string
  }

  
  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setError("");
     const payload = {
      name: form.name,
      fromDate: formatDate(form.fromDate),
      toDate: formatDate(form.toDate),
      holidayType: type,
      startTime: form.startTime || null, // HH:MM or null
      endTime: form.endTime || null,
      description: form.description===""?"-":form.description.trim(), // optional
    };
    
    try {
    //   reset form fields after save form
      setForm({
        name: "",
        fromDate: "",
        toDate: "",
        holidayType: "",
        startTime: "",
        endTime: "",
        description:"",
      });

      onSaved && onSaved(payload);
      onClose();
    } 
    
    catch (err) {
      setLoading(false);
      setError("Unknown error");
      toast.error("holiday save failed: ");
    }
  };

if (!isOpen) return null;

return (
  <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 pointer-events-auto">

    {/* Modal Wrapper */}
    <aside className="w-full sm:w-3/4 md:w-1/2 bg-white rounded-md shadow-xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto p-0" style={{scrollbarWidth:"none"}}>

      {/* Header */}
      <div className="sticky top-0 bg-[#656462] text-white rounded-t-md px-6 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium">{holiday ? "Edit Holiday" : "Add Holiday"}</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="bg-white text-black px-2 rounded text-xl leading-none"
        >
          &times;
        </button>
      </div>

      {/* Form Body */}
      <div className="px-6 py-6 space-y-5 border rounded-md mx-4 mt-5 mb-8 bg-[#f3f3f3]">
        
        <label className="block">
          <span className="text-sm mb-1 block">Holiday Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Add holiday name"
            className="w-full border rounded bg-white px-3 py-1"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="text-sm mb-1 block">From Date</span>
            <input
              name="fromDate"
              value={form.fromDate}
              onChange={handleChange}
              type="date"
              className="w-full border bg-white rounded px-3 py-1"
            />
          </label>

          <label>
            <span className="text-sm mb-1 block">To Date</span>
            <input
              name="toDate"
              value={form.toDate}
              onChange={handleChange}
              type="date"
              className="w-full border bg-white rounded px-3 py-1"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="text-sm mb-1 block">Start Time</span>
            <input
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              type="time"
              className="w-full border bg-white rounded px-3 py-1"
            />
          </label>

          <label>
            <span className="text-sm mb-1 block">End Time</span>
            <input
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              type="time"
              className="w-full border bg-white rounded px-3 py-1"
            />
          </label>
        </div>

        <label>
          <span className="text-sm mb-1 block">Holiday Type</span>
          <DropDown value={type} data={options} onChange={handleType} placeholder="Select Type"/>
        </label>

        <label>
          <span className="text-sm mb-1 block">Description</span>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            placeholder="Add holiday description"
            className="w-full bg-white border rounded px-3 py-2 h-24"
          />
        </label>

        {error && <p className="text-red-600 text-sm">*{error}</p>}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-3 pb-7">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#C81C1F] cursor-pointer text-white px-6 py-1 rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {holiday ? "Update" : "Save"}
          </button>

          <button
            onClick={onClose}
            className="bg-white border px-6 py-1 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>

      </div>

    </aside>
  </div>
);

}
