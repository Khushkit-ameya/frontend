"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { useCreateLeaveTypeAllocationMutation } from "@/store/api";
import DropDown from "../Holiday/HolidayDropDown";

interface Option {
  key: string;
  label: string;
}

export default function AddLeaveTypeForm({ isOpen, onClose, onSaved }: any) {
  const Role: Option[] = [
    { key: "HR", label: "HR" },
    { key: "DEVELOPMENT", label: "Development" },
    { key: "FINANCE", label: "Finance" },
    { key: "MARKETING", label: "Marketing" },
    { key: "TESTING", label: "Testing" },
    { key: "ACCOUNT", label: "Account" },
    { key: "SALES", label: "Sales" },
  ];

  const LeaveTypes: Option[] = [
    { key: "Sick Leave", label: "Sick Leave" },
    { key: "Casual Leave", label: "Casual Leave" },
    { key: "Annual Leave", label: "Annual Leave" },
    { key: "Maternity Leave", label: "Maternity Leave" },
    { key: "Paternity Leave", label: "Paternity Leave" },
    { key: "Emergency Leave", label: "Emergency Leave" },
    { key: "Unpaid Leave", label: "Unpaid Leave" },
    { key: "Compensatory Leave", label: "Compensatory Leave" },
  ];
const [createLeaveTypeAllocation]=useCreateLeaveTypeAllocationMutation();
  const [form, setForm] = useState({
    year:new Date().getFullYear(),
    leaveType: "",
    role: "",
    days: 0,
  });

const handleSave = async () => {
  if (!form.leaveType  || !form.days || !form.year) {
    toast.error("All fields are required !");
    return;
  }
  console.log("form values", form);
  onSaved(form);
  try {
   const response = await createLeaveTypeAllocation({
      leaveAttributes: [
        {
          id: "",
          year: form.year,
          leaveName: form.leaveType,
          role: [form.role],
          allocatedDays: form.days,
        },
      ],
    } as any).unwrap();
    toast.success("Leave Type added ✅");
    onClose();
  } catch (err: any) {
    toast.error(err?.data?.message || "Failed to add leave type");
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center pointer-events-none">
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black opacity-50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal */}
 <div className="fixed w-[500]  z-50 bg-white  rounded shadow-xl transform transition-transform duration-300 ease-in-out pointer-events-auto animated-slideLeft">
   
        {/* Header */}
        <div className="sticky bg-[#656462] text-white  top-0 z-10 flex justify-between rounded-tl rounded-tr items-center px-6 py-3 border-b">
          <h2 className="font-medium text-lg">Apply Leave Type</h2>
          <button className="text-2xl hover:text-red-700" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 space-y-4 mx-6">
          
           {/* Days Input */}
          <div>
            <label className="text-sm font-medium">Year</label>
            <input
              type="number"
              className="border rounded-md w-full mt-1 px-3 py-1"
              placeholder="Enter year"
              value={form.year}
              onChange={(e) => setForm({ ...form, year:Number( e.target.value) })}
            />
          </div>

          {/* Leave Type Dropdown */}
          <div>
            <label className="text-sm font-medium">Select Leave Type</label>
            <DropDown
              placeholder="Choose Leave Type"
              data={LeaveTypes}
              value={form.leaveType}
              onChange={(v: any) =>
                setForm((p) => ({ ...p, leaveType: v}))
              }
            />
          </div>

          {/* Role Dropdown */}
          {/* <div className="">
            <label className="text-sm font-medium">Select Role</label>
            <DropDown
              placeholder="Choose Role"
              data={Role}
              value={form.role}
              onChange={(v: any) =>
                setForm((p) => ({ ...p, role: v }))
              }/>
          </div> */}

          {/* Days Input */}
          <div>
            <label className="text-sm font-medium">Allotted Days</label>
            <input
              type="number"
              className="border rounded-md w-full mt-1 px-3 py-1"
              placeholder="Enter leave days"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6 mb-5 mx-6">
          <button
            onClick={onClose}
            className="px-5 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-1 text-white bg-red-700 rounded-md hover:bg-red-800"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
