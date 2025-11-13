"use client";
import React, { useEffect, useState } from "react";
import { IoLocationSharp } from "react-icons/io5";
import {
  usePunchInMutation,
  usePunchOutMutation,
  useGetUserAttendanceQuery
} from '@/store/api_query/attendance.api';

interface AddAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (attendance: Attendance) => void;
  onUpdate?: (attendance: Attendance) => void;
  existingAttendance?: Attendance;
  onSuccess?: () => void;
}

interface Attendance {
  id: string;
  name: string;
  date: string;
  phone: string;
  email: string;
  role: string;
  shiftName: string;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | string;
  punchIn: string;
  punchOut: string;
  punchInLocation: string;
  punchOutLocation: string;
  workedHours: string;
}

const AddAttendanceModal: React.FC<AddAttendanceModalProps> = ({
  open,
  onClose,
  onAdd,
  onUpdate,
  existingAttendance,
  onSuccess,
}) => {
  const [location, setLocation] = useState("Fetching location...");
  const [coordinates, setCoordinates] = useState<{ latitude: string; longitude: string }>({
    latitude: '',
    longitude: ''
  });
  const [punchInTime, setPunchInTime] = useState("");
  const [punchOutTime, setPunchOutTime] = useState("");
  const [workedHours, setWorkedHours] = useState("-");
  const [currentPunchId, setCurrentPunchId] = useState<string | null>(null);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null);

  // RTK Query hooks
  const [punchIn, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut }] = usePunchOutMutation();

  // Get today's date in YYYY-MM-DD format for API
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's attendance data
  const {
    data: todayAttendance,
    refetch: refetchTodayAttendance,
    isLoading: isLoadingAttendance,
    error: attendanceError
  } = useGetUserAttendanceQuery(
    { date: today },
    { skip: !today }
  );

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get current date in locale format
  const currentDate = new Date().toLocaleDateString('en-IN');

  // Format time from ISO string to HH:MM
  const formatTime = (isoTime: string | null): string => {
    if (!isoTime) return '';
    try {
      return new Date(isoTime).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  // Format work hours from decimal to hours and minutes
  const formatWorkHours = (hours: number | null): string => {
    if (!hours) return "0h 0m";
    const totalMinutes = Math.round(hours * 60);
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = totalMinutes % 60;
    return `${hoursPart}h ${minutesPart}m`;
  };

  // Calculate worked hours from punch-in time to now
  const calculateWorkedHoursFromPunchIn = (punchInTime: string | null): string => {
    if (!punchInTime) return "0h 0m";
    try {
      const punchInDate = new Date(punchInTime);
      const now = new Date();
      const diffMs = now.getTime() - punchInDate.getTime();

      if (diffMs <= 0) return "0h 0m";

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return "-";
    }
  };

  // Calculate worked hours between two times
  const calculateWorkedHoursBetween = (startTime: string | null, endTime: string | null): string => {
    if (!startTime || !endTime) return "0h 0m";
    try {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      const diffMs = endDate.getTime() - startDate.getTime();

      if (diffMs <= 0) return "0h 0m";

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return "-";
    }
  };

  // Process today's attendance data - FIXED: Handle both response structures
  useEffect(() => {
    console.log("=== ATTENDANCE DATA DEBUG ===");
    console.log("Today's attendance data:", todayAttendance);
    console.log("Open status:", open);
    console.log("Today date:", today);
    console.log("Error:", attendanceError);
    console.log("Is loading:", isLoadingAttendance);

    let attendanceData = null;

    // FIXED: Handle different response structures
    if (todayAttendance) {
      // Case 1: Direct array response
      if (Array.isArray(todayAttendance)) {
        console.log("Direct array response detected");
        attendanceData = todayAttendance;
      }
      // Case 2: { data: array } response  
      else if (todayAttendance.data && Array.isArray(todayAttendance.data)) {
        console.log("Nested data array response detected");
        attendanceData = todayAttendance.data;
      }
      // Case 3: API response structure { message: string, data: array }
      else if (todayAttendance.data && Array.isArray(todayAttendance.data)) {
        console.log("API response structure detected");
        attendanceData = todayAttendance.data;
      }
    }

    console.log("Processed attendance data:", attendanceData);

    if (attendanceData && attendanceData.length > 0) {
      const todayRecord = attendanceData[0];
      console.log("Today record found:", todayRecord);

      if (todayRecord && todayRecord.userPunches && todayRecord.userPunches.length > 0) {
        setCurrentAttendanceId(todayRecord.id);

        // Find all punches for today
        const allPunches = todayRecord.userPunches;
        console.log("All punches:", allPunches);

        // Sort punches by creation time (newest first)
        const sortedPunches = [...allPunches].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Find the latest punch-in that doesn't have punch-out
        const latestActivePunch = sortedPunches.find(punch =>
          punch.punchIn && !punch.punchOut
        );

        if (latestActivePunch) {
          console.log("Latest active punch found:", latestActivePunch);
          setCurrentPunchId(latestActivePunch.id);
          setPunchInTime(formatTime(latestActivePunch.punchIn));
          setPunchOutTime("");

          // Calculate current worked hours
          const worked = calculateWorkedHoursFromPunchIn(latestActivePunch.punchIn);
          setWorkedHours(worked);
          console.log("Punch IN time set:", formatTime(latestActivePunch.punchIn));
        } else {
          // Check if there are any completed punches (with punch-out)
          const latestCompletedPunch = sortedPunches.find(punch =>
            punch.punchIn && punch.punchOut
          );

          if (latestCompletedPunch) {
            console.log("Latest completed punch found:", latestCompletedPunch);
            setPunchInTime(formatTime(latestCompletedPunch.punchIn));
            setPunchOutTime(formatTime(latestCompletedPunch.punchOut));

            if (latestCompletedPunch.workHours) {
              setWorkedHours(formatWorkHours(latestCompletedPunch.workHours));
            } else {
              // Calculate manually if workHours not provided
              const worked = calculateWorkedHoursBetween(
                latestCompletedPunch.punchIn,
                latestCompletedPunch.punchOut
              );
              setWorkedHours(worked);
            }
            console.log("Punch IN and OUT times set");
          } else {
            // No punches found, reset state
            console.log("No punches found in userPunches array");
            setPunchInTime("");
            setPunchOutTime("");
            setWorkedHours("-");
            setCurrentPunchId(null);
          }
        }
      } else {
        console.log("No user punches found in today record");
        setPunchInTime("");
        setPunchOutTime("");
        setWorkedHours("-");
        setCurrentPunchId(null);
        setCurrentAttendanceId(null);
      }
    } else {
      console.log("No attendance record found for today");
      setPunchInTime("");
      setPunchOutTime("");
      setWorkedHours("-");
      setCurrentPunchId(null);
      setCurrentAttendanceId(null);
    }
  }, [todayAttendance, open, today, attendanceError, isLoadingAttendance]);

  // Get location
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates({
            latitude: latitude.toString(),
            longitude: longitude.toString()
          });

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            setLocation(data.display_name || "Location not found");
          } catch {
            setLocation("Unable to fetch location");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocation("Location permission denied");
        }
      );
    }
  }, [open]);

  // Refresh data when modal opens
  useEffect(() => {
    if (open && today) {
      console.log("Modal opened, refetching attendance data");
      refetchTodayAttendance();
    }
  }, [open, refetchTodayAttendance, today]);

  if (!open) return null;

  // Get device ID and IP address
  const getDeviceInfo = () => {
    return {
      deviceId: navigator.userAgent || 'unknown-device',
      ipAddress: '0.0.0.0'
    };
  };

  // Handle Punch-In
  const handlePunchIn = async () => {
    try {
      const { deviceId, ipAddress } = getDeviceInfo();

      const punchInData = {
        punchInLocation: {
          address: location,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        deviceId,
        ipAddress,
        remarks: "Punched in via app"
      };

      console.log("Punching in with data:", punchInData);

      const result = await punchIn(punchInData).unwrap();

      if (result.data) {
        const currentTime = getCurrentTime();
        const userInfo = result.data.user;
        const companyUser = result.data.companyUser;

        const fullName = `${companyUser?.firstName || ''} ${companyUser?.lastName || ''}`.trim();
        const email = userInfo?.email || "-";
        const role = companyUser?.role || "Employee";
        const status = result.data.finalStatus || "PRESENT";
        const shiftName = result.data.shift?.name || "Morning Shift"; // if shift not available, fallback

        const newAttendance: Attendance = {
          id: result.data.id,
          name: fullName || "Unknown",
          date: currentDate,
          phone: '-',
          email,
          role,
          shiftName,
          status,
          punchIn: currentTime,
          punchOut: '-',
          punchInLocation: location,
          punchOutLocation: '-',
          workedHours: '-'
        };


        onAdd(newAttendance);
        refetchTodayAttendance();

        console.log("Punch-In successful:", result);
      }
    } catch (error: any) {
      console.error("Punch-In failed:", error);
      alert(error.data?.message || "Punch-In failed. Please try again.");
    }
  };

  // Handle Punch-Out
  const handlePunchOut = async () => {
    if (!currentAttendanceId) {
      alert("No active attendance record found. Please punch in first.");
      return;
    }

    try {
      const { deviceId, ipAddress } = getDeviceInfo();

      const punchOutData = {
        punchOutLocation: {
          address: location,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        deviceId,
        ipAddress,
        remarks: "Punched out via app"
      };

      console.log("Punching out with data:", punchOutData);

      const result = await punchOut(punchOutData).unwrap();

      if (result.data) {
        const currentTime = getCurrentTime();
        const userInfo = result.data.user;
        const companyUser = result.data.companyUser;
        const fullName = `${companyUser?.firstName || ''} ${companyUser?.lastName || ''}`.trim();
        const email = userInfo?.email || "-";
        const role = companyUser?.role || "Employee";
        const status = result.data.finalStatus || "PRESENT";
        const shiftName = result.data.shift?.name || "Morning Shift"; // if shift not available, fallback
        const updatedAttendance: Attendance = {
          id: result.data.id,
          name: fullName || "Unknown",
          date: currentDate,
          phone: '-',
          email,
          role,
          shiftName,
          status,
          punchIn: punchInTime,
          punchOut: currentTime,
          punchInLocation: result.data.userPunches?.[0]?.punchInLocation?.address || location,
          punchOutLocation: location,
          workedHours: workedHours
        };


        if (onUpdate) {
          onUpdate(updatedAttendance);
        } else {
          onAdd(updatedAttendance);
        }

        refetchTodayAttendance();

        console.log("Punch-Out successful:", result);

        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Punch-Out failed:", error);
      alert(error.data?.message || "Punch-Out failed. Please try again.");
    }
  };

  // Check if user has already punched in today
  const hasPunchedIn = !!punchInTime;
  const hasPunchedOut = !!punchOutTime;

  console.log("Current state:", {
    hasPunchedIn,
    hasPunchedOut,
    punchInTime,
    punchOutTime,
    workedHours,
    isLoadingAttendance,
    today,
    todayAttendance
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-[540px] relative transition-all duration-300 content-center">
        <div className="popup-header pt-2 pb-2 pl-6 pr-6 rounded-t-xl" style={{
          backgroundColor: "#656462",
        }}>
          <button
            onClick={onClose}
            className="absolute top-2 right-6 text-white hover:text-red-500 dark:text-gray-400"
          >
            ✕
          </button>

          <h2 className="text-left text-xl font-semibold dark:text-white text-white">
            Mark Your Today Attendance
          </h2>
        </div>

        {/* Loading State */}
        {isLoadingAttendance && (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading attendance data...</p>
          </div>
        )}

        {/* Error State */}
        {attendanceError && (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Error loading attendance data</p>
          </div>
        )}

        {/* Punch-In / Punch-Out */}
        {!isLoadingAttendance && !attendanceError && (
          <div className="flex justify-between items-center gap-3 p-6">
            {/* Punch-In */}
            <div className="flex-1 text-center rounded-xl h-[190px] p-4 bg-gradient-to-br text-white shadow-inner content-center" style={{
              background: "linear-gradient(180deg, #5E5D5B 35%, #333333 100%)",
            }}>
              <p className="text-3xl font-semibold py-1">{punchInTime || "--:-- --"}</p>
              <p className="text-sm opacity-80 pb-4">{currentDate}</p>
              <button
                onClick={handlePunchIn}
                disabled={hasPunchedIn || isPunchingIn}
                className={`text-2xl text-white font-medium py-2 px-8 rounded transition-all duration-200 ${hasPunchedIn || isPunchingIn
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  }`}
              >
                {isPunchingIn ? "Punching In..." : hasPunchedIn ? "Punched In" : "Punch-In"}
              </button>
            </div>

            {/* Punch-Out */}
            <div className="flex-1 text-center rounded-xl h-[190px] p-4 text-gray-800 dark:text-white shadow-inner content-center" style={{
              background: "#D9D9D9", border: "1px solid #00000029"
            }}>
              <p className="text-3xl font-semibold py-1">{punchOutTime || "--:-- --"}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 pb-4">{currentDate}</p>
              <button
                onClick={handlePunchOut}
                disabled={!hasPunchedIn || hasPunchedOut || isPunchingOut}
                className={`text-2xl text-white font-medium py-2 px-8 rounded transition-all duration-200 ${!hasPunchedIn || hasPunchedOut || isPunchingOut
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  }`}
              >
                {isPunchingOut ? "Punching Out..." : hasPunchedOut ? "Punched Out" : "Punch-Out"}
              </button>
            </div>
          </div>
        )}

        {/* Worked Hours Display */}
        {/* {(hasPunchedIn || workedHours !== "-") && (
          <div className="px-6 pb-4">
            <div className="text-center bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                {hasPunchedOut ? "Worked Hours: " : "Current Hours: "} 
                {workedHours}
              </p>
            </div>
          </div>
        )} */}

        {/* Location */}
        <div className="dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300 items-end gap-2 m-6 pb-8" style={{
          background: "#EEEEEE"
        }}>
          <div className="dark:bg-gray-800 p-4 rounded-t-sm text-gray-700 dark:text-gray-300" style={{
            background: "#b7cee1"
          }}></div>
          <div className="flex items-end pt-4 pl-4">
            <IoLocationSharp className="text-red-500 w-8 h-8" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAttendanceModal;