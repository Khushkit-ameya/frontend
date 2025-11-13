"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import Select from "react-select";
import ShiftNameSelector from "@/components/common/forms/ShiftNameSelector";
import { useGetUsersWithoutShiftsQuery } from '@/store/api_query/bizignite/shift.api';
import DatePicker from "../DatePicker";
import { BorderAllRounded } from "@mui/icons-material";

interface AssignShiftFormData {
  shiftName: string;
  startDate: string;
  endDate: string;
  assigneeUsers: string[];
}

interface AssignShiftFormProps {
  open: boolean;
  onClose: () => void;
  themeColor?: string;
  onSubmit: (data: {
    shiftName: string;
    startDate: string;
    endDate: string;
    assigneeUsers: string[];
  }) => void;
  shiftList: { label: string; value: string }[];
}

const AssignShiftForm: React.FC<AssignShiftFormProps> = ({
  open,
  onClose,
  onSubmit,
  themeColor = "#b61f21",
  shiftList,
}) => {
  const [form, setForm] = useState<AssignShiftFormData>({
    shiftName: "",
    startDate: "",
    endDate: "",
    assigneeUsers: [],
  });

  // Fetch users without assigned shifts
  const { data: usersData, isLoading, error } = useGetUsersWithoutShiftsQuery(undefined, {
    skip: !open,
  });

  const userList =
    usersData?.data?.map((user: any) => ({
      label: `${user.firstName} ${user.middleName ? `${user.middleName} ` : ""}${user.lastName}`,
      value: user.id,
      email: user.user.email,
      status: user.status,
      role: user.role?.name,
      isActive: user.isActive,
    })) || [];

  // Default date setup
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      setForm((prev) => ({
        ...prev,
        startDate: today,
        endDate: nextWeek,
      }));
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { shiftName, startDate, endDate, assigneeUsers } = form;

    if (!shiftName || !startDate || !endDate || assigneeUsers.length === 0) {
      alert("Please fill in all fields");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("End date cannot be before start date");
      return;
    }

    onSubmit(form);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setForm({
      shiftName: "",
      startDate: "",
      endDate: "",
      assigneeUsers: [],
    });
  };

  const selectedUsers = userList.filter((u) =>
    form.assigneeUsers.includes(u.value)
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className={`w-[650px] z-10 shadow-lg  right-0 relative
          bg-white text-gray-900  
          dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700`}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center pt-2 pb-2 pl-4 pr-4"
          style={{
            backgroundColor: "#656462",
            color: "white",
          }}
        >
          <h2 className="text-base font-semibold">Assign Shift</h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-0.5 rounded-[3px] hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{
              backgroundColor: "#ffffff",
              color: "#656462",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* API Loading/Error/Info */}
        {isLoading && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">
                Loading available users...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <span className="text-sm text-red-700">
              Failed to load users. Please try again.
            </span>
          </div>
        )}

        {usersData?.meta && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Available Users:</span>
                <span className="ml-1 text-green-700">
                  {usersData.meta.totalCount}
                </span>
              </div>
              <div>
                <span className="font-medium">Active:</span>
                <span className="ml-1 text-green-700">
                  {usersData.meta.activeUsers}
                </span>
              </div>
            </div>
            {usersData.meta.note && (
              <p className="text-xs text-green-600 mt-1 italic">
                {usersData.meta.note}
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4">
            <div
              className="p-6 rounded-[5px] border"
              style={{ backgroundColor: "#f3f3f3" }}
            >
              {/* Shift Name */}
              <div className="pb-5">
                <label className="block text-sm mb-1 font-medium">
                  Shift Name
                </label>
                <ShiftNameSelector
                  value={form.shiftName}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, shiftName: val }))
                  }
                  shifts={shiftList}
                />
              </div>

              {/* Dates */}
              <div className="flex gap-3 pb-5">
                <div className="flex-1">
                  <label className="block text-sm mb-1 font-medium">
                    Start Date
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={form.startDate}
                      onChange={(date) => setForm((prev) => ({ ...prev, startDate: date }))}
                      placeholder="Select start date"
                      minDate={new Date().toISOString().split("T")[0]}
                      className="w-full start-end-date-shift"
                      disabled={isLoading}
                    />
                    <style>

                    </style>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm mb-1 font-medium">
                    End Date
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={form.endDate}
                      onChange={(date) => setForm((prev) => ({ ...prev, endDate: date }))}
                      placeholder="Select end date"
                      minDate={form.startDate}
                      className="w-full start-end-date-shift"
                      disabled={isLoading}
                    />

                  </div>
                </div>
              </div>

              {/* Multi-User Dropdown */}
              <div className="pb-5">
                <label className="block text-sm mb-1 font-medium">
                  Assignee Users
                </label>
                <Select
                  isMulti
                  name="assigneeUsers"
                  // keep same full user object structure
                  options={userList}
                  value={userList.filter((u) => form.assigneeUsers.includes(u.value))}
                  onChange={(selectedOptions) =>
                    setForm((prev) => ({
                      ...prev,
                      assigneeUsers: selectedOptions.map((opt) => opt.value),
                    }))
                  }
                  isDisabled={isLoading || userList.length === 0}
                  placeholder={
                    isLoading
                      ? "Loading users..."
                      : userList.length === 0
                        ? "No users available"
                        : "Select Users..."
                  }
                  classNamePrefix="react-select text-sm"
                  getOptionLabel={(user) => `${user.label} (${user.email})`} // show email in label
                  getOptionValue={(user) => user.value} // define what value means
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? themeColor : "#ccc",
                      borderWidth: state.isFocused ? themeColor : "1px",
                      boxShadow: state.isFocused ? `0 0 0 0.5px ${themeColor}` : "none",
                      "&:hover": {
                        borderColor: state.isFocused ? themeColor : "#d1d5db"
                      },
                      minHeight: "20px",
                      fontSize: "14px",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#f3f3f3",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#333",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: themeColor,
                      ":hover": { backgroundColor: themeColor, color: "white" },
                    }),
                  }}
                />


                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded p-2 text-xs space-y-1">
                    <p className="font-medium">Selected Users:</p>
                    {selectedUsers.map((u) => (
                      <div
                        key={u.value}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {u.label}{" "}
                          <span className="text-gray-500 text-xs">
                            ({u.email})
                          </span>
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${u.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-6 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border px-6 py-1 text-base rounded hover:bg-gray-100 cursor-pointer"
                  style={{ color: "#88898a", borderColor: "#88898a" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || userList.length === 0}
                  className="px-6 py-1 text-base rounded text-white cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  {isLoading ? "Assigning..." : "Assign Shift"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignShiftForm;
