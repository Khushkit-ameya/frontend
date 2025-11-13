"use client"
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Header from "@/components/common/Header";
import Bar from "@/components/common/PaginationBar";
import Title from "@/components/common/Title";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/store/hooks";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSlidersH } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import Image from "next/image";
import excela from '@/public/excel-p.svg';
import AddLeaveTypeForm from "@/components/BizIgnite/Leave/AddLeaveTypeForm";
import LeaveTypeDashboard from "@/components/BizIgnite/Leave/LeaveType";
import { useGetLeaveTypeAllocationsQuery } from "@/store/api";
import AdvancedFilter, { FilterCondition } from "../../Filter/AddFilter";
import SearchBar from "../../AdvanceSearch/SearchBar";
import ExportModal from "../../ExportExcel/Export";
import FilterIcon from '@/assests/filter-icon.png'

export interface SubtitleItem {
    name: string;
    title: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

export default function Leave() {
    const { isDark, colors } = useTheme();
    const [openLeaveForm, setLeaveForm] = useState(false);
    const [activeTab, setActiveTab] = useState<"leave" | "balance" | "type">("leave");
    const [LeaveDataByRole, setLeaveDataByRole] = useState<Record<string, any>>({});

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'holidayType']);

    // Excel state
    const [showExportModal, setShowExportModal] = useState(false);

    // Advanced filter state
    const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [openFilter, setOpenFilter] = useState(false);
    const [showLessColumns, setShowLessColumns] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
  
    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Build query parameters
    const buildQueryParams = useCallback(() => {
        const params: Record<string, any> = {
            page: page,
            limit: pageSize,
            sortField,
            direction: sortDirection,
        };

        // Add search parameter if exists
        if (searchTerm.trim()) {
            params.search = searchTerm;
        }

        // Add advanced filters if exist
        if (advancedFilters.length > 0) {
            params.parsedFilters = JSON.stringify(advancedFilters);
        }

        // Add any additional filter params
        Object.entries(advancedFilterParams).forEach(([key, value]) => {
            if (value && value !== '') {
                params[key] = value;
            }
        });

        return params;
    }, [page, pageSize, sortField, sortDirection, searchTerm, advancedFilters, advancedFilterParams]);

    // Use the query with parameters
    const queryParams = buildQueryParams();
    const { data: leaveTypeAllocations, isLoading, isError, refetch } = useGetLeaveTypeAllocationsQuery(queryParams);

    const LeaveTitleBtn = [
        {
            name: "Export",
            icon: <Image src={excela} alt="Export" width={18} height={18} />,
            onClick: () => setShowExportModal(true)
        },
        {
            name: "Add Leave Type",
            icon: <FiPlus />,
            onClick: () => setLeaveForm(true)
        }
    ];

    const columns = [
        { key: "name", label: "Leave Type", isFilterable: true },
        { key: "year", label: "Year", isFilterable: true },
        { key: "available", label: "Alloted Days", isFilterable: true },
    ];

    const handleLeaveTypeForm = () => {
        // Handle leave type form submission
        refetch(); // Refetch data after form submission
    };

    // Process and group leave data by role
    useEffect(() => {
        if (!leaveTypeAllocations?.data) {
            setLeaveDataByRole({});
            setFilteredItems([]);
            return;
        }

        const apiData = leaveTypeAllocations.data;

        // Group leave data by role
        const allAttributes = apiData.flatMap(
            (item: any) => item.leaveAttributes || []
        );

        const grouped: Record<string, any[]> = {};
        allAttributes.forEach((attr: any) => {
            const role = attr.role || "Unknown";
            if (!grouped[role]) grouped[role] = [];
            grouped[role].push({
                id: attr.id,
                name: attr.leaveName,
                available: attr.allocatedDays,
                booked: 0,
                year: attr.year,
            });
        });

        setLeaveDataByRole(grouped);

        // Flatten data for filtered items
        const flattenedData = Object.values(grouped).flat();
        setFilteredItems(flattenedData);
    }, [leaveTypeAllocations]);

    // Apply client-side filtering when search or filters change
    useEffect(() => {
        if (!LeaveDataByRole || Object.keys(LeaveDataByRole).length === 0) {
            setFilteredItems([]);
            return;
        }

        // Flatten grouped data
        let flattenedData = Object.values(LeaveDataByRole).flat();
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
    }, [LeaveDataByRole, advancedFilters, searchTerm, selectedColumns]);

        //   pagination setting
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filteredItems.slice(start, end);
    }, [filteredItems, page, pageSize])

    // Convert date to dd-mm-yyyy
    const formatISOToDDMMYYYY = (isoDate: string) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

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
        setPage(1); // Reset to first page when filters change
    }, []);

    // Search handlers
    const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
        setSearchTerm(term);
        setSelectedColumns(columns);
        setPage(1); // Reset to first page when searching
    }, []);

    const applySearch = (term: string, columns: string[], data: any[]) => {
        if (!term.trim() || columns.length === 0) return data;

        const lowerTerm = term.toLowerCase();

        return data.filter((item) =>
            columns.some((col) => {
                const value = item[col];
                return value && String(value).toLowerCase().includes(lowerTerm);
            })
        );
    };

    const applyAdvancedFilters = (filters: FilterCondition[], data: any[]) => {
        if (!filters || filters.length === 0) return data;

        return data.filter((item) =>
            filters.every((filter) => {
                const fieldValue = item[filter.field];
                if (fieldValue === undefined || fieldValue === null) return false;

                const op = filter.operator;
                const filterValue = filter.value;

                // Date handling
                if (filter.field === "from" || filter.field === "to") {
                    const itemDate = fieldValue;
                    const compDate = formatISOToDDMMYYYY(filterValue);
                    if (!itemDate || !compDate) return false;
                    switch (op) {
                        case "eq": return itemDate === compDate;
                        case "ne": return itemDate !== compDate;
                        case "lt": return itemDate < compDate;
                        case "lte": return itemDate <= compDate;
                        case "gt": return itemDate > compDate;
                        case "gte": return itemDate >= compDate;
                        case "bt":
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

                // String filtering
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
                    case "in":
                        return String(filterValue)
                            .toLowerCase()
                            .split(",")
                            .map(v => v.trim())
                            .includes(String(fieldValue).toLowerCase());
                    case "nin":
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

    return (
        <ProtectedRoute>
            <div className="w-screen h-screen flex overflow-auto" style={{
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
                                    { label: 'LeaveMaintainence', href: '/biz-ignite/LeaveMaintainence/LeaveType' },
                                    { label: 'LeaveType', href: '/biz-ignite/LeaveMaintainence/LeaveType' },

                                ]}
                            />
                        </div>

                        <div
                            className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                            style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}
                        >
                            <Title TitleObj={LeaveTitleBtn} name="Leave Type" />
                        </div>

                        <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end h-fit' style={{
                            backgroundColor: isDark ? colors.dark.sidebar : undefined
                        }}>
                            {/* Search Bar */}
                            <SearchBar
                                model="LeaveType"
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
                                total={filteredItems.length}
                                currentPage={page}
                                pageSize={pageSize}
                                onPageChange={(p) => setPage(p)}
                                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                                onToggleColumns={() => setShowLessColumns((s) => !s)}
                                showLessColumns={false}
                                />
                        </div>

                        <div>
                            <LeaveTypeDashboard
                                groupedLeaveData={paginatedItems}
                                isLoading={isLoading}
                                isError={isError}
                            />
                        </div>

                        {openLeaveForm && (
                            <div className="mb-5 bg-amber-800">
                                <AddLeaveTypeForm
                                    isOpen={openLeaveForm}
                                    onClose={() => setLeaveForm(false)}
                                    onSaved={handleLeaveTypeForm}
                                />
                            </div>
                        )}

                        {/* Advanced Filter Popover */}
                        <AdvancedFilter
                            modelType="LeaveType"
                            anchorEl={filterAnchorEl}
                            open={openFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Leave Type Filters"
                        />

                        {/* Excel Export Modal */}
                        <ExportModal
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            entityLabel="Leave"
                            fields={columns}
                            rows={Object.values(LeaveDataByRole).flat()}
                            fetchAll={async () => {
                                const allData = await refetch();
                                const allocations = (allData as any)?.data?.data || [];
                                if (allocations) {
                                    return allocations.flatMap((leave: any) =>
                                        leave.leaveAttributes.map((attr: any) => ({
                                            id: attr.id,
                                            name: attr.leaveName || "—",
                                            year: attr.year || "-",
                                            available: attr.allocatedDays || "0",
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
    );
}