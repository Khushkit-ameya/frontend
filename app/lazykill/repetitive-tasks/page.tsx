"use client";
import React, { useState, useRef, useEffect, JSX, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Edit, FolderPlus, Users, ArrowUpDown, Eye, EyeIcon, BarChart3 } from "lucide-react";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useTheme, useCompanyTheme } from '@/store/hooks';
import { TabbedFormLayout } from "@/components/common/forms/TabbedFormLayout";
import { OverviewTabContent } from "@/components/common/forms/tab-contents/OverviewTabContent";
import { UpdatesTabContent } from "@/components/common/forms/tab-contents/UpdatesTabContent";
import { FilesLinksTabContent } from "@/components/common/forms/tab-contents/FilesLinksTabContent";
import { EmailComposer } from "@/components/common/forms/EmailComposer";
import { EmailSignatureModal } from "@/components/common/forms/EmailSignatureModal";
import { FormModal } from "@/components/common/forms/FormModal";
import DynamicForm, { FieldType } from "@/components/common/forms/DynamicForm";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import search from "@/public/icons/search 1.svg";
import { CiExport } from "react-icons/ci";
import { FiPlus } from "react-icons/fi";
import { FaSlidersH } from "react-icons/fa";
import ProtectedRoute from "@/components/ProtectedRoute";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import Subtitle from "@/components/Project/SubTitle";
import Bar from "@/components/Project/PaginationBar";
import { DateTime } from 'luxon';
import { setTheme, setCompanyThemeColor } from '@/store/api_query/global';
import { useGetCompanyUsersQuery, useGetCurrentUserQuery } from "@/store/api_query/auth.api";
import {
    useGetRepeatTasksQuery,
    useCreateRepeatTaskMutation,
    useUpdateRepeatTaskMutation,
    useDeleteRepeatTaskMutation,
    useToggleRepeatTaskMutation
} from "@/store/api_query/LazyKill/lazyKill.api";
import type { RepeatTaskData, RepeatTaskQueryParams } from "@/types/repeatTask";
import SearchBar from "@/components/common/SearchBar";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";
import { getDynamicFieldConfig } from "@/components/common/forms/DynamicForm/dynamicFieldConfig";
import Image from "next/image";
import FinalTable from "@/components/common/CommonTable";
import { PhoneValue } from "@/components/common/FieldType";
import StatusDropdown from "@/components/dropdowns/StatusDropdown";
import { mapBackendListToFrontend } from "@/utils/fieldDefinitions";
import type { FieldDefinition, SortConfig } from "@/types/FieldDefinitions";
import { customToast as toast } from '@/utils/toast';
import PagerIcon from '@/assests/pager.svg';
import checkProgress from '../../../assests/checkprogress.png';
import DueDatePicker from '@/components/common/DueDatePicker';
import TagsEditor from '../../../components/common/TagsEditor';
import AdvancedFilterPopover from '../../../components/common/AdvancedFilterPopover';
import type { FilterCondition } from '../../../components/common/AdvancedFilterPopover';
import editpencil from '@/assests/editpencil.png';
import deleteForever from '@/assests/delete_forever.png';
import threeDot from '@/assests/threeDots.png';
import excela from '@/public/excel-p.svg';
import FilterIcon from '@/assests/filter-icon.png';
import { useGetAllProjectsQuery } from "@/store/api_query/LazyKill/project.api";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface OptionItem {
    id?: string;
    userId?: string;
    value?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: string;
    label?: string;
    displayName?: string;
    color?: string;
    email?: string;
    role?: string;
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

interface TimelineValue {
    start: string;
    end: string;
}

interface RepetitiveTaskData {
    id: string;
    repeattaskId?: string;
    taskId?: string;
    taskName?: string;
    name?: string;
    description?: string;
    status?: string | { value: string };
    priority?: string | { value: string };
    frequency?: string;
    frequenceType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate?: string;
    endDate?: string;
    nextRunDate?: string;
    nextTime?: string;
    lastRunDate?: string;
    assignedTo?: Array<{ id?: string; userId?: string; value?: string; firstName?: string; lastName?: string; name?: string; avatar?: string }>;
    assignedToId?: string[];
    tags?: string[];
    isActive?: boolean;
    isEnabled?: boolean;
    projectId?: string;
    _id?: string;
    // Frequency configuration fields
    day?: {
        days?: string[];
        time?: string;
    };
    week?: {
        day?: string;
        time?: string;
    };
    month?: {
        day?: number;
        time?: string;
    };
    quartly?: {
        months?: number[];
        day?: number;
        time?: string;
    };
    yearly?: {
        date?: string;
        time?: string;
    };
    whenToStart?: string;
    untilDate?: string;
    estimateTime?: string;
    jobBucket?: boolean;
    repeatTaskType?: string;
}

interface RepetitiveTaskField {
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

interface CurrentUser {
    id: string;
    company: {
        id: string;
    };
}

interface QueryParams {
    page: number;
    countPerPage: number;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
    [key: string]: string | number | undefined;
}

// =====================================================
// SIMPLIFIED FORM COMPONENT - FIXED VERSION
// =====================================================

const RepetitiveTaskForm: React.FC<{
    fields: any[];
    onSubmit: (values: Record<string, unknown>) => void;
    isEditMode?: boolean;
    initialValues?: Record<string, unknown>;
    onClose?: () => void;
    Repeattaskuser?: any[];
}> = ({ fields, onSubmit, isEditMode = false, initialValues = {}, onClose, Repeattaskuser = [] }) => {

    // Extract frequency from initial values correctly
    const getInitialFrequency = useCallback(() => {
        if (initialValues.frequence) {
            return (initialValues.frequence as string).toLowerCase();
        }
        if (initialValues.frequenceType) {
            const freqType = initialValues.frequenceType;
            if (typeof freqType === 'object' && freqType !== null) {
                return ((freqType as any).value || 'daily').toLowerCase();
            }
            return (freqType as string).toLowerCase();
        }
        return 'daily';
    }, [initialValues]);

    const [selectedFrequency, setSelectedFrequency] = useState<string>(getInitialFrequency());
    const [forceRefresh, setForceRefresh] = useState(0);

    // Update frequency when initialValues change (for edit mode)
    useEffect(() => {
        const newFrequency = getInitialFrequency();
        console.log('[RepetitiveTaskForm] Frequency updated from initialValues:', newFrequency);
        console.log('[RepetitiveTaskForm] Full initialValues:', initialValues);
        setSelectedFrequency(newFrequency);
    }, [initialValues, getInitialFrequency]);

    // Transform initial values function
    const transformInitialValues = useCallback((values: Record<string, unknown>) => {
        console.log('[RepetitiveTaskForm] Transforming initial values:', values);
        const transformed = { ...values };

        // Handle frequence/frequenceType field properly
        let freqValue = 'daily';
        if (values.frequence) {
            freqValue = (values.frequence as string).toLowerCase();
        } else if (values.frequenceType) {
            if (typeof values.frequenceType === 'object' && values.frequenceType !== null) {
                freqValue = ((values.frequenceType as any).value || 'daily').toLowerCase();
            } else {
                freqValue = (values.frequenceType as string).toLowerCase();
            }
        }

        // Set frequenceType as a simple string value (not object)
        transformed.frequenceType = freqValue;
        console.log('[RepetitiveTaskForm] Set frequenceType to:', freqValue);

        // Pre-fill frequency configuration based on existing data
        if (values.day) {
            const dayData = values.day as any;
            transformed['day.days'] = dayData.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            transformed['day.time'] = dayData.time || '09:00';
            console.log('[RepetitiveTaskForm] Transformed daily config:', { days: transformed['day.days'], time: transformed['day.time'] });
        }

        if (values.week) {
            const weekData = values.week as any;
            transformed['week.day'] = weekData.day || 'monday';
            transformed['week.time'] = weekData.time || '09:00';
            console.log('[RepetitiveTaskForm] Transformed weekly config:', { day: transformed['week.day'], time: transformed['week.time'] });
        }

        if (values.month) {
            const monthData = values.month as any;
            transformed['month.day'] = monthData.day || 1;
            transformed['month.time'] = monthData.time || '09:00';
            console.log('[RepetitiveTaskForm] Transformed monthly config:', { day: transformed['month.day'], time: transformed['month.time'] });
        }

        if (values.quartly) {
            const quartlyData = values.quartly as any;
            transformed['quartly.months'] = quartlyData.months || [1, 4, 7, 10];
            transformed['quartly.day'] = quartlyData.day || 1;
            transformed['quartly.time'] = quartlyData.time || '09:00';
            console.log('[RepetitiveTaskForm] Transformed quarterly config:', {
                months: transformed['quartly.months'],
                day: transformed['quartly.day'],
                time: transformed['quartly.time']
            });
        }

        if (values.yearly) {
            const yearlyData = values.yearly as any;
            transformed['yearly.date'] = yearlyData.date || new Date().toISOString().split('T')[0];
            transformed['yearly.time'] = yearlyData.time || '09:00';
            console.log('[RepetitiveTaskForm] Transformed yearly config:', { date: transformed['yearly.date'], time: transformed['yearly.time'] });
        }

        if (values.projectId) {
            transformed.projectId = values.projectId;
            console.log('[RepetitiveTaskForm] Transformed projectId:', transformed.projectId);
        }

        if (values.assignedToId && Array.isArray(values.assignedToId)) {
            const assignedToUsers = values.assignedToId.map(userId => {
                // Find user in Repeattaskuser array (you'll need to pass this as prop)
                const user = Repeattaskuser.find(u => u.id === userId);
                return user || { value: userId, label: userId };
            });
            transformed.assignedTo = assignedToUsers;
            console.log('[RepetitiveTaskForm] Transformed assignedTo:', transformed.assignedTo);
        }

        // Add this to handle estimateTime transformation
        if (values.estimateTime) {
            const seconds = parseInt(String(values.estimateTime), 10);
            if (!isNaN(seconds)) {
                // Convert seconds to {value, unit} object
                if (seconds >= 86400) {
                    transformed.estimateTime = { value: seconds / 86400, unit: 'days' };
                } else if (seconds >= 3600) {
                    transformed.estimateTime = { value: seconds / 3600, unit: 'hours' };
                } else {
                    transformed.estimateTime = { value: seconds / 60, unit: 'minutes' };
                }
                console.log('[RepetitiveTaskForm] Transformed estimateTime:', transformed.estimateTime);
            }
        }

        // Add this to handle repeatTaskType transformation
        if (values.repeatTaskType) {
            transformed.repeatTaskType = values.repeatTaskType;
            console.log('[RepetitiveTaskForm] Transformed repeatTaskType:', transformed.repeatTaskType);
        } else {
            // Set default if not present
            transformed.repeatTaskType = 'FLEXIBLE';
        }

        console.log('[RepetitiveTaskForm] Final transformed values:', transformed);
        return transformed;
    }, []);

    // Handle form submission
    const handleSubmit = async (values: Record<string, unknown>) => {
        console.log('[RepetitiveTaskForm] Form submitted with values:', values);
        await onSubmit(values);
    };

    // Handle field changes to update frequency state
    const handleFieldChange = (field: string, value: any) => {
        console.log('[RepetitiveTaskForm] Field changed:', field, 'Raw value:', value, 'Type:', typeof value);

        // Update frequency state when frequenceType changes
        if (field === 'frequenceType') {
            let freqValue = '';

            // Handle different value types from dropdown
            if (value === null || value === undefined) {
                freqValue = 'daily'; // default
            } else if (typeof value === 'string') {
                freqValue = value;
            } else if (typeof value === 'object' && value !== null) {
                // Could be { value: 'daily', label: 'Daily' } or just { value: 'daily' }
                freqValue = value.value || value.label || value.fieldKey || '';
                console.log('[RepetitiveTaskForm] Extracted from object:', freqValue);
            }

            if (freqValue) {
                const normalizedFreq = freqValue.toLowerCase().trim();
                console.log('[RepetitiveTaskForm] >>> UPDATING FREQUENCY TO:', normalizedFreq);

                if (normalizedFreq !== selectedFrequency) {
                    setSelectedFrequency(normalizedFreq);
                    // Force a small refresh to trigger field filtering
                    setForceRefresh(prev => prev + 1);
                }
            } else {
                console.warn('[RepetitiveTaskForm] Could not extract frequency value from:', value);
            }
        }
    };

    // Filter fields based on selected frequency
    const filteredFields = useMemo(() => {
        const filtered = fields.filter(field => {
            if (!field.condition) return true;

            const { field: conditionField, value: conditionValue } = field.condition;

            if (conditionField === 'frequenceType') {
                const matches = selectedFrequency === conditionValue;
                if (matches) {
                    console.log(`[RepetitiveTaskForm] Field ${field.fieldKey} visible for frequency ${selectedFrequency}`);
                }
                return matches;
            }

            return true;
        });

        console.log('[RepetitiveTaskForm] Filtered fields for frequency', selectedFrequency, ':', filtered.length, 'fields');
        return filtered;
    }, [fields, selectedFrequency, forceRefresh]);

    // Memoize transformed values to avoid unnecessary recalculations
    const transformedInitialValues = useMemo(() => {
        return transformInitialValues(initialValues);
    }, [initialValues, transformInitialValues]);

    console.log('[RepetitiveTaskForm] Render:', {
        isEditMode,
        selectedFrequency,
        filteredFieldsCount: filteredFields.length,
        hasInitialValues: Object.keys(initialValues).length > 0,
        forceRefresh
    });

    return (
        <div className="space-y-6">
            <DynamicForm
                fields={filteredFields}
                onSubmit={handleSubmit}
                isEditMode={isEditMode}
                initialValues={transformedInitialValues}
                onFieldChange={handleFieldChange}
            />
        </div>
    );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function RepetitiveTasksPage() {
    const router = useRouter();
    const { isDark, colors, companyThemeColor } = useTheme();

    // =====================================================
    // STATE MANAGEMENT
    // =====================================================

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['taskName', 'status']);

    // Advanced filter state
    const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);

    // Column visibility state
    const [showLessColumns, setShowLessColumns] = useState(false);

    // Sort state
    const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal states
    const [isEditMode, setIsEditMode] = useState(false);
    const [open, setOpen] = useState(false);
    const [editTask, setEditTask] = useState<RepetitiveTaskData | null>(null);

    // Frequency state - MOVED TO PARENT COMPONENT
    const [selectedFrequency, setSelectedFrequency] = useState<string>('daily');

    // Delete modal state
    const [deleteModalState, setDeleteModalState] = useState<{
        isOpen: boolean;
        taskId: string | null;
        taskName: string | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        taskId: null,
        taskName: null,
        isDeleting: false
    });

    // =====================================================
    // API QUERIES & MUTATIONS
    // =====================================================

    // Get current user
    const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery() as { data?: CurrentUser; isLoading: boolean };

    // Get company users for assignedTo dropdown
    const { data: RepeattaskUsers } = useGetCompanyUsersQuery({});

    // Build API query parameters - Backend uses skip/take not page/limit
    const apiQueryParams = useMemo((): RepeatTaskQueryParams => {
        const params: RepeatTaskQueryParams = {
            // Convert page/limit to skip/take for backend
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            // Note: companyId is automatically handled by backend from JWT token (req.user.companyId)
        };

        // Add filter params that backend supports
        Object.entries(advancedFilterParams).forEach(([key, value]) => {
            if (key === 'status') params.status = value;
            if (key === 'isEnabled') params.isEnabled = value === 'true';
            if (key === 'frequenceType') params.frequenceType = value as any;
            if (key === 'projectId') params.projectId = value;
        });

        return params;
    }, [currentPage, pageSize, advancedFilterParams]);

    // Fetch repeat tasks
    // Backend automatically filters by companyId from JWT token (req.user.companyId)
    const {
        data: repeatTasksData,
        isLoading: repeatTasksLoading,
        isFetching: repeatTasksFetching,
        refetch: refetchRepeatTasks
    } = useGetRepeatTasksQuery(apiQueryParams, {
        skip: !currentUser?.id, // Only skip if user not loaded
        refetchOnMountOrArgChange: true,
    });

    // Mutations
    const [createRepetitiveTask] = useCreateRepeatTaskMutation();
    const [updateRepeatTask, { isLoading: isUpdating }] = useUpdateRepeatTaskMutation();
    const [deleteRepeatTask, { isLoading: isDeleting }] = useDeleteRepeatTaskMutation();
    const [toggleRepeatTask] = useToggleRepeatTaskMutation();

    // Extract data from API response - Backend returns { data: RepeatTaskData[], total: number }
    const rows = repeatTasksData?.data || [];
    const totalCount = repeatTasksData?.total || 0;
    const loading = userLoading || repeatTasksLoading || repeatTasksFetching;

    // =====================================================
    // FIELD DEFINITIONS & FORM CONFIGURATION
    // =====================================================

    // Transform company users for assignedTo dropdown
    const Repeattaskuser = useMemo(() => {
        if (!RepeattaskUsers?.users) return [];

        return RepeattaskUsers.users.map((user: any) => {
            const userId = user.id || user.userId || '';
            const userName = user.name || user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User';
            const userRole = user.role?.name || user.role || 'Team Member';
            const userAvatar = user.avatar || user.image || '';
            const userEmail = user.email || '';

            if (!userId) {
                console.warn('User without ID found:', user);
                return null;
            }

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
        }).filter(Boolean);
    }, [RepeattaskUsers]);

    const { data: projectsData } = useGetAllProjectsQuery({
        page: 1,
        countPerPage: 100, // Fetch enough projects for dropdown
        sort: 'name',
        sortDirection: 'asc'
    });

    // Transform projects for dropdown options
    const projectOptions = useMemo(() => {
        if (!projectsData?.data?.projects) return [];

        return projectsData.data.projects.map((project: any) => ({
            value: project.id,
            label: project.name || project.projectName || `Project ${project.id}`,
            // Include additional project data if needed
            projectData: project
        }));
    }, [projectsData]);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        repeattaskId: 150,
        taskName: 150,
        description: 150,
        frequenceType: 150,
        frequence: 150,
        priority: 150,
        whenToStart: 150,
        nextTime: 150,
        untilDate: 150,
        estimateTime: 150,
        assignedToId: 150,
        tags: 150,
        isEnabled: 150,
        action: 150,
    });

    // Repetitive task form fields
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
                fieldKey: 'projectId',
                displayName: 'Project',
                fieldType: 'DROPDOWN',
                isRequired: true,
                isEditable: true,
                displayOrder: 3,
                icon: "/icons/project/Descritpion.svg",
                iconBg: "#C81C1F",
                options: {
                    choices: projectOptions
                }
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
            // Company Job Bucket as Switch/Toggle
            {
                fieldKey: 'jobBucket',
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
            // Estimate Time with number input and time unit dropdown
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
            // Repeat Task Type (FLEXIBLE/IMPORTANT)
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
            {
                fieldKey: 'dailyConfig',
                displayName: 'Daily Configuration',
                fieldType: 'CUSTOM_DAILY',
                isRequired: false,
                isEditable: true,
                displayOrder: 11,
                condition: { field: 'frequenceType', value: 'daily' }
            },

            // WEEKLY FREQUENCY CONFIGURATION - Only show when weekly is selected
            {
                fieldKey: 'weeklyConfig',
                displayName: 'Weekly Configuration',
                fieldType: 'CUSTOM_WEEKLY',
                isRequired: false,
                isEditable: true,
                displayOrder: 12,
                condition: { field: 'frequenceType', value: 'weekly' }
            },

            // MONTHLY FREQUENCY CONFIGURATION - Only show when monthly is selected
            {
                fieldKey: 'monthlyConfig',
                displayName: 'Monthly Configuration',
                fieldType: 'CUSTOM_MONTHLY_VALIDATED',
                isRequired: false,
                isEditable: true,
                displayOrder: 13,
                condition: { field: 'frequenceType', value: 'monthly' }
            },

            // QUARTERLY FREQUENCY CONFIGURATION - Only show when quarterly is selected
            {
                fieldKey: 'quarterlyConfig',
                displayName: 'Quarterly Configuration',
                fieldType: 'CUSTOM_QUARTERLY_VALIDATED',
                isRequired: false,
                isEditable: true,
                displayOrder: 14,
                condition: { field: 'frequenceType', value: 'quarterly' }
            },

            // YEARLY FREQUENCY CONFIGURATION - Only show when yearly is selected
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

    // Field definitions matching backend Prisma schema
    const mockFieldDefinitions: FieldDefinition[] = [
        {
            fieldKey: 'repeattaskId',
            displayName: 'Task ID',
            fieldType: 'TEXT',
            isRequired: false,
            isVisible: true,
            isFreezed: true,
            displayOrder: 1,
            columnWidth: 'w-[220px]',
        },
        {
            fieldKey: 'taskName',
            displayName: 'Task Name',
            fieldType: 'TEXT',
            isRequired: true,
            isVisible: true,
            displayOrder: 2,
            columnWidth: 'w-[320px]',
        },
        {
            fieldKey: 'description',
            displayName: 'Description',
            fieldType: 'TEXTAREA',
            isRequired: false,
            isVisible: true,
            displayOrder: 3,
            columnWidth: 'w-[300px]',
        },
        {
            fieldKey: 'frequenceType',
            displayName: 'Type',
            fieldType: 'DROPDOWN',
            isRequired: true,
            isVisible: true,
            displayOrder: 4,
            columnWidth: 'w-[180px]',
            options: {
                choices: ['FLEXIBLE', 'IMPORTANT']
            }
        },
        {
            fieldKey: 'frequence',
            displayName: 'Frequency',
            fieldType: 'DROPDOWN',
            isRequired: true,
            isVisible: true,
            displayOrder: 5,
            columnWidth: 'w-[250px]!',
            options: {
                choices: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']
            }
        },
        {
            fieldKey: 'priority',
            displayName: 'Priority',
            fieldType: 'DROPDOWN',
            isRequired: false,
            isVisible: true,
            displayOrder: 6,
            columnWidth: 'w-[140px]',
            options: {
                choices: ['low', 'medium', 'high', 'urgent']
            }
        },
        {
            fieldKey: 'whenToStart',
            displayName: 'Start Date',
            fieldType: 'DATE',
            isRequired: true,
            isVisible: true,
            displayOrder: 7,
            columnWidth: 'w-[170px]',
        },
        {
            fieldKey: 'nextTime',
            displayName: 'Next Run',
            fieldType: 'DATE',
            isRequired: false,
            isVisible: true,
            displayOrder: 8,
            columnWidth: 'w-[170px]',
        },
        {
            fieldKey: 'untilDate',
            displayName: 'Until Date',
            fieldType: 'TEXT',
            isRequired: false,
            isVisible: true,
            displayOrder: 9,
            columnWidth: 'w-[170px]',
        },
        {
            fieldKey: 'estimateTime',
            displayName: 'Estimate',
            fieldType: 'TEXT',
            isRequired: true,
            isVisible: true,
            displayOrder: 10,
            columnWidth: 'w-[130px]',
        },
        {
            fieldKey: 'assignedToId',
            displayName: 'Assigned To',
            fieldType: 'MULTISELECT',
            isRequired: false,
            isVisible: true,
            displayOrder: 11,
            columnWidth: 'w-[180px]',
            options: {
                multiple: true,
                choices: []
            }
        },
        {
            fieldKey: 'tags',
            displayName: 'Tags',
            fieldType: 'CREATABLE_DROPDOWN',
            isRequired: false,
            isVisible: true,
            displayOrder: 12,
            columnWidth: 'w-[220px]',
            options: {
                multiple: true,
                choices: []
            }
        },
        {
            fieldKey: 'isEnabled',
            displayName: 'Enabled',
            fieldType: 'CHECKBOX',
            isRequired: false,
            isVisible: true,
            displayOrder: 13,
            columnWidth: 'w-[120px]',
        },
        {
            fieldKey: 'action',
            displayName: 'Action',
            fieldType: 'ACTION',
            isRequired: false,
            isVisible: true,
            displayOrder: 14,
            columnWidth: 'w-[180px]',
        }
    ];

    const visibleFields: FieldDefinition[] = useMemo(() => {
        if (!showLessColumns) {
            return mockFieldDefinitions;
        }

        const frozenColumns = ['repeattaskId'];
        const columnsToShow = 5;

        let nonFrozenCount = 0;
        return mockFieldDefinitions.filter((field) => {
            if (frozenColumns.includes(field.fieldKey)) {
                return true;
            }
            nonFrozenCount++;
            return nonFrozenCount <= columnsToShow;
        });
    }, [showLessColumns]);

    // =====================================================
    // QUERY PARAMETERS
    // =====================================================

    const queryParams = useMemo((): QueryParams => {
        const params: QueryParams = {
            page: currentPage,
            countPerPage: pageSize
        };

        if (sort) {
            params.sort = sort.field;
            params.sortDirection = sort.direction;
        }

        if (searchTerm && searchTerm.trim() && selectedColumns.length > 0) {
            const trimmedTerm = searchTerm.trim();
            selectedColumns.forEach(column => {
                params[column] = `cn:${trimmedTerm}`;
            });
        }

        Object.keys(advancedFilterParams).forEach(key => {
            if (!params[key]) {
                params[key] = advancedFilterParams[key];
            }
        });

        return params;
    }, [searchTerm, selectedColumns, advancedFilterParams, currentPage, pageSize, sort]);

    // =====================================================
    // EVENT HANDLERS
    // =====================================================

    // Search handlers
    const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
        setSearchTerm(term);
        setSelectedColumns(columns);
        setCurrentPage(1);
    }, []);

    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
    }, []);

    // Advanced filter handlers
    const handleAdvancedFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
        setOpenAdvancedFilter(true);
    }, []);

    const handleAdvancedFilterClose = useCallback(() => {
        setOpenAdvancedFilter(false);
        setFilterAnchorEl(null);
    }, []);

    const handleApplyAdvancedFilters = useCallback((filters: FilterCondition[], queryParams: Record<string, string>) => {
        setAdvancedFilters(filters);
        setAdvancedFilterParams(queryParams);
        setCurrentPage(1);
        console.log('Applied advanced filters:', { filters, queryParams });
    }, []);

    const handleClearAdvancedFilters = useCallback(() => {
        setAdvancedFilters([]);
        setAdvancedFilterParams({});
        setCurrentPage(1);
    }, []);

    // Toggle column visibility
    const handleToggleColumns = useCallback(() => {
        setShowLessColumns(prev => !prev);
    }, []);

    const openCreateModal = () => {
        if (!currentUser?.company?.id) {
            toast.error("Unable to create task. Please refresh the page and try again.");
            return;
        }

        // Set default project if available
        const defaultProject = projectOptions.length > 0 ? projectOptions[0].value : '';

        setEditTask({
            id: '',
            taskName: '',
            description: '',
            frequency: 'weekly',
            status: 'active',
            isActive: true,
            repeatTaskType: 'FLEXIBLE',
            frequenceType: 'daily',
            projectId: defaultProject // Set default project
        });
        setSelectedFrequency('daily');
        setIsEditMode(false);
        setOpen(true);
    };

    const handleModalClose = () => {
        setOpen(false);
        setIsEditMode(false);
        setEditTask(null);
        setSelectedFrequency('daily'); // Reset frequency on close
    };

    const handleEditTaskFromRow = (taskData: RepetitiveTaskData) => {
        if (!taskData) {
            toast.error("Task data not available");
            return;
        }

        console.log("Editing task:", taskData);
        setEditTask(taskData);
        setIsEditMode(true);

        // Set frequency based on task data
        if (taskData.frequenceType) {
            const freqValue = typeof taskData.frequenceType === 'object'
                ? (taskData.frequenceType as any).value
                : taskData.frequenceType;
            setSelectedFrequency(String(freqValue).toLowerCase());
        } else {
            setSelectedFrequency('daily');
        }
        setOpen(true);
    };

    const transformFormValues = (values: Record<string, unknown>) => {
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
        let repeatTaskType = 'FLEXIBLE'; // default
        if (values.repeatTaskType) {
            if (typeof values.repeatTaskType === 'object' && values.repeatTaskType !== null) {
                repeatTaskType = (values.repeatTaskType as { value?: string }).value || 'FLEXIBLE';
            } else {
                repeatTaskType = String(values.repeatTaskType);
            }
        }

        // Get frequency schedule type (daily, weekly, monthly, etc.)
        let frequencyScheduleType = selectedFrequency; // Use the controlled state from parent
        if (values.frequenceType) {
            if (typeof values.frequenceType === 'object' && values.frequenceType !== null) {
                frequencyScheduleType = (values.frequenceType as { value?: string }).value || selectedFrequency;
            } else {
                frequencyScheduleType = String(values.frequenceType);
            }
        }

        // Build frequency configuration based on frequencyScheduleType
        let frequencyConfig = {};
        const frequence = frequencyScheduleType.toUpperCase();

        // Handle date formatting to prevent "Invalid Date"
        const formatDateForAPI = (dateValue: any): string | undefined => {
            if (!dateValue) return undefined;

            try {
                const date = new Date(dateValue);
                return isNaN(date.getTime()) ? undefined : date.toISOString();
            } catch {
                return undefined;
            }
        };
        console.log("values",values)
        switch (frequencyScheduleType.toLowerCase()) {
            case 'daily':
                frequencyConfig = {
                    frequence: frequence,
                    day: {
                        days: values['day.days'] || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        time: convertTo24Hour(values['day.time'] || '09:00')
                    }
                };
                break;
            case 'weekly':
                frequencyConfig = {
                    frequence: frequence,
                    week: {
                        day: values['week.day'] || 'monday',
                        time: convertTo24Hour(values['week.time'] || '09:00')
                    }
                };
                break;
            case 'monthly':
                frequencyConfig = {
                    frequence: frequence,
                    month: {
                        day: Math.min(28, Math.max(1, Number(values['month.day']) || 1)),
                        time: convertTo24Hour(values['month.time'] || '09:00')
                    }
                };
                break;
            case 'quarterly':
                frequencyConfig = {
                    frequence: frequence,
                    quartly: {
                        months: values['quartly.months'] || [1, 4, 7, 10],
                        day: Math.min(28, Math.max(1, Number(values['quartly.day']) || 1)),
                        time: convertTo24Hour(values['quartly.time'] || '09:00')
                    }
                };
                break;
            case 'yearly':
                frequencyConfig = {
                    frequence: frequence,
                    yearly: {
                        date: values['yearly.date'] ? new Date(values['yearly.date'] as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        time: convertTo24Hour(values['yearly.time'] || '09:00')
                    }
                };
                break;
            default:
                frequencyConfig = {
                    frequence: 'DAILY',
                    day: {
                        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        time: convertTo24Hour('09:00')
                    }
                };
        }

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

        // Transform projectId - extract value from dropdown object if needed
        let projectId = '';
        if (values.projectId) {
            if (typeof values.projectId === 'object' && values.projectId !== null) {
                projectId = (values.projectId as { value?: string }).value || String(values.projectId);
            } else {
                projectId = String(values.projectId);
            }
        }

        // Validate that projectId is provided
        if (!projectId) {
            throw new Error("Project selection is required");
        }

        // Transform dates with validation
        const whenToStart = formatDateForAPI(values.whenToStart) || new Date().toISOString();
        const untilDate = formatDateForAPI(values.untilDate);

        return {
            taskName: String(values.taskName || ''),
            description: String(values.description || ''),
            priority: typeof values.priority === 'object' ? (values.priority as { value?: string }).value : String(values.priority || 'medium'),
            estimateTime: String(estimateTimeInSeconds),
            jobBucket: "reporting", // STATIC VALUE
            assignedToId: assignedToIds,
            tags: tags,
            projectId: projectId, // Use the extracted projectId
            frequenceType: repeatTaskType, // FLEXIBLE or IMPORTANT
            ...frequencyConfig,
            whenToStart: whenToStart,
            untilDate: untilDate,
            isEnabled: values.isEnabled !== false,
        };
    };

    const handleFormSubmit = async (values: Record<string, unknown>) => {
        if (!currentUser?.company?.id || !currentUser?.id) {
            throw new Error("User information not found");
        }

        console.log("Raw form values for repetitive task:", values);

        // Transform form data for API
        const repetitiveTaskData = transformFormValues(values);

        console.log("Transformed repetitive task data:", repetitiveTaskData);

        try {
            if (isEditMode && editTask?.id) {
                // UPDATE operation - Include companyId in the request
                const result = await updateRepeatTask({
                    taskId: editTask.id,
                    updateData: {
                        ...repetitiveTaskData,
                        companyId: currentUser.company.id // Add companyId for edit
                    }
                }).unwrap();
                toast.success("Repetitive task updated successfully!");
                handleModalClose();
                await refetchRepeatTasks();
                return result;
            } else {
                // CREATE operation  
                const result = await createRepetitiveTask({
                    companyId: currentUser.company.id,
                    userId: currentUser.id,
                    repetitiveTaskData
                }).unwrap();
                toast.success("Repetitive task created successfully!");
                handleModalClose();
                await refetchRepeatTasks();
                return result;
            }
        } catch (error: unknown) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} repetitive task:`, error);

            if (error && typeof error === 'object' && 'data' in error) {
                console.error('Error details:', error.data);
            }

            throw new Error((error as { data?: { message?: string } })?.data?.message ||
                `Failed to ${isEditMode ? 'update' : 'create'} repetitive task`);
        }
    };

    // Delete handlers
    const handleDeleteTask = async (taskId: string, taskName: string) => {
        if (!taskId) {
            toast.error("Task ID is missing");
            return;
        }

        setDeleteModalState({
            isOpen: true,
            taskId,
            taskName,
            isDeleting: false
        });
    };

    const handleConfirmDelete = async () => {
        const { taskId, taskName } = deleteModalState;

        if (!taskId) {
            toast.error("Task ID is missing");
            return;
        }

        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

        try {
            await deleteRepeatTask(taskId).unwrap();
            toast.success(`Task "${taskName}" deleted successfully`);
            await refetchRepeatTasks();

            setDeleteModalState({
                isOpen: false,
                taskId: null,
                taskName: null,
                isDeleting: false
            });
        } catch (error: unknown) {
            console.error('Failed to delete task:', error);
            const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Failed to delete task. Please try again.';
            toast.error(errorMessage);
            setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalState({
            isOpen: false,
            taskId: null,
            taskName: null,
            isDeleting: false
        });
    };

    // =====================================================
    // TABLE CELL RENDERER
    // =====================================================

    const getCellRenderer = ({ field, row, value }: { field: FieldDefinition; row: RepetitiveTaskData; value: unknown }) => {
        // Action column
        if (field.fieldKey === 'action') {
            return (
                <div className="flex items-center justify-center gap-1">
                    <button
                        type="button"
                        title="Edit"
                        className="w-8 h-8 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTaskFromRow(row);
                        }}
                    >
                        <Image src={editpencil} alt="Edit" width={12} height={12} />
                    </button>

                    <button
                        type="button"
                        title="Delete"
                        className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(row.id, row.taskName || row.name || 'this task');
                        }}
                    >
                        <Image src={deleteForever} alt="Delete" width={12} height={12} />
                    </button>

                    <button
                        type="button"
                        title="More"
                        className="w-8 h-8 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: open more actions menu
                        }}
                    >
                        <Image src={threeDot} alt="More" width={12} height={12} />
                    </button>
                </div>
            );
        }

        // Task ID column (frozen, clickable) - Backend uses 'repeattaskId'
        if (field.fieldKey === 'repeattaskId' && value) {
            const displayId = String(value);
            return (
                <div className="flex items-center gap-1">
                    <div
                        className="flex-1 cursor-pointer text-lg font-semibold underline text-[#c81c1f] border-r-[1px] border-[#d8d8d8]"
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Navigate to task detail page
                            // router.push(`/lazykill/repetitive-tasks/${row.id}`);
                        }}
                    >
                        {displayId}
                    </div>
                    <div
                        className="px-4 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditTaskFromRow(row);
                        }}
                    >
                        <Image src={PagerIcon} alt="Pager Icon" width={18} height={18} />
                    </div>
                </div>
            );
        }

        // Priority dropdown
        if (field.fieldKey === 'priority') {
            const choices = (field.options as FieldOptions)?.choices ?? [];
            const options: StatusOption[] = choices.map((c: OptionItem) => ({
                fieldKey: String(c.value || c),
                displayName: c.label ?? String(c.value || c),
                color: c.color ?? '#6b7280',
            }));

            const currentKey = typeof value === 'string' ? value : '';

            return (
                <StatusDropdown
                    currentStatus={currentKey}
                    options={options}
                    onStatusChange={async (newKey: string) => {
                        try {
                            await updateRepeatTask({
                                taskId: row.id,
                                updateData: { priority: newKey }
                            }).unwrap();
                            toast.success(`Priority updated to "${newKey}"`);
                        } catch (error) {
                            console.error("Failed to update priority:", error);
                            toast.error("Failed to update priority");
                        }
                    }}
                    onUpdateOption={async () => { }}
                    onAddOption={async () => { }}
                    onDeleteOption={async () => { }}
                    onReorderOptions={async () => { }}
                    disabled={false}
                    className="w-fit rounded-lg! h-[21px]!"
                />
            );
        }

        // Frequency Type (FLEXIBLE/IMPORTANT)
        if (field.fieldKey === 'frequenceType' && value) {
            const frequenceTypeColors = {
                'FLEXIBLE': '#3b82f6', // blue
                'IMPORTANT': '#ef4444', // red
            };
            return (
                <span
                    className="px-3 py-1 text-sm font-medium rounded-full text-white"
                    style={{ backgroundColor: frequenceTypeColors[value as keyof typeof frequenceTypeColors] || '#6b7280' }}
                >
                    {String(value)}
                </span>
            );
        }

        // Frequency (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
        if (field.fieldKey === 'frequence' && value) {
            const frequenceColors = {
                'DAILY': '#10b981', // green
                'WEEKLY': '#3b82f6', // blue
                'MONTHLY': '#f59e0b', // amber
                'QUARTERLY': '#8b5cf6', // purple
                'YEARLY': '#ec4899', // pink
            };
            return (
                <span
                    className="px-3 py-1 text-sm font-medium rounded-full text-white"
                    style={{ backgroundColor: frequenceColors[value as keyof typeof frequenceColors] || '#6b7280' }}
                >
                    {String(value)}
                </span>
            );
        }

        // Date fields - Backend uses 'whenToStart', 'nextTime', 'untilDate'
        if (field.fieldKey === 'whenToStart' && value) {
            try {
                return (
                    <div className="text-sm font-semibold border-[1px] border-[#309b71] py-0.5 rounded-full text-[#309b71] px-[27px] w-fit">
                        {DateTime.fromISO(value as string).toFormat('MMM dd, yyyy')}
                    </div>
                );
            } catch (e) {
                return <div className="text-sm text-gray-400">Invalid date</div>;
            }
        }

        // Next Run Date - handle null/undefined
        if (field.fieldKey === 'nextTime') {
            if (!value || value === null || value === undefined) {
                return <div className="text-sm text-gray-400 italic">Not scheduled</div>;
            }
            try {
                return (
                    <div className="text-sm font-semibold border-[1px] border-[#309b71] py-0.5 rounded-full text-[#309b71] px-[27px] w-fit">
                        {DateTime.fromISO(value as string).toFormat('MMM dd, yyyy')}
                    </div>
                );
            } catch (e) {
                return <div className="text-sm text-gray-400">Invalid date</div>;
            }
        }

        // Until Date - can be "infinity" or a date or null
        if (field.fieldKey === 'untilDate') {
            if (!value || value === null || value === undefined) {
                return <div className="text-sm text-gray-400 italic">No end date</div>;
            }
            if (String(value).toLowerCase() === 'infinity') {
                return (
                    <div className="text-sm font-semibold text-blue-600 px-2">
                        ∞ Infinity
                    </div>
                );
            }
            try {
                return (
                    <div className="text-sm font-semibold border-[1px] border-[#309b71] py-0.5 rounded-full text-[#309b71] px-[27px] w-fit">
                        {DateTime.fromISO(value as string).toFormat('MMM dd, yyyy')}
                    </div>
                );
            } catch (e) {
                return <div className="text-sm">{String(value)}</div>;
            }
        }

        // Estimate Time (in seconds)
        if (field.fieldKey === 'estimateTime' && value) {
            const seconds = parseInt(String(value), 10);
            if (isNaN(seconds)) return <div className="text-sm">{String(value)}</div>;

            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            return (
                <div className="text-sm font-medium">
                    {hours > 0 && `${hours}h `}
                    {minutes > 0 && `${minutes}m `}
                    {secs > 0 && `${secs}s`}
                    {hours === 0 && minutes === 0 && secs === 0 && '0s'}
                </div>
            );
        }

        // Is Enabled (boolean)
        if (field.fieldKey === 'isEnabled') {
            const isEnabled = Boolean(value);
            return (
                <div className="flex items-center justify-center">
                    <button
                        className={`px-3 py-1 text-xs font-medium rounded-full ${isEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await toggleRepeatTask(row.id).unwrap();
                                toast.success(`Task ${isEnabled ? 'disabled' : 'enabled'} successfully`);
                            } catch (error) {
                                console.error("Failed to toggle task:", error);
                                toast.error("Failed to toggle task");
                            }
                        }}
                    >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            );
        }

        // Tags
        if (field.fieldKey === 'tags' && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1">
                    {(value as string[]).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            );
        }

        // Assigned To (User avatars) - Backend uses assignedToId string array
        if (field.fieldKey === 'assignedToId' && Array.isArray(value)) {
            return (
                <div className="flex -space-x-2 items-center justify-center w-full">
                    {(value as string[]).slice(0, 3).map((userId: string, index: number) => (
                        <div
                            key={userId}
                            className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white overflow-hidden"
                            title={userId}
                        >
                            <span className="uppercase">
                                {userId.charAt(0) || '?'}
                            </span>
                        </div>
                    ))}
                    {(value as string[]).length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                            +{(value as string[]).length - 3}
                        </div>
                    )}
                </div>
            );
        }

        // Text fields
        if (field.fieldKey === 'taskName' || field.fieldKey === 'description') {
            return <div className="text-sm capitalize">{value as string}</div>;
        }

        return undefined;
    };

    // =====================================================
    // TITLE BUTTONS
    // =====================================================

    const taskTitleButtons = [
        {
            name: "Export",
            icon: <Image src={excela} alt="Export" width={18} height={18} />,
            onClick: () => {
                // TODO: Implement export functionality
                toast.info("Export functionality coming soon");
            },
        },
        {
            name: "Add Task",
            icon: <FiPlus />,
            onClick: () => openCreateModal(),
        },
    ];

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <ProtectedRoute>
            <div>
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
                                        { label: 'Project Management', href: '/dashboard' },
                                        { label: 'Repetitive Tasks', href: '/lazykill/repetitive-tasks' },
                                    ]}
                                />
                            </div>

                            {/* Title Section */}
                            <div
                                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                                style={{
                                    backgroundColor: isDark ? colors.dark.sidebar : undefined
                                }}
                            >
                                <Title projectTitleObj={taskTitleButtons} name="Repetitive Task List" />
                            </div>

                            {/* Filter Bar */}
                            <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 flex justify-end items-center h-fit' style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}>
                                <div className="flex items-center gap-2">
                                    <SearchBar
                                        onSearch={handleSearch}
                                        placeholder="Search tasks"
                                        defaultSelectedColumns={['taskName', 'status']}
                                        defaultOperator="cn"
                                        showOperatorSelector={false}
                                        className="flex-shrink-0"
                                    />

                                    {/* Advanced Filters Button */}
                                    <button
                                        onClick={handleAdvancedFilterClick}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                        title="Advanced Filters"
                                    >
                                        <Image src={FilterIcon} alt="Filters" width={16} height={16} />
                                        <span>Add Filters</span>
                                        {advancedFilters.length > 0 && (
                                            <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                                {advancedFilters.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Sort Button */}
                                    <button
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                        title="Sort Tasks"
                                    >
                                        <Image src="/sort.svg" alt="Sort" width={16} height={16} />
                                        <span>Sort</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pagination Bar */}
                            <div className='mx-5 mt-11 py-2 px-2 rounded flex h-fit'>
                                <Bar
                                    total={totalCount}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    onToggleColumns={handleToggleColumns}
                                    showLessColumns={showLessColumns}
                                />
                            </div>

                            {/* Table */}
                            {/* Table */}
                            <div className="flex-1 mx-5 mb-5 mt-2 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 overflow-auto">
                                {loading ? (
                                    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                                        <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                                    </div>
                                ) : (
                                    <FinalTable
                                        data={rows as unknown as Record<string, unknown>[]}
                                        fieldDefinitions={visibleFields}
                                        rowKey="id"
                                        stickyHeader
                                        appearance="figma"
                                        frozenColumnKeys={['repeattaskId']} // Fixed typo: was 'repeatTaskId'
                                        sortConfig={sort}
                                        onSortChange={(cfg) => {
                                            if (cfg) {
                                                setSort(cfg);
                                                setCurrentPage(1);
                                            }
                                        }}
                                        loading={loading}
                                        getCellRenderer={getCellRenderer as any}
                                        // ADD THESE PROPS FOR COLUMN WIDTHS:
                                        columnWidths={columnWidths}
                                        onColumnResize={(key, width) => setColumnWidths((prev) => ({ ...prev, [key]: width }))}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Create/Edit Modal - UPDATED with frequency props */}
                        <FormModal
                            isOpen={open}
                            onClose={handleModalClose}
                            title={isEditMode ? "Edit Repetitive Task" : "Create Repetitive Task"}
                            size="lg"
                            maxHeight="95vh"
                            className="overflow-y-auto"
                        >
                            <div className="h-full p-4 overflow-y-auto">
                                <RepetitiveTaskForm
                                    fields={repetitiveTaskFields}
                                    onSubmit={handleFormSubmit}
                                    isEditMode={isEditMode}
                                    initialValues={(editTask ?? {}) as Record<string, unknown>}
                                    onClose={handleModalClose}
                                    Repeattaskuser={Repeattaskuser}
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
                        />

                        {/* Delete Confirmation Modal */}
                        <DeleteConfirmationModal
                            isOpen={deleteModalState.isOpen}
                            onClose={handleCancelDelete}
                            onConfirm={handleConfirmDelete}
                            title="Are you sure?"
                            message="Do you really want to delete this repetitive task permanently?"
                            itemName={deleteModalState.taskName || undefined}
                            isDeleting={deleteModalState.isDeleting}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}