"use client";
import ApplyLeaveForm from "@/components/BizIgnite/Leave/LeaveTypeForm";
import { useState } from "react";

const leaveTypes = [
  { id: "SICK_LEAVE", name: "Sick Leave" },
  { id: "CASUAL_LEAVE", name: "Casual Leave" },
  { id: "ANNUAL_LEAVE", name: "Annual Leave" },
  { id: "MATERNITY_LEAVE", name: "Maternity Leave" },
  { id: "PATERNITY_LEAVE", name: "Paternity Leave" },
  { id: "EMERGENCY_LEAVE", name: "Emergency Leave" },
  { id: "UNPAID_LEAVE", name: "Unpaid Leave" },
  { id: "COMPENSATORY_LEAVE", name: "Compensatory Leave" },
];

const initialState:any = {};
leaveTypes.forEach((l:any) => {
  initialState[l.id] = { available: 0, booked: 0 };
});

export default function LeaveDashboard() {
  const [leaveData, setLeaveData] = useState(initialState);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);

  const handleApplyClick = (leave:any) => {
    setSelectedLeave(leave);
    setOpenModal(true);
  };

  const handleSubmit = (data:any) => {
    const { leaveId, days } = data;

    setLeaveData((prev:any) => ({
      ...prev,
      [leaveId]: {
        ...prev[leaveId],
        available: prev[leaveId].available + days,
        booked: prev[leaveId].booked + 1,
      },
    }));
    setOpenModal(false);
  };

  return (
    <div className="space-y-3">
      {leaveTypes.map((row) => (
        <div
          key={row.id}
          className="flex justify-between items-center p-4 border rounded relative group"
        >
          <span className="font-semibold">{row.name}</span>
          <div>
            <p>Available: {leaveData[row.id].available} days</p>
            <p>Booked: {leaveData[row.id].booked} day</p>
          </div>

          <button
            className="hidden group-hover:block bg-blue-600 text-white px-3 py-1 rounded absolute right-4"
            onClick={() => handleApplyClick(row)}
          >
            Apply Leave
          </button>
        </div>
      ))}

      {openModal && (
        <ApplyLeaveForm
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSaved={handleSubmit}
          LeaveType={selectedLeave?.leaveType || ''}
        />
      )}
    </div>
  );
}
