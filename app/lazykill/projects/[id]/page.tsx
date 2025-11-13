"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import CompanyJobBucketDialog from '@/components/CompanyJobBucketDialog';
import { useRouter, useParams } from "next/navigation";
import { Search, User, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { DateTime } from "luxon";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import { useTheme } from '@/store/hooks';
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import TaskTable, { TaskData } from "@/components/common/TaskTable";
import { FieldDefinition } from "@/types/FieldDefinitions";
import {
    useGetProjectByIdQuery,
} from "@/store/api_query/LazyKill/project.api";
import { useUpdateSubtaskMutation } from "@/store/api_query/LazyKill/lazyKill.api";
import {
    useGetTaskMDMFieldsQuery,
    useGetTaskMDMFieldsTableQuery,
    useGetAllTasksQuery,
    useUpdateTaskStatusMutation,
    useUpdateTaskPriorityMutation,
    useGetTaskMDMInfoQuery,
    useCreateTaskStatusOptionMutation,
    useUpdateTaskStatusOptionMutation,
    useDeleteTaskStatusOptionMutation,
    useCreateTaskPriorityOptionMutation,
    useUpdateTaskPriorityOptionMutation,
    useDeleteTaskPriorityOptionMutation,
    useUpdateTaskTagsMutation,
    useUpdateTaskNameMutation,
    useUpdateTaskDueDateMutation,
    useUpdateTaskMDMDisplayNameMutation,
    useUpdateSubtaskStatusMutation,
    useUpdateSubtaskPriorityMutation,
    useUpdateSubtaskAssigneeMutation,
    useUpdateSubtaskTagsMutation,
    useUpdateSubtaskNameMutation,
    useUpdateSubtaskDueDateMutation,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useCreateTaskTimeTrackingMutation,
    useCreateSubtaskTimeTrackingMutation,
    useStartTaskTimeTrackingMutation,
    useStopTaskTimeTrackingMutation,
    useStartSubtaskTimeTrackingMutation,
    useStopSubtaskTimeTrackingMutation,
    useGetUserRunningTaskQuery,
    useGetUserRunningSubtaskQuery,
    useSubtaskMDMFieldsQuery,
    useCreateSubtaskMutation,
    useCreateRepeatTaskMutation,
    useGetTaskTimeInvestedByUserQuery,
} from "@/store/api_query/LazyKill/lazyKill.api";
import { useGetCompanyUsersQuery, useGetCurrentUserQuery } from '@/store/api_query/auth.api';
import StatusDropdown from "@/components/dropdowns/StatusDropdown";
import DueDatePicker from "@/components/common/DueDatePicker";
import AssignedToSelector from "@/components/common/AssignedToSelector";
import Image from "next/image";
import { customToast as toast } from '@/utils/toast';
import { GrFormAdd } from "react-icons/gr";
import TagsEditor from "@/components/common/TagsEditor";
import editpencil from '@/assests/editpencil.png';
import deleteForever from '@/assests/delete_forever.png';
import threeDot from '@/assests/threeDots.png';
import TaskSearchBar from "@/components/common/TaskSearchBar";
import AdvancedFilterPopover from '@/components/common/AdvancedFilterPopover';
import PersonFilterPopover from '@/components/Project/PersonFilterPopover';
import SortFilterPopover from '@/components/Project/SortFilterPopover';
import Bar from "@/components/Project/PaginationBar";
import FilterIcon from '@/assests/filter-icon.png';
import infinityIcon from "@/public/infinity.svg";

// Form related imports
import { TabbedFormLayout } from "@/components/common/forms/TabbedFormLayout";
import { OverviewTabContent } from "@/components/common/forms/tab-contents/OverviewTabContent";
import { UpdatesTabContent } from "@/components/common/forms/tab-contents/UpdatesTabContent";
import { FilesLinksTabContent } from "@/components/common/forms/tab-contents/FilesLinksTabContent";
import { FormModal } from "@/components/common/forms/FormModal";
import DynamicForm, { FieldType } from "@/components/common/forms/DynamicForm";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";
import search from "@/public/icons/search 1.svg";
import { getDynamicFieldConfig } from "@/components/common/forms/DynamicForm/dynamicFieldConfig";
import PagerIcon from '@/assests/pager.svg';
import { FaPlay, FaStop } from "react-icons/fa";
import KanbanBoard from "@/components/Project/KanbanBoard";
import { Popover, Box, Typography, Divider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

// Define interfaces

interface TagObject {
    value?: string;
    label?: string;
    color?: string;
    [key: string]: unknown;
}
interface OptionItem {
    id?: string;
    userId?: string;
    value?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
}

interface UserObject {
    id?: string;
    userId?: string;
    value?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string;
    role?: string;
}

export interface TaskDataExtended {
    id: string;
    taskId?: string;
    taskName?: string;
    description?: string;
    status?: string | { value: string };
    priority?: string | { value: string };
    progress?: number;
    startDate?: string;
    endDate?: string;
    timeLine?: string[] | { start: string; end: string };
    taskType?: string | { value: string };
    tags?: string[];
    assignedTo?: Array<{ id?: string; userId?: string; value?: string; firstName?: string; lastName?: string; name?: string; avatar?: string }>;
    assignedBy?: Array<{ id?: string; userId?: string; value?: string; firstName?: string; lastName?: string; name?: string; avatar?: string }>;
    documents?: unknown[];
    _id?: string;

    // Optional helper flags/ids for subtasks handling in UI
    isSubtask?: boolean;
    parentTaskId?: string;
    subTaskId?: string;
}

interface TaskField {
    fieldKey: string;
    displayName: string;
    fieldType: string;
    isRequired?: boolean;
    isEditable?: boolean;
    options?: OptionItem[];
    displayOrder?: number;
    defaultValue?: unknown;
    validations?: {
        min?: number;
        max?: number;
    };
    id?: string;
}

interface TaskFieldsResponse {
    data?: TaskField[];
}

interface FieldOptions {
    choices?: OptionItem[];
    allowCustom?: boolean;
    multiple?: boolean;
    searchable?: boolean;
    min?: number;
    max?: number;
    rows?: number;
}

interface StatusOption {
    fieldKey: string;
    displayName: string;
    color: string;
}

// Time Invested Popover Component
interface TimeInvestedPopoverProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    taskId: string | null;
    isSubtask?: boolean;
}

const TimeInvestedPopover: React.FC<TimeInvestedPopoverProps> = ({ anchorEl, open, onClose, taskId, isSubtask = false }) => {
    // Fetch time invested data
    const { data: timeInvestedData, isLoading, error } = useGetTaskTimeInvestedByUserQuery(
        taskId || '',
        { skip: !taskId }
    );

    // Helper function to format seconds to readable time
    const formatTime = (seconds: number) => {
        if (!seconds || seconds <= 0) return '0s';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    };

    // Helper function to format date/time
    const formatDateTime = (dateString: string) => {
        try {
            const dt = DateTime.fromISO(dateString);
            return dt.toFormat('MMM dd, yyyy hh:mm a');
        } catch {
            return dateString;
        }
    };

    const timeData = timeInvestedData?.data?.data;

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Box sx={{ p: 3, minWidth: 500, maxWidth: 700, maxHeight: '80vh', overflowY: 'auto' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography color="error">Failed to load time tracking data</Typography>
                    </Box>
                ) : timeData ? (
                    <>
                        {/* Header */}
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            {isSubtask ? 'Subtask' : 'Task'} Time Tracking
                        </Typography>

                        {/* Summary Section - One Line */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: '#f5f5f5',
                            p: 2,
                            borderRadius: 2,
                            mb: 3
                        }}>
                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Your Time
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                    {formatTime(timeData.totalSeconds)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    ({timeData.totalHours?.toFixed(2)}h)
                                </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    All Users Total
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57c00' }}>
                                    {formatTime(timeData.totalSecondsAllUsers)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    ({timeData.totalHoursAllUsers?.toFixed(2)}h)
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Time Tracking Entries */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#424242' }}>
                            Time Tracking Sessions ({isSubtask ? 'Subtask Only' : 'All Users'})
                        </Typography>

                        {/* For subtasks, show only subtask entries */}
                        {/* For tasks, show all entries including subtask entries */}
                        {(() => {
                            // Determine which entries to display
                            let entriesToShow = [];

                            if (isSubtask) {
                                // For subtasks: show only entries where subtaskId is not null
                                entriesToShow = (timeData.allEntriesAllUsers || []).filter((entry: any) => entry.subtaskId);
                            } else {
                                // For tasks: show all entries (task + subtask entries)
                                entriesToShow = timeData.allEntriesAllUsers || [];
                            }

                            if (entriesToShow.length === 0) {
                                return (
                                    <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                        <Typography variant="body2">No time tracking sessions found</Typography>
                                    </Box>
                                );
                            }

                            return entriesToShow.map((entry: any, index: number) => (
                                <Box
                                    key={entry.timeTrackingId || index}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        bgcolor: '#fafafa',
                                        '&:hover': {
                                            bgcolor: '#f5f5f5',
                                            boxShadow: 1
                                        }
                                    }}
                                >
                                    {/* User Info and Duration */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {/* User Avatar */}
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    bgcolor: '#1976d2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {entry.createdBy?.avatar ? (
                                                    <img
                                                        src={entry.createdBy.avatar}
                                                        alt={`${entry.createdBy.firstName} ${entry.createdBy.lastName}`}
                                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    `${entry.createdBy?.firstName?.charAt(0) || ''}${entry.createdBy?.lastName?.charAt(0) || ''}`
                                                )}
                                            </Box>

                                            {/* User Name and Role */}
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                    {entry.createdBy?.firstName || ''} {entry.createdBy?.lastName || ''}
                                                </Typography>
                                                {entry.createdBy?.role && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                                                        {entry.createdBy.role}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Duration Badge */}
                                        <Box sx={{
                                            bgcolor: entry.subtaskId ? '#e3f2fd' : '#fff3e0',
                                            color: entry.subtaskId ? '#1976d2' : '#f57c00',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 2,
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }}>
                                            {formatTime(entry.seconds)}
                                        </Box>
                                    </Box>

                                    {/* Start and End Time */}
                                    <Box sx={{ display: 'flex', gap: 3, mb: 1.5, flexWrap: 'wrap' }}>
                                        <Box sx={{ flex: 1, minWidth: '200px' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 500 }}>
                                                Started:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                                                {formatDateTime(entry.startAt)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: '200px' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 500 }}>
                                                Ended:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 500 }}>
                                                {entry.endAt ? formatDateTime(entry.endAt) : 'Still running...'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Task/Subtask Label */}
                                    {entry.subtaskId && (
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    bgcolor: '#e3f2fd',
                                                    color: '#1976d2',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontWeight: 500,
                                                    display: 'inline-block'
                                                }}
                                            >
                                                Subtask Entry
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Notes Section */}
                                    {entry.notes && (
                                        <Box sx={{
                                            mt: 1.5,
                                            pt: 1.5,
                                            borderTop: '1px solid #e0e0e0'
                                        }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block', mb: 0.5 }}>
                                                Notes:
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#424242',
                                                    bgcolor: 'white',
                                                    p: 1.5,
                                                    borderRadius: 1,
                                                    border: '1px solid #e0e0e0',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    maxHeight: '120px',
                                                    overflowY: 'auto',
                                                    fontSize: entry.notes.length > 100 ? '0.8rem' : '0.875rem',
                                                    lineHeight: 1.5
                                                }}
                                            >
                                                {entry.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            ));
                        })()}

                        {/* Subtask Summary (only for tasks) */}
                        {!isSubtask && timeData.subtaskTotalsAllUsers && timeData.subtaskTotalsAllUsers.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#424242' }}>
                                    Subtask Time Summary
                                </Typography>
                                {timeData.subtaskTotalsAllUsers.map((subtask: any, index: number) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1,
                                            p: 1.5,
                                            bgcolor: '#e3f2fd',
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: '#424242', fontWeight: 500 }}>
                                            {subtask.subtaskName || 'Unnamed Subtask'}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                            {formatTime(subtask.totalSeconds)}
                                        </Typography>
                                    </Box>
                                ))}
                            </>
                        )}

                        {/* Footer Info */}
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                Total Sessions: {isSubtask
                                    ? (timeData.allEntriesAllUsers || []).filter((e: any) => e.subtaskId).length
                                    : timeData.allEntriesAllUsers?.length || 0}
                            </Typography>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography>No time tracking data available</Typography>
                    </Box>
                )}
            </Box>
        </Popover>
    );
};

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params?.id as string;
    const { isDark, colors } = useTheme();

    // State management
    const [taskExpandedIds, setTaskExpandedIds] = useState<(string | number)[]>([]);
    /**
     * Toggle expand/collapse state for a task row.
     * Adds the id when not present, removes it when present.
     */
    const toggleExpand = (id: string | number) => {
        setTaskExpandedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            }
            return [...prev, id];
        });
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [assignedToSelectorOpen, setAssignedToSelectorOpen] = useState(false);
    const [assignedToAnchorEl, setAssignedToAnchorEl] = useState<HTMLElement | null>(null);
    const [companyJobAnchorEl, setCompanyJobAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskName, setEditingTaskName] = useState<string>("");
    const [showLessColumns, setShowLessColumns] = useState(false);
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [personFilterAnchorEl, setPersonFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [sortFilterAnchorEl, setSortFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
    const [openPersonFilter, setOpenPersonFilter] = useState(false);
    const [openSortFilter, setOpenSortFilter] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<any[]>([]);
    const [personFilters, setPersonFilters] = useState<{ managerIds?: string[]; teamIds?: string[]; assignmentType?: 'task' | 'subtask' | 'both' }>({});
    const [sortConfig, setSortConfig] = useState<any>(null);
    const [searchQueryParams, setSearchQueryParams] = useState<Record<string, string>>({}); // Store search params from search bar
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const { data: RepeattaskUsers } = useGetCompanyUsersQuery({});
    // Track related item context for forms/details (used by setRelatedItem)
    const [relatedItem, setRelatedItem] = useState<{
        type: 'task' | 'subtask';
        taskId?: string;
        subTaskId?: string;
        taskName?: string;
        projectId?: string;
        projectName?: string;
    } | null>(null);

    // Time tracking state - track running time for each task
    const [runningTimes, setRunningTimes] = useState<Record<string, number>>({}); // taskId -> runningSeconds
    const [runningTaskIds, setRunningTaskIds] = useState<Set<string>>(new Set()); // Set of currently running task IDs

    // Time invested popover state
    const [timeInvestedAnchorEl, setTimeInvestedAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedTimeTrackingTaskId, setSelectedTimeTrackingTaskId] = useState<string | null>(null);
    const [selectedTimeTrackingIsSubtask, setSelectedTimeTrackingIsSubtask] = useState<boolean>(false);

    // Notes dialog state for time tracking
    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [timeTrackingNotes, setTimeTrackingNotes] = useState('');
    const [pendingStopAction, setPendingStopAction] = useState<{
        taskId: string;
        isSubtask: boolean;
        displayText: string;
    } | null>(null);

    // Form modal state
    const [isEditMode, setIsEditMode] = useState(false);
    const [open, setOpen] = useState(false);
    const [editTask, setEditTask] = useState<TaskDataExtended | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [taskType, setTaskType] = useState<"regular" | "repetitive">("regular");

    // Queries
    const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();
    const { data: projectData, isLoading: projectLoading, error: projectError } = useGetProjectByIdQuery(projectId, {
        skip: !projectId
    });
    // Use the hook's real return type so helpers like `refetch` are available
    const { data: taskMDMFields, isLoading: taskMDMLoading, refetch: taskmdmrefetch } = useGetTaskMDMFieldsQuery();
    const { data: taskMDMFieldsTable, isLoading: taskMDMTableLoading } = useGetTaskMDMFieldsTableQuery() as any;
    const { data: taskMDMInfo, isLoading: taskMDMInfoLoading } = useGetTaskMDMInfoQuery() as any;

    // Fetch tasks by project ID with pagination and sorting
    // Using getAllTasks with projectId filter to support pagination, sorting, and search
    // Memoize query params to ensure RTK Query detects changes
    const queryParams = useMemo(() => {
        const params: any = {
            projectId: `eq:${projectId}`, // Filter by project ID using eq: prefix for exact match
            page: currentPage,
            countPerPage: pageSize,
            sort: sortField,
            sortDirection: sortDirection,
            ...searchQueryParams,
            ...advancedFilterParams,
            companyJobBucket: 'eq:false',
        };

        // Add assigned filter for both tasks and subtasks
        const assignedIds = new Set<string>();
        personFilters.managerIds?.forEach((id) => assignedIds.add(id));
        personFilters.teamIds?.forEach((id) => assignedIds.add(id));
        if (assignedIds.size > 0) {
            params['assignedToId'] = `in:${Array.from(assignedIds).join(',')}`;
        }

        // Add assignment type filter (task vs subtask)
        if (personFilters.assignmentType && personFilters.assignmentType !== 'both') {
            params['assignmentType'] = personFilters.assignmentType; // 'task', 'subtask', or 'both'
        }

        console.log('queryParams updated:', params);
        return params;
    }, [projectId, currentPage, pageSize, sortField, sortDirection, searchQueryParams, advancedFilterParams, personFilters]);

    const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useGetAllTasksQuery(queryParams, {
        skip: !projectId
    });

    // Mutations for task status and priority
    const [updateTaskStatus] = useUpdateTaskStatusMutation();
    const [updateTaskPriority] = useUpdateTaskPriorityMutation();
    const [updateTaskName] = useUpdateTaskNameMutation();
    const [updateTaskDueDate] = useUpdateTaskDueDateMutation();
    const [updateTaskMDMDisplayName] = useUpdateTaskMDMDisplayNameMutation();
    const [createTaskStatusOption] = useCreateTaskStatusOptionMutation();
    const [updateTaskStatusOption] = useUpdateTaskStatusOptionMutation();
    const [deleteTaskStatusOption] = useDeleteTaskStatusOptionMutation();
    const [createTaskPriorityOption] = useCreateTaskPriorityOptionMutation();
    const [updateTaskPriorityOption] = useUpdateTaskPriorityOptionMutation();
    const [deleteTaskPriorityOption] = useDeleteTaskPriorityOptionMutation();
    const [updateTaskTags] = useUpdateTaskTagsMutation();
    const [createTask] = useCreateTaskMutation();
    const [updateTask] = useUpdateTaskMutation();
    const [updateSubtask] = useUpdateSubtaskMutation();

    // Subtask mutations
    const [updateSubtaskStatus] = useUpdateSubtaskStatusMutation();
    const [updateSubtaskPriority] = useUpdateSubtaskPriorityMutation();
    const [updateSubtaskAssignee] = useUpdateSubtaskAssigneeMutation();
    const [updateSubtaskTags] = useUpdateSubtaskTagsMutation();
    const [updateSubtaskName] = useUpdateSubtaskNameMutation();
    const [updateSubtaskDueDate] = useUpdateSubtaskDueDateMutation();
    const [createSubtask] = useCreateSubtaskMutation();
    const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

    // Extract both data and refetch (rename data variable) so we can call fetchSubtaskMDMFields()
    const { data: subtaskMDMFieldsData, refetch: fetchSubtaskMDMFields } = useSubtaskMDMFieldsQuery();

    // Keep local state in sync when the query returns data
    useEffect(() => {
        if (!subtaskMDMFieldsData) return;
        if (Array.isArray((subtaskMDMFieldsData as any).data)) {
            setSubtaskMDMFields((subtaskMDMFieldsData as any).data);
        } else if (Array.isArray(subtaskMDMFieldsData as any)) {
            setSubtaskMDMFields(subtaskMDMFieldsData as any);
        }
    }, [subtaskMDMFieldsData]);

    // Time tracking mutations and queries
    const [createTaskTimeTracking] = useCreateTaskTimeTrackingMutation();
    const [createSubtaskTimeTracking] = useCreateSubtaskTimeTrackingMutation();
    const [startTaskTimeTracking] = useStartTaskTimeTrackingMutation();
    const [stopTaskTimeTracking] = useStopTaskTimeTrackingMutation();
    const [startSubtaskTimeTracking] = useStartSubtaskTimeTrackingMutation();
    const [stopSubtaskTimeTracking] = useStopSubtaskTimeTrackingMutation();

    // Query for currently running task/subtask
    const { data: runningTaskData, refetch: refetchRunningTask } = useGetUserRunningTaskQuery(undefined, {
        // pollingInterval: 5000, // Poll every 5 seconds to update running status
    });
    const { data: runningSubtaskData, refetch: refetchRunningSubtask } = useGetUserRunningSubtaskQuery(undefined, {
        // pollingInterval: 5000, // Poll every 5 seconds to update running status
    });
    const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
    const [selectedParentTaskId, setSelectedParentTaskId] = useState<string | null>(null);
    const [subtaskMDMFields, setSubtaskMDMFields] = useState<any[]>([]);
    const [subtaskLoading, setSubtaskLoading] = useState(false);
    const loading = projectLoading || userLoading || taskMDMLoading || tasksLoading || taskMDMInfoLoading || taskMDMTableLoading;


    const handleOpenSubtaskModal = (parentTaskId: string) => {
        setSelectedParentTaskId(parentTaskId);
        fetchSubtaskMDMFields();
        setSubtaskModalOpen(true);
    };

    const handleCompanyJobClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setCompanyJobAnchorEl(e.currentTarget);
    };

    const handleCompanyJobClose = () => {
        setCompanyJobAnchorEl(null);
    };
    const handleUpdateTaskStatus = async (taskId: string, status: string) => {
        try {
            await updateTask({
                id: taskId,
                updateData: { status }
            }).unwrap();
            toast.success(`Task status updated to ${status}`);
        } catch (error: any) {
            console.error('Failed to update task status:', error);
            toast.error(error?.data?.message || 'Failed to update task status');
            throw error; // Re-throw to let the Kanban board handle the error
        }
    };

    // Enhanced error handling in handleCreateSubtask
    const handleCreateSubtask = async (values: Record<string, unknown>) => {
        if (!selectedParentTaskId || !currentUser?.company?.id) {
            toast.error('Missing required information');
            return;
        }

        setSubtaskLoading(true);
        try {
            console.log('Raw form values:', values);
            console.log('Estimation time value:', values.estimationTime);
            console.log('Estimation time type:', typeof values.estimationTime);

            // Transform status
            let statusValue = 'todo';
            if (values.status) {
                if (typeof values.status === 'object' && values.status !== null) {
                    statusValue = (values.status as { value?: string }).value || 'todo';
                } else {
                    statusValue = String(values.status);
                }
            }

            // Transform priority
            let priorityValue = 'medium';
            if (values.priority) {
                if (typeof values.priority === 'object' && values.priority !== null) {
                    priorityValue = (values.priority as { value?: string }).value || 'medium';
                } else {
                    priorityValue = String(values.priority);
                }
            }

            // Transform assignedTo
            const assignedToIds: string[] = [];
            if (values.assignedTo) {
                if (Array.isArray(values.assignedTo)) {
                    values.assignedTo.forEach((user: any) => {
                        if (typeof user === 'object' && user !== null) {
                            if (user.value) assignedToIds.push(user.value);
                            else if (user.id) assignedToIds.push(user.id);
                        } else if (typeof user === 'string') {
                            assignedToIds.push(user);
                        }
                    });
                }
            }

            // Transform task type
            let taskTypeValue = 'general';
            if (values.taskType) {
                if (typeof values.taskType === 'object' && values.taskType !== null) {
                    taskTypeValue = (values.taskType as { value?: string }).value || 'general';
                } else {
                    taskTypeValue = String(values.taskType);
                }
            } else if (values.subtaskType) {
                taskTypeValue = String(values.subtaskType);
            }

            // Handle estimationTime - pass through as-is (backend handles both formats)
            const estimationTime = values.estimationTime !== undefined && values.estimationTime !== null 
                ? values.estimationTime 
                : null;

            const subtaskData = {
                taskId: selectedParentTaskId,
                subtaskName: String(values.taskName || values.subtaskName || ''),
                description: String(values.description || ''),
                status: statusValue,
                priority: priorityValue,
                startDate: values.startDate,
                endDate: values.endDate,
                progress: Math.max(0, Math.min(100, Number(values.progress) || 0)),
                assignedToId: assignedToIds,
                tags: Array.isArray(values.tags) ? values.tags.map(tag => String(tag)) : [],
                subtaskType: taskTypeValue,
                estimationTime: estimationTime,
                companyId: currentUser.company.id,
                createdById: currentUser.id,
            };

            console.log('Transformed subtask data:', subtaskData);

            await createSubtask(subtaskData).unwrap();
            toast.success('Subtask created successfully!');
            refetchTasks();
            setSubtaskModalOpen(false);
            setSelectedParentTaskId(null);
        } catch (error: unknown) {
            console.error('Failed to create subtask:', error);

            // More detailed error logging
            if (error && typeof error === 'object' && 'data' in error) {
                console.error('Error details:', error.data);
            }

            toast.error((error as { data?: { message?: string } })?.data?.message || 'Failed to create subtask');
        } finally {
            setSubtaskLoading(false);
        }
    };

    // Transform API data to TaskData format
    const sampleTasks: TaskData[] = useMemo(() => {
        const tasks = tasksData?.data?.data?.tasks || tasksData?.data?.tasks || [];

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return [];
        }

        return tasks.map((task: any) => ({
            id: task.id || task._id,
            taskTree: "",
            taskId: task.taskId || task.id,
            taskName: task.taskName || task.name || '',
            description: task.description || '',
            priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium',
            status: task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending',
            progress: task.progress || 0,
            startDate: task.startDate || '',
            endDate: task.endDate || '',
            timeLine: task.timeLine || [],
            taskType: task.taskType || [],
            tags: task.tags || [],
            estimationTime: task.estimationTime || null,
            assignedTo: task.assignedTo || [],
            assignedBy: task.assignedBy || null,
            timeTracking: task.timeTrackings || [],
            lastTimetackingStart: task.lastTimetackingStart || null,
            timeTrackingEnable: task.timeTrackingEnable || false,
            spentTime: task.spentTime || 0,
            updates: task.updates || [],
            subtasks: Array.isArray(task.subtasks) && task.subtasks.length > 0 ? task.subtasks.map((subtask: any) => ({
                id: subtask.id || subtask._id,
                taskId: subtask.subtaskId || subtask.id,
                taskName: subtask.subtaskName || subtask.name || '',
                description: subtask.description || '',
                priority: subtask.priority ? subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1) : 'Medium',
                status: subtask.status ? subtask.status.charAt(0).toUpperCase() + subtask.status.slice(1) : 'Pending',
                progress: subtask.progress || 0,
                startDate: subtask.startDate || '',
                endDate: subtask.endDate || '',
                timeLine: subtask.timeLine ? subtask.timeLine : [],
                assignedTo: subtask.assignedTo || [],
                assignedBy: subtask.assignedBy || null,
                taskType: subtask.subtaskType || [],
                tags: subtask.tags || [],
                estimationTime: subtask.estimationTime || null,
                timeTracking: subtask.timeTrackings || [],
                lastTimetackingStart: subtask.lastTimetackingStart || null,
                timeTrackingEnable: subtask.timeTrackingEnable || false,
                isSubtask: true,
                updates: subtask.projectUpdates || [],
            })) : undefined,
        }));
    }, [tasksData]);

    // Effect to detect running time tracking sessions based on backend data
    // Backend provides timeTrackingEnable and lastTimetackingStart fields
    useEffect(() => {
        if (!sampleTasks || sampleTasks.length === 0) return;

        const newRunningIds = new Set<string>();

        // Check main tasks
        sampleTasks.forEach((task) => {
            if (task.timeTrackingEnable === true && task.lastTimetackingStart) {
                newRunningIds.add(String(task.id));
            }

            // Check subtasks
            if (Array.isArray(task.subtasks)) {
                task.subtasks.forEach((subtask: any) => {
                    if (subtask.timeTrackingEnable === true && subtask.lastTimetackingStart) {
                        newRunningIds.add(String(subtask.id));
                    }
                });
            }
        });

        setRunningTaskIds(newRunningIds);
    }, [sampleTasks]);

    // Effect to force re-render every second for running tasks to update time display
    useEffect(() => {
        if (runningTaskIds.size === 0) return;

        const timer = setInterval(() => {
            setRunningTimes((prev) => {
                const updated = { ...prev };
                runningTaskIds.forEach((taskId) => {
                    updated[taskId] = (prev[taskId] || 0) + 1;
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [runningTaskIds]);

    // Task field definitions from API for table
    const taskFieldDefinitions: FieldDefinition[] = useMemo(() => {
        const fields = Array.isArray(taskMDMFieldsTable?.data) ? taskMDMFieldsTable.data : [];

        const apiFields = fields
            .filter((field: any) => field.isVisible !== false)
            .map((field: any) => ({
                fieldKey: field.fieldKey,
                displayName: field.displayName || field.fieldKey,
                fieldType: field.fieldType || 'TEXT',
                isVisible: field.isVisible !== false,
                isSortable: field.sort !== false,
                columnWidth: field.columnWidth || 160,
                displayOrder: field.displayOrder || 0,
            }));

        const taskTreeField: FieldDefinition = {
            fieldKey: 'taskTree',
            displayName: 'Tree',
            fieldType: 'TEXT',
            isVisible: true,
            isSortable: false,
            columnWidth: 100,
            displayOrder: -1,
        };

        const actionField: FieldDefinition = {
            fieldKey: 'action',
            displayName: 'Action',
            fieldType: 'ACTION',
            isVisible: true,
            isSortable: false,
            columnWidth: 120,
            displayOrder: 9999,
        };

        return [taskTreeField, ...apiFields, actionField]
            .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }, [taskMDMFieldsTable]);

    // Filter columns based on showLessColumns state
    const visibleFields: FieldDefinition[] = useMemo(() => {
        if (!showLessColumns) {
            return taskFieldDefinitions;
        }

        const columnsToShow = 5;
        let nonTreeCount = 0;

        return taskFieldDefinitions.filter((field) => {
            if (field.fieldKey === 'taskTree' || field.fieldKey === 'action') {
                return true;
            }
            nonTreeCount++;
            return nonTreeCount <= columnsToShow;
        });
    }, [taskFieldDefinitions, showLessColumns]);

    // Transform task fields for form
    const taskFields = useMemo(() => {
        if (!taskMDMFields?.data) return [];

        return (taskMDMFields.data as TaskField[])
            .filter((field: TaskField) => field && field.fieldKey && field.fieldType)
            .map((field: TaskField) => {
                const dynamicConfig = getDynamicFieldConfig(
                    field.fieldKey,
                    field.fieldType as FieldType,
                    field.displayName
                );

                const transformedOptions: FieldOptions = {};

                // Handle tags field
                if (field.fieldKey === 'tags' && field.options) {
                    transformedOptions.choices = (field.options as OptionItem[]).map((choice: OptionItem) => ({
                        value: choice.value,
                        label: choice.label,
                        color: choice.color
                    })) || [];
                    transformedOptions.allowCustom = true;
                    transformedOptions.multiple = true;
                }

                // Handle assignedTo field
                if (field.fieldKey === 'assignedTo') {
                    if (field.options && Array.isArray(field.options)) {
                        transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                            id: opt.id || (opt.value as string) || String(opt),
                            value: opt.id || (opt.value as string) || String(opt),
                            label: opt.label || opt.displayName || String(opt.value || opt),
                            color: opt.color,
                            firstName: opt.firstName || opt.name?.split(' ')[0] || '',
                            lastName: opt.lastName || opt.name?.split(' ').slice(1).join(' ') || '',
                            email: opt.email || opt.label,
                            role: opt.role || 'Team Member',
                            avatar: opt.avatar
                        }));
                    }
                    transformedOptions.multiple = true;
                    transformedOptions.searchable = true;
                }

                // Handle assignedBy field
                if (field.fieldKey === 'assignedBy') {
                    if (field.options && Array.isArray(field.options)) {
                        transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                            id: (opt.id || opt.value || String(opt)) as string,
                            value: (opt.id || opt.value || String(opt)) as string,
                            label: opt.label || opt.displayName || String(opt.value || opt),
                            color: opt.color,
                            firstName: opt.firstName || opt.name?.split(' ')[0] || '',
                            lastName: opt.lastName || opt.name?.split(' ').slice(1).join(' ') || '',
                            email: opt.email || opt.label,
                            role: opt.role || 'Assigner',
                            avatar: opt.avatar
                        }));
                    }
                    transformedOptions.multiple = true;
                    transformedOptions.searchable = true;
                }

                // Handle dropdown fields
                else if (field.fieldType === 'DROPDOWN' || field.fieldType === 'SELECT' || field.fieldType === 'MULTI_SELECT' || field.fieldType === 'USER_SELECT') {
                    if (field.options && Array.isArray(field.options)) {
                        transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                            id: (opt.id || opt.value || String(opt)) as string,
                            value: (opt.value || String(opt)) as string,
                            label: opt.label || opt.displayName || String(opt.value || opt),
                            color: opt.color,
                            firstName: opt.firstName,
                            lastName: opt.lastName,
                            email: opt.email || opt.label,
                            role: opt.role,
                            avatar: opt.avatar
                        }));
                    } else {
                        transformedOptions.choices = [];
                    }

                    if (field.fieldType === 'MULTI_SELECT' || field.fieldKey === 'assignedTo' || field.fieldKey === 'assignedBy') {
                        transformedOptions.multiple = true;
                    }

                    if (field.fieldType === 'USER_SELECT' || field.fieldKey === 'assignedTo' || field.fieldKey === 'assignedBy') {
                        transformedOptions.searchable = true;
                    }
                }

                // Handle other fields with options
                else if (field.options && Array.isArray(field.options)) {
                    transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                        id: (opt.id || opt.value || String(opt)) as string,
                        value: (opt.value || String(opt)) as string,
                        label: opt.label || opt.displayName || String(opt.value || opt),
                        color: opt.color
                    }));
                }

                // Add validations if present
                if (field.validations) {
                    if (field.validations.min !== undefined) transformedOptions.min = field.validations.min;
                    if (field.validations.max !== undefined) transformedOptions.max = field.validations.max;
                }

                // Add other field properties
                if (field.fieldType === 'TEXTAREA' && !transformedOptions.rows) {
                    transformedOptions.rows = 3;
                }

                const finalField = {
                    fieldKey: field.fieldKey,
                    displayName: field.displayName,
                    fieldType: field.fieldType,
                    isRequired: field.isRequired || false,
                    isEditable: field.isEditable !== false,
                    options: transformedOptions,
                    displayOrder: field.displayOrder || 0,
                    icon: dynamicConfig.icon,
                    tooltip: dynamicConfig.tooltip,
                    iconBg: "#C81C1F",
                };

                return finalField;
            })
            .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }, [taskMDMFields]);

    const Repeattaskuser = useMemo(() => {
        if (!RepeattaskUsers?.users) return [];

        return RepeattaskUsers.users.map((user: any) => {
            // Handle different possible API response structures
            const userId = user.id || user.userId || '';
            const userName = user.name || user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User';
            const userRole = user.role?.name || user.role || 'Team Member';
            const userAvatar = user.avatar || user.image || '';
            const userEmail = user.email || '';

            // Ensure we have a valid ID
            if (!userId) {
                console.warn('User without ID found:', user);
                return null;
            }

            // Split name for display purposes
            const nameParts = userName.split(' ');
            const firstName = user.firstName || nameParts[0] || '';
            const lastName = user.lastName || nameParts.slice(1).join(' ') || '';

            return {
                id: userId,
                value: userId,
                label: userName,
                name: userName,
                firstName: firstName,
                lastName: lastName,
                email: userEmail,
                role: userRole,
                avatar: userAvatar,
                color: user.role?.color || user.color || '#6b7280'
            };
        }).filter(Boolean); // Remove any null entries
    }, [RepeattaskUsers]);

    console.log("Repeattaskuser??????????????????????????????????????", Repeattaskuser);

    const repetitiveTaskFields = useMemo(() => {
        const baseFields = [
            {
                fieldKey: 'taskName',
                displayName: 'Task Name',
                fieldType: 'TEXT',
                isRequired: true,
                isEditable: true,
                displayOrder: 1,
                icon: "/icons/project/Proejct Name.svg",
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'description',
                displayName: 'Description',
                fieldType: 'TEXT',
                isRequired: true,
                isEditable: true,
                displayOrder: 2,
                icon: "/icons/project/Descritpion.svg",
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'priority',
                displayName: 'Priority',
                fieldType: 'DROPDOWN',
                isRequired: true,
                isEditable: true,
                displayOrder: 4,
                icon: "/icons/project/Priority.svg",
                iconBg: "#C81C1F",
                options: {
                    choices: [
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'critical', label: 'Critical' }
                    ]
                }
            },
            // UPDATED: Company Job Bucket as Switch/Toggle
            {
                fieldKey: 'companyJobBucket',
                displayName: 'Company Job Bucket',
                fieldType: 'SWITCH',
                isRequired: false,
                isEditable: true,
                displayOrder: 5,
                icon: "/icons/project/document-_1_.svg",
                iconBg: "#C81C1F",
                options: {
                    defaultValue: false
                }
            },
            // UPDATED: Estimate Time with number input and time unit dropdown
            {
                fieldKey: 'estimateTime',
                displayName: 'Estimate Time',
                fieldType: 'CUSTOM_ESTIMATE_TIME',
                isRequired: false,
                isEditable: true,
                displayOrder: 6,
                icon: "/icons/time.svg",
                iconBg: "#C81C1F",
                options: {
                    defaultValue: { value: 60, unit: 'minutes' }
                }
            },
            {
                fieldKey: 'assignedTo',
                displayName: 'Assigned To',
                fieldType: 'MULTI_SELECT',
                isRequired: true,
                isEditable: true,
                displayOrder: 7,
                icon: "/icons/project/Manager.svg",
                iconBg: "#C81C1F",
                options: {
                    choices: Repeattaskuser,
                    multiple: true,
                    searchable: true
                }
            },
            {
                fieldKey: 'tags',
                displayName: 'Tags',
                fieldType: 'MULTI_SELECT',
                isRequired: false,
                isEditable: true,
                displayOrder: 8,
                icon: "/icons/project/tags.svg",
                iconBg: "#C81C1F",
                options: {
                    choices: [],
                    multiple: true,
                    allowCustom: true
                }
            },
            // NEW FIELD: Repeat Task Type (FLEXIBLE/IMPORTANT)
            {
                fieldKey: 'repeatTaskType',
                displayName: 'Repeat Task Type',
                fieldType: 'DROPDOWN',
                isRequired: true,
                isEditable: true,
                displayOrder: 9,
                icon: "/icons/project/Timeline Calnedr.svg",
                iconBg: "#C81C1F",
                options: {
                    choices: [
                        { value: 'FLEXIBLE', label: 'Flexible' },
                        { value: 'IMPORTANT', label: 'Important' }
                    ]
                }
            },
            {
                fieldKey: 'frequenceType',
                displayName: 'Frequency Type',
                fieldType: 'DROPDOWN',
                isRequired: true,
                isEditable: true,
                displayOrder: 10,
                icon: "/icons/project/Timeline Calnedr.svg",
                iconBg: "#C81C1F",
                options: {
                    choices: [
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly' },
                        { value: 'yearly', label: 'Yearly' }
                    ]
                }
            },
            // DAILY FREQUENCY CONFIGURATION
            {
                fieldKey: 'dailyConfig',
                displayName: 'Daily Configuration',
                fieldType: 'CUSTOM_DAILY',
                isRequired: false,
                isEditable: true,
                displayOrder: 11,
                condition: { field: 'frequenceType', value: 'daily' }
            },
            // WEEKLY FREQUENCY CONFIGURATION
            {
                fieldKey: 'weeklyConfig',
                displayName: 'Weekly Configuration',
                fieldType: 'CUSTOM_WEEKLY',
                isRequired: false,
                isEditable: true,
                displayOrder: 12,
                condition: { field: 'frequenceType', value: 'weekly' }
            },
            // MONTHLY FREQUENCY CONFIGURATION - Updated with day validation
            {
                fieldKey: 'monthlyConfig',
                displayName: 'Monthly Configuration',
                fieldType: 'CUSTOM_MONTHLY_VALIDATED',
                isRequired: false,
                isEditable: true,
                displayOrder: 13,
                condition: { field: 'frequenceType', value: 'monthly' }
            },
            // QUARTERLY FREQUENCY CONFIGURATION - Updated with day validation
            {
                fieldKey: 'quarterlyConfig',
                displayName: 'Quarterly Configuration',
                fieldType: 'CUSTOM_QUARTERLY_VALIDATED',
                isRequired: false,
                isEditable: true,
                displayOrder: 14,
                condition: { field: 'frequenceType', value: 'quarterly' }
            },
            // YEARLY FREQUENCY CONFIGURATION
            {
                fieldKey: 'yearlyConfig',
                displayName: 'Yearly Configuration',
                fieldType: 'CUSTOM_YEARLY',
                isRequired: false,
                isEditable: true,
                displayOrder: 15,
                condition: { field: 'frequenceType', value: 'yearly' }
            },
            {
                fieldKey: 'whenToStart',
                displayName: 'When to Start',
                fieldType: 'DATETIME',
                isRequired: true,
                isEditable: true,
                displayOrder: 16,
                icon: "/icons/project/Timeline Calnedr.svg",
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'untilDate',
                displayName: 'Repeat Until',
                fieldType: 'DATETIME',
                isRequired: false,
                isEditable: true,
                displayOrder: 17,
                icon: "/icons/project/Timeline Calnedr.svg",
                iconBg: "#C81C1F",
            },
        ];

        return baseFields.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }, [Repeattaskuser]);

    // Get current fields based on task type
    const currentTaskFields = useMemo(() => {
        return taskType === "regular" ? taskFields : repetitiveTaskFields;
    }, [taskType, taskFields, repetitiveTaskFields]);

    // Initial values for form
    const initialValues = useMemo(() => {
        const defaults: Record<string, unknown> = {
            progress: 0,
            isEnabled: true,
        };

        // Set initial values based on backend field definitions for regular tasks
        if (taskType === "regular" && taskMDMFields?.data) {
            (taskMDMFields.data as TaskField[]).forEach((field: TaskField) => {
                if (field.defaultValue !== undefined) {
                    defaults[field.fieldKey] = field.defaultValue;
                }
            });
        }

        return defaults;
    }, [taskMDMFields, taskType]);

    // In ProjectDetailPage.tsx - Update the repetitive task handler
    const [createRepetitiveTask] = useCreateRepeatTaskMutation();

    const handleCreateRepetitiveTask = async (values: Record<string, unknown>) => {
        if (!currentUser?.company?.id || !currentUser?.id) {
            throw new Error("User information not found");
        }

        console.log("Raw form values for repetitive task:", values);

        // Helper function to convert 12-hour time format to 24-hour format
        const convertTo24Hour = (timeStr: any): string => {
            if (!timeStr) return '01:00'; // Default time
            
            const timeString = String(timeStr).toLowerCase().trim();
            
            // If already in 24-hour format (no am/pm), return as-is
            if (!/am|pm/.test(timeString)) {
                return timeString;
            }
            
            // Extract hours, minutes, and am/pm
            const isPM = timeString.includes('pm');
            const isAM = timeString.includes('am');
            
            // Remove am/pm and any spaces
            const cleanTime = timeString.replace(/am|pm|\s/g, '');
            const [hoursStr, minutesStr] = cleanTime.split(':');
            
            let hours = parseInt(hoursStr) || 0;
            const minutes = minutesStr || '00';
            
            // Convert to 24-hour format
            if (isPM && hours !== 12) {
                hours += 12;
            } else if (isAM && hours === 12) {
                hours = 0;
            }
            
            // Return in HH:MM format
            return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        };

        // Transform assignedTo to assignedToId array
        const assignedToIds: string[] = [];
        if (values.assignedTo) {
            if (Array.isArray(values.assignedTo)) {
                values.assignedTo.forEach((user: any) => {
                    if (typeof user === 'object' && user !== null) {
                        if (user.value) assignedToIds.push(user.value);
                        else if (user.id) assignedToIds.push(user.id);
                    } else if (typeof user === 'string') {
                        assignedToIds.push(user);
                    }
                });
            }
        }

        // Handle Company Job Bucket (switch value)
        const companyJobBucket = Boolean(values.companyJobBucket);

        // Handle Estimate Time conversion to seconds
        let estimateTimeInSeconds = 3600; // Default 1 hour
        if (values.estimateTime && typeof values.estimateTime === 'object') {
            const estimate = values.estimateTime as { value: number; unit: string };
            switch (estimate.unit) {
                case 'minutes':
                    estimateTimeInSeconds = estimate.value * 60;
                    break;
                case 'hours':
                    estimateTimeInSeconds = estimate.value * 3600;
                    break;
                case 'days':
                    estimateTimeInSeconds = estimate.value * 86400;
                    break;
                default:
                    estimateTimeInSeconds = estimate.value || 3600;
            }
        }

        // Get repeatTaskType (FLEXIBLE/IMPORTANT)
        let repeatTaskType = '';
        if (values.repeatTaskType) {
            if (typeof values.repeatTaskType === 'object' && values.repeatTaskType !== null) {
                repeatTaskType = (values.repeatTaskType as { value?: string }).value || 'FLEXIBLE';
            } else {
                repeatTaskType = String(values.repeatTaskType);
            }
        } else {
            repeatTaskType = 'FLEXIBLE'; // default
        }

        // Get frequency schedule type (daily, weekly, monthly, etc.)
        let frequencyScheduleType = '';
        if (values.frequenceType) {
            if (typeof values.frequenceType === 'object' && values.frequenceType !== null) {
                frequencyScheduleType = (values.frequenceType as { value?: string }).value || 'daily';
            } else {
                frequencyScheduleType = String(values.frequenceType);
            }
        } else {
            frequencyScheduleType = 'daily'; // default
        }

        // Build frequency configuration based on frequencyScheduleType
        let frequencyConfig = {};
        const frequence = frequencyScheduleType.toUpperCase();
        console.log("frequence",frequence);
        switch (frequencyScheduleType.toLowerCase()) {
            case 'daily':
                frequencyConfig = {
                    frequence: frequence,
                    day: {
                        s:"sd",
                        days: (values as any)?.day?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        time: ((values as any)?.day?.time || '09:00')
                    }
                };
                break;
            case 'weekly':
                frequencyConfig = {
                    frequence: frequence,
                    week: {
                        day: values['week.day'] || 'monday',
                        time: (values['week.time'] || '09:00')
                    }
                };
                break;
            case 'monthly':
                frequencyConfig = {
                    frequence: frequence,
                    month: {
                        day: Math.min(28, Math.max(1, Number(values['month.day']) || 1)), // Ensure day is between 1-28
                        time: (values['month.time'] || '09:00')
                    }
                };
                break;
            case 'quarterly':
                frequencyConfig = {
                    frequence: frequence,
                    quartly: {
                        months: values['quartly.months'] || [1, 4, 7, 10],
                        day: Math.min(28, Math.max(1, Number(values['quartly.day']) || 1)), // Ensure day is between 1-28
                        time: (values['quartly.time'] || '09:00')
                    }
                };
                break;
            case 'yearly':
                frequencyConfig = {
                    frequence: frequence,
                    yearly: {
                        date: values['yearly.date'] ? new Date(values['yearly.date'] as string).toISOString().split('T')[0] : '2025-01-01',
                        time: (values['yearly.time'] || '09:00')
                    }
                };
                break;
            default:
                frequencyConfig = {
                    frequence: 'DAILY',
                    day: {
                        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        time: ('09:00')
                    }
                };
        }
        console.log("frequencyConfig",frequencyConfig)
        // Transform tags
        const tags: string[] = [];
        if (values.tags) {
            if (Array.isArray(values.tags)) {
                values.tags.forEach((tag: any) => {
                    if (typeof tag === 'object' && tag !== null) {
                        tags.push(tag.value || tag.label || String(tag));
                    } else {
                        tags.push(String(tag));
                    }
                });
            }
        }

        // Transform documents if present
        const documents: any[] = [];
        if (values.documents) {
            if (Array.isArray(values.documents)) {
                values.documents.forEach((doc: any) => {
                    if (typeof doc === 'object' && doc !== null) {
                        documents.push({
                            id: doc.id || String(doc),
                            name: doc.name || String(doc),
                            url: doc.url || ''
                        });
                    } else {
                        documents.push(String(doc));
                    }
                });
            }
        }

        // Transform dates
        const whenToStart = values.whenToStart ? new Date(values.whenToStart as string).toISOString() : new Date().toISOString();
        const untilDate = values.untilDate ? new Date(values.untilDate as string).toISOString() : undefined;

        const repetitiveTaskData = {
            taskName: String(values.taskName || ''),
            description: String(values.description || ''),
            priority: typeof values.priority === 'object' ? (values.priority as { value?: string }).value : String(values.priority || 'medium'),
            estimateTime: String(estimateTimeInSeconds), // Send in seconds
            companyJobBucket: companyJobBucket, // Send as boolean
            jobBucket: "reporting",
            assignedToId: assignedToIds,
            projectId: projectId,
            tags: tags,
            documents: documents.length > 0 ? documents : [],
            frequenceType: repeatTaskType, // This should be FLEXIBLE or IMPORTANT
            ...frequencyConfig,
            whenToStart: whenToStart,
            untilDate: untilDate,
            isEnabled: values.isEnabled !== false,
        };

        console.log("Transformed repetitive task data:", repetitiveTaskData);

        try {
            const result = await createRepetitiveTask({
                companyId: currentUser.company.id,
                userId: currentUser.id,
                repetitiveTaskData
            }).unwrap();

            toast.success("Repetitive task created successfully!");
            setOpen(false);
            setIsEditMode(false);
            setEditTask(null);
            setTaskType("regular");
            return result;
        } catch (error: unknown) {
            console.error("Failed to create repetitive task:", error);

            if (error && typeof error === 'object' && 'data' in error) {
                console.error('Error details:', error.data);
            }

            throw new Error((error as { data?: { message?: string } })?.data?.message || "Failed to create repetitive task");
        }
    };

    const handleFormSubmit = async (values: Record<string, unknown>) => {
        try {
            console.log("Form submitted with values:", values);

            if (userLoading) {
                return;
            }
            console.log("tasktype", taskType);
            if (taskType === "repetitive") {
                console.log("values", values);
                await handleCreateRepetitiveTask(values);
                return;
            }

            const transformedValues: Record<string, unknown> = {};

            // Validate required fields
            if (!values.taskName || !(values.taskName as string).trim()) {
                throw new Error("Task name is required");
            }

            // FIX: Use subtaskName for subtasks, taskName for regular tasks
            const isSubtask = editTask?.isSubtask || false;

            if (isSubtask) {
                transformedValues.subtaskName = (values.taskName as string).trim();
            } else {
                transformedValues.taskName = (values.taskName as string).trim();
            }

            // Map description
            if (values.description) {
                transformedValues.description = values.description;
            }

            // Handle status field transformation
            if (values.status) {
                if (typeof values.status === 'object' && (values.status as { value: string }).value) {
                    transformedValues.status = (values.status as { value: string }).value;
                } else {
                    transformedValues.status = values.status;
                }
            }

            // Handle priority field transformation
            if (values.priority) {
                if (typeof values.priority === 'object' && (values.priority as { value: string }).value) {
                    transformedValues.priority = (values.priority as { value: string }).value;
                } else {
                    transformedValues.priority = values.priority;
                }
            }

            // Handle dates
            if (values.startDate) {
                const startDate = new Date(values.startDate as string);
                if (isNaN(startDate.getTime())) {
                    throw new Error("Invalid start date provided");
                }
                transformedValues.startDate = values.startDate;
            }

            if (values.endDate) {
                const endDate = new Date(values.endDate as string);
                if (isNaN(endDate.getTime())) {
                    throw new Error("Invalid end date provided");
                }
                transformedValues.endDate = values.endDate;
            }

            // Handle timeline transformation
            if (values.timeLine && typeof values.timeLine === 'object') {
                const timelineObj = values.timeLine as { start: string; end: string };
                const timelineArray: string[] = [];
                if (timelineObj.start) {
                    timelineArray.push(timelineObj.start);
                }
                if (timelineObj.end) {
                    timelineArray.push(timelineObj.end);
                }
                if (timelineArray.length > 0) {
                    transformedValues.timeLine = timelineArray;
                }
            }

            // Handle taskType - FIX: Use subtaskType for subtasks
            if (values.taskType) {
                let taskTypeValue = values.taskType;
                if (Array.isArray(taskTypeValue)) {
                    taskTypeValue = taskTypeValue[0];
                }
                if (typeof taskTypeValue === 'object' && taskTypeValue !== null) {
                    taskTypeValue = (taskTypeValue as { value: string }).value;
                }

                if (isSubtask) {
                    transformedValues.subtaskType = String(taskTypeValue);
                } else {
                    transformedValues.taskType = String(taskTypeValue);
                }
            }

            // Handle assignedTo -> assignedToId transformation
            if (values.assignedTo) {
                let assignedToIds: string[] = [];

                if (Array.isArray(values.assignedTo)) {
                    assignedToIds = (values.assignedTo as any[]).map((member) => {
                        if (typeof member === 'object' && member !== null) {
                            return member.id || member.value || member;
                        }
                        return member;
                    }).filter(Boolean);
                } else {
                    assignedToIds = [values.assignedTo as string];
                }

                transformedValues.assignedToId = assignedToIds;
            }

            // Handle assignedBy -> assignedById transformation
            if (values.assignedBy) {
                let assignedByIds: string[] = [];

                if (Array.isArray(values.assignedBy)) {
                    assignedByIds = (values.assignedBy as any[]).map((assigner) => {
                        if (typeof assigner === 'object' && assigner !== null) {
                            return assigner.id || assigner.value || assigner;
                        }
                        return assigner;
                    }).filter(Boolean);
                } else {
                    assignedByIds = [values.assignedBy as string];
                }

                transformedValues.assignedById = assignedByIds.length > 0 ? assignedByIds[0] : null;
            }

            // Handle tags - FIXED: Convert objects to strings
            if (values.tags) {
                if (Array.isArray(values.tags)) {
                    transformedValues.tags = values.tags.map((tag: any) => {
                        if (typeof tag === 'object' && tag !== null) {
                            return tag.value || tag.label || String(tag);
                        }
                        return String(tag);
                    });
                } else {
                    transformedValues.tags = [(values.tags as string)];
                }
            }

            // Set and validate progress
            const progress = Number(values.progress) || 0;
            if (progress < 0 || progress > 100) {
                throw new Error("Progress must be between 0 and 100");
            }
            transformedValues.progress = progress;

            // Handle estimationTime - pass through as-is (backend handles both formats)
            if (values.estimationTime !== undefined && values.estimationTime !== null) {
                transformedValues.estimationTime = values.estimationTime;
            }

            // Handle companyJobBucket - only for tasks, not subtasks
            if (!isSubtask && values.companyJobBucket !== undefined) {
                transformedValues.companyJobBucket = Boolean(values.companyJobBucket);
            }

            // Add project ID and required user fields
            transformedValues.projectId = projectId;

            if (!currentUser?.company?.id) {
                throw new Error("Company information not found. Please ensure you're logged in.");
            }
            if (!currentUser?.id) {
                throw new Error("User information not found. Please ensure you're logged in.");
            }

            transformedValues.companyId = currentUser.company.id;
            transformedValues.createdById = currentUser.id;

            // Remove any fields that shouldn't be sent to the backend
            delete transformedValues.assignedTo;
            delete transformedValues.assignedBy;

            console.log("Transformed values for API:", transformedValues);
            console.log("Is subtask:", isSubtask);

            if (isEditMode && editTask?.id) {
                if (isSubtask) {
                    // Update subtask using updateSubtask mutation
                    console.log("Updating subtask with ID:", editTask.id);
                    await updateSubtask({
                        id: editTask.id,
                        updateData: transformedValues,
                        taskId: editTask.taskId || (editTask as any).taskId // 🔥 Pass taskId to refetch parent task
                    }).unwrap();
                    await refetchTasks();
                    toast.success("Subtask updated successfully!");
                } else {
                    // Update regular task
                    await updateTask({
                        id: editTask.id,
                        updateData: transformedValues
                    }).unwrap();
                    toast.success("Task updated successfully!");
                }
            } else {
                // Create new task (regular task creation)
                await createTask(transformedValues).unwrap();
                toast.success("Task created successfully!");
            }

            setOpen(false);
            setIsEditMode(false);
            setEditTask(null);
            setTaskType("regular");
        } catch (error: unknown) {
            console.error("Failed to save task:", error);

            let errorMessage = "An unexpected error occurred. Please try again.";

            if (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
                errorMessage = (error.data as { message: string }).message;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = (error as { message: string }).message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toast.error(errorMessage);
        }
    };

    const handleEditTaskFromRow = (taskData: any) => {
        if (!taskData) {
            toast.error("Task data not available");
            return;
        }

        console.log("Editing task:", taskData);
        console.log("Is subtask?", taskData.isSubtask);

        // Check if this is a subtask
        const isSubtask = taskData.isSubtask || false;

        // Define types for tag transformation
        type FormTag = {
            value: string;
            label: string;
            color: string;
        };

        // Get task MDM fields to find available options for taskType
        const taskTypeOptions = taskFields.find(field => field.fieldKey === 'taskType')?.options?.choices || [];
        const statusOptions = taskFields.find(field => field.fieldKey === 'status')?.options?.choices || [];
        const priorityOptions = taskFields.find(field => field.fieldKey === 'priority')?.options?.choices || [];

        console.log("Available taskType options:", taskTypeOptions);
        console.log("Available status options:", statusOptions);
        console.log("Available priority options:", priorityOptions);

        // Helper function to find matching option from available choices
        const findMatchingOption = (value: string, options: any[]) => {
            if (!value) return null;

            // First try exact match with value
            const exactMatch = options.find(opt =>
                (typeof opt === 'object' ? opt.value : opt) === value
            );
            if (exactMatch) {
                return typeof exactMatch === 'object'
                    ? { value: exactMatch.value, label: exactMatch.label }
                    : { value: exactMatch, label: exactMatch };
            }

            // Then try case-insensitive match with label
            const caseInsensitiveMatch = options.find(opt => {
                const label = typeof opt === 'object' ? opt.label : opt;
                return label && String(label).toLowerCase() === String(value).toLowerCase();
            });
            if (caseInsensitiveMatch) {
                return typeof caseInsensitiveMatch === 'object'
                    ? { value: caseInsensitiveMatch.value, label: caseInsensitiveMatch.label }
                    : { value: caseInsensitiveMatch, label: caseInsensitiveMatch };
            }

            // If no match found, create a basic object
            return {
                value: String(value).toLowerCase(),
                label: String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase()
            };
        };

        // Transform the task data to match form field expectations
        const transformedData: any = {
            ...taskData,
            taskName: taskData.taskName || '',
            description: taskData.description || '',

            // Handle timeline data if it exists
            timeLine: taskData.timeLine ? (
                Array.isArray(taskData.timeLine)
                    ? {
                        start: taskData.timeLine[0] || '',
                        end: taskData.timeLine[1] || ''
                    }
                    : typeof taskData.timeLine === 'object' && ((taskData.timeLine as any).start || (taskData.timeLine as any).end)
                        ? {
                            start: (taskData.timeLine as any).start || '',
                            end: (taskData.timeLine as any).end || ''
                        }
                        : undefined
            ) : undefined,

            // Handle status - FIXED: Use available options to find correct format
            status: (() => {
                const statusValue = taskData.status;
                if (!statusValue) return '';

                // For string values like "todo", find matching option
                if (typeof statusValue === 'string') {
                    return findMatchingOption(statusValue, statusOptions) || {
                        value: statusValue.toLowerCase(),
                        label: statusValue.charAt(0).toUpperCase() + statusValue.slice(1).toLowerCase()
                    };
                }

                // For object values, use as-is
                if (typeof statusValue === 'object' && statusValue !== null) {
                    return {
                        value: (statusValue as any).value || String(statusValue),
                        label: (statusValue as any).label || (statusValue as any).displayName || String(statusValue)
                    };
                }

                return '';
            })(),

            // Handle priority - FIXED: Use available options to find correct format
            priority: (() => {
                const priorityValue = taskData.priority;
                if (!priorityValue) return '';

                // For string values like "low", find matching option
                if (typeof priorityValue === 'string') {
                    return findMatchingOption(priorityValue, priorityOptions) || {
                        value: priorityValue.toLowerCase(),
                        label: priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1).toLowerCase()
                    };
                }

                // For object values, use as-is
                if (typeof priorityValue === 'object' && priorityValue !== null) {
                    return {
                        value: (priorityValue as any).value || String(priorityValue),
                        label: (priorityValue as any).label || (priorityValue as any).displayName || String(priorityValue)
                    };
                }

                return '';
            })(),


            taskType: (() => {
                // For subtasks, use subtaskType field
                const taskTypeValue = isSubtask ? taskData.subtaskType : taskData.taskType;
                console.log("Raw taskType value for editing:", taskTypeValue, "isSubtask:", isSubtask);

                if (!taskTypeValue) return '';

                // If it's already an object with value/label, use as-is
                if (typeof taskTypeValue === 'object' && taskTypeValue !== null) {
                    const result = {
                        value: (taskTypeValue as any).value || (taskTypeValue as any).id || String(taskTypeValue),
                        label: (taskTypeValue as any).label || (taskTypeValue as any).displayName || String(taskTypeValue)
                    };
                    console.log("Object taskType result:", result);
                    return result;
                }

                // For string values like "development", create simple object
                const result = {
                    value: String(taskTypeValue).toLowerCase(),
                    label: String(taskTypeValue).charAt(0).toUpperCase() + String(taskTypeValue).slice(1).toLowerCase()
                };
                console.log("String taskType result:", result);
                return result;
            })(),

            // Handle estimationTime transformation - FIXED: Proper handling
            estimationTime: (() => {
                const estTime = taskData.estimationTime;
                console.log("Raw estimationTime:", estTime, "Type:", typeof estTime);

                if (estTime === undefined || estTime === null) return null;

                // If it's already in the object format {value, unit}, use as-is
                if (typeof estTime === 'object' && estTime !== null && 'value' in estTime && 'unit' in estTime) {
                    return estTime;
                }

                // If it's a number (seconds), convert to hours object
                if (typeof estTime === 'number') {
                    const hours = estTime / 3600; // Convert seconds to hours
                    return {
                        value: hours,
                        unit: 'hours'
                    };
                }

                // If it's a string, try to parse it
                if (typeof estTime === 'string') {
                    try {
                        const numValue = parseInt(estTime, 10);
                        if (!isNaN(numValue)) {
                            const hours = numValue / 3600;
                            return {
                                value: hours,
                                unit: 'hours'
                            };
                        }
                    } catch (error) {
                        console.error('Error parsing estimationTime string:', error);
                    }
                }

                return null;
            })(),

            // Handle tags - FIXED: Properly handle malformed tags
            tags: ((): FormTag[] => {
                if (!Array.isArray(taskData.tags)) return [];

                return taskData.tags.map((tag: any) => {
                    // Handle the case where tag is "[object object]" string
                    if (typeof tag === 'string' && tag === '[object object]') {
                        return {
                            value: 'unknown',
                            label: 'Unknown',
                            color: '#D9D9D980'
                        };
                    }

                    if (typeof tag === 'object' && tag !== null) {
                        const tagObj = tag as Record<string, unknown>;
                        return {
                            value: String(tagObj.value || tagObj.label || tag),
                            label: String(tagObj.label || tagObj.value || tag),
                            color: String(tagObj.color || '#D9D9D980')
                        };
                    }

                    // Handle regular string tags
                    return {
                        value: String(tag),
                        label: String(tag),
                        color: '#D9D9D980'
                    };
                });
            })(),

            // Handle estimationTime transformation
            // estimationTime: taskData.estimationTime !== undefined ? taskData.estimationTime : null,


            // FIX: Map assignedTo from API response to form field
            assignedTo: (() => {
                // Use assignedTo from API response which contains user objects
                const assignedUsers = Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [];

                return assignedUsers.map((member: any) => {
                    if (!member) return null;

                    const id = member.id || member.userId || member.value;
                    const firstName = member.firstName || member.first_name || (member.name ? String(member.name).split(' ')[0] : '') || '';
                    const lastName = member.lastName || member.last_name || (member.name ? String(member.name).split(' ').slice(1).join(' ') : '') || '';
                    const label = member.label || `${firstName} ${lastName}`.trim() || String(id);

                    return {
                        id: id,
                        value: id,
                        label: label,
                        firstName: firstName,
                        lastName: lastName,
                        role: member.role || 'Team Member',
                        avatar: member.avatar
                    };
                }).filter(Boolean);
            })(),

            // FIX: Map assignedBy from API response to form field
            assignedBy: (() => {
                // Use assignedBy from API response which contains user objects
                const assignedByUsers = Array.isArray(taskData.assignedBy) ? taskData.assignedBy : [];

                return assignedByUsers.map((assigner: any) => {
                    if (!assigner) return null;

                    const id = assigner.id || assigner.userId || assigner.value;
                    const firstName = assigner.firstName || assigner.first_name || (assigner.name ? String(assigner.name).split(' ')[0] : '') || '';
                    const lastName = assigner.lastName || assigner.last_name || (assigner.name ? String(assigner.name).split(' ').slice(1).join(' ') : '') || '';
                    const label = assigner.label || `${firstName} ${lastName}`.trim() || String(id);

                    return {
                        id: id,
                        value: id,
                        label: label,
                        firstName: firstName,
                        lastName: lastName,
                        role: assigner.role || 'Assigner',
                        avatar: assigner.avatar
                    };
                }).filter(Boolean);
            })(),

            // Handle progress
            progress: typeof taskData.progress === 'number' ? taskData.progress : 0,

            // Handle dates - ensure they're in the right format
            startDate: taskData.startDate || '',
            endDate: taskData.endDate || '',
        };

        console.log("Transformed task data for editing:", transformedData);
        console.log("TaskType in transformed data:", transformedData.taskType);

        setEditTask(transformedData);
        setIsEditMode(true);
        setTaskType("regular");
        setOpen(true);

        // Set related item with proper type for subtasks
        setRelatedItem({
            type: isSubtask ? "subtask" as const : "task" as const,
            taskId: isSubtask ? (taskData as any).parentTaskId : taskData.id, // For subtasks, use parent task ID
            subTaskId: isSubtask ? taskData.id : undefined, // For subtasks, include subtask ID
            taskName: taskData.taskName,
            projectId: projectId,
            projectName: projectData?.data?.name || projectData?.data?.projectName,
        });
    };
    const watchTaskType = () => {
        // This will be implemented when we have form context
        return taskType; // Fallback to the state for now
    };
    // Open create modal - always default to regular
    const openCreateModal = (type: "regular" | "repetitive" = "regular") => {
        console.log("Opening create modal for:", type);

        if (!currentUser?.company?.id) {
            toast.error("Unable to create task. Please refresh the page and try again.");
            return;
        }

        setEditTask(initialValues as unknown as TaskDataExtended);
        setIsEditMode(false);
        setTaskType(type); // This will be "regular" by default
        setOpen(true);
        console.log("Modal state set to open");
    };

    // Modal close handler
    const handleModalClose = () => {
        setOpen(false);
        setIsEditMode(false);
        setEditTask(null);
        setTaskType("regular");
        setActiveTab("overview");
    };

    const getModalTitle = () => {
        // Check if we're editing a subtask
        const isSubtask = editTask?.isSubtask || (editTask && 'isSubtask' in editTask && editTask.isSubtask);

        if (selectedParentTaskId) {
            return isEditMode ? "Edit Subtask" : "Create Subtask";
        }

        // Check if editing existing subtask
        if (isEditMode && isSubtask) {
            return "Edit Subtask";
        }

        const taskTypeLabel = taskType === "regular" ? "Regular Task" : "Repetitive Task";
        return isEditMode ? `Edit ${taskTypeLabel}` : `Create ${taskTypeLabel}`;
    };

    // Memoize tabs so they are not recomputed on every re-render (e.g. timer ticks)
    const filteredTabs = useMemo(() => {
        const isCreateMode = !isEditMode && !editTask?.id;
        const isSubtask = editTask?.isSubtask || (editTask && 'isSubtask' in editTask && editTask.isSubtask);

        // Useful during development only; avoid spamming console during runtime
        if (process.env.NODE_ENV === 'development') {
            console.debug("getFilteredTabs - isEditMode:", isEditMode);
            console.debug("getFilteredTabs - editTask:", editTask);
            console.debug("getFilteredTabs - isSubtask:", isSubtask);
            console.debug("getFilteredTabs - isCreateMode:", isCreateMode);
        }

        return [
            {
                key: "overview",
                label: "Overview",
                icon: search,
                component: OverviewTabContent as React.ComponentType<unknown>,
                componentProps: {
                    formFields: taskFields
                        // Filter out companyJobBucket field for subtasks
                        .filter(field => {
                            if (isSubtask && field.fieldKey === 'companyJobBucket') {
                                return false; // Exclude companyJobBucket for subtasks
                            }
                            return true;
                        })
                        .map(field => ({
                            ...field,
                            isTaskField: true, // Mark as task field for proper API routing
                        })),
                    repetitiveTaskFields: repetitiveTaskFields.map(field => ({
                        ...field,
                        isTaskField: true, // Mark repetitive task fields as task fields
                    })),
                    onSubmit: handleFormSubmit,
                    isEditMode,
                    initialValues: editTask || initialValues,
                    userRole: "admin",
                    className: "h-full",
                    mdmId: taskMDMInfo?.data?.id, // Pass task MDM ID, not project MDM ID
                    relatedItem: isEditMode && editTask ? {
                        type: isSubtask ? "subtask" as const : "task" as const,
                        taskId: isSubtask ? selectedParentTaskId : editTask.id,
                        subTaskId: isSubtask ? editTask.id : undefined,
                        taskName: editTask.taskName,
                        projectId: projectId,
                        projectName: projectData?.data?.name || projectData?.data?.projectName,
                    } : isCreateMode ? undefined : {
                        type: "task" as const,
                        projectId: projectId,
                        projectName: projectData?.data?.name || projectData?.data?.projectName,
                    },
                    taskType: taskType,
                    onTaskTypeChange: setTaskType,
                    isTaskForm: true,
                    watch: () => taskType,
                },
                disabled: false, // Keep Overview tab enabled but handle create mode internally
                tooltip: isCreateMode ? "Fill out the form and save to enable activities" : ""
            },
            {
                key: "updates",
                label: "Updates",
                icon: home,
                component: UpdatesTabContent as React.ComponentType<unknown>,
                componentProps: {
                    className: "h-[95vh]",
                    projectId: projectId,
                    ...(isEditMode && editTask && {
                        relatedItem: {
                            type: isSubtask ? "subtask" as const : "task" as const,
                            taskId: isSubtask ? selectedParentTaskId : editTask.id,
                            subTaskId: isSubtask ? editTask.id : undefined,
                            projectId: projectId,
                            projectName: projectData?.data?.name || projectData?.data?.projectName,
                        }
                    }),
                },
                disabled: isCreateMode,
                tooltip: isCreateMode ? "Save the task first to add updates" : ""
            },
            {
                key: "files/links",
                label: "Files / Links",
                icon: update,
                component: FilesLinksTabContent as React.ComponentType<unknown>,
                componentProps: {
                    className: "h-[95vh] overflow-y-auto",
                    taskId: isEditMode && editTask?.id ? editTask.id : undefined,
                },
                disabled: isCreateMode,
                tooltip: isCreateMode ? "Save the task first to add files and links" : ""
            },
        ];
    }, [
        isEditMode,
        editTask?.id,
        editTask?.isSubtask,
        selectedParentTaskId,
        taskType,
        taskFields,
        repetitiveTaskFields,
        initialValues,
        taskMDMInfo?.data?.id,
        projectData?.data?.name,
        projectId,
    ]);


    // Task cell renderer
    const getTaskCellRenderer = useCallback(({
        field,
        row,
        value,
        rowIndex,
        isSubtask,
        level,
    }: {
        field: FieldDefinition;
        row: TaskData;
        value: any;
        rowIndex: number;
        isSubtask: boolean;
        level: number;
    }) => {
        const mdmField = Array.isArray(taskMDMFields?.data) ? (taskMDMFields.data as TaskField[]).find((f: TaskField) => f.fieldKey === field.fieldKey) : null;
        if (field.fieldKey === 'updates' || field.fieldKey === 'lastUpdate') {
            const isSubtask = Boolean((row as any).isSubtask || (row as any)._isSubtask);

            // value might be the updates array or fallback to row.updates
            const updatesArray = Array.isArray(value)
                ? value
                : Array.isArray((row as any).updates)
                    ? (row as any).updates
                    : [];

            // For subtasks sometimes updates might be nested differently,
            // but prefer row.updates if present. If none, show empty.
            const lastUpdate = updatesArray.length ? updatesArray[updatesArray.length - 1] : null;

            const rawNotes = lastUpdate?.updateNotes ?? lastUpdate?.updateNotesHtml ?? null;
            const authorName = lastUpdate?.createdBy?.firstName || lastUpdate?.createdBy?.name || lastUpdate?.createdBy?.displayName || '';
            const createdAt = lastUpdate?.createdAt || lastUpdate?.created_at || lastUpdate?.createdOn || null;

            // Strip HTML tags to show plain text
            const plainText = rawNotes && typeof rawNotes === 'string'
                ? rawNotes.replace(/<[^>]*>/g, '').trim()
                : '';

            // Optionally truncate for table display
            const displayText = plainText
                ? (plainText.length > 200 ? `${plainText.slice(0, 197)}...` : plainText)
                : (lastUpdate ? '[No notes]' : '-');

            // Format timestamp if available
            let timeLabel = '';
            if (createdAt) {
                try {
                    timeLabel = DateTime.fromISO(String(createdAt)).toFormat('MMM dd, yyyy hh:mm a');
                } catch {
                    timeLabel = String(createdAt);
                }
            }

            return (
                <div
                    className="text-sm break-words cursor-pointer"
                    title={plainText || (lastUpdate ? '[No notes]' : '-')}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Ensure subtask flag is preserved by passing the full row through
                        handleEditTaskFromRow(row as unknown as TaskDataExtended);
                        setActiveTab('updates');
                    }}
                >
                    <div className="font-medium text-gray-800">{displayText}</div>
                    {lastUpdate && (
                        <div className="text-xs text-gray-500 mt-1">
                            {authorName ? `${authorName}` : 'Unknown'}{timeLabel ? ` • ${timeLabel}` : ''}
                            {isSubtask ? ' • Subtask' : ''}
                        </div>
                    )}
                </div>
            );
        }
        if (field.fieldKey === 'taskId' && typeof value === 'string') {
            const taskId = row?.id;
            const isSubtask = row._isSubtask || false;
            const level = row._level || 0;

            // Calculate indentation for subtasks
            const indentation = level * 28; // Match your indentationSize

            return (
                <div
                    className="flex items-center gap-1 w-full"
                // style={{ paddingLeft: isSubtask ? `${indentation}px` : '0' }}
                >
                    {/* Task ID Text */}
                    <div
                        className="flex-1 cursor-pointer text-sm font-semibold underline text-[#c81c1f] border-r-[1px] border-[#d8d8d8] pr-3"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (taskId) {
                                console.log("Navigate to task:", taskId);
                            }
                        }}
                    >
                        {value}
                    </div>

                    {/* Pager Icon - Consistent size for both tasks and subtasks */}
                    <div
                        className="px-4 cursor-pointer flex items-center justify-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTaskFromRow(row as unknown as TaskDataExtended);
                        }}
                        style={{
                            minHeight: '32px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Image
                            src={PagerIcon}
                            alt="Pager Icon"
                            width={18}
                            height={18}
                            className="flex-shrink-0"
                        />
                    </div>
                </div>
            );
        }
        if (field.fieldKey === 'taskName') {
            const isEditing = editingTaskId === row.id;

            if (isEditing) {
                return (
                    <div className="flex gap-2 items-center w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editingTaskName}
                            onChange={(e) => setEditingTaskName(e.target.value)}
                            onBlur={async () => {
                                if (editingTaskName.trim() && editingTaskName !== value) {
                                    try {
                                        // Use subtask API if it's a subtask, otherwise use task API
                                        if (isSubtask) {
                                            await updateSubtaskName({
                                                id: row.id,
                                                subtaskName: editingTaskName.trim(),
                                                taskId: row.taskId || (row as any).taskId // 🔥 Pass taskId to refetch parent task
                                            }).unwrap();
                                            await refetchTasks();
                                        } else {
                                            await updateTaskName({
                                                id: row.id,
                                                taskName: editingTaskName.trim()
                                            }).unwrap();
                                        }
                                        toast.success('Name updated');
                                        setEditingTaskId(null);
                                    } catch (error) {
                                        console.error('Failed to update name:', error);
                                        toast.error('Failed to update name');
                                        setEditingTaskName(value);
                                        setEditingTaskId(null);
                                    }
                                } else {
                                    setEditingTaskId(null);
                                    setEditingTaskName("");
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                } else if (e.key === 'Escape') {
                                    setEditingTaskId(null);
                                    setEditingTaskName("");
                                }
                            }}
                            className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                            autoFocus
                        />
                    </div>
                );
            }

            return (
                <div
                    className="font-medium text-start cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                        setEditingTaskId(row.id as string);
                        setEditingTaskName(value);
                    }}
                    title="Double click to edit"
                >
                    {value}
                </div>
            );
        }

        if (field.fieldKey === 'taskTree') {
            const isExpanded = taskExpandedIds.includes(row.id);
            const hasSubtasks = Array.isArray(row.subtasks) && row.subtasks.length > 0;
            const level = row._level || 0;
            const isSubtask = row._isSubtask || false;

            // Calculate indentation for hierarchy
            const indentation = level * 28;

            return (
                <div
                    className="flex items-center gap-2"
                    style={{
                        minWidth: 36,
                        paddingLeft: `${indentation}px`,
                        minHeight: '32px' // Consistent height
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Show infinity icon only for subtasks */}
                    {isSubtask && (
                        <Image
                            src={infinityIcon}
                            alt="Subtask"
                            width={16}
                            height={16}
                            className="flex-shrink-0"
                            title="Subtask"
                        />
                    )}

                    {/* Expand/Collapse button for tasks with subtasks */}
                    {/* {hasSubtasks && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(String(row.id));
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                        >
                            {isExpanded ? (
                                <MdOutlineKeyboardArrowDown size={18} />
                            ) : (
                                <MdOutlineKeyboardArrowRight size={18} />
                            )}
                        </button>
                    )} */}

                    {/* Add Subtask button - only for parent tasks */}
                    {!isSubtask && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSubtaskModal(String(row.id));
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title="Add subtask"
                        >
                            <GrFormAdd size={18} />
                        </button>
                    )}

                    {/* Spacer for tasks without expand/collapse or add buttons */}
                    {!hasSubtasks && !isSubtask && (
                        <div className="w-9 flex-shrink-0"></div> // Match the width of buttons
                    )}

                    {/* Additional spacer for subtasks without buttons */}
                    {isSubtask && !hasSubtasks && (
                        <div className="w-7 flex-shrink-0"></div> // Match infinity icon width + gap
                    )}
                </div>
            );
        }

        if (field.fieldKey === 'status') {
            const choices = (mdmField?.options as any) ?? [];
            const options = choices.map((c: any) => ({
                fieldKey: String(c.value || c),
                displayName: c.label ?? String(c.value || c),
                color: c.color ?? '#6b7280',
            }));

            let currentKey = '';
            if (value && typeof value === 'object' && (value as any).value) {
                currentKey = String((value as any).value);
            } else {
                const raw = String(value ?? '').toLowerCase();
                const matched = options.find((o: any) => o.fieldKey === raw) || options.find((o: any) => o.displayName.toLowerCase() === raw);
                currentKey = matched ? matched.fieldKey : raw;
            }

            const mdmId = taskMDMInfo?.data?.id;

            return (
                <StatusDropdown
                    currentStatus={currentKey}
                    options={options}
                    onStatusChange={async (newKey: string) => {
                        try {
                            // Use subtask API if it's a subtask, otherwise use task API
                            if (isSubtask) {
                                await updateSubtaskStatus({
                                    id: row.id,
                                    status: newKey,
                                    taskId: row.taskId || (row as any).taskId // 🔥 Pass taskId to refetch parent task
                                }).unwrap();
                            } else {
                                await updateTaskStatus({
                                    id: row.id,
                                    status: newKey
                                }).unwrap();
                            }
                            toast.success(`Status updated to ${newKey}`);
                        } catch (error) {
                            console.error('Failed to update status:', error);
                            toast.error('Failed to update status');
                        }
                    }}
                    onUpdateOption={async (fieldKey: string, updates: any) => {
                        if (!mdmId) {
                            toast.error('MDM information not available');
                            return;
                        }
                        try {
                            await updateTaskStatusOption({
                                id: mdmId,
                                fieldKey: 'status',
                                option: {
                                    value: fieldKey,
                                    label: updates.displayName,
                                    color: updates.color
                                }
                            }).unwrap();
                            toast.success(`Option updated: ${updates.displayName}`);
                        } catch (error) {
                            console.error('Failed to update status option:', error);
                            toast.error('Failed to update option');
                        }
                    }}
                    onAddOption={async (option: any) => {
                        if (!mdmId) {
                            toast.error('MDM information not available');
                            return;
                        }
                        try {
                            await createTaskStatusOption({
                                id: mdmId,
                                fieldKey: 'status',
                                option: {
                                    label: option.displayName,
                                    value: option.displayName.toLowerCase().replace(/\s+/g, '_'),
                                    color: option.color
                                }
                            }).unwrap();
                            toast.success(`Added new option: ${option.displayName}`);
                        } catch (error) {
                            console.error('Failed to add status option:', error);
                            toast.error('Failed to add option');
                        }
                    }}
                    onDeleteOption={async (fieldKey: string) => {
                        if (!mdmId) {
                            toast.error('MDM information not available');
                            return;
                        }
                        try {
                            await deleteTaskStatusOption({
                                id: mdmId,
                                fieldKey: 'status',
                                option: fieldKey
                            }).unwrap();
                            toast.success('Option deleted');
                        } catch (error) {
                            console.error('Failed to delete status option:', error);
                            toast.error('Failed to delete option');
                        }
                    }}
                    onReorderOptions={async (ordered: any[]) => {
                        toast.success('Options reordered');
                    }}
                    disabled={tasksLoading}
                    className="w-fit! rounded-lg! h-[21px]!"
                />
            );
        }

        if (field.fieldKey === 'priority') {
            const choices = (mdmField?.options as any) ?? [];
            const options = choices.map((c: any) => ({
                fieldKey: String(c.value || c),
                displayName: c.label ?? String(c.value || c),
                color: c.color ?? '#6b7280',
            }));

            let currentKey = '';
            if (value && typeof value === 'object' && (value as any).value) {
                currentKey = String((value as any).value);
            } else {
                const raw = String(value ?? '').toLowerCase();
                const matched = options.find((o: any) => o.fieldKey === raw) || options.find((o: any) => o.displayName.toLowerCase() === raw);
                currentKey = matched ? matched.fieldKey : raw;
            }

            const mdmId = taskMDMInfo?.data?.id;

            return (
                <StatusDropdown
                    currentStatus={currentKey}
                    options={options}
                    onStatusChange={async (newKey: string) => {
                        try {
                            // Use subtask API if it's a subtask, otherwise use task API
                            if (isSubtask) {
                                await updateSubtaskPriority({
                                    id: row.id,
                                    priority: newKey,
                                    taskId: row.taskId || (row as any).taskId // 🔥 Pass taskId to refetch parent task
                                }).unwrap();
                            } else {
                                await updateTaskPriority({
                                    id: row.id,
                                    priority: newKey
                                }).unwrap();
                            }
                            toast.success(`Priority updated to ${newKey}`);
                        } catch (error) {
                            console.error('Failed to update priority:', error);
                            toast.error('Failed to update priority');
                        }
                    }}
                    onUpdateOption={async (fieldKey: string, updates: any) => {
                        if (!mdmId) {
                            toast.error('MDM information not available');
                            return;
                        }
                        try {
                            await updateTaskPriorityOption({
                                id: mdmId,
                                fieldKey: 'priority',
                                option: {
                                    value: fieldKey,
                                    label: updates.displayName,
                                    color: updates.color
                                }
                            }).unwrap();
                            toast.success(`Option updated: ${updates.displayName}`);
                        } catch (error) {
                            console.error('Failed to update priority option:', error);
                            toast.error('Failed to update option');
                        }
                    }}
                    onAddOption={async (option: any) => {
                        if (!mdmId) {
                            toast.error('MDM information not available');
                            return;
                        }
                        try {
                            await createTaskPriorityOption({
                                id: mdmId,
                                fieldKey: 'priority',
                                option: {
                                    label: option.displayName,
                                    value: option.displayName.toLowerCase().replace(/\s+/g, '_'),
                                    color: option.color
                                }
                            }).unwrap();
                            toast.success(`Added new option: ${option.displayName}`);
                        } catch (error) {
                            console.error('Failed to add priority option:', error);
                            toast.error('Failed to add option');
                        }
                    }}
                    onDeleteOption={async (fieldKey: string) => {
                        if (!mdmId) {
                            toast.error('MDM information not available');
                            return;
                        }
                        try {
                            await deleteTaskPriorityOption({
                                id: mdmId,
                                fieldKey: 'priority',
                                option: fieldKey
                            }).unwrap();
                            toast.success('Option deleted');
                        } catch (error) {
                            console.error('Failed to delete priority option:', error);
                            toast.error('Failed to delete option');
                        }
                    }}
                    onReorderOptions={async (ordered: any[]) => {
                        toast.success('Options reordered');
                    }}
                    disabled={tasksLoading}
                    className="w-fit! rounded-lg! h-[21px]!"
                />
            );
        }

        // ASSIGNEDTO FIELD - Using AssignedToSelector component with multiple avatars
        // Works for both tasks and subtasks
        if (field.fieldKey === 'assignedTo') {
            const renderAssigneeAvatar = (user: any) => {
                const initial = user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || '?';
                return (
                    <div
                        className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white overflow-hidden flex-shrink-0"
                        title={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                    >
                        {user?.avatar ? (
                            <Image
                                src={user.avatar}
                                alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <span className="uppercase">{initial}</span>
                        )}
                    </div>
                );
            };

            const assignedUsers = Array.isArray(value) ? value : (value ? [value] : []);
            const displayUsers = assignedUsers.slice(0, 3);
            const remainingCount = assignedUsers.length - 3;

            // Note: isSubtask parameter is available in scope from getTaskCellRenderer
            // Frontend currently uses same API endpoints for both tasks and subtasks
            // TODO: Implement dedicated subtask assignment APIs once backend provides them
            // Current implementation: Uses generic task assignment logic for both

            return (
                <div
                    className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskId(String(row.id));
                        setAssignedToAnchorEl(e.currentTarget);
                        setAssignedToSelectorOpen(true);
                    }}
                >
                    <AssignedToSelector
                        taskId={String(row.id)}
                        currentAssignedTo={assignedUsers}
                        isOpen={assignedToSelectorOpen && selectedTaskId === row.id}
                        onClose={() => {
                            setAssignedToSelectorOpen(false);
                            setAssignedToAnchorEl(null);
                            setSelectedTaskId(null);
                        }}
                        anchorEl={assignedToAnchorEl}
                        isSubtask={isSubtask}
                        parentTaskId={isSubtask ? (row.taskId || (row as any).taskId) : undefined} // 🔥 Pass parent taskId for subtasks
                    />
                    {assignedUsers.length > 0 ? (
                        <div className="flex items-center gap-1">
                            <div className="flex -space-x-2">
                                {displayUsers.map((user: any, index: number) => (
                                    <div key={index} className="relative">
                                        {renderAssigneeAvatar(user)}
                                    </div>
                                ))}
                                {remainingCount > 0 && (
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white flex-shrink-0"
                                        title={`+${remainingCount} more`}
                                    >
                                        +{remainingCount}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 hover:text-gray-700">
                            + Assign
                        </div>
                    )}
                </div>
            );
        }

        if (field.fieldKey === 'assignedBy') {
            const assignedByUser = value;
            if (!assignedByUser) {
                return <div className="text-sm text-gray-500">-</div>;
            }

            const initial = assignedByUser?.firstName?.charAt(0) || assignedByUser?.lastName?.charAt(0) || '?';

            return (
                <div
                    className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white overflow-hidden flex-shrink-0"
                    title={`${assignedByUser?.firstName || ''} ${assignedByUser?.lastName || ''}`.trim()}
                >
                    {assignedByUser?.avatar ? (
                        <Image
                            src={assignedByUser.avatar}
                            alt={`${assignedByUser?.firstName || ''} ${assignedByUser?.lastName || ''}`}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <span className="uppercase">{initial}</span>
                    )}
                </div>
            );
        }

        if (field.fieldKey === 'progress') {
            const progressColor =
                value >= 100
                    ? 'bg-green-500'
                    : value >= 75
                        ? 'bg-blue-500'
                        : value >= 50
                            ? 'bg-yellow-500'
                            : 'bg-orange-500';

            return (
                <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full ${progressColor} transition-all duration-300`}
                            style={{ width: `${value}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{value}%</span>
                </div>
            );
        }

        if (field.fieldKey === 'tags') {
            const taskId = row?.id ?? row?._id;
            const currentTags = Array.isArray(value) ? value : [];

            if (!taskId) {
                return <div className="text-sm text-gray-500">-</div>;
            }

            return (
                <TagsEditor
                    currentValue={currentTags as string[]}
                    onTagsChange={async (newTags: string[]) => {
                        try {
                            if (!currentUser?.id) {
                                toast.error('User information not available. Please refresh the page.');
                                return;
                            }

                            // Use subtask API if it's a subtask, otherwise use task API
                            if (isSubtask) {
                                await updateSubtaskTags({
                                    id: taskId,
                                    tags: newTags,
                                    taskId: row.taskId || (row as any).taskId // 🔥 Pass taskId to refetch parent task
                                }).unwrap();
                            } else {
                                await updateTaskTags({
                                    id: taskId,
                                    tags: newTags
                                }).unwrap();
                            }
                            toast.success('Tags updated successfully');
                        } catch (error: unknown) {
                            console.error('Failed to update tags:', error);
                            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                                ? (error.data as { message: string }).message
                                : 'Failed to update tags';
                            toast.error(errorMessage);
                        }
                    }}
                    disabled={userLoading || !currentUser?.id}
                />
            );
        }

        // Timeline field - date range with hover showing total days
        // Handle both tasks and subtasks timeline data
        if (field.fieldKey === 'timeLine') {
            // Ensure value is an array
            const timelineArray = Array.isArray(value) ? value : [];

            // Only render if we have at least 2 dates
            if (timelineArray.length >= 2) {
                try {
                    const startDate = timelineArray[0] as string;
                    const endDate = timelineArray[1] as string;

                    // Validate dates can be parsed
                    DateTime.fromISO(startDate);
                    DateTime.fromISO(endDate);

                    return (
                        <div className="flex items-center gap-2">
                            <div className="bg-[#8f8e8c] rounded-full px-7 mb-1 mt-1 cursor-pointer transition-colors group relative">
                                <div className="w-[100px] justify-center flex items-center py-0.5 gap-2 group-hover:hidden transition-opacity duration-150">
                                    <span className="text-white font-medium group-hover:text-black">{DateTime.fromISO(startDate).toFormat('MMM dd')}</span>
                                    <div className="w-3 h-px bg-white"></div>
                                    <span className="text-white font-medium group-hover:text-black">{DateTime.fromISO(endDate).toFormat('MMM dd')}</span>
                                </div>
                                <div className="w-[100px] text-white py-0.5 bg-[#8f8e8c] rounded-full justify-center hidden group-hover:flex items-center px-2 text-sm font-medium transition-opacity duration-150">
                                    {(() => {
                                        const start = new Date(startDate);
                                        const end = new Date(endDate);
                                        const msPerDay = 1000 * 60 * 60 * 24;
                                        const daysBetween = Math.max(0, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
                                        return `${daysBetween} day${daysBetween !== 1 ? 's' : ''}`;
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                } catch (error) {
                    console.error('Error parsing timeline dates:', error);
                    return <span className="text-gray-500">Invalid dates</span>;
                }
            }

            // Return empty state for empty timeline arrays
            return <span className="text-gray-400 text-sm">-</span>;
        }

        if (field.fieldKey === 'startDate' && value) {
            try {
                const date = DateTime.fromISO(value);
                return (
                    <div className="border-[1px] border-[#309b71] text-[#309b71] px-[27px] py-0.5 rounded-full inline-block text-sm font-semibold w-fit">
                        {date.toFormat('MMM dd, yyyy')}
                    </div>
                );
            } catch {
                return <span className="text-gray-500">Invalid date</span>;
            }
        }

        // DueDate field - interactive picker
        if (field.fieldKey === 'endDate' && value) {
            try {
                return (
                    <DueDatePicker
                        currentValue={value}
                        onDateChange={async (newDate) => {
                            try {
                                if (row.isSubtask) {
                                    await updateSubtaskDueDate({
                                        id: row.id,
                                        dueDate: newDate,
                                        taskId: row.taskId || (row as any).taskId // 🔥 Pass taskId to refetch parent task
                                    }).unwrap();
                                    toast.success('Subtask due date updated');
                                } else {
                                    await updateTaskDueDate({
                                        id: row.id,
                                        dueDate: newDate
                                    }).unwrap();
                                    toast.success('Task due date updated');
                                }
                            } catch (error: any) {
                                console.error('Error updating due date:', error);
                                toast.error(error?.data?.message || 'Failed to update due date');
                            }
                        }}
                        disabled={tasksLoading}
                    />
                );
            } catch {
                return <span className="text-gray-500">Invalid date</span>;
            }
        }

        // EstimationTime field - display as hours and minutes or days
        if (field.fieldKey === 'estimationTime') {
            if (!value || value <= 0) {
                return <span className="text-gray-400 text-sm">-</span>;
            }

            // estimationTime is in seconds
            const seconds = Math.max(0, value);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;

            let displayText = '';
            if (days > 0) {
                displayText = `${days}d ${remainingHours}h`;
            } else if (hours > 0) {
                displayText = `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                displayText = `${minutes}m`;
            } else {
                displayText = `${seconds}s`;
            }

            return (
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap">
                        {displayText}
                    </div>
                </div>
            );
        }

        // TimeTrackings field - Enhanced with API-based running status detection
        // Shows running clock icon when timer is active, or total spent time when stopped
        if (field.fieldKey === 'timeTracking') {
            // Determine if this specific row is the one currently running
            const runningTask = runningTaskData?.data?.data;
            const runningSubtask = runningSubtaskData?.data?.data;

            let isRunning = false;
            let runningStartTime: string | null = null;

            // Check if this row is the currently running task/subtask
            if (row.isSubtask && runningSubtask?.running && runningSubtask?.subtask?.id === row.id) {
                isRunning = true;
                runningStartTime = runningSubtask.startTime;
            } else if (!row.isSubtask && runningTask?.running && runningTask?.task?.id === row.id) {
                isRunning = true;
                runningStartTime = runningTask.startTime;
            }

            // Calculate running time from API startTime if tracking is active
            let runningTime = 0;
            if (isRunning && runningStartTime) {
                try {
                    const startTime = DateTime.fromISO(runningStartTime);
                    const now = DateTime.now();
                    runningTime = Math.floor(now.diff(startTime, 'seconds').seconds);
                } catch (error) {
                    console.error('Error calculating running time:', error);
                    runningTime = 0;
                }
            }

            // Use row.spentTime for total spent time + current running time
            const totalSeconds = (row.spentTime || 0) + runningTime;

            // Handle start click with conflict detection
            const handleStartClick = async (e: React.MouseEvent) => {
                e.stopPropagation();

                try {
                    // Check if another task/subtask is already running
                    const hasRunningTask = runningTask?.running;
                    const hasRunningSubtask = runningSubtask?.running;

                    if (row.isSubtask) {
                        // Starting a subtask
                        if (hasRunningTask) {
                            // Stop the running task first
                            toast.warning(`Stopping running task "${runningTask.task?.taskName || 'Unknown'}" first...`);
                            await stopTaskTimeTracking(runningTask.task?.id).unwrap();
                        }
                        if (hasRunningSubtask && runningSubtask.subtask?.id !== row.id) {
                            // Stop the running subtask first
                            toast.warning(`Stopping running subtask "${runningSubtask.subtask?.subtaskName || 'Unknown'}" first...`);
                            await stopSubtaskTimeTracking(runningSubtask.subtask?.id).unwrap();
                        }
                        await startSubtaskTimeTracking(String(row.id)).unwrap();
                    } else {
                        // Starting a task
                        if (hasRunningSubtask) {
                            // Stop the running subtask first
                            toast.warning(`Stopping running subtask "${runningSubtask.subtask?.subtaskName || 'Unknown'}" first...`);
                            await stopSubtaskTimeTracking(runningSubtask.subtask?.id).unwrap();
                        }
                        if (hasRunningTask && runningTask.task?.id !== row.id) {
                            // Stop the running task first
                            toast.warning(`Stopping running task "${runningTask.task?.taskName || 'Unknown'}" first...`);
                            await stopTaskTimeTracking(runningTask.task?.id).unwrap();
                        }
                        await startTaskTimeTracking(String(row.id)).unwrap();
                    }

                    toast.success('Time tracking started');
                    // Refetch running status
                    refetchRunningTask();
                    refetchRunningSubtask();
                } catch (error: any) {
                    console.error('Failed to start time tracking:', error);
                    toast.error(error?.data?.message || 'Failed to start time tracking');
                }
            };

            // Show play button if no time tracked at all
            if (!isRunning && (!totalSeconds || totalSeconds <= 0)) {
                // Fetch time invested data for this task
                const taskId = String(row.id);
                const isSubtaskRow = row.isSubtask || false;

                return (
                    <div className="flex items-center gap-2">
                        <div
                            className="bg-gray-400 p-[3px] pl-[5px] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
                            onClick={handleStartClick}
                        >
                            <FaPlay size={8} color="#d1d5dc" />
                        </div>
                        <span
                            className="text-blue-600 text-sm cursor-pointer hover:underline font-medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTimeTrackingTaskId(taskId);
                                setSelectedTimeTrackingIsSubtask(isSubtaskRow);
                                setTimeInvestedAnchorEl(e.currentTarget);
                            }}
                        >
                            View total time
                        </span>
                    </div>
                );
            }

            const seconds = Math.max(0, totalSeconds);

            // Use Luxon to compute duration components
            const zero = DateTime.fromMillis(0);
            const end = zero.plus({ seconds });
            const dur = end.diff(zero, ['days', 'hours', 'minutes', 'seconds']).toObject();

            const days = Math.floor(dur.days || 0);
            const hours = Math.floor(dur.hours || 0);
            const minutes = Math.floor(dur.minutes || 0);
            const secs = Math.floor(dur.seconds || 0);
            const remainingHours = hours % 24;

            let displayText = '';
            if (isRunning) {
                // Running format: show more granular time including seconds
                if (days > 0) {
                    displayText = `${days}d ${remainingHours}h ${minutes}m`;
                } else if (hours > 0) {
                    displayText = `${hours}h ${minutes}m ${secs}s`;
                } else if (minutes > 0) {
                    displayText = `${minutes}m ${secs}s`;
                } else {
                    displayText = `${secs}s`;
                }
            } else {
                // Stopped format: show coarser summary
                if (days > 0) {
                    displayText = `${days}d ${remainingHours}h`;
                } else if (hours > 0) {
                    displayText = `${hours}h ${minutes}m`;
                } else if (minutes > 0) {
                    displayText = `${minutes}m`;
                } else {
                    displayText = `${seconds}s`;
                }
            }

            return (
                <div className="flex items-center gap-2">
                    {isRunning ? (
                        <div className="flex items-center gap-1">
                            <div className="relative w-4 h-4">
                                <svg
                                    className="w-4 h-4 text-red-500 animate-pulse"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                                <svg
                                    className="w-4 h-4 text-red-500 absolute inset-0 animate-spin"
                                    style={{ animationDuration: '2s' }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 2" />
                                </svg>
                            </div>
                            {/* Stop button when running */}
                            <div
                                className="bg-red-500 p-[3px] pl-[5px] rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Open notes dialog before stopping
                                    setPendingStopAction({
                                        taskId: String(row.id),
                                        isSubtask: row.isSubtask || false,
                                        displayText: displayText
                                    });
                                    setNotesDialogOpen(true);
                                }}
                                title="Stop tracking"
                            >
                                <FaStop size={8} color="#ffffff" />
                            </div>
                        </div>
                    ) : (
                        <div
                            className="bg-gray-400 p-[3px] pl-[5px] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
                            onClick={handleStartClick}
                        >
                            <FaPlay size={8} color="#d1d5dc" />
                        </div>
                    )}
                    <div className={`rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap ${isRunning
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        }`}>
                        {displayText}
                    </div>
                </div>
            );
        }

        // ACTION COLUMN - Edit and Delete buttons
        if (field.fieldKey === 'action') {
            return (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        title="Edit"
                        className=" p-2 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTaskFromRow(row as unknown as TaskDataExtended);
                        }}
                    >
                        <Image src={editpencil} alt="Edit" width={10} height={10} />
                    </button>

                    <button
                        type="button"
                        title="Delete"
                        className=" p-2 rounded-full bg-black flex items-center justify-center text-white shadow hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Delete task feature coming soon');
                        }}
                    >
                        <Image src={deleteForever} alt="Delete" width={10} height={10} />
                    </button>

                    <button
                        type="button"
                        title="More"
                        className=" p-2 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.info('More actions coming soon');
                        }}
                    >
                        <Image src={threeDot} alt="More" width={10} height={10} />
                    </button>
                </div>
            );
        }

        return undefined;
    }, [
        taskMDMFields,
        tasksLoading,
        assignedToSelectorOpen,
        selectedTaskId,
        assignedToAnchorEl,
        currentUser,
        userLoading,
        updateTaskName,
        updateSubtaskName,
        updateTaskStatus,
        updateSubtaskStatus,
        updateTaskPriority,
        updateSubtaskPriority,
        updateTaskTags,
        updateSubtaskTags,
        updateTaskDueDate,
        updateSubtaskDueDate,
        createTaskStatusOption,
        updateTaskStatusOption,
        deleteTaskStatusOption,
        createTaskPriorityOption,
        updateTaskPriorityOption,
        deleteTaskPriorityOption,
        taskMDMInfo,
        editingTaskId,
        editingTaskName,
        runningTaskIds,
        runningTimes,
        createTaskTimeTracking,
        createSubtaskTimeTracking,
        runningTaskData,
        runningSubtaskData,
        startTaskTimeTracking,
        stopTaskTimeTracking,
        startSubtaskTimeTracking,
        stopSubtaskTimeTracking,
        refetchRunningTask,
        refetchRunningSubtask,
    ]);

    // Calculate pagination from API response
    const totalTasks = tasksData?.data?.data?.total || tasksData?.data?.total || 0;
    const totalPages = Math.ceil(totalTasks / pageSize);
    const paginatedTasks = sampleTasks;

    // Handler functions for filters and search
    const handleSearch = (_searchTerm: string, _selectedColumns: string[], searchParamsInput?: Record<string, string>) => {
        if (searchParamsInput && Object.keys(searchParamsInput).length > 0) {
            setSearchQueryParams(searchParamsInput);
        } else {
            setSearchQueryParams({});
        }
        setCurrentPage(1); // Reset to first page on new search
    };

    const handleAdvancedFilterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setFilterAnchorEl(e.currentTarget);
        setOpenAdvancedFilter(true);
    };

    const handleAdvancedFilterClose = () => {
        setOpenAdvancedFilter(false);
        setFilterAnchorEl(null);
    };

    const handleClearAdvancedFilters = () => {
        setAdvancedFilters([]);
        setAdvancedFilterParams({});
        setCurrentPage(1);
    };

    const handleApplyAdvancedFilters = (filters: any[], queryParams?: Record<string, string>) => {
        console.log('Advanced filters applied:', filters);

        let params: Record<string, string> = {};
        if (queryParams && Object.keys(queryParams).length > 0) {
            params = queryParams;
        } else {
            filters.forEach(filter => {
                if (filter.field && filter.operator && filter.value.trim()) {
                    params[filter.field] = `${filter.operator}:${filter.value.trim()}`;
                }
            });
        }

        console.log('Setting advanced filter params:', params);
        setAdvancedFilters(filters);
        setAdvancedFilterParams(params);
        handleAdvancedFilterClose();
        setCurrentPage(1);
    };

    const handlePersonFilterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setPersonFilterAnchorEl(e.currentTarget);
        setOpenPersonFilter(true);
    };

    const handlePersonFilterClose = () => {
        setOpenPersonFilter(false);
        setPersonFilterAnchorEl(null);
    };

    const handleApplyPersonFilter = (selectedUsers: string[], filterType: 'manager' | 'team' | 'both', assignmentType: 'task' | 'subtask' | 'both') => {
        if (selectedUsers.length === 0) {
            setPersonFilters({});
            handlePersonFilterClose();
            setCurrentPage(1);
            return;
        }

        const newFilters: typeof personFilters = {};

        if (filterType === 'manager') {
            newFilters.managerIds = selectedUsers;
        } else if (filterType === 'team') {
            newFilters.teamIds = selectedUsers;
        } else {
            newFilters.managerIds = selectedUsers;
            newFilters.teamIds = selectedUsers;
        }

        newFilters.assignmentType = assignmentType;

        setPersonFilters(newFilters);
        handlePersonFilterClose();
        setCurrentPage(1);
    };

    const handleSortFilterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setSortFilterAnchorEl(e.currentTarget);
        setOpenSortFilter(true);
    };

    const handleSortFilterClose = () => {
        setOpenSortFilter(false);
        setSortFilterAnchorEl(null);
    };

    const handleApplySortFilter = (sort: any) => {
        console.log('Sort filter applied:', sort);
        setSortConfig(sort);
        if (sort?.field) {
            setSortField(sort.field);
            setSortDirection(sort.direction || 'asc');
        }
        handleSortFilterClose();
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleToggleColumns = () => {
        setShowLessColumns(prev => !prev);
    };

    const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
        if (!taskMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            await updateTaskMDMDisplayName({
                id: taskMDMInfo.data.id,
                fieldKey: field.fieldKey,
                displayName: newName
            }).unwrap();
            toast.success(`Field renamed to "${newName}"`);
        } catch (error) {
            console.error('Failed to rename field:', error);
            toast.error('Failed to rename field');
        }
    };

    // Handler for stopping time tracking with notes
    const handleStopWithNotes = async () => {
        if (!pendingStopAction) return;

        try {
            // Call backend API to stop time tracking with notes
            if (pendingStopAction.isSubtask) {
                await stopSubtaskTimeTracking({
                    id: pendingStopAction.taskId,
                    notes: timeTrackingNotes || undefined
                }).unwrap();
            } else {
                await stopTaskTimeTracking({
                    id: pendingStopAction.taskId,
                    notes: timeTrackingNotes || undefined
                }).unwrap();
            }

            toast.success(`Time tracking stopped and saved (${pendingStopAction.displayText})${timeTrackingNotes ? ' with notes' : ''}`);

            // Refetch running status
            refetchRunningTask();
            refetchRunningSubtask();

            // Close dialog and reset state
            setNotesDialogOpen(false);
            setTimeTrackingNotes('');
            setPendingStopAction(null);
        } catch (error: any) {
            console.error('Failed to stop time tracking:', error);
            toast.error(error?.data?.message || 'Failed to stop time tracking');
        }
    };

    // Handler for canceling notes dialog
    const handleCancelNotes = () => {
        setNotesDialogOpen(false);
        setTimeTrackingNotes('');
        setPendingStopAction(null);
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                    <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                </div>
            </ProtectedRoute>
        );
    }

    if (projectError || !projectData?.data) {
        return (
            <ProtectedRoute>
                <div className="w-screen h-screen flex items-center justify-center" style={{
                    backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
                }}>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
                        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
                        <button
                            onClick={() => router.push('/lazykill/projects')}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Back to Projects
                        </button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="w-screen h-screen overflow-hidden flex" style={{
                backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
            }}>
                <Sidebar />
                <div className="flex-1 flex flex-col relative min-w-0 w-full">
                    <Header />
                    <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
                        {/* Breadcrumb */}
                        <div className='border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                            <BreadcrumbsNavBar
                                customItems={[
                                    { label: 'MY PROJECTS', href: '/lazykill/projects' },
                                    { label: 'PROJECT LIST', href: '/lazykill/projects' },
                                    { label: projectData?.data?.name || projectData?.data?.projectName || 'P00[1 AI Hub ]', href: `/lazykill/project/${projectId}` },
                                ]}
                            />
                        </div>

                        {/* Task Details Header */}
                        <div className='px-5 py-4' style={{
                            backgroundColor: isDark ? colors.dark.sidebar : '#fff'
                        }}>
                            <div className="flex items-center justify-between bg-[#333333] px-4 py-3">
                                <h1 className="text-lg font-bold text-white" style={{ color: isDark ? colors.dark.text : "white" }}>
                                    Task Details
                                </h1>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCompanyJobClick}
                                        aria-controls={companyJobAnchorEl ? 'company-job-popover' : undefined}
                                        aria-haspopup="true"
                                        className="flex items-center gap-2 px-4 py-2 text-[#cb2a2d] bg-white rounded transition-colors font-semibold"
                                    >
                                        <Image src="/companyJobBucket.svg" alt="companyJobBucket" width={16} height={16} />
                                        Company Job Bucket
                                    </button>
                                    {/* <button className="flex items-center gap-2 px-4 py-2 text-[#cb2a2d] bg-white rounded transition-colors font-semibold">
                                        <Image src="/excel-p.svg" alt="export" width={16} height={16} />
                                        Export
                                    </button> */}
                                    {/* Simple Add Task button that opens form directly */}
                                    <button
                                        onClick={() => openCreateModal("regular")}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 rounded border border-red-700 hover:bg-red-50"
                                    >
                                        + Add Task
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Company Job Bucket Dialog (moved to component) */}
                        <CompanyJobBucketDialog
                            open={Boolean(companyJobAnchorEl)}
                            onClose={handleCompanyJobClose}
                            projectId={projectId}
                            onSelectBucket={(bucketId: string) => {
                                // Example behavior: close dialog and show a toast. Replace with real logic as needed.
                                handleCompanyJobClose();
                                toast.success(`Selected job bucket: ${bucketId}`);
                                // TODO: wire selected bucket into form/create flows
                            }}
                        />

                        {/* Search and Filter Bar - Task Specific */}
                        <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 flex justify-end items-center h-fit' style={{
                            backgroundColor: isDark ? colors.dark.sidebar : undefined
                        }}>
                            <div className="flex items-center gap-2">
                                {/* Task-Specific Search Bar for Tasks & Subtasks */}
                                <TaskSearchBar
                                    onSearch={handleSearch}
                                    placeholder="Search tasks, subtasks, description, type, tags..."
                                    defaultSelectedColumns={['taskName', 'subtaskName', 'description', 'tags']}
                                    defaultOperator="cn"
                                    showOperatorSelector={true}
                                    className="flex-shrink-0"
                                />

                                {/* Assigned To Filter */}
                                <button
                                    onClick={handlePersonFilterClick}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                    title="Filter by Assigned Users"
                                >
                                    <img src="/projecticon/Person.svg" alt="Person Icon" width={17} height={17} />
                                    <span>Assigned To</span>
                                    {(personFilters.managerIds?.length || personFilters.teamIds?.length) ? (
                                        <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                            {Math.max(personFilters.managerIds?.length || 0, personFilters.teamIds?.length || 0)}
                                        </span>
                                    ) : null}
                                </button>

                                {/* Task-Specific Filters Button */}
                                <button
                                    onClick={handleAdvancedFilterClick}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                    title="Filter by Status, Priority, Progress, Dates"
                                >
                                    <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                                    <span>Task Filters</span>
                                    {advancedFilters.length > 0 && (
                                        <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                            {advancedFilters.length}
                                        </span>
                                    )}
                                </button>

                                {/* Task-Specific Sort Button */}
                                <button
                                    onClick={handleSortFilterClick}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                    title="Sort by Task Fields"
                                >
                                    <Image src="/sort.svg" alt="Sort" width={16} height={16} />
                                    <span>Sort</span>
                                </button>


                                {/* Add View Toggle Button */}
                                <button
                                    onClick={() => setViewMode(viewMode === "table" ? "kanban" : "table")}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                    title={`Switch to ${viewMode === "table" ? "Kanban" : "Table"} view`}
                                >
                                    <Image
                                        src={viewMode === "table" ? "/task_4941013.png" : "/header_6014850.png"}
                                        alt={viewMode === "table" ? "Kanban" : "Table"}
                                        width={16}
                                        height={16}
                                    />
                                    <span>{viewMode === "table" ? "Kanban View" : "Table View"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Pagination Bar */}
                        <div className='mx-5 mt-4 py-2 px-2 rounded flex h-fit'>
                            <Bar
                                total={totalTasks}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                onToggleColumns={handleToggleColumns}
                                showLessColumns={showLessColumns}
                            />
                        </div>

                        {/* Task Table */}

                        {/* View Toggle and Main Content */}
                        <div className="border-t-2 border-b-2 flex-1 m-1 overflow-hidden flex flex-col relative">
                            {viewMode === "table" ? (
                                // Table View
                                <TaskTable
                                    tasks={paginatedTasks}
                                    fieldDefinitions={visibleFields}
                                    treeColumnKey="taskTree"
                                    taskIdKey="id"
                                    subtasksKey="subtasks"
                                    initialExpandedIds={taskExpandedIds}
                                    onExpandChange={setTaskExpandedIds}
                                    selectable={true}
                                    stickyHeader={true}
                                    indentationSize={28}
                                    getCellRenderer={getTaskCellRenderer}
                                    onSelectionChange={(selectedKeys, rows) => {
                                        console.log('Selected task IDs:', selectedKeys);
                                    }}
                                    onRowClick={(row, index) => {
                                        console.log('Clicked task:', row);
                                    }}
                                    onRenameColumn={handleRenameColumn}
                                    appearance="figma"
                                    rowKey="id"
                                    className="min-h-12 h-12"
                                />
                            ) : (
                                // Kanban View
                                // In your ProjectDetailPage.tsx, update the KanbanBoard component usage:

                                <KanbanBoard
                                    tasks={paginatedTasks}
                                    statusOptions={taskMDMFields?.data || []}
                                    onEditTask={handleEditTaskFromRow}
                                    onOpenSubtaskModal={handleOpenSubtaskModal}
                                    onOpenCreateTask={() => openCreateModal("regular")}
                                    onUpdateTaskStatus={handleUpdateTaskStatus}
                                    onRefresh={refetchTasks}
                                    onCreateStatus={async (statusData) => {
                                        try {
                                            if (!taskMDMInfo?.data?.id) {
                                                toast.error('MDM information not available');
                                                return;
                                            }

                                            await createTaskStatusOption({
                                                id: taskMDMInfo.data.id,
                                                fieldKey: 'status',
                                                option: {
                                                    label: statusData.displayName,
                                                    value: statusData.displayName.toLowerCase().replace(/\s+/g, '_'),
                                                    color: statusData.color
                                                }
                                            }).unwrap();

                                            toast.success(`Added new status: ${statusData.displayName}`);
                                            refetchTasks();
                                            taskmdmrefetch();
                                        } catch (error) {
                                            console.error('Failed to add status option:', error);
                                            toast.error('Failed to add status');
                                        }
                                    }}
                                />
                            )}
                        </div>

                        {/* Task Form Modal */}
                        <FormModal
                            isOpen={open}
                            onClose={handleModalClose}
                            title={getModalTitle()}
                            size="xl"
                            maxHeight="95vh"
                        >
                            <TabbedFormLayout
                                tabs={filteredTabs}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                className="h-full"
                            />
                        </FormModal>

                        <FormModal
                            isOpen={subtaskModalOpen}
                            onClose={() => {
                                setSubtaskModalOpen(false);
                                setSelectedParentTaskId(null);
                            }}
                            title="Create Subtask"
                            size="lg"
                            className="overflow-y-auto"
                        >
                            <div className="p-6">
                                <DynamicForm
                                    fields={taskFields.map(field => ({
                                        ...field,
                                        fieldType: field.fieldType as any,
                                        isSubtaskField: true, // Mark as subtask field
                                        isTaskField: false,   // Ensure it's not marked as task field
                                    })) as any}
                                    onSubmit={handleCreateSubtask}
                                    isEditMode={false}
                                    initialValues={{}}
                                    submitButtonText={subtaskLoading ? "Creating..." : "Create Subtask"}
                                    cancelButtonText="Cancel"
                                    mdmId={taskMDMInfo?.data?.id} // Use task MDM ID for subtasks
                                />
                            </div>
                        </FormModal>

                        {/* Advanced Filter Popover */}
                        <AdvancedFilterPopover
                            anchorEl={filterAnchorEl}
                            open={openAdvancedFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Task Filters"
                            mode="task"
                            onClearFilters={handleClearAdvancedFilters}
                        />

                        {/* Person Filter Popover */}
                        <PersonFilterPopover
                            anchorEl={personFilterAnchorEl}
                            open={openPersonFilter}
                            onClose={handlePersonFilterClose}
                            onApplyFilter={handleApplyPersonFilter}
                            currentFilters={personFilters}
                        />

                        {/* Sort Filter Popover */}
                        <SortFilterPopover
                            anchorEl={sortFilterAnchorEl}
                            open={openSortFilter}
                            onClose={handleSortFilterClose}
                            onApplySort={handleApplySortFilter}
                            currentSort={sortConfig}
                            mode="task"
                        />

                        {/* Time Invested Popover */}
                        <TimeInvestedPopover
                            anchorEl={timeInvestedAnchorEl}
                            open={Boolean(timeInvestedAnchorEl)}
                            onClose={() => {
                                setTimeInvestedAnchorEl(null);
                                setSelectedTimeTrackingTaskId(null);
                                setSelectedTimeTrackingIsSubtask(false);
                            }}
                            taskId={selectedTimeTrackingTaskId}
                            isSubtask={selectedTimeTrackingIsSubtask}
                        />

                        {/* Time Tracking Notes Dialog */}
                        <Dialog
                            open={notesDialogOpen}
                            onClose={handleCancelNotes}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle sx={{
                                bgcolor: '#f5f5f5',
                                borderBottom: '1px solid #e0e0e0',
                                fontWeight: 600
                            }}>
                                Add Notes for Time Tracking
                            </DialogTitle>
                            <DialogContent sx={{ mt: 2 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                        Time tracked: <strong>{pendingStopAction?.displayText}</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                        {pendingStopAction?.isSubtask ? 'Subtask' : 'Task'} will be stopped.
                                    </Typography>
                                </Box>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    label="Notes (Optional)"
                                    placeholder="Add notes about what you worked on..."
                                    multiline
                                    rows={4}
                                    fullWidth
                                    variant="outlined"
                                    value={timeTrackingNotes}
                                    onChange={(e) => setTimeTrackingNotes(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'white'
                                        }
                                    }}
                                />
                            </DialogContent>
                            <DialogActions sx={{ p: 2, bgcolor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
                                <Button
                                    onClick={handleCancelNotes}
                                    variant="outlined"
                                    sx={{
                                        textTransform: 'none',
                                        color: '#666',
                                        borderColor: '#ccc',
                                        '&:hover': {
                                            borderColor: '#999',
                                            bgcolor: '#f5f5f5'
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleStopWithNotes}
                                    variant="contained"
                                    sx={{
                                        textTransform: 'none',
                                        bgcolor: '#d32f2f',
                                        '&:hover': {
                                            bgcolor: '#b71c1c'
                                        }
                                    }}
                                >
                                    Stop Timer
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
