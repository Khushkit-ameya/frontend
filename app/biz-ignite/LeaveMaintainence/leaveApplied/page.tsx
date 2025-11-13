"use client"
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Header from "@/components/common/Header";
import Title from "@/components/common/Title";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/store/hooks";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BiSortAlt2 } from "react-icons/bi";
import { FaEye, FaPen, FaSlidersH, FaTrash } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import SimpleTable, { Column } from "@/components/common/DynamicTable";
import { FilterCondition } from "@/components/common/AdvancedFilterPopover";
import excela from '@/public/excel-p.svg';
import Image from "next/image";
import { useAddCommentOnLeaveMutation, useChangeLeaveStatusMutation, useGetAllCommentsQuery, useSelector_, useUserLeaveAppliedQuery } from "@/store/api";
import dayjs from "dayjs";
import toast from "@/utils/toast";
import ExportModal from "../../ExportExcel/Export";
import SearchBar from "../../AdvanceSearch/SearchBar";
import AdvancedFilter from "../../Filter/AddFilter";
import { X } from "lucide-react";
import { skipToken } from '@reduxjs/toolkit/query';
import Bar from "@/components/common/PaginationBar";
import FilterIcon from '@/assests/filter-icon.png'

type LeaveRow = {
    id: number;
    leaveType: string;
    status: "Pending" | "Approved" | "Rejected" | "New" | "WithDraw";
    withdraw?: string;
    from: string;
    to: string;
    noOfDays: number;
    reason?: string;
    comments?: string;
    attachments?: boolean;
    approvedBy?: string;
    handleStatusChange?: (id: number, newStatus: string) => void;
};

type Comment = {
    id: string;
    userId: string;
    leaveId: string;
    comment: string;
    commentDate: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        firstName: string;
        middleName: string | null;
        lastName: string;
        avatar: string | null;
    };
};

type CommentModalState = {
    isOpen: boolean;
    leaveId: number | null;
    newComment: string;
};

const statusClass = (s: LeaveRow["status"]) => {
    switch (s) {
        case "Approved":
            return "border-green-500 text-green-700 bg-green-50";
        case "Pending":
            return "border-orange-400 text-orange-700 bg-orange-50";
        case "Rejected":
            return "border-red-500 text-red-700 bg-red-50";
        case "New":
            return "border-blue-500 text-blue-700 bg-blue-50";
        default:
            return "border-gray-300 text-gray-700 bg-gray-50";
    }
};

export default function Leave() {
    const { isDark, colors } = useTheme();
    const [leaves, setLeaves] = useState<LeaveRow[]>([]);
    const [leaveStatusChange] = useChangeLeaveStatusMutation();
    const [showLessColumns, setShowLessColumns] = useState(false);
    
    // Pagination state
        const [page, setPage] = useState(1);
        const [pageSize, setPageSize] = useState(10);
        
    // Advanced filter state
    const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [filterItems, setFilteredItems] = useState<LeaveRow[]>([]);
    const [openFilter, setOpenFilter] = useState(false);

    // Comment modal state
    const [commentModal, setCommentModal] = useState<CommentModalState>({
        isOpen: false,
        leaveId: null,
        newComment: ""
    });
console.log("advanceFilter params=",advancedFilterParams)
    const [addComment, { isLoading: isAddingComment }] = useAddCommentOnLeaveMutation();
    
    // Fetch comments when modal is open with a specific leaveId
    const { data: leaveCommentsData, refetch: refetchComments, isLoading: isLoadingComments } = useGetAllCommentsQuery(
        commentModal.leaveId ? { leaveId: commentModal.leaveId.toString() } : skipToken,
        { skip: !commentModal.leaveId }
    );

    const user: any = useSelector_((state) => state.globalState.user);
    const { data, refetch } = useUserLeaveAppliedQuery({
        companyUserId: user?.companyUserId || "",
    });
    const leaveAppliedData = data as any[] | undefined;

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'holidayType']);

    // Excel state
    const [showExportModal, setShowExportModal] = useState(false);

    // Status change handler
    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const response = await leaveStatusChange({ id: id.toString(), status: newStatus.toUpperCase() }).unwrap();
            toast.success(`Leave status changed to ${newStatus} successfully.`);
        } catch (error: any) {
            console.error("Error changing status:", error);
            toast.error(`Failed to change status: ${error?.data?.message || error.message}`);
        }
    };

    // Comment modal handlers
    const handleOpenCommentModal = (leaveId: number) => {
        setCommentModal({
            isOpen: true,
            leaveId,
            newComment: ""
        });
    };

    const handleCloseCommentModal = () => {
        setCommentModal({
            isOpen: false,
            leaveId: null,
            newComment: ""
        });
    };

    const handleAddComment = async () => {
        try {
            if (!commentModal.newComment.trim()) {
                toast.error("Please enter a comment");
                return;
            }

            if (!commentModal.leaveId) {
                toast.error("No leave selected");
                return;
            }

            // Call the API to add comment
            const response = await addComment({
                userId: user?.companyUserId,
                leaveId: commentModal.leaveId.toString(),
                comment: commentModal.newComment
            }).unwrap();

            console.log("Comment added successfully:", response);
            
            // Refetch comments to get updated list
            await refetchComments();
            
            // Clear the new comment input
            setCommentModal(prev => ({
                ...prev,
                newComment: ""
            }));

            // Show success message
            toast.success("Comment added successfully");

        } catch (error: any) {
            console.error("Error adding comment:", error);
            toast.error(error?.data?.message || error?.message || "Failed to add comment");
        }
    };

    // Format comment date for display
    const formatCommentDate = (dateString: string) => {
        return dayjs(dateString).format('DD-MM-YYYY HH:mm');
    };

    // Get user display name
    const getUserDisplayName = (comment: Comment) => {
        const { firstName, middleName, lastName } = comment.user;
        return [firstName, middleName, lastName].filter(Boolean).join(' ');
    };

    const getColumns = (handleStatusChange: (id: number, newStatus: string) => void): Column<LeaveRow>[] => [
        {
            key: "leaveType",
            label: "Leave Type",
            center: true,
            sortable: false,
            isFilterable: true,
            render: (r) => <div className="text-sm text-gray-600 ">{r.leaveType}</div>,
        },
        {
            key: "status",
            label: "Status",
            center: true,
            sortable: false,
            isFilterable: true,
            render: (r) => (
                <span className={`px-3 py-1 w-full rounded border text-xs font-medium cursor-pointer inline-block ${statusClass(r.status)}`}>
                    {r.status}
                </span>
            ),
        },
        {
            key: "from",
            label: "From",
            center: true,
            sortable: false,
            isFilterable: true,
            render: (r) => <div className="text-sm text-gray-600">{r.from}</div>,
        },
        {
            key: "to",
            label: "To",
            center: true,
            sortable: false,
            isFilterable: true,
            render: (r) => <div className="text-sm text-gray-600">{r.to}</div>,
        },
        {
            key: "noOfDays",
            label: "No of Days",
            center: true,
            isFilterable: true,
            sortable: false,
            render: (r) => <div className="text-sm text-gray-600">{r.noOfDays}</div>,
        },
        {
            key: "reason",
            label: "Reason",
            center: true,
            sortable: false,
            isFilterable: true,
            render: (r) => (
                <div
                    className="text-sm text-gray-600 truncate max-w-[120px] cursor-pointer group relative"
                    title={r.reason || "—"}
                >
                    {r.reason || "—"}
                </div>
            ),
        },
        {
            key: "comments",
            label: "Comments",
            center: true,
            isFilterable: true,
            render: (r) => {
                const commentCount = r.comments ? 1 : 0; // Simple count for display
                return (
                    <div className="text-sm text-gray-600 relative">
                        <span
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleOpenCommentModal(r.id)}
                        >
                            {commentCount > 0 ? (
                                `View Comments (${commentCount})`
                            ) : (
                                "Add Comment"
                            )}
                        </span>
                    </div>
                );
            },
        },
        {
            key: "attachments",
            label: "Attachments",
            center: true,
            isFilterable: false,
            render: (r) =>
                r.attachments ? (
                    <a
                        href={"#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-md bg-[#9e9b94] border border-black text-white inline-flex items-center gap-2 hover:bg-[#7f7c75] transition-colors"
                    >
                        View <FaEye className="mt-1 ml-[-5px]" />
                    </a>
                ) : (
                    <span className="text-gray-400 text-xs italic">No file</span>
                ),
        },
        {
            key: "approvedBy",
            label: "Approved by",
            center: true,
            sortable: false,
            isFilterable: true,
            render: (r) => <div className="text-sm text-gray-600">{r.approvedBy}</div>,
        },
    ];

    const columns = getColumns(handleStatusChange);

    useEffect(() => {
        if (leaveAppliedData?.length) {
            const mapped = leaveAppliedData?.map((item: any, index: number): LeaveRow => ({
                id: item?.id,
                leaveType: item.leaveType?.leaveName || "—",
                status: item.status
                    ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
                    : "Pending",
                from: dayjs(item.startDate).format("DD-MM-YYYY"),
                to: dayjs(item.endDate).format("DD-MM-YYYY"),
                noOfDays: dayjs(item.endDate).diff(dayjs(item.startDate), "day") + 1,
                reason: item.reason,
                comments: item.comments?.length > 0 ? item.comments.map((c: any) => c.text).join(", ") : "",
                attachments: item.attachments?.length > 0,
                approvedBy: item.approver
                    ? `${item.approver.firstName || ""} ${item.approver.lastName || ""}`.trim()
                    : "—",
            }));
            setLeaves(mapped);
        }
    }, [leaveAppliedData]);

    const LeaveTitleBtn = [
        {
            name: "Export",
            icon: <Image src={excela} alt="Export" width={18} height={18} />,
            onClick: () => setShowExportModal(true)
        },
    ];

    const subTitleBtn = [
        {
            name: "search",
            icon: " "
        },
        {
            icon: <BiSortAlt2 />,
            name: "Sort"
        },
    ];

    // convert date to dd-mm-yyyy
    const formatISOToDDMMYYYY = (isoDate: string) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const applyAdvancedFilters = (filters: FilterCondition[], data: LeaveRow[]) => {
        if (!filters || filters.length === 0) return data;

        return data.filter((item) =>
            filters.every((filter) => {
                const fieldValue = (item as any)[filter.field];
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

    useEffect(() => {
        if (!leaves || leaves.length === 0) {
            setFilteredItems([]);
            return;
        }

        let filtered = [...leaves];

        // Apply advanced filters (if any)
        if (advancedFilters && advancedFilters.length > 0) {
            filtered = applyAdvancedFilters(advancedFilters, filtered);
        }

        // Apply search filter (if any)
        if (searchTerm && selectedColumns.length > 0) {
            filtered = applySearch(searchTerm, selectedColumns, filtered);
        }

        setFilteredItems(filtered);
    }, [leaves, advancedFilters, searchTerm, selectedColumns]);

        //   pagination setting
        const paginatedItems = useMemo(() => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            return filterItems.slice(start, end);
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
    }, []);

    // Search handlers
    const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
        setSearchTerm(term);
        setSelectedColumns(columns);
    }, []);

    const applySearch = (term: string, columns: string[], data: LeaveRow[]) => {
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
                                    { label: 'LeaveMaintainence', href: '/biz-ignite/LeaveMaintainence/leaveApplied' },
                                    { label: 'LeaveApplied', href: '/biz-ignite/LeaveMaintainence/leaveApplied' },
                                ]}
                            />
                        </div>

                        {/* title */}
                        <div
                            className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                            style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}
                        >
                            <Title TitleObj={LeaveTitleBtn} name="Leave Applied" />
                        </div>
                        

                        {/* subtitle */}
                        <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end h-fit' style={{
                            backgroundColor: isDark ? colors.dark.sidebar : undefined
                        }}>
                            <SearchBar
                                model="LeaveApplied"
                                onSearch={handleSearch}
                                placeholder="Search"
                                defaultSelectedColumns={['status', 'leaveType']}
                                defaultOperator="cn"
                                showOperatorSelector={false}
                                className="flex-shrink-0"
                            />

                            <button
                                onClick={handleAdvancedFilterClick}
                                className=" flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                title="Advanced Filters"
                            >
                                <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                                Filters</button>
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
                        <SimpleTable columns={columns} items={paginatedItems} maxRowsBeforeScroll={4} />

                        {/* Advanced Filter Popover */}
                        <AdvancedFilter
                            modelType="LeaveApplied"
                            anchorEl={filterAnchorEl}
                            open={openFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Leave Applied Filters"
                        />

                        {/* Excel Export */}
                        <ExportModal
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            entityLabel="Leave"
                            fields={columns}
                            rows={leaves}
                            fetchAll={async () => {
                                const allData = await refetch() as { data?: any[] };
                                if (allData?.data?.length) {
                                    return allData.data.map((item: any) => ({
                                        id: item?.id,
                                        leaveType: item.leaveType?.leaveName || "—",
                                        status: item.status
                                            ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
                                            : "Pending",
                                        from: dayjs(item.startDate).format("DD-MM-YYYY"),
                                        to: dayjs(item.endDate).format("DD-MM-YYYY"),
                                        noOfDays: dayjs(item.endDate).diff(dayjs(item.startDate), "day") + 1,
                                        reason: item.reason,
                                        comments: item.comments?.length > 0 ? item.comments.map((c: any) => c.text).join(", ") : "—",
                                        approvedBy: item.approver
                                            ? `${item.approver.firstName || ""} ${item.approver.lastName || ""}`.trim()
                                            : "—",
                                    }));
                                }
                                return [];
                            }}
                        />

                        {/* Comment Modal */}
                        {commentModal.isOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div
                                    className={`
                                         w-[650px] max-h-[80vh] shadow-lg overflow-y-auto  
                                         bg-white text-gray-900  
                                         dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
                                         flex flex-col
                                       `}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-center pt-2 pb-2 pl-4 pr-4 sticky top-0" style={{
                                        backgroundColor: "#656462", color: "white"
                                    }}>
                                        <h2 className="text-base font-semibold">Leave Comments</h2>
                                        <button
                                            onClick={handleCloseCommentModal}
                                            className="cursor-pointer p-0.5 rounded-[3px] hover:bg-gray-100 dark:hover:bg-gray-800" style={{
                                                backgroundColor: "#ffffff", color: "#656462"
                                            }}
                                            aria-label="Close"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4">
                                        {/* Existing Comments */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Comments ({leaveCommentsData?.length || 0})
                                            </label>
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                                {isLoadingComments ? (
                                                    <div className="text-center py-4">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                                        <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
                                                    </div>
                                                ) : leaveCommentsData && leaveCommentsData.length > 0 ? (
                                                    leaveCommentsData.map((comment: Comment) => (
                                                        <div key={comment.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-medium text-sm text-gray-800">
                                                                    {getUserDisplayName(comment)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatCommentDate(comment.commentDate)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                                {comment.comment}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-6 border border-dashed border-gray-300 rounded">
                                                        <p className="text-sm text-gray-400 italic">No comments yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add New Comment */}
                                        <div className="border-t pt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Add New Comment
                                            </label>
                                            <textarea
                                                value={commentModal.newComment}
                                                onChange={(e) => setCommentModal(prev => ({
                                                    ...prev,
                                                    newComment: e.target.value
                                                }))}
                                                placeholder="Enter your comment here..."
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                                                rows={4}
                                                disabled={isAddingComment}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end p-4 border-t">
                                        <button
                                            type="button"
                                            onClick={handleCloseCommentModal}
                                            disabled={isAddingComment}
                                            className="border px-6 py-1 text-base rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                            style={{ color: "#88898a", borderColor: "#88898a" }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddComment}
                                            disabled={isAddingComment || !commentModal.newComment.trim()}
                                            className="px-6 py-1 text-base rounded text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                            style={{ backgroundColor: '#b61f21', color: '#ffffff' }}
                                        >
                                            {isAddingComment ? "Adding..." : "Add Comment"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
