"use client";

import React, { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { toast } from "react-toastify";
import { FiUser, FiUserCheck, FiUsers } from "react-icons/fi";
import DropDown from "./HolidayDropDown";
import { useCreateHolidayMutation, useGetHolidayByCompanyIdQuery, useDeleteOffDayMutation, useUpdateOffDayMutation } from "@/store/api_query/holiday.api";
import { useGetCompanyUsersQuery } from "@/store/api_query/companyOff.api";

interface Props {
  startDate: Date | null;
  endDate: Date | null; // selected users for the holiday
  onChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
   themeColor?: string;
}

interface Option {
  key: string
  label: string
}

export default function FlexibleCustomCalendar({
  startDate,
  endDate,
  onChange,
  onClose,
  themeColor = "yellow",
}: Props) {
  const [localStart, setLocalStart] = useState<Date | null>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | null>(endDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(startDate || new Date());
  const [saving, setSaving] = useState(false);
  const [openPopup, setPopup] = useState(false);
const [showHolidayUsersPopup, setShowHolidayUsersPopup] = useState(false);
const [selectedHolidayUsers, setSelectedHolidayUsers] = useState<any[]>([]);
const [selectedHolidayDate, setSelectedHolidayDate] = useState<string | null>(null);
const [flexibleHolidayData, setflexibleHolidayData] = useState<{ date: string; userCount: number; usersOff:[] }[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [createHoliday] = useCreateHolidayMutation();
  const { data: companyUsers, isLoading: isUsersLoading } = useGetCompanyUsersQuery()as { data?: { data: any[] } , isLoading: boolean };
console.log("company Users=",companyUsers)
const { data: holidayData, refetch } = useGetHolidayByCompanyIdQuery({
  fromDate: '2025-01-01',
  toDate: '2025-12-31',
});

   useEffect(() => {  
    console.log("holidayData=",holidayData)     
    if (holidayData && holidayData.length > 0) {
     const weekOff = holidayData.map((h: any) => ({
  date: new Date(h.fromDate).toISOString().split("T")[0],
  userCount: h.usersOff ? h.usersOff.length : 0,
  usersOff: h.usersOff || [],
}));
setflexibleHolidayData(weekOff);

       } else {
        setflexibleHolidayData([]);
    }
}, [holidayData]);

  const usersData: Option[] = React.useMemo(() => {
  if (!companyUsers?.data) return [{ key: "All", label: "All" }];

  const mapped = companyUsers.data.map((u: any) => {
  const first = u.firstName ?? "";
  const last = u.lastName ?? "";
  const fullName = `${first} ${last}`.trim() || u.name || "Unnamed";

  return {
    key: u.id || u.companyUserId,
    label: fullName,
  };
  });
  return [{ key: "All", label: "All" }, ...mapped];
}, [companyUsers]);


  useEffect(() => {
    setLocalStart(startDate);
    setLocalEnd(endDate);
  }, [startDate, endDate]);

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const isoFor = (d: Date) => format(d, "yyyy-MM-dd");

  // Check if a date is a saved holiday
  const isWeekOff =(d: Date) => {
  return flexibleHolidayData.find((h) => h.date === isoFor(d));
};

  // check past dates:
  const isPast = (d: Date) => {
    const todayIso = isoFor(new Date());
    return isoFor(d) < todayIso;
  };

  const isInPreviousMonth = (d: Date) => {
    if (d.getMonth() + 1 < new Date().getMonth() + 1) return true;
    return false;
  };

  // isDisabledDate: central checker
  const isDisabledDate = (d: Date) => {
    return (
      isInPreviousMonth(d) || // any previous month
      isPast(d) ||            // past days of current month
      isWeekOff(d)            // already saved holiday
    );
  };

 const handleDayClick = (day: number) => {
  const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  const isoDate = format(selectedDate, "yyyy-MM-dd"); // ✅ local format


  const existingHoliday = flexibleHolidayData.find((h) => h.date === isoDate);
console.log("existing holiday=",existingHoliday," iso date=",isoDate)

  if (existingHoliday && existingHoliday.usersOff?.length > 0) {
    // Open popup with user info
    setSelectedHolidayUsers(existingHoliday.usersOff);
    setSelectedHolidayDate(isoDate);
    setShowHolidayUsersPopup(true);
    setPopup(false);
    return;
  }

  // Normal flow for creating new holiday
  setLocalStart(selectedDate);
  setPopup(true);
};


  const handleUser = (user: string | number) => {
    console.log("userKey=", user);
    const userKey= user.toString()
    if (userKey === "All") {
      // If "All" clicked → select or deselect all
      if (users.length === usersData.length - 1) {
        // Already all selected → unselect all
        setUsers([]);
      } else {
        const allUserKeys = usersData.filter(u => u.key !== "All").map(u => u.key);
        setUsers(allUserKeys);
      }
    } else {
      // Toggle individual user
      if (users.includes(userKey)) {
        setUsers(users.filter(u => u !== userKey));
      } else {
        setUsers([...users, userKey]);
      }
    }
  };

  const onTimeChange = (timeStr: string, forStart = true) => {
    const base = (forStart ? localStart : localEnd) || new Date();
    const iso = `${format(base, "yyyy-MM-dd")}T${timeStr}`;
    const newD = new Date(iso);
    if (forStart) setLocalStart(newD);
    else setLocalEnd(newD);
  };

  const handleSave = async () => {
    if (!localStart) {
      toast.error("Please select a date for week off.");
      return;
    }
    const userDate = localStart; // validate selected date- yyyy-mm-dd

    // final checks
    if (localEnd && localEnd.getHours() < localStart.getHours()) {
      toast.error("Please select valid time!.");
      return;
    }
    if (isPast(userDate)) { toast.error("Can'nt save a past date."); return; }
    if (userDate.getDay() === 0) { toast.error("Sunday already exist week off"); return; }
    if (isWeekOff(userDate)) {toast.error("Date already saved as week Off."); return; }

    setSaving(true);
     try {
        const payload = {
        name:"flexible_holiday",
        fromDate:isoFor(localStart),
        toDate: isoFor(localStart),
        holidayType:"COMPANY",
        startTime: localStart ? format(localStart, "HH:mm") : null,
        endTime: localEnd ? format(localEnd, "HH:mm") : null,
        userIds: users.length > 0 ? users : usersData.filter(u => u.key !== "All").map(u => u.key)
      };
       console.log("payload=", payload)
       const response = await createHoliday(payload).unwrap();
          console.log("response:", response)
       setUsers([]);
      // notify parent so it can mark the date (yellow background)
      onChange(localStart, localEnd);
      onClose();
      toast.success("WeekOff saved successfully.");
     await refetch();

    }
      catch(err){
          console.log("error while saving:",err)
          toast.error("Flexible Holiday creation failed!")
        }                   
     finally {
      setSaving(false);
    }
  };

  const handleTime = () => { 
    console.log("+=========");   
    console.log(localStart?.getHours(), localEnd?.getHours());  
    if (!localStart) {
      toast.error("Please select a date for week off.");
      return;
    } 
    if (localEnd && localEnd.getHours() < localStart.getHours()) {
      toast.error("End time cannot be before start time.");
      return;
    }
    setPopup(false);
    setUsers([]);
  };

  return (
    <div className="">
      <div className=" flex justify-center">
        <div className="relative mt-3 mx-6 p-4 w-full ">

          {/* header */}
          <div className="flex  items-center justify-between mb-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5 active:text-red-600" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={currentMonth.getMonth()}
                onChange={(e) =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))
                }
                className="border rounded px-2 py-1"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2000, i, 1), "MMM")}
                  </option>
                ))}
              </select>

              <select
                value={currentMonth.getFullYear()}
                onChange={(e) =>
                  setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))
                }
                className="border rounded px-2 py-1"
              >
                {Array.from({ length: 50 }).map((_, i) => {
                  const year = 2000 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5 active:text-green-600" />
            </button>
          </div>

          {/* calendar grid */}
        <div className="
  grid 
  grid-cols-7 sm:grid-cols-7 
  xs:grid-cols-4 
  gap-2 
  text-center text-sm 
  mb-3 mx-2 sm:mx-6
">
            {daysOfWeek.map((day) => (
              <div key={day} className="font-medium">
                {day}
              </div>
            ))}

            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

              const disabled = isDisabledDate(thisDate);
              const selected =
                localStart &&
                localStart.getDate() === day &&
                localStart.getMonth() === currentMonth.getMonth() &&
                localStart.getFullYear() === currentMonth.getFullYear();
const holidayData = isWeekOff(thisDate);
const savedAsHoliday = !!holidayData;
const userCount = holidayData ? holidayData.userCount : 0;

              // const savedAsHoliday = isWeekOff(thisDate);
              const past = isPast(thisDate);
              const isSunday = thisDate.getDay() === 0;

              // calendar dates styles:
              let baseClass =
                "py-1 mx-5  rounded w-8 h-7 inline-flex items-center justify-center border-2 text-sm";

              if (savedAsHoliday) {
                // yellow bg for saved holidays
                baseClass += "bg-[#656462] text-green-600";
              } else if (selected) {
                baseClass += " bg-[#C81C1F] text-white";
              } else if (disabled) {
                baseClass += " text-gray-400 cursor-not-allowed";
              } else if (isSunday) {
                baseClass += " text[#C81C1F] cursor-not-allowed";
              } else {
                baseClass += " hover:bg-blue-200 transition cursor-pointer";
              }

              return (
    <button
    key={day}
    onClick={() => handleDayClick(day)}
    disabled={
    (isDisabledDate(thisDate) && !savedAsHoliday) ||
    thisDate.getDay() === 0 ||
    isPast(thisDate)
  }
    className={`rounded h-9 flex flex-col items-center justify-center border text-xs sm:text-sm aspect-square w-full
      ${savedAsHoliday ? "bg-[#656462] text-green-400" : 
        selected ? "bg-[#C81C1F] text-white" :
        isDisabledDate(thisDate) ? "text-gray-400 cursor-not-allowed" :
        thisDate.getDay() === 0 ? "text-[#C81C1F] cursor-not-allowed" :
        "hover:bg-blue-200 transition cursor-pointer"}`}
    title={savedAsHoliday ? "Weekoff exist" : format(thisDate, "dd MMM yyyy")}
  >
    {day}
     {savedAsHoliday && (
    <div className="text-[12px] text-gray-200 leading-none m-0.5">{userCount}</div>
  )}
  </button>


              );
            })}
          </div>

          {/* Done */}
          <button
            onClick={handleSave}
            className="mt-3 w-full text-white bg-[#C81C1F] px-4 py-2 rounded active:scale-95"
            style={{ backgroundColor: "bg-[#656462]", opacity: saving ? 0.7 : 1 }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/*time input Popup */}
      {openPopup && localStart && (
        <div className="fixed inset-0 z-60">
          {/* overlay */}
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="flex justify-center items-center min-h-screen">
            <div className="absolute bg-white rounded-lg p-6 w-80">
              <h3 className="text-lg font-semibold mb-4">
                Set Time for : <span className="text-green-500">{format(localStart, "dd-MM-yyyy")}</span>
              </h3>

              <div className="flex gap-4 mb-4">
                <div className="flex flex-col flex-1">
                  <label className="text-sm mb-1">Start time</label>
                  <input
                    type="time"
                    value={localStart ? format(localStart, "HH:mm") : ""}
                    onChange={(e) => onTimeChange(e.target.value, true)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-sm mb-1">End time</label>
                  <input
                    type="time"
                    value={localEnd ? format(localEnd, "HH:mm") : ""}
                    onChange={(e) => onTimeChange(e.target.value, false)}
                    className="border px-2 py-1 rounded"
                  />
                </div>
              </div>

              <div>
                <h1 className="flex items-center gap-1"><FiUsers/>Users:</h1>
                <DropDown value={users} data={usersData} onChange={handleUser} placeholder="Select User"/>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  className="px-4 py-0.5  bg-gray-200 rounded"
                  onClick={() => { setPopup(false); setUsers([]); }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-0.5 bg-red-600 text-white rounded"
                  onClick={handleTime}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{showHolidayUsersPopup && (
  <div className="fixed inset-0 z-60 flex justify-center items-center">
    <div className="absolute inset-0 bg-black opacity-40" />
    <div className="bg-white rounded-lg shadow-lg w-96 p-5 relative z-10">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
        onClick={() => setShowHolidayUsersPopup(false)}
      >
        <X className="w-5 h-5" />
      </button>

      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <FiUserCheck className="text-green-600" />
        Users on Leave — {selectedHolidayDate}
      </h3>

      {selectedHolidayUsers.length > 0 ? (
        <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
          {selectedHolidayUsers.map((userOff: any, idx: number) => (
            <li key={idx} className="py-2 flex flex-col">
              <span className="font-medium text-gray-900">
                {userOff.user?.firstName} {userOff.user?.lastName??""}
              </span>
              {/* display userID */}
              {/* <span className="text-sm text-gray-600">ID: {userOff.userId}</span> */}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm mt-2">
          No user details available for this holiday.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          className="bg-red-500 text-white px-4  rounded"
          onClick={() => setShowHolidayUsersPopup(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      
    </div>
  );
}