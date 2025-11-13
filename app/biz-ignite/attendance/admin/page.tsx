"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import { useTheme } from "@/store/hooks";
import SearchBar from "../../AdvanceSearch/SearchBar";
import FilterIcon from '@/assests/filter-icon.png';
import Image from "next/image";
import { useGetAllAttendancesQuery } from '@/store/api_query/attendance.api';
import AdvancedFilter, { FilterCondition } from "../../Filter/AddFilter";
import ExportModal from "../../ExportExcel/Export";
import Bar from "@/components/common/PaginationBar";
import FinalTable from "@/components/common/CommonTable";
import type { FieldDefinition, SortConfig } from '../../../../types/FieldDefinitions';
import excela from '@/public/excel-p.svg';
type Attendance = {
  id: string;
  name: string;
  date: string;
  phone: string;
  email: string;
  role: string;
  shiftName: string;
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT";
  punchIn: string;
  punchOut: string;
  punchInLocation: string;
  punchOutLocation: string;
  workedHours: string;
  userPunches?: any[];
};

export default function AttendancePage() {
  const fieldDefinitions: FieldDefinition[] = [
    { fieldKey: "name", displayName: "Name", fieldType: "TEXT" },
    { fieldKey: "date", displayName: "Date", fieldType: "TEXT" },
    // { fieldKey: "phone", displayName: "Phone", fieldType: "PHONE" },
    { fieldKey: "email", displayName: "Email", fieldType: "EMAIL" },
    // { fieldKey: "role", displayName: "Role", fieldType: "TEXT" },
    { fieldKey: "shiftName", displayName: "Shift", fieldType: "TEXT" },
    { fieldKey: "status", displayName: "Status", fieldType: "TEXT" },
    { fieldKey: "punchIn", displayName: "Punch In", fieldType: "TIME" },
    { fieldKey: "punchOut", displayName: "Punch Out", fieldType: "TIME" },
    { fieldKey: "punchInLocation", displayName: "In Location", fieldType: "TEXT" },
    { fieldKey: "punchOutLocation", displayName: "Out Location", fieldType: "TEXT" },
    { fieldKey: "workedHours", displayName: "Worked Hours", fieldType: "NUMBER" },
  ];
  const { isDark, colors } = useTheme();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  // Admin API hook to fetch all attendances


  // Transform API data to match frontend structure
  useEffect(() => {
    if (apiAttendanceData) {
      let attendanceArray: any[] = [];

      // Handle different API response structures
      if (Array.isArray(apiAttendanceData)) {
        attendanceArray = apiAttendanceData;
      } else if (apiAttendanceData.data && Array.isArray(apiAttendanceData.data)) {
        attendanceArray = apiAttendanceData.data;
      } else if (typeof apiAttendanceData === 'object') {
        const arrayKeys = Object.keys(apiAttendanceData).filter(key =>
          Array.isArray((apiAttendanceData as any)[key])
        );

        if (arrayKeys.length > 0) {
          attendanceArray = (apiAttendanceData as any)[arrayKeys[0]];
        } else {
          attendanceArray = [apiAttendanceData];
        }
      }
      // Transform each attendance record
      const transformedData: Attendance[] = attendanceArray.map((item: any, index: number) => {
        // Get latest punch data
        const latestPunch = item.userPunches && item.userPunches.length > 0
          ? item.userPunches[item.userPunches.length - 1]
          : null;
        // Format date from available fields
        const dateSource = item.date || item.createdAt || item.attendanceDate || new Date();
        const dateObj = new Date(dateSource);
        const formattedDate = dateObj.toLocaleDateString('en-IN');

        // Format time to 12-hour format
        const formatTime = (timeString: string) => {
          if (!timeString) return '-';
          try {
            return new Date(timeString).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          } catch {
            return '-';
          }
        };
        // Calculate worked hours between punch in and out
        const calculateWorkedHours = (punchIn: string, punchOut: string) => {
          if (!punchIn || !punchOut) return '-';
          try {
            const start = new Date(punchIn);
            const end = new Date(punchOut);
            const diffMs = end.getTime() - start.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
          } catch {
            return '-';
          }
        };
        // Determine attendance status
        const determineStatus = () => {
          // Prefer backend status first
          if (item.finalStatus) return item.finalStatus;
          // Fallback: determine from punchIn time if backend didn't send status
          if (latestPunch) {
            const punchInTime = latestPunch.punchIn
              ? new Date(latestPunch.punchIn).getHours()
              : null;

            if (punchInTime !== null) {
              if (punchInTime > 9) return "Late Arrival";
              if (punchInTime < 8) return "Early Arrival";
            }
          }
          // Default fallback
          return "On Time";
        };

        return {
          id: item.id || `temp-${index}-${Date.now()}`,
          name:
            `${item.companyUser?.firstName || ""} ${item.companyUser?.lastName || ""
              }`.trim() || "User",
          date: formattedDate,
          phone: item.user?.phone || item.employee?.phone || "-",
          email: item.user?.email || item.employee?.email || "-",
          role: item.companyUser?.role || "null",
          shiftName: item.shift?.name || "Morning Shift",
          status: determineStatus(),
          punchIn: latestPunch ? formatTime(latestPunch.punchIn) : "-",
          punchOut: latestPunch ? formatTime(latestPunch.punchOut) : "-",
          punchInLocation:
            latestPunch?.punchInLocation?.address ||
            latestPunch?.punchInLocation ||
            "Not recorded",
          punchOutLocation:
            latestPunch?.punchOutLocation?.address ||
            latestPunch?.punchOutLocation ||
            "Not recorded",

          workedHours: latestPunch?.workHours
            ? `${Math.floor(latestPunch.workHours)}h ${Math.round(
              (latestPunch.workHours % 1) * 60
            )}m`
            : calculateWorkedHours(latestPunch?.punchIn, latestPunch?.punchOut),

          userPunches: item.userPunches || [],
        };



      });
      setAttendances(transformedData);
    } else {
      setAttendances([]);
    }
  }, []);

  // Header buttons configuration
  const projectTitleBtn = [
    {
      name: "Export",
      icon: <Image src={excela} alt="Export" width={18} height={18} />,
      onClick: () => setShowExportModal(true),
    },
  ];

  const todayDate = new Date().toLocaleDateString();
  const existingAttendance = attendances.find(a => a.date === todayDate);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'attendanceAdmin']);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilter, setOpenFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"attendanceAdmin" | "permanent" | "flexible">("attendanceAdmin");
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
const {
  data: apiAttendanceData,
  refetch: refetchAttendances,
  isLoading: isLoadingAttendances,
  error: attendanceError,
} = useGetAllAttendancesQuery({
  page: currentPage,
  limit: pageSize,
  search: searchTerm?.trim() || '',
  sortField: 'punchDate',
  direction: 'desc',
  filters: advancedFilters ?? [],
});

  // Column visibility state for Show More/Show Less button
  const [showLessColumns, setShowLessColumns] = useState(false);
  // Search handlers
  const handleSearch = useCallback((term: string, columns: string[]) => {
    setSearchTerm(term);
    setSelectedColumns(columns);
    setCurrentPage(1);
  }, []);
  const applySearch = (term: string, columns: string[], data: Attendance[]) => {
    console.log("term=", term, " column", columns)
    if (!term.trim() || columns.length === 0) return data;
    const lowerTerm = term.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const value = (item as any)[col];
        return value && String(value).toLowerCase().includes(lowerTerm);
      })
    );
  };
  useEffect(() => {
    if (!attendances || attendances.length === 0) {
      setFilteredAttendances([]);
      return;
    }
    // Mapping filter field names to actual table field keys
    const fieldAlias: Record<string, string> = {
      name: "name",
      date: "date",
      // phone: "phone",
      email: "email",
      role: "role",
      shift: "shift",
      status: "status",
      punchIn: "punchIn",
      punchOut: "punchOut",
      inLocation: "punchInLocation",
      outLocation: "punchOutLocation",
      workedHours: "workedHours",
    };
    // Normalize time like "10:35 am" or "2:43 pm" → "HH:mm"
    const normalizeTime = (t: string) => {
      if (!t) return "";
      let timeStr = String(t).trim().toLowerCase();
      if (timeStr.includes("am") || timeStr.includes("pm")) {
        const [timePart, modifier] = timeStr.split(" ");
        const [hStr, mStr] = timePart.split(":");
        let hours = Number(hStr);
        const minutes = Number(mStr || 0);
        if (modifier === "pm" && hours < 12) hours += 12;
        if (modifier === "am" && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
      const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        const hours = Number(match[1]);
        const mins = Number(match[2]);
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      }
      return timeStr;
    };
    // Convert "0h 1m" → "00:01"
    const toHHMM = (timeStr: string) => {
      if (!timeStr) return "";
      timeStr = timeStr.toLowerCase().replace(/\s+/g, "");
      const hMatch = timeStr.match(/(\d+)h/);
      const mMatch = timeStr.match(/(\d+)m/);
      if (hMatch || mMatch) {
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      }
      return normalizeTime(timeStr);
    };
    // Normalize date (supports DD/MM/YYYY and YYYY-MM-DD)
    const parseDateToISO = (d: string) => {
      if (!d) return "";
      const s = String(d).trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [day, month, year] = s.split("/");
        return `${year}-${month}-${day}`;
      }
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
      return s;
    };
    let filtered = [...attendances].filter((item) => {
      if (!advancedFilters || advancedFilters.length === 0) return true;
      return advancedFilters.every((filter) => {
        const prop = fieldAlias[filter.field] || filter.field;
        let raw = (item as any)[prop];
        // handle nested address object
        if (raw && typeof raw === "object") {
          if (raw.address) raw = raw.address;
          else if (raw.label) raw = raw.label;
          else raw = JSON.stringify(raw);
        }
        // Date comparison
        if (filter.fieldType === "date") {
          const itemDate = parseDateToISO(String(raw));
          const filterDate = parseDateToISO(String(filter.value));
          console.log("Normalized dates:", itemDate, filterDate);
          switch (filter.operator) {
            case "eq":
              return itemDate === filterDate;
            case "ne":
              return itemDate !== filterDate;
            default:
              return true;
          }
        }
        // Time fields (punchIn, punchOut, workedHours)
        if (filter.fieldType === "time") {
          const itemHHMM = toHHMM(String(raw));
          const filterHHMM = toHHMM(String(filter.value));
          console.log("Normalized time/workedHours:", itemHHMM, "vs", filterHHMM);
          switch (filter.operator) {
            case "eq":
              return itemHHMM === filterHHMM;
            case "ne":
              return itemHHMM !== filterHHMM;
            default:
              return true;
          }
        }
        // String/text fields (location, name, etc.)
        const value = String(raw || "").toLowerCase();
        const filterVal = String(filter.value || "").toLowerCase();

        switch (filter.operator) {
          case "eq":
            return value.includes(filterVal);
          case "ne":
            return !value.includes(filterVal);
          case "cn":
            return value.includes(filterVal);
          case "nc":
            return !value.includes(filterVal);
          case "sw":
            return value.startsWith(filterVal);
          case "ew":
            return value.endsWith(filterVal);
          default:
            return true;
        }
      });
    });
    // Apply search filter (if any)
    if (searchTerm && selectedColumns.length > 0) {
      filtered = applySearch(searchTerm, selectedColumns, filtered);
    }
    setFilteredAttendances(filtered);
  }, [attendances, advancedFilters, searchTerm, selectedColumns]);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  // Pagination calculations
  const totalRecords = filteredAttendances.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentDataFiltered = filteredAttendances.slice(startIndex, startIndex + pageSize);
  // Navigate to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };
  // Filter modal handlers
  const handleOpenFilter = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
    setOpenFilter(true);
  };
  // Refresh attendance data after operations
  const handleAttendanceSuccess = () => {
    refetchAttendances();
  };
  // Manual refresh for error recovery
  const handleManualRefresh = () => {
    refetchAttendances();
  };
  const handleAdvancedFilterClose = useCallback(() => {
    setOpenFilter(false);
    setFilterAnchorEl(null);
  }, []);
  const handleApplyAdvancedFilters = useCallback((filters: FilterCondition[], queryParams: Record<string, string>) => {
    setAdvancedFilters(filters);
    setAdvancedFilterParams(queryParams);
    setCurrentPage(1);
  }, []); useEffect(() => {
    refetchAttendances();
  }, [searchTerm, advancedFilters, currentPage, pageSize]);

  // Get Attendance Fields
  const getAttendanceFields = useCallback(() => {
    return fieldDefinitions.map(field => ({
      key: field.fieldKey,
      label: field.displayName,
      fieldType: field.fieldType,
      isFilterable: true,
      displayOrder: field.displayOrder,
    }));
  }, [fieldDefinitions]);

  /* -----------------------------
   Get Attendance Rows
  ----------------------------- */
  const getAttendanceRows = useCallback(() => {
    return filteredAttendances.map(item => ({
      name: item.name,
      date: item.date,
      // phone: item.phone,
      email: item.email,
      role: item.role,
      shiftName: item.shiftName,
      status: item.status,
      punchIn: item.punchIn,
      punchOut: item.punchOut,
      punchInLocation: item.punchInLocation,
      punchOutLocation: item.punchOutLocation,
      workedHours: item.workedHours,
    }));
  }, [filteredAttendances]);

  /* -----------------------------
   Fetch All Attendances (for export)
  ----------------------------- */
  const fetchAllAttendances = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/all`);
      if (!response.ok) throw new Error("Failed to fetch all attendances");

      const data = await response.json();

      return data.attendances.map((item: any) => ({
        name: `${item.companyUser?.firstName || ""} ${item.companyUser?.lastName || ""}`.trim() || "User",
        date: new Date(item.punchDate).toLocaleDateString(),
        // phone: item.user?.phone || item.employee?.phone || "-",
        email: item.user?.email || item.employee?.email || "-",
        role: item.companyUser?.role || "Employee",
        shiftName: item.shift?.name || "Morning Shift",
        status: item.finalStatus || "On Time",
        punchIn: item.userPunches?.[0]?.punchIn ? new Date(item.userPunches[0].punchIn).toLocaleTimeString() : "-",
        punchOut: item.userPunches?.[0]?.punchOut ? new Date(item.userPunches[0].punchOut).toLocaleTimeString() : "-",
        punchInLocation:
          item.userPunches?.[0]?.punchInLocation?.address ||
          item.userPunches?.[0]?.punchInLocation ||
          "Not recorded",
        punchOutLocation:
          item.userPunches?.[0]?.punchOutLocation?.address ||
          item.userPunches?.[0]?.punchOutLocation ||
          "Not recorded",
        workedHours: item.userPunches?.[0]?.workHours
          ? `${Math.floor(item.userPunches[0].workHours)}h ${Math.round((item.userPunches[0].workHours % 1) * 60)}m`
          : "-",
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);
  // Add this below your fieldDefinitions and showLessColumns state
  const visibleFields = React.useMemo(() => {
    if (!showLessColumns) return fieldDefinitions; // Show all columns

    // Show only first 5 columns
    const columnsToShow = 5;
    return fieldDefinitions.slice(0, columnsToShow);
  }, [showLessColumns, fieldDefinitions]);

  const handleToggleColumns = useCallback(() => {
    setShowLessColumns((prev) => !prev);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden flex" style={{ backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg }}>
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-w-0 w-full">
        <Header />
        <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
          <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
            <BreadcrumbsNavBar
              customItems={[
                { label: 'Biz Ignite', href: '/dashboard' },
                { label: 'Attendance', href: '/biz-ignite/attendance/admin' },
                { label: 'Admin', href: '/biz-ignite/attendance/admin' },

              ]}
            />
          </div>
          <div
            className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
            style={{
              backgroundColor: isDark ? colors.dark.sidebar : undefined
            }}
          >
            <Title projectTitleObj={projectTitleBtn} name="Attendance" />
          </div>
          {/* Export Excel Modal */}
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            entityLabel="Attendance"
            fields={getAttendanceFields()}
            rows={getAttendanceRows()}
            fetchAll={fetchAllAttendances}
          />


          {/* Loading State */}
          {isLoadingAttendances && (
            <div className="mx-5 mt-4 p-4 text-center">
              <p>Loading attendance data...</p>
            </div>
          )}

          {/* Error State */}
          {attendanceError && (
            <div className="mx-5 mt-4 p-4 text-center text-red-600">
              <p>Error loading attendance data</p>
              <button
                onClick={handleManualRefresh}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search and Filters Section */}
          {!isLoadingAttendances && !attendanceError && (
            <>
              <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 flex justify-end items-center h-fit'
                style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}>
                <div className="flex items-center gap-1" style={{ color: "#000000" }}>
                  {/* Search bar for filtering records */}
                  <SearchBar
                    model="attendanceAdmin"
                    onSearch={handleSearch}
                    placeholder="Search"
                    defaultSelectedColumns={['name', 'status']}
                    defaultOperator="cn"
                    showOperatorSelector={false}
                    className="flex-shrink-0"
                  />
                  {/* Advanced filters button */}
                  <button
                    onClick={handleOpenFilter}
                    className=" flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                    title="Advanced Filters"
                  ><Image src={FilterIcon} alt="Filters" width={16} height={16} />
                    <span>Filters</span>
                  </button>
                </div>
                {/* Advanced Filter Modal */}
                {openFilter && (
                  <div className="fixed inset-0 bg-black/40 flex justify-end items-start pt-60 z-50 pr-5">
                    <div className="">
                      <AdvancedFilter
                        modelType="attendanceAdmin"
                        anchorEl={filterAnchorEl}
                        open={openFilter}
                        onClose={handleAdvancedFilterClose}
                        onApplyFilters={handleApplyAdvancedFilters}
                        initialFilters={advancedFilters}
                        title="Advanced Attendance Filters"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Pagination Controls */}
              <div className="attendance mx-5 mt-11 py-2 px-2 rounded flex h-fit">
                <Bar
                  total={totalRecords}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setCurrentPage(1);
                    setPageSize(size);
                  }}
                  onToggleColumns={handleToggleColumns}
                  showLessColumns={showLessColumns}
                />
              </div>
              {/* Attendance Data Table */}
              <div className="mx-5 overflow-x-auto flex-1 attendance-table">
                <FinalTable
                  fieldDefinitions={visibleFields}
                  data={currentDataFiltered}
                  selectable={false}
                  onAddColumn={undefined}
                  onOpenColumnManager={undefined}
                  onColumnOrderChange={undefined}
                  onHiddenFieldKeysChange={undefined}
                  onSortChange={undefined}
                  appearance="figma"
                  stickyHeader={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}