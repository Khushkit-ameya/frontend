"use client";
import { useEffect, useState } from "react";
import ApplyLeaveForm from "./LeaveTypeForm";
import { toast } from "react-toastify";
import { useGetLeaveTypeAllocationsQuery } from "@/store/api";
import AddLeaveTypeForm from "./AddLeaveTypeForm";
import EditIcon from "@/components/ui buttons/EditIcon";
import DeleteIcon from "@/components/ui buttons/DeleteIcon";

export default function LeaveTypeDashboard({ groupedLeaveData, isLoading, isError }: any){
  const [openModal, setOpenModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
console.log("leave by Role=",groupedLeaveData)

  const handleApplyClick = (leave: any) => {
    if (leave.available <= 0) {
      toast.error(`You have no available ${leave.name}`);
      return;
    }
    setSelectedLeave({ ...leave });
    setOpenModal(true);
  };

  const handleSubmit = (data: any) => {
    const { leaveType, totalDays } = data;

    // setLeaveDataByRole((prev) => {
    //   const updated = { ...prev };
    //   updated[role] = updated[role].map((l: any) =>
    //     l.name === leaveType
    //       ? { ...l, available: l.available - totalDays, booked: l.booked + totalDays }
    //       : l
    //   );
    //   return updated;
    // });

    setOpenModal(false);
  };

  if (isLoading) return <p className="p-5">Loading leave allocations...</p>;
  if (isError) return <p className="p-5 text-red-600">Failed to load leave data.</p>;

    // Normalize data shape
  const leavesArray = Array.isArray(groupedLeaveData)
    ? groupedLeaveData
    : Object.values(groupedLeaveData || {}).flat();

  // Show message when no data is available
  if (!leavesArray || leavesArray.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-gray-100 rounded-lg mt-6 mx-5">
        <p className="text-gray-500 text-lg font-medium">No data available</p>
      </div>
    );
  }
  return (
    <div className="space-y-8 mt-6  mb-10 bg-gray-50 max-h-[50vh] overflow-y-auto p-5 rounded-2xl">
      {leavesArray?.map((leave: any, index: number) => (
        <div
          key={index}
          className="space-y-4 shadow-md hover:shadow-xl transition-shadow duration-300 p-5 rounded-2xl bg-white border border-gray-200"
        >
            <div
              key={leave.id}
              className="grid grid-cols-4 items-center py-4 px-4 border border-gray-100 bg-gray-50 hover:bg-gray-100 rounded-xl group transition-all duration-200"
            >
              <div className="text-center">
                <div className="flex items-center gap-3">
                  <span className="border border-gray-400 px-3 py-0.5 rounded-full bg-gray-700 text-white text-xs tracking-wide">
                    {leave.year}
                  </span>
                </div>
              </div>
              {/* Leave Name */}
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 whitespace-nowrap">
                    {leave.name}
                  </span>
                </div>
                
              </div>

              {/* Leave Balance */}
              <div className="text-center">
                <p className="font-medium text-gray-600">Allocated</p>
                <p className="font-semibold">{leave.available} days</p>
              </div>
              

              {/* Apply Button */}
                {/* <div className="flex justify-end pr-2">
                  <button
                    disabled={leave.available <= 0}
                    className={`hidden group-hover:flex gap-2  px-6 py-1 rounded-lg font-medium transition-all duration-200 `}
                  
                  >
                   <span><EditIcon/></span>
                   <span><DeleteIcon/></span>
                  </button>
                </div> */}
             
            </div>
        </div>
      ))}

      {openModal && selectedLeave && (
        <ApplyLeaveForm isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSaved={handleSubmit} 
          leaveData={selectedLeave}
          />


      )}


    </div>

  );
}
