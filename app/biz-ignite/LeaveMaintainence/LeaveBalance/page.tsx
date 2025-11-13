"use client"
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Header from "@/components/common/Header";
import Bar from "@/components/common/PaginationBar";
import Subtitle from "@/components/common/SubTitle";
import Title from "@/components/common/Title";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/store/hooks";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BiSortAlt2 } from "react-icons/bi";
import { FaSlidersH } from "react-icons/fa";
import Image from "next/image";
import excela from '@/public/excel-p.svg';
import LeaveDashboard from "@/components/BizIgnite/Leave/LeaveDetails";
import AdvancedFilter, { FilterCondition } from "../../Filter/AddFilter";
import SearchBar from "../../AdvanceSearch/SearchBar";
import ExportModal from "../../ExportExcel/Export";
import { useGetUserLeaveBalanceQuery, useSelector_ } from "@/store/api";

export default function Leave() {

    const { isDark, colors } = useTheme();
    const [showLessColumns, setShowLessColumns] = useState(false);
    const user: any = useSelector_((state) => state.globalState.user);
    const userID = user?.id || "";
    const [leaveBalanceData,setLeaveBalanceData]=useState<Record<string, any>>([]);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
 
    // Search state
            const [searchTerm, setSearchTerm] = useState('');
            const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'holidayType']);
            
    // Excel state
            const [showExportModal,setShowExportModal]=useState(false);
        
    // Advanced filter state
        const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
        const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
        const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
        const [filterItems,setFilteredItems]=useState<Record<string, any>>({});
        const [openFilter, setOpenFilter] = useState(false);
    
        const queryParams = useMemo(() => {
        return {
        userID,
        page,
        pageSize,
        searchTerm: searchTerm || "",
        searchColumns: selectedColumns.join(","),
        ...advancedFilterParams, // any advanced filters user applied
         };
        }, [page, pageSize, searchTerm, selectedColumns, advancedFilterParams]);
       
        const { data: leaveData, isLoading, isError, refetch } = useGetUserLeaveBalanceQuery(
        queryParams
        ) as {
        data?: { data?: { leaveRecords: any[] } };
        isLoading: boolean;
        isError: boolean;
        refetch: () => void; 
        };
    console.log("leaveData",leaveData)
    const columns = [
      { key: "name", label: "leave Type", isFilterable: true },
      { key: "year", label: "Year", isFilterable: true },
      { key: "available", label: "Remaining Days", isFilterable: true },
      { key: "booked", label: "Used Days", isFilterable: true },
    ]

     // convert date to dd-mm-yyyy
    const formatISOToDDMMYYYY = (isoDate: string) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const LeaveTitleBtn = [
        {
            name: "Export",
            icon: <Image src={excela} alt="Export" width={18} height={18} />,
            onClick: () => setShowExportModal(true)
        },
       
    ]


    console.log("queryParams=",queryParams)
       useEffect(() => {
            if (!leaveData?.data?.leaveRecords) return;
        console.log(" leaveData=",leaveData)
           const allAttributes = leaveData.data.leaveRecords.flatMap((record: any) => record.usersLeaveRecords || []);
            const grouped: Record<string, any[]> = {};
            allAttributes.forEach((attr: any) => {
              const role = attr.role || "Unknown";
              if (!grouped[role]) grouped[role] = [];
              grouped[role].push({
                id: attr.id,
                name: attr.leaveName,
                available: attr.remainingDays,
                booked: attr.usedDays,
                year: attr.year,
                leaveAttributeId:attr?.leaveAttributeId
              });
            });
            setLeaveBalanceData(grouped);
          }, [leaveData]);

          const applyAdvancedFilters = (filters: FilterCondition[], data: Record<string, string>[]) => {
          if (!filters || filters.length === 0) return data;
        
          return data.filter((item) =>
            filters.every((filter) => {
              const fieldValue = (item as any)[filter.field];
              if (fieldValue === undefined || fieldValue === null) return false;
        
              const op = filter.operator;
              const filterValue = filter.value;
              console.log("filter value=",filterValue)
              // ✅ Date handling
              if (filter.field === "from" || filter.field === "to") {
                 const itemDate=fieldValue;
                 const compDate = formatISOToDDMMYYYY(filterValue);
                if (!itemDate || !compDate) return false;
                switch (op) {
                  case "eq": return itemDate === compDate;
                  case "ne": return itemDate !== compDate;
                  case "lt": return itemDate < compDate;
                  case "eq": return itemDate == compDate;
                  case "lte": return itemDate <= compDate;
                  case "gt": return itemDate > compDate;
                  case "gte": return itemDate >= compDate;
                  case "bt":
                    // between — expects filterValue = [start, end]
                    if (Array.isArray(filterValue) && filterValue.length === 2) {
                      const start = formatISOToDDMMYYYY(filterValue[0]);
                      const end = formatISOToDDMMYYYY(filterValue[1]);
                      if (!start || !end) return false;
                      return itemDate >= start && itemDate <= end;
                    }
                    return true;
                  default:
                    return true;
                }
              }
        
              // ✅ String filtering
              switch (op) {
                case "eq":
                  return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase();
                case "cn":
                  return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
                case "ne":
                  return String(fieldValue).toLowerCase() !== String(filterValue).toLowerCase();
                case "nc":
                  return !String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
                case "sw":
                  return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
                case "ew":
                  return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
                case "in": // In List (comma-separated values)
                  return String(filterValue)
                  .toLowerCase()
                  .split(",")
                  .map(v => v.trim())
                  .includes(String(fieldValue).toLowerCase());
        
                case "nin": // Not In List
                  return !String(filterValue)
                  .toLowerCase()
                  .split(",")
                  .map(v => v.trim())
                  .includes(String(fieldValue).toLowerCase());
                  default:
                  return true;
              }
            })
          );
        };
    
       useEffect(() => {
       if (!leaveBalanceData || leaveBalanceData.length === 0) {
         setFilteredItems([]);
         return;
       }
     
    // Flatten grouped data (convert object of arrays → single array)
      let flattenedData = Object.values(leaveBalanceData).flat();
    
      let filtered = flattenedData;
    
       // Apply advanced filters (if any)
       if (advancedFilters && advancedFilters.length > 0) {
         filtered = applyAdvancedFilters(advancedFilters, filtered);
       }
     
       // Apply search filter (if any)
       if (searchTerm && selectedColumns.length > 0) {
         filtered = applySearch(searchTerm, selectedColumns, filtered);
       }
     
       setFilteredItems(filtered);
     }, [leaveBalanceData, advancedFilters, searchTerm, selectedColumns]);
     
    //   pagination setting
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        let flattenedData = Object.values(leaveBalanceData).flat();
        return flattenedData?.slice(start, end);
    }, [filterItems, page, pageSize])

      // Advanced filter handlers
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
             // setCurrentPage(1); // Reset to first page when filters change
         }, []);
     
         
       
             // Search handlers
             const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
             setSearchTerm(term);
             setSelectedColumns(columns);
             // setPage(1); // Reset to first page when searching
             }, []);
     
             const applySearch = (term: string, columns: string[], data: Record<string, string>[]) => {
                 console.log("term=",term," column",columns)
                   if (!term.trim() || columns.length === 0) return data;
     
                   const lowerTerm = term.toLowerCase();
                 
                   return data.filter((item) =>
                     columns.some((col) => {
                       const value = (item as any)[col];
                       return value && String(value).toLowerCase().includes(lowerTerm);
                     })
                  );
             };
    return (
        <ProtectedRoute >
            <div className="w-screen h-screen flex overflow-auto  " style={{
                backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
            }}>
                <Sidebar />
                <div className="flex-1 flex flex-col relative min-w-0 w-full">
                    <Header />
                    <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-auto flex flex-col relative' style={{ scrollbarWidth: "none" }}>
                       <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                                <BreadcrumbsNavBar
                                    customItems={[
                                        { label: 'Biz Ignite', href: '/dashboard' },
                                        { label: 'LeaveMaintainence', href: '/biz-ignite/LeaveMaintainence/LeaveBalance' },
                                        { label: 'LeaveBalance', href: '/biz-ignite/LeaveMaintainence/LeaveBalance' },

                                    ]}
                                />
                            </div>

                        <div
                            className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                            style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}
                        >
                            <Title TitleObj={LeaveTitleBtn} name="Leave Balance" />
                        </div>

                        <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end h-fit' style={{
                            backgroundColor: isDark ? colors.dark.sidebar : undefined
                        }}>

                        {/* Add Search Bar */}
                        <SearchBar
                        model="LeaveBalance"
                        onSearch={handleSearch}
                        placeholder="Search"
                        defaultSelectedColumns={['name']}
                        defaultOperator="cn"
                        showOperatorSelector={false}
                        className="flex-shrink-0"
                        />
                        {/* Add Filters Button */}
                        <button
                        onClick={handleAdvancedFilterClick}
                        className=" flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                        title="Advanced Filters"
                        ><FaSlidersH />Filters</button>
                        </div>

                       {/* pagination bar */}

                        <div className='mx-5 mt-6 py-2 px-2 rounded flex h-fit'>
                              <Bar
                               total={filterItems.length}
                               currentPage={page}
                               pageSize={pageSize}
                               onPageChange={(p) => setPage(p)}
                                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                                onToggleColumns={() => setShowLessColumns((s) => !s)}
                               showLessColumns={false}
                               />
                        </div>

                         <div>
                          <LeaveDashboard leaveBalanceData={leaveBalanceData} isLoading={isLoading} isError={isError} />
                          </div>

                           {/* Advanced Filter Popover */}
                            <AdvancedFilter
                            modelType="LeaveBalance"
                            anchorEl={filterAnchorEl}
                            open={openFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Leave Balance Filters"
                            />
                          
                                                    
                        {/* Excel Export */}
                        <ExportModal
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            entityLabel="Leave"
                            fields={columns}
                            rows={Object.values(leaveBalanceData).flat()}
                            fetchAll={async () => {
                            const allData = await refetch(); 
                            const allocations = (allData as any)?.data?.data || [];
                            if (allocations) {
                            return (allocations.leaveRecords || []).flatMap(({usersLeaveRecords}:any) =>
                              usersLeaveRecords.map((attr: any) => ({
                                  id: attr.id,
                                  name: attr.leaveName || "",
                                  available: attr.remainingDays || "0",
                                  booked:attr.usedDays || "0",
                                  year: attr.year || "-",
                                  }))
                               );
                         }
                          
                            return [];
                         }}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}