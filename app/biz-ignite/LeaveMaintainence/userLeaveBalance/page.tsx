"use client";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Header from "@/components/common/Header";
import Subtitle from "@/components/common/SubTitle";
import Title from "@/components/common/Title";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/store/hooks";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BiSortAlt2 } from "react-icons/bi";
import { FaSlidersH } from "react-icons/fa";
import SimpleTable, { Column } from "@/components/common/DynamicTable";
import AdvancedFilter, { FilterCondition } from "../../Filter/AddFilter";
import Image from "next/image";
import excela from '@/public/excel-p.svg';
import SearchBar from "../../AdvanceSearch/SearchBar";
import FilterIcon from '@/assests/filter-icon.png'
import Bar from "@/components/common/PaginationBar";
import { useGetLeaveTypeNamesQuery, useGetAllLeavesNameOnlyQuery } from "@/store/api";
import ExportModal from "../../ExportExcel/Export";
import { availableMemory } from "node:process";

type LeaveRow = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  [leaveName: string]: string | number | { usedDays?: number; remainingDays?: number } | undefined;
};

export default function Leave() {
  const { isDark, colors } = useTheme();
  const [openFilter, setOpenFilter] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
  const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
  const [showLessColumns, setShowLessColumns] = useState(false);
  const [Params, setParams]=useState();

  // Search state
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'holidayType']);
  
  // Excel state
      const [showExportModal, setShowExportModal] = useState(false);
      
  // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const queryParams = useMemo(() => {
    return {
    page,
    pageSize,
    searchTerm: searchTerm || "",
    searchColumns: selectedColumns.join(","),
    ...advancedFilterParams, // any advanced filters user applied
     };
    }, [page, pageSize, searchTerm, selectedColumns, advancedFilterParams]);

    
  //get leave name in filter fileds
  const { data: allLeavesResp } = useGetAllLeavesNameOnlyQuery({});
  const { data: leaveDataResp } = useGetLeaveTypeNamesQuery(queryParams) as { data?: { data: any[] }};
  console.log("leaveDataResp", leaveDataResp);
  console.log("queryParams=", queryParams);

  const { columns, rows } = useMemo(() => {
    if (!leaveDataResp?.data) return { columns: [], rows: [] };
    const leaveData = leaveDataResp?.data;

    const leaveNames = [...new Set(leaveData?.map((l: any) => l.leaveName))];

    const usersMap: Record<string, LeaveRow> = {};

    leaveData.forEach((leaveType: any) => {
      const { leaveName, usersLeaveRecords } = leaveType;
      usersLeaveRecords?.forEach((record: any) => {
        const userId = record.userId;
        if (!usersMap[userId]) {
          usersMap[userId] = {
            id: userId,
            name: `${record.companyUser.firstName || ""} ${record.companyUser.lastName || ""}`,
            role: record.companyUser.role || "—",
          };
        }
        usersMap[userId][leaveName] = {
          usedDays: record.usedDays,
          remainingDays: record.remainingDays,
        };
      });
    });

    const rows = Object.values(usersMap);

    const columns: Column<LeaveRow>[] = [
      {
        key: "name",
        label: "Name",
        center: true,
        sortable: false,
        isFilterable:true,
        render: (r) => (
          <div className="flex items-center m-auto text-center gap-2 text-gray-700">
            {r.avatar && <img src={r.avatar} alt={r.name} className="w-7 h-7 rounded-full object-cover" />}
            <span className="text-center m-auto">{r.name}</span>
          </div>
        ),
      },
      // {
      //   key: "role",
      //   label: "Role",
      //   center: true,
      //   sortable: false,
      // },
      ...leaveNames.map((ln: any) => ({
        key: ln,
        label: ln,
        center: true,
        isFilterable:true,
        render: (r: LeaveRow) => {
          const data = r[ln] as { usedDays?: number; remainingDays?: number } | undefined;
          if (!data) return <span className="text-gray-400">—</span>;
          return (
            <div className="flex  text-sm gap-1 text-center text-[14px] m-auto">
              <span className="text-red-500 font-semibold">Used: {data.usedDays}</span> | 
              <span className="text-green-600 font-semibold">Remaining: {data.remainingDays}</span>
            </div>
          );
        },
      })),
    ];

    return { columns, rows };
  }, [leaveDataResp]);

  const handleAdvancedFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
    setOpenFilter(true);
  }, []);

  const handleAdvancedFilterClose = useCallback(() => {
    setOpenFilter(false);
    setFilterAnchorEl(null);
  }, []);

  const handleApplyAdvancedFilters = useCallback((filters: FilterCondition[], queryParams: Record<string, string>) => {
    setAdvancedFilters(filters);
    setAdvancedFilterParams(queryParams);
  }, []);

  const UserLeaveBalanceTitleBtn = [
    {
      name: "Export",
      icon: <Image src={excela} alt="Export" width={18} height={18} />,
       onClick: () => setShowExportModal(true)
    },
    //  {
    //      name: "Add Leave Type",
    //      icon: <FiPlus />,
    //      onClick: () => setLeaveForm(true)
    //  }
  ];
        //get dynamicleavefield
    const dynamicLeaveFields = useMemo(() => {
  if (!allLeavesResp?.data) return [];
  return allLeavesResp.data.map((item: any) => ({
    label: item.leaveName,
    value: item.leaveName,
    type: "number", // ya string — depending on how you filter (e.g. usedDays/remainingDays)
  }));
}, [allLeavesResp]);

  const applySearch = useCallback((term: string, columns: string[], data: LeaveRow[]) => {
  if (!term.trim()) return data;

  const lowerTerm = term.toLowerCase();

  return data.filter((item) => {
    // Check top-level fields (like name, role)
    const matchesTopLevel = columns.some((col) => {
      const value = (item as any)[col];
      return value && String(value).toLowerCase().includes(lowerTerm);
    });

    //  Check nested leave fields (usedDays and remainingDays)
    const matchesLeaveValues = Object.keys(item).some((key) => {
      const val = item[key];
      if (val && typeof val === "object" && ("usedDays" in val || "remainingDays" in val)) {
        const { usedDays, remainingDays } = val as { usedDays?: number; remainingDays?: number };
        return (
          String(usedDays ?? "").toLowerCase().includes(lowerTerm) ||
          String(remainingDays ?? "").toLowerCase().includes(lowerTerm)
        );
      }
      return false;
    });

    return matchesTopLevel || matchesLeaveValues;
  });
}, []);

  // ---- Combine filters + search ----
  // const filteredItems = useMemo(() => {
  //   let result = [...rows];
  //   console.log("result=",result)
  //   if (searchTerm) {
  //     result = applySearch(searchTerm, selectedColumns, result);
  //   }
  //   return result;
  // }, [rows, searchTerm, selectedColumns]);

  // // ---- Pagination ----
  // const paginatedItems = useMemo(() => {
  //   const start = (page - 1) * pageSize;
  //   const end = start + pageSize;
  //   return filteredItems.slice(start, end);
  // }, [filteredItems, page, pageSize]);

    // Search handlers
        const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
            setSearchTerm(term);
            setSelectedColumns(columns);
        }, []);
    
console.log("columns=",columns)
// console.log("paginatedItem=",paginatedItems)
  return (
    <ProtectedRoute>
      <div
        className="w-screen h-screen flex overflow-auto"
        style={{
          backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
        }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col relative min-w-0 w-full">
          <Header />
          <div className="border-t-2 border-red-600 flex-1 m-1 overflow-auto flex flex-col relative">
            <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
              <BreadcrumbsNavBar
                customItems={[
                  { label: 'Biz Ignite', href: '/dashboard' },
                  { label: 'LeaveMaintainence', href: '/biz-ignite/LeaveMaintainence/userLeaveBalance' },
                  { label: 'User Leave Balance', href: '/biz-ignite/LeaveMaintainence/userLeaveBalance' },

                ]}
              />
            </div>

            <div
              className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
              style={{
                backgroundColor: isDark ? colors.dark.sidebar : undefined
              }}
            >
              <Title TitleObj={UserLeaveBalanceTitleBtn} name="User's Leave Balance" />
            </div>

             <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end h-fit' style={{
              backgroundColor: isDark ? colors.dark.sidebar : undefined
            }}> 
              {/* Search Bar */}
              <SearchBar
                model="LeaveRecord"
                onSearch={handleSearch}
                placeholder="Search"
                defaultSelectedColumns={['name']}
                defaultOperator="cn"
                showOperatorSelector={false}
                className="flex-shrink-0"
              />
              {/* Filters Button */}
              <button
                onClick={handleAdvancedFilterClick}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                title="Advanced Filters"
              >
                <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                Filters
              </button>
            </div>
             <div className='mx-5 mt-6 py-2 px-2 rounded flex h-fit'>
                <Bar
                total={rows.length}
                currentPage={page}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                onToggleColumns={() => setShowLessColumns((s) => !s)}
                showLessColumns={!showLessColumns}
                />
            </div> 


            <SimpleTable columns={columns} items={rows} maxRowsBeforeScroll={4} />

            <AdvancedFilter
              modelType="userLeaveBalance"
              anchorEl={filterAnchorEl}
              open={openFilter}
              onClose={handleAdvancedFilterClose}
              onApplyFilters={handleApplyAdvancedFilters}
              initialFilters={advancedFilters}
              title="Advanced Project Filters"
              availableFields={dynamicLeaveFields}
            />

            {/* Excel Export */}
            <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            entityLabel="Leave"
            fields={columns}
            rows={rows}
            fetchAll={async () => {
              try {
                const allocations = leaveDataResp?.data || [];
                if (!allocations || allocations.length === 0) return [];
                // Map users
                const usersMap: Record<string, any> = {}; 
                allocations.forEach(({ leaveName, usersLeaveRecords }: any) => {
                  (usersLeaveRecords || []).forEach(({ remainingDays, usedDays, companyUser }: any) => {
                    const userId = companyUser?.id;
                    if (!userId) return;
                    // Initialize user object if not exists
                    if (!usersMap[userId]) {
                      usersMap[userId] = {
                        id: userId,
                        name: `${companyUser?.firstName || ""} ${companyUser?.lastName || ""}`.trim(),
                        role: companyUser?.role || "—"
                      };
                    }

                    // Add leave type as key
                    usersMap[userId][leaveName] = {
                      remainingDays: remainingDays ?? 0,
                      usedDays: usedDays ?? 0
                    };
                  });
                });
                 // Convert map to array
                const result = Object.values(usersMap);
                return result;
              } catch (error) {
                console.error("Error fetching all leave data:", error);
                return [];
              }
             }}
              />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
