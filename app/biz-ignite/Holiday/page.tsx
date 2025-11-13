"use client";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/store/hooks";
import Header from "@/components/common/Header";
import Title from "@/components/common/Title";
import Subtitle from "@/components/common/SubTitle";
import Bar from "@/components/common/PaginationBar";
import { FiPlus } from "react-icons/fi";
import { FaPen, FaSlidersH, FaTrash } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import HolidayModal from "@/components/common/forms/HolidayForm/holidayform";
import FlexibleCustomCalendar from "@/components/BizIgnite/Holiday/FlexibleCalendar";
import WeekdayCalendar from "@/components/BizIgnite/Holiday/PermanentCalendar";
import SimpleTable, { Column } from "@/components/common/DynamicTable";
import { useGetCompanyOffsQuery, useCreateCompanyOffMutation } from "@/store/api_query/companyOff.api";
import { useCreateHolidayMutation, useGetHolidayByCompanyIdQuery, useDeleteOffDayMutation, useUpdateOffDayMutation } from "@/store/api_query/holiday.api";
import AdvancedFilter, { FilterCondition } from "../Filter/AddFilter";
import SearchBar from "../AdvanceSearch/SearchBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";
import FilterIcon from '@/assests/filter-icon.png'
import excela from '@/public/excel-p.svg';
import ExcelExportButton from "../ExportExcel/HolidayExcel";

export type Holiday = {
    id: string;
    name: string;
    fromDate: string;
    toDate: string;
    startTime?: string;
    endTime?: string;
    holidayType?: string;
    description?: string;
};



const getTypeColor = (holidayType: string | undefined) => {
    switch (holidayType) {
        case 'PUBLIC':
            return 'border-green-500 text-green-700 bg-green-50';
        case 'COMPANY':
            return 'border-blue-500 text-blue-700 bg-blue-50';
        case 'REGIONAL':
            return 'border-orange-500 text-orange-700 bg-orange-50';
        case 'OPTIONAL':
            return 'border-purple-500 text-purple-700 bg-purple-50';
        default:
            return 'border-gray-500 text-gray-700 bg-gray-50';
    }
};

export default function LeaveRecord() {

    const columns: Column<Holiday>[] = [
        {
            key: "name", label: "Holiday Name", center: true, isFilterable: true, sortable: false, render: (r: Holiday) => (
                <div className="text-green-700">
                    {r.name.slice(0, 20)}  {r.name.length > 20 && "..."}
                </div>
            ),
        },
        { key: "fromDate", label: "From Date", center: true, isFilterable: true, sortable: false, render: (r) => <div className="text-gray-600">{r.fromDate}</div>, },
        { key: "toDate", label: "To Date", center: true, isFilterable: true, sortable: false, render: (r) => <div className="text-gray-600">{r.toDate}</div>, },
        { key: "startTime", label: "Start Time", center: true, isFilterable: true, sortable: false, render: (r) => <div className="text-gray-600">{r.startTime}</div>, },
        { key: "endTime", label: "End Time", center: true, isFilterable: true, sortable: false, render: (r) => <div className="text-gray-600">{r.endTime}</div>, },
        {
            key: "holidayType",
            label: "Type",
            center: true,
            isFilterable: true,
            sortable: false,
            render: (r) => <span
                className={`inline-block w-full px-2 py-1 rounded border text-xs font-medium ${getTypeColor(r.holidayType)}`}
            >
                {r.holidayType || "-"}
            </span>,
        },
        {
            key: "description", label: "Description", center: true, isFilterable: true, render: (r) => {
                if (!r.description) return <div className="text-gray-600">-</div>;
                const short = r.description.slice(0, 30);
                return <div className="text-gray-600"> {r.description.length > 30 ? `${short}...` : short}</div>
            },
        },
        {
            key: "actions",
            label: "Actions",
            center: true,
            isFilterable: false,
            render: (r) => (
                <div className="flex items-center justify-center gap-2">
                    <button title="Edit" onClick={() => handleEdit(r.id)} className="p-2 rounded-full bg-[#C81C1F] text-white cursor-pointer active:scale-95">
                        <FaPen />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(r.id)} className="p-2 rounded-full bg-gray-800 text-white cursor-pointer active:scale-95">
                        <FaTrash />
                    </button>
                </div>
            ),
        },
    ];

    const { isDark, colors } = useTheme();
    const [openHolidayForm, setHolidayForm] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [items, setItems] = useState<Holiday[]>([]);
    const [openDropDown, setDropDown] = useState(false);
    const [activeTab, setActiveTab] = useState<"holiday" | "permanent" | "flexible">("holiday");
    const [PermanentWeekDay, setPermanentWeekDay] = useState<number[]>([]);
    const [createCompanyOff, { isLoading, isSuccess, error }] = useCreateCompanyOffMutation();
    const { data: companyOffData, refetch: refetchCompanyOff } = useGetCompanyOffsQuery();
    console.log("companyOffData",companyOffData)
    const [createHoliday] = useCreateHolidayMutation();
    const [deleteOffDay] = useDeleteOffDayMutation();
    const [updateOffDay] = useUpdateOffDayMutation();
    const [filterItems, setFilteredItems] = useState<Holiday[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showLessColumns, setShowLessColumns] = useState(false);
    const [params, setParams]=useState();

    // Advanced filter state
    const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openFilter, setOpenFilter] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'holidayType']);

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

    const { data:holidayRaw, refetch } = useGetHolidayByCompanyIdQuery({});
    const holidayData = (holidayRaw as unknown as { data: any[] }) || { data: [] };
    console.log("queryParams",queryParams)
    // convert date to dd-mm-yyyy
    const formatISOToDDMMYYYY = (isoDate: string) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        console.log('holidayData=',holidayData)
        if (holidayData && holidayData.data?.length > 0) {
            // const filteredData = holidayData.data.filter((h: any) => h.name !== "flexible_holiday");
            const formattedData: Holiday[] = holidayData.data.map((h: any) => ({
                id: h.id || '',                  // default empty string
                name: h.name || 'Holiday',       // default name
                fromDate: formatISOToDDMMYYYY(h.fromDate),
                toDate: formatISOToDDMMYYYY(h.toDate),
                startTime: h.startTime || '',
                endTime: h.endTime || '',
                holidayType: h.holidayType || '',
                description: h.description || '',
            }));
            setItems(formattedData);

        } else {
            setItems([]);
        }
    }, [holidayData]);

    const applyAdvancedFilters = (filters: FilterCondition[], data: Holiday[]) => {
        if (!filters || filters.length === 0) return data;

        return data.filter((item) =>
            filters.every((filter) => {
                const fieldValue = (item as any)[filter.field];
                if (fieldValue === undefined || fieldValue === null) return false;

                const op = filter.operator;
                const filterValue = filter.value;

                // ✅ Date handling
                if (filter.field === "fromDate" || filter.field === "toDate") {
                    const itemDate = fieldValue;

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
        if (!items || items.length === 0) {
            setFilteredItems([]);
            return;
        }

        let filtered = [...items];

        // Apply advanced filters (if any)
        if (advancedFilters && advancedFilters.length > 0) {
            filtered = applyAdvancedFilters(advancedFilters, filtered);
        }

        // Apply search filter (if any)
        if (searchTerm && selectedColumns.length > 0) {
            filtered = applySearch(searchTerm, selectedColumns, filtered);
        }

        setFilteredItems(filtered);
    }, [items, advancedFilters, searchTerm, selectedColumns]);


    //   pagination setting
        const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filterItems.slice(start, end);
    }, [filterItems, page, pageSize]);


    // Load existing permanent holidays when data arrives
    useEffect(() => {
        if (companyOffData && Array.isArray(companyOffData) && companyOffData.length > 0) {
            console.log("companyOff=", companyOffData)
            const [{ weekDay }] = companyOffData
             console.log("weekDays=", weekDay)
            setPermanentWeekDay(weekDay || []);

        } else {
            setPermanentWeekDay([]); // fallback
        }
    }, [companyOffData]);



    const LeaveTitleBtn = [
        {
            name: "Export",
            icon: <Image src={excela} alt="Export" width={18} height={18} />,
            onClick: () => setShowExportModal(true)
        },
        {
            name: "Add Holiday",
            icon: <FiPlus />,
            onClick: () => setHolidayForm(true)
        }
    ]
    const handlePermanentWeekDays = async (selectedDay: number) => {
        setIsSaving(true);
        try {
            const updatedWeekDays = (prev: number[]) => {
                const set = new Set(prev);
                if (set.has(selectedDay)) {
                    set.delete(selectedDay);
                } else {
                    set.add(selectedDay);
                }
                return Array.from(set);
            };

            const newWeekDays = updatedWeekDays(PermanentWeekDay);

            setPermanentWeekDay(newWeekDays);

            console.log("permanentday", newWeekDays);

            // Use the calculated newWeekDays for the API call
            const response = await createCompanyOff({
                weekDay: Array.isArray(newWeekDays) ? newWeekDays : [newWeekDays],
            }).unwrap();
            setActiveTab('permanent')
            toast.success('Permanent week days saved successfully!');
            refetchCompanyOff();
        } catch (err) {
            toast.error('Failed to save weekdays');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDateToISO = (dateStr: string) => {
        // input: "24-10-2025"
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`; // "2025-10-24"
    };

    const mapTypeToEnum = (type: string) => {
        switch (type) {
            case 'PUBLIC': return 'PUBLIC';
            case 'COMPANY': return 'COMPANY';
            case 'REGIONAL': return 'REGIONAL';
            case 'OPTIONAL': return 'OPTIONAL';
            default: return 'OTHER';
        }
    };

    const handleHolidayForm = async (newHoliday: Partial<Holiday>) => {
        setIsSaving(true);
        try {
            const payload: Partial<Holiday> = {
                ...newHoliday,
                fromDate: formatDateToISO(newHoliday.fromDate || ""),
                toDate: formatDateToISO(newHoliday.toDate || ""),
                holidayType: mapTypeToEnum(newHoliday.holidayType || ""),
            };
            if (editingHoliday) {
                const response = await updateOffDay({ id: editingHoliday.id, ...payload }).unwrap();
                refetch();
                const formattedResponse = {
                    ...response,
                    fromDate: formatISOToDDMMYYYY(response.fromDate),
                    toDate: formatISOToDDMMYYYY(response.toDate),
                };

                // Update the item in the table
                setItems(prev =>
                    prev.map(h => (h.id === formattedResponse.id ? formattedResponse : h))
                );

                toast.success("Holiday updated successfully");
                setEditingHoliday(null);
            }
            else {
                const response = await createHoliday(payload).unwrap();
                // Format the response date to match table
                const formattedResponse = {
                    ...response,
                    fromDate: formatISOToDDMMYYYY(response.fromDate),
                    toDate: formatISOToDDMMYYYY(response.toDate),
                };
                setItems(prev => [formattedResponse, ...prev]);
                toast.success('Holiday saved successfully');
                refetch()
            }
        }
        catch (err) {
            toast.error('Failed to save holiday');
        }
        finally {
            setIsSaving(false);
        }
    }

    const handleDelete = async (RowId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this holiday?");
        if (!confirmed) return;
        try {
            const res = await deleteOffDay(RowId).unwrap();
            setItems(prev => prev.filter(h => h.id !== RowId));
            toast.success("Holiday delete successfully")
        }
        catch (err) {
            console.error("Failed to delete holiday:", error);
            toast.error("Failed to delete holiday!");
        }
    }

    const handleEdit = (holidayId: string) => {
        const holidayToEdit = items.find(h => h.id === holidayId);
        if (!holidayToEdit) return;

        // Set the holiday to be edited and open the modal
        setEditingHoliday(holidayToEdit);
        setHolidayForm(true);
    }

    const handleAdvancedFilterClose = useCallback(() => {
        setOpenFilter(false);
        setFilterAnchorEl(null);
    }, []);

    const handleApplyAdvancedFilters = useCallback((filters: FilterCondition[], queryParams: Record<string, string>) => {
        console.log("filter condition=", filters)
        setAdvancedFilters(filters);
        setAdvancedFilterParams(queryParams);
        setPage(1); // Reset to first page when filters change
    }, []);


    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
        setOpenFilter(true);
    };

    // Search handlers
    const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
        setSearchTerm(term);
        setSelectedColumns(columns);
        setPage(1); // Reset to first page when searching
    }, []);

    const applySearch = (term: string, columns: string[], data: Holiday[]) => {
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

    return (
        <ProtectedRoute>
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
                                    { label: 'Holiday', href: '/biz-ignite/Holiday' },

                                ]}
                            />
                        </div>
                        <div
                            className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                            style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}
                        >
                            <Title TitleObj={LeaveTitleBtn} name="Holiday" />
                        </div>
                        <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-between h-fit' style={{
                            backgroundColor: isDark ? colors.dark.sidebar : undefined
                        }}>
                            <div className="flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("holiday")}
                                    className={`${activeTab === 'holiday' ? 'bg-[#C81C1F] text-white' : 'bg-white text-black'} flex py-0.5   rounded items-center px-3 border border-gray-300  mr-1 cursor-pointer active:scale-95`}
                                >
                                    Holiday
                                </button>
                                {openHolidayForm && (
                                    <div className="">
                                        <HolidayModal
                                            isOpen={openHolidayForm}
                                            onClose={() => {
                                                setHolidayForm(false);
                                                setEditingHoliday(null);
                                            }}
                                            onSaved={handleHolidayForm as (payload: unknown) => void}
                                            holiday={editingHoliday as Partial<Holiday> | undefined}

                                        />
                                    </div>
                                )}

                              <ExcelExportButton
                                isOpen={showExportModal}
                                entityLabel="Holiday"
                                holidayData={paginatedItems}
                                onClose={() => setShowExportModal(false)}
                                onFetchAll={async () => {
                                  // Fetch all data for “Export All”
                                  const allData = (await refetch().unwrap()) as unknown as { data: any[] };
                                  const allHolidayData=allData.data.filter((i:any)=> i.name !== "flexible_holiday");
                                  const allFlexible = allData.data.filter((i:any) => i.name === "flexible_holiday");
                                  const allWeekOff = PermanentWeekDay || [];

                                  return {
                                    holidayData: allHolidayData|| [],
                                    flexibleData: allFlexible || [],
                                    weekOffData: allWeekOff || [],
                               };
                             }}
                            />

                                <button onClick={() => (setActiveTab("permanent"), setDropDown(false))} className={`${activeTab === 'permanent' ? 'bg-[#C81C1F] text-white' : 'bg-white text-black'} border border-gray-300 p-1 rounded mx-2 `}>Permanent Week Off</button>
                                <button onClick={() => (setActiveTab("flexible"), setDropDown(false))} className={`${activeTab === 'flexible' ? 'bg-[#C81C1F] text-white' : 'bg-white text-black'} px-1 border border-gray-300  rounded py-1`}>Flexible Week Off</button>

                            </div>
                            <div className="flex items-center justify-center gap-1">

                                {/* Add Search Bar */}
                                {activeTab === 'holiday' && (
                                    <SearchBar
                                        model="holiday"
                                        onSearch={handleSearch}
                                        placeholder="Search"
                                        defaultSelectedColumns={['name', 'holidayType']}
                                        defaultOperator="cn"
                                        showOperatorSelector={false}
                                        className="flex-shrink-0"
                                    />
                                )}
                                {/* Add Filters Button */}
                                {activeTab === 'holiday' && (

                                    <button
                                        onClick={handleFilterClick}
                                        className=" flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                        title="Advanced Filters"
                                    >
                                        <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                                        Filters</button>
                                )}
                                {openDropDown && (
                                    <div className="absolute mt-25 left-52  border rounded shadow-lg z-50">
                                        <div className="flex flex-col border-t-transparent bg-gray-100">
                                            <button onClick={() => (setActiveTab("permanent"), setDropDown(false))} className="bg-white border py-1 px-4 rounded hover:bg-blue-50">Permanent</button>
                                            <button onClick={() => (setActiveTab("flexible"), setDropDown(false))} className="bg-white border border-t-gray-300 hover:bg-blue-50 rounded py-1">Flexible</button>
                                        </div>
                                    </div>

                                )}

                            </div>
                        </div>

                        {/* pagination bar */}
                        {activeTab === 'holiday' && (

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
                        )}
                        {/* ===== Tab Content ===== */}

                        {activeTab === "holiday" && <SimpleTable columns={columns} items={paginatedItems} maxRowsBeforeScroll={7} />
                        }

                        {activeTab === "permanent" && (
                            <WeekdayCalendar
                                onSave={handlePermanentWeekDays}
                                existingHolidays={PermanentWeekDay || []}
                                onClose={() => setActiveTab("holiday")}
                            />
                        )}

                        {activeTab === "flexible" && (
                            <FlexibleCustomCalendar
                                startDate={new Date()}
                                endDate={new Date()}
                                onChange={(start, end) => (console.log(start, end))}
                                onClose={() => setActiveTab("holiday")} themeColor="red"
                            />
                        )}

                        <AdvancedFilter
                            modelType="holiday"
                            anchorEl={filterAnchorEl}
                            open={openFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Holiday Filters"
                        />
                    </div>
                    {isSaving && (
                        <div className="fixed inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50">
                            <LoadingSpinner />
                            <p className="text-white ml-3 text-lg">Saving, please wait...</p>
                        </div>
                    )}


                </div>
            </div>
        </ProtectedRoute>
    )
}
