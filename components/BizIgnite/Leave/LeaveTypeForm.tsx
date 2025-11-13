"use client";

import { useApplyLeaveMutation } from "@/store/api";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface FormType {
  role: string;
  leaveName: string;
  fromDate: string;
  toDate: string;
  file: File | null; // <-- allow File
  reason: string;
}

export default function ApplyLeaveForm({ isOpen, onClose, onSaved, leaveData }: any) {
console.log("leaveData?.leave in form:", leaveData?.leave);
  const [form, setForm] = useState<FormType>({
    role: "",
    leaveName: "",
    fromDate: "",
    toDate: "",
    file: null, // initial value is null
    reason: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const[applyLeave]=useApplyLeaveMutation();
  // Reset or prefill on open
  useEffect(() => {
    if (leaveData?.leave) {
      setForm({
        role: leaveData?.leave.role,
        leaveName: leaveData?.leave.name.replace(/_/g, ' ')?.trim(),
        fromDate: leaveData?.leave.fromDate || "",
        toDate: leaveData?.leave.toDate || "",
        file: leaveData?.leave.file || null,
        reason: leaveData?.leave.description || "",
      });
    } else {
      resetForm();
    }
  }, [leaveData?.leave]);

  const resetForm = () => {
    setForm({
      role: "",
      leaveName: leaveData?.leave?.name.replace(/_/g, ' ')?.trim(),
      fromDate: "",
      toDate: "",
      file: null,
      reason: "",
    });
  };

  if (!isOpen) return null;

  const calculateDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    const diff =
      (new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) /
      (1000 * 3600 * 24);
    return diff + 1;
  };

  const validate = () => {
    const today = new Date();
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    const totalDays = calculateDays();
    const available = leaveData?.leave?.available || 0;

    if (!form.fromDate) return "From Date required";
    if (!form.toDate) return "To Date required";

    if (from > to) return "From Date cannot be greater than To Date";

    if (from < new Date(today.toDateString()))
      return "You can't apply leave for past dates";

    if (!form.reason.trim())
      return "Reason required";

    // if (totalDays > available)
    //   return `You cannot apply more than ${available} days`;

    // calculate leave dates are already not applied for leave
    // const overlaps = existingLeaves.some((l: any) => {
    //   const lf = new Date(l.fromDate);
    //   const lt = new Date(l.toDate);
    //   return from <= lt && to >= lf;
    // });

    // if (overlaps)
    //   return "You already applied for leave in this date range";

    return null;
  }; 1

  const handleSave = async() => {
    try {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      leaveName: leaveData?.leave.id,
      totalDays: calculateDays(),
    };

    console.log("APPLY LEAVE PAYLOAD:", payload);
    const formData = new FormData();
    formData.append("leaveTypeId", leaveData?.leave?.leaveAttributeId);
    formData.append("startDate", payload.fromDate);
    formData.append("endDate", payload.toDate);
    formData.append("reason", payload.reason);
    formData.append("status", "PENDING");
     if (payload.file) {
    if (payload.file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(payload.file.type)) {
      throw new Error('Only image (JPG, JPEG, PNG) and PDF files are allowed');
    }

    formData.append("file", payload.file);
  }
  console.log("FormData entries:");
  for (const pair of formData.entries()) {
    console.log(`${pair[0]}: ${pair[1]}`);
  }
const response = await applyLeave(formData).unwrap();
console.log("Leave applied response:", response);
    toast.success("Leave Applied ✅");
    onSaved && onSaved(payload);
    setLoading(false);
    // onClose();
    // resetForm();
  } catch (err) {
    console.error("Error applying leave:", err);
    setLoading(false);
    toast.error("Failed to apply leave");
  }
  };
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 pointer-events-none">

      {/* overlay */}
      <div
        className="absolute inset-0 bg-black opacity-40 pointer-events-auto z-40"
      />

      {/* modal */}
      <div className="fixed  z-50 bg-white  rounded-xl shadow-xl transform transition-transform duration-300 ease-in-out pointer-events-auto animated-slideLeft">
        <div className="sticky bg-[#656462] text-white  top-0 z-10 flex justify-between rounded-tl-xl rounded-tr-xl items-center px-6 py-3 border-b">
          <h2 className="font-medium text-lg">Apply Leave</h2>
          <button className="text-2xl hover:text-red-700" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="px-6 py-4 overflow-auto" style={{ maxHeight: "calc(100% - 60px)" }}>

          {/* Leave type */}

          <label className=" font-medium text-sm">Leave Name
            <input type="text" className="w-full font-normal mt-1 border rounded-md px-3 py-2" value={form.leaveName} disabled />
          </label>
          {/* DATE PICKERS */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="text-sm font-medium">
              From Date
              <input
                type="date"
                className="w-full font-normal border px-3 py-2 rounded-md mt-1"
                value={form.fromDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fromDate: e.target.value }))
                }
              />
            </label>

            <label className="text-sm font-medium">
              To Date
              <input
                type="date"
                className="font-normal w-full border px-3 py-2 rounded-md mt-1"
                value={form.toDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, toDate: e.target.value }))
                }
              />
            </label>
          </div>

          {/* DAYS INFO */}
          <p className="text-sm mb-3">
            Total Days:{" "}
            <span className="font-semibold text-blue-600">
              {calculateDays()} days
            </span>
          </p>

          {/* file upload */}
          <label className="block text-sm font-medium">
            Choose File
            <input
              type="file"
              className="font-normal w-full border px-3 py-2 rounded-md mt-1"
              placeholder="Upload File"
              onChange={(e) =>
                setForm((p: any) => ({ ...p, file: e.target.files?.[0] || null }))
              }
            />
          </label>
          {/* DESCRIPTION */}
          <label className="block text-sm font-medium">
            Reason
            <textarea
              rows={2}
              className="font-normal w-full border px-3 py-2 rounded-md mt-1"
              value={form.reason}
              onChange={(e) =>
                setForm((p) => ({ ...p, reason: e.target.value }))
              }
            ></textarea>
          </label>

          {/* ERRORS */}
          {error && <p className="text-sm text-red-600 my-2">*{error}</p>}

          {/* ACTIONS */}
          <div className="flex gap-3 pt-3">
            <button
              className="bg-gray-200 py-2 px-5 rounded-md flex-1 cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-red-700 text-white py-2 px-5 rounded-md flex-1 disabled:opacity-60 cursor-pointer"
              disabled={loading}
              onClick={handleSave}
            >
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
