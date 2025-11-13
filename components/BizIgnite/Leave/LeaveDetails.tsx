"use client";
import { useState } from "react";
import ApplyLeaveForm from "./LeaveTypeForm";
import { toast } from "react-toastify";
import { useGetUserLeaveBalanceQuery, useSelector_ } from "@/store/api";
interface LeaveDashboardProps {
  leaveBalanceData?: Record<string, string>;
  isloading?:boolean;
  isError?:boolean;
}

export default function LeaveDashboard({ leaveBalanceData, isloading, isError }: any) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
   console.log("leave balance data=",leaveBalanceData)
  
   const handleApplyClick = (leave: any, leaveTypeAllocationId: string) => {
    console.log("Selected Leave:", leave, leaveTypeAllocationId);
    if (leave.remainingDays <= 0) {
      toast.error(`You have no remaining ${leave.leaveName}`);
      return;
    }
    setSelectedLeave({ leave, leaveTypeAllocationId });
    setOpenModal(true);
  };

  const handleSubmit = () => setOpenModal(false);

  if (isloading) return <p className="p-5">Loading leave data...</p>;
  if (isError) return <p className="p-5 text-red-600">Failed to load leave data.</p>;

  // Normalize data shape
  const leavesArray = Array.isArray(leaveBalanceData)
    ? leaveBalanceData
    : Object.values(leaveBalanceData || {}).flat();

  return (
    <div className="space-y-8 mt-6 mb-10 bg-gray-50 max-h-[50vh] overflow-y-auto p-5 rounded-2xl">
      {leaveBalanceData.length === 0 && (
        <p className="text-center text-gray-500">No leave records found.</p>
      )}

      {leavesArray.map((record: any, index: number) =>
          <div
            key={`${record.id}-${record.year}`}
            className="grid grid-cols-4 items-center py-4 px-4 border border-gray-100 bg-white hover:bg-gray-50 rounded-xl shadow-sm transition-all duration-200"
          >
            {/* Leave Name */}
            <div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">
                  {record.name.replace(/_/g, ' ')?.trim()}
                </span>
                <div className="flex items-center gap-3">
                  <span className="border border-gray-400 px-3 py-0.5 rounded-full bg-gray-700 text-white text-xs tracking-wide">
                    {record.year}
                  </span>
                </div>
              </div>
            </div>

            {/* Used Days */}
            <div className="text-center text-red-500">
              <p className="font-medium text-gray-600">Used</p>
              <p className="font-semibold">{record.booked} days</p>
            </div>

            {/* Remaining Days */}
            <div className="text-center text-green-600">
              <p className="font-medium text-gray-600">Remaining</p>
              <p className="font-semibold">{record.available} days</p>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end pr-2">
              <button
                disabled={record.available <= 0}
                onClick={() =>
                  handleApplyClick(
                    record,
                    record.leaveTypeAllocationId
                  )
                }
                className={`border px-6 py-1 rounded-lg font-medium transition-all duration-200 ${record.available > 0
                    ? "border-red-600 text-red-700 hover:bg-red-50"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Apply Leave
              </button>
            </div>
          </div>
        
      )}

      {openModal && selectedLeave && (
        <ApplyLeaveForm
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSaved={handleSubmit}
          leaveData={selectedLeave}
        />
      )}
    </div>
  );
}
