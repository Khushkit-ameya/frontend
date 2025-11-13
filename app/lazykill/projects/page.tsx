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
import { FieldType } from "@/components/common/forms/DynamicForm";
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
import { DateTime } from 'luxon'
import ExportModal from "@/components/common/ExportModal";
import ProjectExportModal from "@/components/common/ProjectExportModal";
import { useGetAllTasksQuery } from "@/store/api_query/LazyKill/lazyKill.api";
import { setTheme, setCompanyThemeColor } from '@/store/api_query/global';
import {
    useGetProjectFieldsQuery,
    useGetAllProjectsQuery,
    useLazyGetAllProjectsQuery,
    useUpdateProjectMutation,
    useCreateProjectMutation,
    useDeleteProjectMutation,
    useUpdateProjectFieldMutation,
    useUpdateProjectFieldDisplayNameMutation,
    useUpdateProjectFieldDisplayOrderMutation,
    useReorderProjectFieldsMutation,
    useGetProjectFieldsTableQuery,
    useGetProjectMDMInfoQuery,
    useCreateFieldOptionMutation,
    useUpdateFieldOptionMutation,
    useDeleteFieldOptionMutation,
    useUpdateFieldOptionSequenceMutation,
    useUpdateProjectDueDateWithTimelineMutation,
    useUpdateProjectTimelineMutation,
    useUpdateProjectTagsMutation,
    useCreatePriorityOptionMutation,
    useUpdatePriorityOptionMutation,
    useDeletePriorityOptionMutation,
    useUpdateProjectPriorityMutation,
    useUpdateProjectStatusMutation
} from "@/store/api_query/LazyKill/project.api";
import { useGetContactFieldsQuery } from "@/store/api_query/BizAcceleractorContact.api";
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";
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
import ManagerSelector from "@/components/Project/ManagerSelector";
import TeamSelector from "@/components/Project/TeamSelector";
import PagerIcon from '@/assests/pager.svg'
import checkProgress from '../../../assests/checkprogress.png'
import DueDatePicker from '@/components/common/DueDatePicker';
import TagsEditor from '../../../components/common/TagsEditor';
import AdvancedFilterPopover from '../../../components/common/AdvancedFilterPopover';
import type { FilterCondition } from '../../../components/common/AdvancedFilterPopover';
import PersonFilterPopover from '../../../components/Project/PersonFilterPopover';
import SortFilterPopover from '../../../components/Project/SortFilterPopover';
import GanttViewPopover from '../../../components/Project/GanttViewPopover';
import editpencil from '@/assests/editpencil.png';
import deleteForever from '@/assests/delete_forever.png';
import threeDot from '@/assests/threeDots.png';
import excela from '@/public/excel-p.svg';
import { de, fr } from "date-fns/locale";
import FilterIcon from '@/assests/filter-icon.png'

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
    // Add other possible properties that might exist
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

// Define proper TypeScript interfaces
interface ProjectData {
    id: string;
    name?: string;
    projectName?: string;
    description?: string;
    status?: string | { value: string };
    priority?: string | { value: string };
    progress?: number;
    timeline?: string[] | { start: string; end: string };
    startDate?: string;
    dueDate?: string | Array<{ newDueDate: string }>;
    projectType?: string | { value: string };
    tags?: string[];
    team?: Array<{ id?: string; userId?: string; value?: string; firstName?: string; lastName?: string; name?: string; avatar?: string }>;
    manager?: Array<{ id?: string; userId?: string; value?: string; firstName?: string; lastName?: string; name?: string; avatar?: string }>;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    documents?: unknown[];
    files?: unknown[];
    attachments?: unknown[];
    projectTags?: string[];
    _id?: string;
}

interface ProjectFieldsResponse {
    data?: ProjectField[];
}

interface ProjectField {
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

interface OptionItem {
    id?: string;
    value?: string;
    label?: string;
    displayName?: string;
    color?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    avatar?: string;
    name?: string;
}

interface ProjectFieldsTableResponse {
    data?: FieldDefinition[];
}

interface ProjectMDMInfoResponse {
    data?: {
        id: string;
    };
}

interface ProjectsResponse {
    data?: {
        projects: ProjectData[];
        total: number;
    };
}

interface CurrentUser {
    id: string;
    company: {
        id: string;
    };
}

interface CurrentUserResponse {
    data?: CurrentUser;
}

interface QueryParams {
    page: number;
    countPerPage: number;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
    [key: string]: string | number | undefined;
}

// interface TimelineValue {
//     start: string;
//     end: string;
// }

interface StatusOption {
    fieldKey: string;
    displayName: string;
    color: string;
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
export default function Project() {
    const router = useRouter();
    const { isDark, colors, companyThemeColor } = useTheme();

    // Search & filter params
    const [searchQueryParams, setSearchQueryParams] = useState<Record<string, string>>({});

    // Advanced filter state
    const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);

    // Person filter state
    const [personFilterAnchorEl, setPersonFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openPersonFilter, setOpenPersonFilter] = useState(false);
    const [personFilters, setPersonFilters] = useState<{
        managerIds?: string[];
        teamIds?: string[];
    }>({});

    // Sort filter state
    const [sortFilterAnchorEl, setSortFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openSortFilter, setOpenSortFilter] = useState(false);

    // Column visibility state for Show More/Show Less button
    const [showLessColumns, setShowLessColumns] = useState(false);

    // Sort state wired to API
    const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Build query parameters for search and pagination according to API format (operator:value)
    const queryParams = useMemo((): QueryParams => {
        const params: QueryParams = {
            page: currentPage,
            countPerPage: pageSize
        };

        // Add sorting parameters
        if (sort && sort.field) {
            params.sort = sort.field;
            params.sortDirection = sort.direction;
        }

        // Add search + advanced filter params
        Object.assign(params, searchQueryParams, advancedFilterParams);

        // Add person filters (manager and team)
        if (personFilters.managerIds && personFilters.managerIds.length > 0) {
            params['manager.id'] = `in:${personFilters.managerIds.join(',')}`;
        }

        if (personFilters.teamIds && personFilters.teamIds.length > 0) {
            params['team.id'] = `in:${personFilters.teamIds.join(',')}`;
        }

        return params;
    }, [searchQueryParams, advancedFilterParams, currentPage, pageSize, sort, personFilters]);

    // Queries and Mutations with proper typing
    const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery() as { data?: CurrentUser; isLoading: boolean };
    const { data: contactFields, isLoading: contactFieldsLoading, isError: contactFieldsError } = useGetContactFieldsQuery();
    const { data: projectFieldsData, isLoading: projectFieldsLoading, isError: projectFieldsError } = useGetProjectFieldsQuery() as { data?: ProjectFieldsResponse; isLoading: boolean; isError: boolean };
    const { data: projectFieldsTableData, isLoading: projectFieldsTableLoading, isError: projectFieldsTableError, isFetching: projectFieldsTableFetching } = useGetProjectFieldsTableQuery() as { data?: ProjectFieldsTableResponse; isLoading: boolean; isError: boolean; isFetching: boolean };
    const { data: projectsData, isLoading: projectsLoading } = useGetAllProjectsQuery(queryParams) as { data?: ProjectsResponse; isLoading: boolean };
    const [triggerGetAllProjects] = useLazyGetAllProjectsQuery();
    const { data: projectMDMInfo, isLoading: mdmInfoLoading } = useGetProjectMDMInfoQuery() as { data?: ProjectMDMInfoResponse; isLoading: boolean };
    const [updateProject] = useUpdateProjectMutation();
    const [createProject] = useCreateProjectMutation();
    const [deleteProject] = useDeleteProjectMutation();
    const [updateProjectField] = useUpdateProjectFieldMutation();
    const [updateProjectFieldDisplayName] = useUpdateProjectFieldDisplayNameMutation();
    const [updateProjectFieldDisplayOrder] = useUpdateProjectFieldDisplayOrderMutation();
    const [reorderProjectFields] = useReorderProjectFieldsMutation();
    const [createFieldOption] = useCreateFieldOptionMutation();
    const [updateFieldOption] = useUpdateFieldOptionMutation();
    const [deleteFieldOption] = useDeleteFieldOptionMutation();
    const [updateFieldOptionSequence] = useUpdateFieldOptionSequenceMutation();
    const [updateProjectDueDateWithTimeline] = useUpdateProjectDueDateWithTimelineMutation();
    const [updateProjectTimeline] = useUpdateProjectTimelineMutation();
    const [updateProjectTags] = useUpdateProjectTagsMutation();
    const [createPriorityOption] = useCreatePriorityOptionMutation();
    const [updatePriorityOption] = useUpdatePriorityOptionMutation();
    const [deletePriorityOption] = useDeletePriorityOptionMutation();
    const [updateProjectPriority] = useUpdateProjectPriorityMutation();
    const [updateProjectStatus] = useUpdateProjectStatusMutation();
    const [isEditMode, setIsEditMode] = useState(false);
    const [open, setOpen] = useState(false);
    const [editProject, setEditProject] = useState<ProjectData | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showSigModal, setShowSigModal] = useState(false);
    const [ganttViewOpen, setGanttViewOpen] = useState(false);
    const [ganttAnchorEl, setGanttAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedProjectForGantt, setSelectedProjectForGantt] = useState<ProjectData | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const { data: allTasksData } = useGetAllTasksQuery({
        page: 1,
        countPerPage: 10000, // Large number to get all tasks
    });
    const [deleteModalState, setDeleteModalState] = useState<{
        isOpen: boolean;
        projectId: string | null;
        projectName: string | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        projectId: null,
        projectName: null,
        isDeleting: false
    });

    // Manager Selector State
    const [managerSelectorState, setManagerSelectorState] = useState<{
        isOpen: boolean;
        projectId: string;
        currentManagers: UserObject[];
        anchorEl: HTMLElement | null;
    }>({
        isOpen: false,
        projectId: '',
        currentManagers: [],
        anchorEl: null
    });

    // Team Selector State  
    const [teamSelectorState, setTeamSelectorState] = useState<{
        isOpen: boolean;
        projectId: string;
        currentTeam: UserObject[];
        anchorEl: HTMLElement | null;
    }>({
        isOpen: false,
        projectId: '',
        currentTeam: [],
        anchorEl: null
    });

    // Resolve field definitions similar to leads page
    const finalFields: FieldDefinition[] = useMemo(() => {
        const fromApi = (Array.isArray(projectFieldsTableData?.data) ? projectFieldsTableData.data : []) as FieldDefinition[];
        const mergedByKey = new Map<string, FieldDefinition>();
        // const mergedByKey = new Map<string, any>();
        fromApi.forEach((f: FieldDefinition) => {
            if (!f) return;
            mergedByKey.set(f.fieldKey, { ...mergedByKey.get(f.fieldKey), ...f });
        });

        // Enrich fields with options from projectFieldsData
        if (projectFieldsData?.data && Array.isArray(projectFieldsData.data)) {
            (projectFieldsData.data as ProjectField[]).forEach((field: ProjectField) => {
                if (field && field.fieldKey && field.options) {
                    const existing = mergedByKey.get(field.fieldKey);
                    if (existing) {
                        // Transform options to FieldOptions format with choices array
                        const transformedOptions: any = {};
                        if (Array.isArray(field.options)) {
                            transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                                id: opt.id || opt.value,
                                value: opt.value || opt.id,
                                label: opt.label || opt.displayName || String(opt.value || opt),
                                displayName: opt.displayName || opt.label,
                                color: opt.color || '#6b7280',
                            }));
                        }
                        mergedByKey.set(field.fieldKey, {
                            ...existing,
                            options: transformedOptions
                        });
                    }
                }
            });
        }

        let fields: FieldDefinition[] = [];
        if (fromApi?.length > 0) {
            fields = mapBackendListToFrontend([...Array.from(mergedByKey.values()) as any, {
                fieldKey: 'action',
                displayName: 'Action',
                fieldType: 'ACTION',
                isRequired: false,
                // isEditable: false,
                options: {},
                displayOrder: fromApi?.length + 1,
                isCoreField: false,
                isVisible: true,
                isReadOnly: false,
                isSearchable: false,
                isFilterable: false,
                isSortable: false,
                isFreezed: false,
                columnWidth: 'w-[50px]',
                defaultValue: null,
            }]);
        }
        return fields;
    }, [projectFieldsTableData, projectFieldsTableFetching, projectFieldsData]);

    // Filter columns based on showLessColumns state
    // When showLessColumns is true, show ONLY the first 5 columns (after the frozen column) and hide the rest
    const visibleFields: FieldDefinition[] = useMemo(() => {
        if (!showLessColumns) {
            return finalFields;
        }

        // Keep the frozen column 'projectId' always visible
        // Show only the first 5 columns after projectId when showLessColumns is true
        const frozenColumns = ['projectId']; // Always visible
        const columnsToShow = 5;

        let nonFrozenCount = 0;
        return finalFields.filter((field) => {
            // Always show frozen columns
            if (frozenColumns.includes(field.fieldKey)) {
                return true;
            }

            // Show only the first 5 non-frozen columns when showLessColumns is true
            nonFrozenCount++;
            return nonFrozenCount <= columnsToShow;
        });
    }, [finalFields, showLessColumns, projectFieldsTableFetching]);

    const projectFields = useMemo(() => {
        if (!projectFieldsData?.data) return [];

        return (projectFieldsData.data as ProjectField[])
            .filter((field: ProjectField) => field && field.fieldKey && field.fieldType)
            .map((field: ProjectField) => {
                // Get dynamic configuration based on field key, type, and display name
                const dynamicConfig = getDynamicFieldConfig(
                    field.fieldKey,
                    field.fieldType as FieldType,
                    field.displayName
                );

                // Transform backend options to frontend format
                const transformedOptions: FieldOptions = {};

                // Handle tags field specifically - convert DROPDOWN to CREATABLE_DROPDOWN
                if (field.fieldKey === 'tags' && field.options) {
                    transformedOptions.choices = (field.options as OptionItem[]).map((choice: OptionItem) => ({
                        value: choice.value,
                        label: choice.label,
                        color: choice.color
                    })) || [];
                    transformedOptions.allowCustom = true; // Force allow custom tags
                    transformedOptions.multiple = true; // Force multiple selection
                }

                if (field.fieldKey === 'manager') {
                    if (field.options && Array.isArray(field.options)) {
                        transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                            id: opt.id || (opt.value as string) || String(opt), // Fix this line
                            value: opt.id || (opt.value as string) || String(opt),
                            label: opt.label || opt.displayName || String(opt.value || opt),
                            color: opt.color,
                            firstName: opt.firstName || opt.name?.split(' ')[0] || '',
                            lastName: opt.lastName || opt.name?.split(' ').slice(1).join(' ') || '',
                            email: opt.email || opt.label,
                            role: opt.role || 'Manager',
                            avatar: opt.avatar
                        }));
                    }
                    transformedOptions.multiple = true;
                    transformedOptions.searchable = true;
                }

                // Handle team field specifically
                if (field.fieldKey === 'team') {
                    if (field.options && Array.isArray(field.options)) {
                        transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                            id: (opt.id || opt.value || String(opt)) as string, // Fix: Ensure string type
                            value: (opt.id || opt.value || String(opt)) as string, // Fix: Ensure string type
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
                // Handle dropdown fields (DROPDOWN, SELECT, MULTI_SELECT)
                else if (field.fieldType === 'DROPDOWN' || field.fieldType === 'SELECT' || field.fieldKey === 'manager' || field.fieldKey === 'team' || field.fieldType === 'MULTI_SELECT' || field.fieldType === 'USER_SELECT') {
                    if (field.options && Array.isArray(field.options)) {
                        transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                            id: (opt.id || opt.value || String(opt)) as string, // Fix: Ensure string type
                            value: (opt.value || String(opt)) as string, // Fix: Ensure string type
                            label: opt.label || opt.displayName || String(opt.value || opt),
                            color: opt.color,
                            firstName: opt.firstName,
                            lastName: opt.lastName,
                            email: opt.email || opt.label, // Use label as email if no email field
                            role: opt.role,
                            avatar: opt.avatar
                        }));
                    } else {
                        // Provide empty choices array for dropdowns without options
                        transformedOptions.choices = [];
                    }

                    // Set multiple selection for multi-select fields
                    if (field.fieldType === 'MULTI_SELECT' || field.fieldKey === 'team' || field.fieldKey === 'manager') {
                        transformedOptions.multiple = true;
                    }

                    // Make user select fields searchable
                    if (field.fieldType === 'USER_SELECT' || field.fieldKey === 'team' || field.fieldKey === 'manager') {
                        transformedOptions.searchable = true;
                    }
                }
                // Handle other fields with options
                else if (field.options && Array.isArray(field.options)) {
                    transformedOptions.choices = (field.options as OptionItem[]).map((opt: OptionItem) => ({
                        id: (opt.id || opt.value || String(opt)) as string, // Fix: Ensure string type
                        value: (opt.value || String(opt)) as string, // Fix: Ensure string type
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
                    fieldType: field.fieldType, // This will be CREATABLE_DROPDOWN for tags
                    isRequired: field.isRequired || false,
                    isEditable: field.isEditable !== false,
                    options: transformedOptions,
                    displayOrder: field.displayOrder || 0,
                    icon: dynamicConfig.icon,
                    tooltip: dynamicConfig.tooltip,
                    // helpText: field.helpText,
                    iconBg: "#C81C1F",
                };

                return finalField;
            })
            .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }, [projectFieldsData]);

    // Search handlers
    const handleSearch = useCallback((_term: string, _columns: string[], searchParams?: Record<string, string>) => {
        if (searchParams && Object.keys(searchParams).length > 0) {
            setSearchQueryParams(searchParams);
        } else {
            setSearchQueryParams({});
        }
        setCurrentPage(1); // Reset to first page when searching
    }, []);

    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when changing page size
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
        setCurrentPage(1); // Reset to first page when filters change
        console.log('Applied advanced filters:', { filters, queryParams });
    }, []);

    const handleClearAdvancedFilters = useCallback(() => {
        setAdvancedFilters([]);
        setAdvancedFilterParams({});
        setCurrentPage(1);
    }, []);

    // Person filter handlers
    const handlePersonFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setPersonFilterAnchorEl(event.currentTarget);
        setOpenPersonFilter(true);
    }, []);

    const handlePersonFilterClose = useCallback(() => {
        setOpenPersonFilter(false);
        setPersonFilterAnchorEl(null);
    }, []);

    const handleApplyPersonFilter = useCallback((selectedUsers: string[], filterType: 'manager' | 'team' | 'both') => {
        if (selectedUsers.length === 0) {
            // Clear person filters
            setPersonFilters({});
        } else if (filterType === 'manager') {
            setPersonFilters({ managerIds: selectedUsers });
        } else if (filterType === 'team') {
            setPersonFilters({ teamIds: selectedUsers });
        } else {
            // Both - filter by either manager OR team members
            setPersonFilters({
                managerIds: selectedUsers,
                teamIds: selectedUsers
            });
        }
        setCurrentPage(1); // Reset to first page when filters change
        toast.success(`Person filter applied (${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''})`);
    }, []);

    // Sort filter handlers
    const handleSortFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setSortFilterAnchorEl(event.currentTarget);
        setOpenSortFilter(true);
    }, []);

    const handleSortFilterClose = useCallback(() => {
        setOpenSortFilter(false);
        setSortFilterAnchorEl(null);
    }, []);

    const handleApplySort = useCallback((field: string, direction: 'asc' | 'desc') => {
        setSort({ field, direction });
        setCurrentPage(1); // Reset to first page when sorting changes
        toast.success(`Sorted by ${field} (${direction === 'asc' ? 'Ascending' : 'Descending'})`);
    }, []);

    // Toggle column visibility handler
    const handleToggleColumns = useCallback(() => {
        setShowLessColumns(prev => !prev);
    }, []);

    // Data and loading state
    const rows = projectsData?.data?.projects ?? [];
    const totalCount = projectsData?.data?.total ?? 0;
    const loading = projectFieldsLoading || projectsLoading || userLoading || mdmInfoLoading;

    const initialValues = useMemo(() => {
        const defaults: Record<string, unknown> = {
            progress: 0,
        };

        // Set initial values based on backend field definitions
        if (projectFieldsData?.data) {
            (projectFieldsData.data as ProjectField[]).forEach((field: ProjectField) => {
                if (field.defaultValue !== undefined) {
                    defaults[field.fieldKey] = field.defaultValue;
                }
            });
        }

        return defaults;
    }, [projectFieldsData]);

    const handleFormSubmit = async (values: Record<string, unknown>) => {
        try {
            console.log("Form submitted with values:", values);
            // Check if user data is still loading
            if (userLoading) {
                return;
            }

            // Transform the values to match backend expectations
            const transformedValues: Record<string, unknown> = {};

            // Validate required fields
            if (!values.name || !(values.name as string).trim()) {
                throw new Error("Project name is required");
            }

            // Map projectName to name (backend expects 'name')
            transformedValues.name = (values.name as string).trim();

            // Map description
            if (values.description) {
                transformedValues.description = values.description;
            }

            // Map customer fields
            if (values.customerName) {
                transformedValues.customerName = (values.customerName as string).trim();
            }
            if (values.customerEmail) {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(values.customerEmail as string)) {
                    throw new Error("Please enter a valid customer email address");
                }
                transformedValues.customerEmail = (values.customerEmail as string).trim().toLowerCase();
            }
            if (values.customerPhone) {
                transformedValues.customerPhone = (values.customerPhone as string).trim();
            }

            // Handle timeline transformation (convert to array of dates)
            if (values.timeline && typeof values.timeline === 'object') {
                const timelineArray: string[] = [];
                const timelineObj = values.timeline as TimelineValue;
                if (timelineObj.start) {
                    timelineArray.push(timelineObj.start);
                    // Always sync startDate with timeline.start
                    transformedValues.startDate = timelineObj.start;
                }
                if (timelineObj.end) {
                    timelineArray.push(timelineObj.end);
                    // Always sync dueDate with timeline.end
                    transformedValues.dueDate = timelineObj.end;
                }
                if (timelineArray.length > 0) {
                    transformedValues.timeline = timelineArray;
                }
            }

            // Map and validate dates (only if not already set by timeline)
            if (values.startDate && !transformedValues.startDate) {
                const startDate = new Date(values.startDate as string);
                if (isNaN(startDate.getTime())) {
                    throw new Error("Invalid start date provided");
                }
                transformedValues.startDate = values.startDate;
            }
            if (values.dueDate && !transformedValues.dueDate) {
                const dueDate = new Date(values.dueDate as string);
                if (isNaN(dueDate.getTime())) {
                    throw new Error("Invalid due date provided");
                }
                transformedValues.dueDate = values.dueDate;
            }

            // Validate that due date is not before start date if both are provided
            if (transformedValues.startDate && transformedValues.dueDate) {
                const startDate = new Date(transformedValues.startDate as string);
                const dueDate = new Date(transformedValues.dueDate as string);
                console.log("Validating dates:", { startDate, dueDate });
                if (dueDate < startDate) {
                    throw new Error("Due date cannot be before the start date");
                }
            }

            // Handle status field transformation (extract value from object)
            if (values.status) {
                if (typeof values.status === 'object' && (values.status as { value: string }).value) {
                    transformedValues.status = (values.status as { value: string }).value;
                } else {
                    transformedValues.status = values.status;
                }
            }

            // Handle priority field transformation (extract value from object)
            if (values.priority) {
                if (typeof values.priority === 'object' && (values.priority as { value: string }).value) {
                    transformedValues.priority = (values.priority as { value: string }).value;
                } else {
                    transformedValues.priority = values.priority;
                }
            }

            // Handle projectType - extract string value from any format
            if (values.projectType) {
                let projectTypeValue = values.projectType;

                // If it's an array, take the first element
                if (Array.isArray(projectTypeValue)) {
                    projectTypeValue = projectTypeValue[0];
                }

                // If it's an object, extract the value property
                if (typeof projectTypeValue === 'object' && projectTypeValue !== null) {
                    projectTypeValue = (projectTypeValue as { value: string }).value;
                }

                // Ensure it's a string
                transformedValues.projectType = String(projectTypeValue);
            }

            // Handle team (ensure it's an array of IDs) - EXTRACT ONLY IDs FROM OBJECTS
            if (values.team) {
                transformedValues.team = Array.isArray(values.team)
                    ? (values.team as UserObject[]).map((member: UserObject) => {
                        // Extract ONLY the ID, not the full object
                        if (typeof member === 'object' && member !== null) {
                            return member.id || member.value;
                        }
                        return member;
                    }).filter(Boolean) // Remove any null/undefined values
                    : [values.team];
            }

            // Handle manager (ensure it's an array of IDs) - EXTRACT ONLY IDs FROM OBJECTS  
            if (values.manager) {
                transformedValues.managerId = Array.isArray(values.manager)
                    ? (values.manager as UserObject[]).map((manager: UserObject) => {
                        // Extract ONLY the ID, not the full object
                        if (typeof manager === 'object' && manager !== null) {
                            return manager.id || manager.value;
                        }
                        return manager;
                    }).filter(Boolean) // Remove any null/undefined values
                    : [values.manager];
            }

            // Handle tags (ensure it's an array)
            if (values.tags) {
                transformedValues.tags = Array.isArray(values.tags)
                    ? values.tags
                    : (values.tags as string).split(',').map((tag: string) => tag.trim()).filter(Boolean);
            }

            // Set and validate progress (default to 0 if not provided)
            const progress = Number(values.progress) || 0;
            if (progress < 0 || progress > 100) {
                throw new Error("Progress must be between 0 and 100");
            }
            transformedValues.progress = progress;

            // Add required fields from current user
            if (!currentUser?.company?.id) {
                throw new Error("Company information not found. Please ensure you're logged in.");
            }
            if (!currentUser?.id) {
                throw new Error("User information not found. Please ensure you're logged in.");
            }

            transformedValues.companyId = currentUser.company.id;
            transformedValues.createdById = currentUser.id;

            if (isEditMode && editProject?.id) {
                // When updating a project, handle timeline and dueDate separately
                if (transformedValues.timeline && Array.isArray(transformedValues.timeline) && (transformedValues.timeline as string[]).length >= 2) {
                    // First update the timeline via the dedicated timeline API
                    await updateProjectTimeline({
                        id: editProject.id,
                        timeline: transformedValues.timeline as string[]
                    }).unwrap();

                    // Then update the due date via the dedicated due date API
                    // This creates a new entry in ProjectDueDateHistory
                    await updateProjectDueDateWithTimeline({
                        id: editProject.id,
                        dueDate: (transformedValues.timeline as string[])[1], // Use timeline end date as due date
                        reason: 'Updated via timeline change',
                        changedById: currentUser.id
                    }).unwrap();

                    // Remove timeline and dueDate from transformedValues to avoid conflicts
                    delete transformedValues.timeline;
                    delete transformedValues.dueDate;
                }

                // Update other project fields
                await updateProject({ id: editProject.id, updateData: transformedValues }).unwrap();
                toast.success("Project updated successfully!");
            } else {
                await createProject(transformedValues).unwrap();
                toast.success("Project created successfully!");
            }

            setOpen(false);
            setIsEditMode(false);
            setEditProject(null);
        } catch (error: unknown) {
            console.error("Failed to save project:", error);

            // Handle specific error types
            let errorMessage = "An unexpected error occurred. Please try again.";

            if (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
                // Backend validation error
                errorMessage = (error.data as { message: string }).message;
                console.error("Backend error:", (error.data as { message: string }).message);
            } else if (error && typeof error === 'object' && 'message' in error) {
                // Frontend validation error or network error
                errorMessage = (error as { message: string }).message;
                console.error("Error message:", (error as { message: string }).message);
            } else if (typeof error === 'string') {
                // String error message
                errorMessage = error;
            }

            toast.error(errorMessage);
        }
    };

    const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
        if (!field.fieldKey) return;
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        const clean = newName.trim();
        if (!clean || clean === field.displayName) return;

        try {
            await updateProjectFieldDisplayName({
                mdmId: projectMDMInfo.data.id,
                fieldKey: field.fieldKey,
                displayName: clean
            }).unwrap();
            toast.success(`Column renamed to "${clean}"`);
        } catch (e) {
            console.error('Failed to update field displayName', e);
            toast.error('Failed to rename column');
        }
    };

    const handleHideColumn = async (field: FieldDefinition) => {
        if (!field.id) return;
        try {
            await updateProjectField({ fieldId: field.id, data: { isVisible: false } }).unwrap();
            toast.success(`Column "${field.displayName}" hidden`);
        } catch (e) {
            console.error('Failed to hide field', e);
            toast.error('Failed to hide column');
        }
    };

    const handleToggleColumnVisibility = async (field: FieldDefinition, visible: boolean) => {
        if (!field.id) return;
        try {
            await updateProjectField({ fieldId: field.id, data: { isVisible: visible } }).unwrap();
        } catch (e) {
            console.error('Failed to toggle visibility', e);
        }
    };

    const handleReorderColumns = async (orderedFieldKeys: string[]) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            // TypeScript now knows projectMDMInfo.data.id exists
            const mdmId = projectMDMInfo.data.id;

            const updates = orderedFieldKeys.map((fieldKey, index) =>
                updateProjectFieldDisplayOrder({
                    mdmId: mdmId, // Use the extracted variable
                    fieldKey,
                    displayOrder: index + 1
                }).unwrap()
            );

            await Promise.all(updates);
            toast.success('Column order updated successfully');
        } catch (e: unknown) {
            console.error('Failed to reorder fields', e);
            toast.error('Failed to reorder columns');
        }
    };

    const handleEditProjectFromRow = (projectData: ProjectData) => {
        if (!projectData) {
            toast.error("Project data not available");
            return;
        }

        console.log("Editing project:", projectData);

        // Transform the project data to match form field expectations
        const transformedData: ProjectData = {
            ...projectData,
            // Ensure name field is mapped from projectName if needed
            name: projectData.name || projectData.projectName,
            // Handle timeline data if it exists - can be array or object
            timeline: projectData.timeline ? (
                Array.isArray(projectData.timeline)
                    ? {
                        start: projectData.timeline[0] || null,
                        end: projectData.timeline[1] || null
                    } as TimelineValue
                    : typeof projectData.timeline === 'object' && ((projectData.timeline as TimelineValue).start || (projectData.timeline as TimelineValue).end)
                        ? {
                            start: (projectData.timeline as TimelineValue).start || null,
                            end: (projectData.timeline as TimelineValue).end || null
                        } as TimelineValue
                        : undefined
            ) : undefined,
            // Ensure dates are properly formatted
            startDate: projectData.startDate,
            // Extract due date from dueDate array (get the latest one)
            dueDate: Array.isArray(projectData.dueDate) && projectData.dueDate.length > 0
                ? projectData.dueDate[projectData.dueDate.length - 1]?.newDueDate
                : projectData.dueDate,
            // Handle status and priority objects - ensure they're strings for the form
            status: typeof projectData.status === 'object' ? (projectData.status as { value: string }).value : projectData.status,
            priority: typeof projectData.priority === 'object' ? (projectData.priority as { value: string }).value : projectData.priority,
            // Ensure arrays are properly handled - check multiple possible field names
            tags: Array.isArray(projectData.tags) ? projectData.tags :
                Array.isArray(projectData.projectTags) ? projectData.projectTags : [],

            // Handle team - extract only the values (IDs) for form input and include firstName, lastName, role
            team: Array.isArray(projectData.team)
                ? projectData.team.map((member: OptionItem) => {
                    if (!member) return { id: null, value: null, firstName: '', lastName: '', role: '' } as unknown as UserObject;
                    if (typeof member === 'object') {
                        const id = member.id || member.userId || member.value || null;
                        const firstName = member.firstName || member.first_name || (member.name ? String(member.name).split(' ')[0] : '') || '';
                        const lastName = member.lastName || member.last_name || (member.name ? String(member.name).split(' ').slice(1).join(' ') : '') || '';
                        const role = 'Team Member';
                        return {
                            id,
                            value: id,
                            firstName,
                            lastName,
                            role,
                            avatar: member.avatar
                        } as UserObject;
                    }
                    // primitive value (string/id)
                    return {
                        id: member as string,
                        value: member as string,
                        firstName: '',
                        lastName: '',
                        role: 'Team Member'
                    } as UserObject;
                })
                : [],
            // Handle manager - extract only the values (IDs) and include firstName, lastName, role
            manager: Array.isArray(projectData.manager)
                ? projectData.manager.map((manager: OptionItem) => {
                    if (!manager) return { id: null, value: null, firstName: '', lastName: '', role: '' } as unknown as UserObject;
                    if (typeof manager === 'object') {
                        const id = manager.id || manager.userId || manager.value || null;
                        const name = manager.name || '';
                        const firstName = manager.firstName || manager.first_name || (name ? String(name).split(' ')[0] : '') || '';
                        const lastName = manager.lastName || manager.last_name || (name ? String(name).split(' ').slice(1).join(' ') : '') || '';
                        const role = 'Manager';
                        return {
                            id,
                            value: id,
                            firstName,
                            lastName,
                            role,
                            avatar: manager.avatar
                        } as UserObject;
                    }
                    // primitive value (string/id)
                    return {
                        id: manager as string,
                        value: manager as string,
                        firstName: '',
                        lastName: '',
                        role: 'Manager'
                    } as UserObject;
                })
                : [],

            // Handle projectType - single string value
            projectType: typeof projectData.projectType === 'object'
                ? ((projectData.projectType as OptionItem).value || (projectData.projectType as OptionItem).id || projectData.projectType)
                : projectData.projectType || '',

            // Handle documents/files
            documents: Array.isArray(projectData.documents) ? projectData.documents :
                Array.isArray(projectData.files) ? projectData.files :
                    Array.isArray(projectData.attachments) ? projectData.attachments : [],
            // Handle progress
            progress: typeof projectData.progress === 'number' ? projectData.progress : 0,
        };
        console.log("Transformed project data for editing:", transformedData);

        setEditProject(transformedData);
        setIsEditMode(true);
        setOpen(true);
    };

    const openCreateModal = () => {
        if (!currentUser?.company?.id) {
            toast.error("Unable to create project. Please refresh the page and try again.");
            return;
        }
        setEditProject(initialValues as unknown as ProjectData);
        setIsEditMode(false);
        setOpen(true);
    };

    const handleEmailClick = () => {
        setShowEmailModal(true);
    };

    const handleSettingsClick = () => {
        setShowSigModal(true);
    };

    const handleDeleteProject = async (projectId: string, projectName: string) => {
        if (!projectId) {
            toast.error("Project ID is missing");
            return;
        }

        // Open delete confirmation modal
        setDeleteModalState({
            isOpen: true,
            projectId,
            projectName,
            isDeleting: false
        });
    };

    const handleConfirmDelete = async () => {
        const { projectId, projectName } = deleteModalState;

        if (!projectId) {
            toast.error("Project ID is missing");
            return;
        }

        // Set deleting state
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

        try {
            await deleteProject(projectId).unwrap();
            toast.success(`Project "${projectName}" deleted successfully`);

            // Close modal on success
            setDeleteModalState({
                isOpen: false,
                projectId: null,
                projectName: null,
                isDeleting: false
            });
        } catch (error: unknown) {
            console.error('Failed to delete project:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to delete project. Please try again.';
            toast.error(errorMessage);

            // Reset deleting state but keep modal open
            setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalState({
            isOpen: false,
            projectId: null,
            projectName: null,
            isDeleting: false
        });
    };

    const projectTitleBtn = [
        {
            name: "Export",
            icon: <Image src={excela} alt="Export" width={18} height={18} />,
            onClick: () => setShowExportModal(true),
        },
        {
            name: "Add Project",
            icon: <FiPlus />,
            onClick: () => openCreateModal(),
        },
    ];

    // Add this state near your other state declarations
    const [activeView, setActiveView] = useState<"default" | "email" | "signature">("default");

    // Update the modal title logic
    const getModalTitle = () => {
        if (activeView === "email") return "New Email";
        if (activeView === "signature") return "Email Signature";
        return isEditMode ? "Edit Project" : "Create Project";
    };

    // Update the tab configuration to hide other tabs when email/signature is active
    const getFilteredTabs = () => {
        if (activeView !== "default") {
            // Only show Overview tab when email/signature is active
            return [
                {
                    key: "overview",
                    label: "Overview",
                    icon: search,
                    component: OverviewTabContent as React.ComponentType<unknown>,
                    componentProps: {
                        formFields: projectFields,
                        onSubmit: handleFormSubmit,
                        isEditMode,
                        initialValues: editProject || initialValues,
                        userRole: "admin",
                        className: "h-full",
                        onEmailClick: handleEmailClick,
                        onSettingsClick: handleSettingsClick,
                        mdmId: projectMDMInfo?.data?.id, // Pass mdmId for field option management
                        // Pass relatedItem when editing a project
                        relatedItem: isEditMode && editProject ? {
                            type: "project" as const,
                            projectId: editProject.id,
                            projectName: editProject.name || editProject.projectName,
                        } : undefined,
                        activeView,
                        onViewChange: setActiveView,
                    },
                    disabled: false
                }
            ];
        }
        return [
            {
                key: "overview",
                label: "Overview",
                icon: search,
                component: OverviewTabContent as React.ComponentType<unknown>,
                componentProps: {
                    formFields: projectFields,
                    onSubmit: handleFormSubmit,
                    isEditMode,
                    initialValues: editProject || initialValues,
                    userRole: "admin",
                    className: "h-full",
                    onEmailClick: handleEmailClick,
                    onSettingsClick: handleSettingsClick,
                    mdmId: projectMDMInfo?.data?.id,
                    relatedItem: isEditMode && editProject ? {
                        type: "project" as const,
                        projectId: editProject.id,
                        projectName: editProject.name || editProject.projectName,
                    } : undefined,
                    activeView,
                    onViewChange: setActiveView,
                },
                disabled: false
            },
            {
                key: "updates",
                label: "Updates",
                icon: home,
                component: UpdatesTabContent as React.ComponentType<unknown>,
                componentProps: {
                    className: " h-[95vh]",
                    projectId: isEditMode && editProject?.id ? editProject.id : undefined,
                },
                disabled: !isEditMode // Keep Updates tab disabled
            },
            {
                key: "files/links",
                label: "Files / Links",
                icon: update,
                component: FilesLinksTabContent as React.ComponentType<unknown>,
                componentProps: {
                    className: "h-[95vh] overflow-y-auto",
                },
                disabled: !isEditMode
            },
        ];
    };

    // Update the modal close handler to reset activeView
    const handleModalClose = () => {
        setOpen(false);
        setIsEditMode(false);
        setEditProject(null);
        setActiveView("default"); // Reset to default view
        setActiveTab("overview"); // Reset to Overview tab
    };

    // Handler functions for StatusDropdown option management
    const handleAddOption = async (fieldKey: string, option: { displayName: string; color: string }) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            await createFieldOption({
                mdmId: projectMDMInfo.data.id,
                fieldKey,
                option: {
                    label: option.displayName,
                    value: option.displayName.toLowerCase().replace(/\s+/g, '_'),
                    color: option.color
                }
            }).unwrap();
            toast.success(`Added new option: ${option.displayName}`);
        } catch (error: unknown) {
            console.error('Failed to add option:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to add option';
            toast.error(errorMessage);
        }
    };

    const handleUpdateOption = async (fieldKey: string, updates: { displayName?: string; color?: string }) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            const field = finalFields.find(f => f.fieldKey === fieldKey);
            const choices = (field?.options as FieldOptions)?.choices ?? [];
            const currentOption = choices.find((c: OptionItem) => c.label === updates.displayName || c.displayName === updates.displayName);

            if (!currentOption) {
                toast.error('Option not found for update');
                return;
            }

            // Ensure we have fallback values
            const label = updates.displayName || currentOption.label || '';
            const value = currentOption.value || '';
            const color = updates.color || currentOption.color;

            if (!value) {
                toast.error('Option value is required');
                return;
            }

            await updateFieldOption({
                mdmId: projectMDMInfo.data.id,
                fieldKey,
                option: {
                    label,
                    value,
                    color
                }
            }).unwrap();
            toast.success(`Updated option: ${label}`);
        } catch (error: unknown) {
            console.error('Failed to update option:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to update option';
            toast.error(errorMessage);
        }
    };

    const handleReorderOptions = async (fieldKey: string, ordered: StatusOption[]) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            // The backend expects individual sequence updates, so we'll update each option
            for (let i = 0; i < ordered.length; i++) {
                const option = ordered[i];
                await updateFieldOptionSequence({
                    mdmId: projectMDMInfo.data.id,
                    fieldKey,
                    optionValue: option.fieldKey, // This should be the option value
                    newSequence: i + 1 // 1-based sequence
                }).unwrap();
            }
            toast.success('Options reordered successfully');
        } catch (error: unknown) {
            console.error('Failed to reorder options:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to reorder options';
            toast.error(errorMessage);
        }
    };

    // Priority-specific handler functions
    const handleAddPriorityOption = async (option: { displayName: string; color: string }) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            await createPriorityOption({
                projectId: projectMDMInfo.data.id,
                optionData: {
                    label: option.displayName,
                    value: option.displayName.toLowerCase().replace(/\s+/g, '_'),
                    color: option.color
                }
            }).unwrap();
            toast.success(`Added new priority option: ${option.displayName}`);
        } catch (error: unknown) {
            console.error('Failed to add priority option:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to add priority option';
            toast.error(errorMessage);
        }
    };

    const handleUpdatePriorityOption = async (updates: { displayName?: string; color?: string }) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            // For updates, we need to find the current option to get its value
            const field = finalFields.find(f => f.fieldKey === 'priority');
            const choices = (field?.options as FieldOptions)?.choices ?? [];
            const currentOption = choices.find((c: OptionItem) => c.label === updates.displayName || c.displayName === updates.displayName);

            if (!currentOption) {
                toast.error('Priority option not found for update');
                return;
            }

            await updatePriorityOption({
                projectId: projectMDMInfo.data.id,
                optionData: {
                    label: updates.displayName ?? currentOption.label ?? '',
                    value: currentOption.value ?? '',
                    color: updates.color ?? currentOption.color ?? ''
                }
            }).unwrap();
            toast.success(`Updated priority option: ${updates.displayName || currentOption.label}`);
        } catch (error: unknown) {
            console.error('Failed to update priority option:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to update priority option';
            toast.error(errorMessage);
        }
    };

    const handleReorderPriorityOptions = async (ordered: StatusOption[]) => {
        if (!projectMDMInfo?.data?.id) {
            toast.error('MDM information not available');
            return;
        }

        try {
            // For priority, we might need to implement a specific reorder API or use generic one
            // Using the generic approach for now
            for (let i = 0; i < ordered.length; i++) {
                const option = ordered[i];
                await updateFieldOptionSequence({
                    mdmId: projectMDMInfo.data.id,
                    fieldKey: 'priority',
                    optionValue: option.fieldKey,
                    newSequence: i + 1
                }).unwrap();
            }
            toast.success('Priority options reordered successfully');
        } catch (error: unknown) {
            console.error('Failed to reorder priority options:', error);
            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                ? (error.data as { message: string }).message
                : 'Failed to reorder priority options';
            toast.error(errorMessage);
        }
    };

    const getCellRenderer = ({ field, row, value }: { field: FieldDefinition; row: ProjectData; value: unknown }) => {
        // Handle Timeline (date range)
        console.log(field.fieldKey, value);
        if (field.fieldKey === 'updates' || field.fieldKey === 'lastUpdate') {
            // value might be the updates array or we can fallback to row.updates
            const updatesArray = Array.isArray(value) ? value : Array.isArray((row as any).updates) ? (row as any).updates : [];
            const lastUpdate = updatesArray.length ? updatesArray[updatesArray.length - 1] : null;
            const rawNotes = lastUpdate?.updateNotes ?? lastUpdate?.updateNotesHtml ?? null;

            // Strip HTML tags to show plain text
            const plainText = rawNotes && typeof rawNotes === 'string'
                ? rawNotes.replace(/<[^>]*>/g, '').trim()
                : '-';

            // Optionally truncate for table display
            const displayText = plainText.length > 200 ? `${plainText.slice(0, 197)}...` : plainText;

            return (
                <div
                    className="text-sm break-words cursor-pointer"
                    title={plainText}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Open the edit/create modal for this project and switch to Updates tab
                        handleEditProjectFromRow(row);
                        setActiveTab('updates');
                    }}
                >
                    {displayText}
                </div>
            );
        }
        if (field.fieldKey === 'action') {
            return (
                <div className="flex items-center justify-center gap-1">
                    <button
                        type="button"
                        title="Edit"
                        className="w-8 h-8 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditProjectFromRow(row);
                        }}
                    >
                        <Image src={editpencil} alt="Edit" width={12} height={12} />
                    </button>

                    <button
                        type="button"
                        title="Gantt View"
                        className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shadow hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            setGanttAnchorEl(e.currentTarget as HTMLElement);
                            setSelectedProjectForGantt(row);
                            setGanttViewOpen(true);
                        }}
                    >
                        <BarChart3 size={16} />
                    </button>

                    <button
                        type="button"
                        title="Delete"
                        className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow hover:opacity-90"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(row.id, row.name || row.projectName || 'this project');
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
        if (field.fieldKey === 'projectId' && typeof value === 'string') {
            console.log(`Rendering projectId cell for projectId`, row);
            const projectId = row?.id;
            return (
                <div className="flex items-center gap-1">
                    <div
                        className="flex-1 cursor-pointer text-lg font-semibold underline text-[#c81c1f] border-r-[1px] border-[#d8d8d8]"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (projectId) {
                                router.push(`/lazykill/projects/${projectId}`);
                            }
                        }}
                    >
                        {value}
                    </div>
                    <div
                        className="px-4 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditProjectFromRow(row);
                        }}
                    >
                        <Image src={PagerIcon} alt="Pager Icon" width={18} height={18} />
                    </div>
                </div>
            );
        }
        if (field.fieldKey === 'name' && typeof value === 'string') {
            return (
                <div className="text-sm capitalize">
                    {value}
                </div>
            );
        }
        if (field.fieldKey === 'description' && typeof value === 'string') {
            return (
                <div className="text-sm capitalize">
                    {value}
                </div>
            );
        }
        if (field.fieldKey === 'customerName' && typeof value === 'string') {
            return (
                <div className="text-sm capitalize underline">
                    {value}
                </div>
            );
        }
        if (field.fieldKey === 'documents' || field.fieldKey === 'Files /Links') {
            return (
                <div className="w-full flex items-center justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditProjectFromRow(row);
                            setActiveTab('files/links');
                        }}
                        className="text-sm flex items-center gap-2 capitalize bg-[#8f8e8c] rounded-md px-3 py-1 text-white hover:bg-[#6e6d6b] transition-colors"
                    >
                        View <EyeIcon size={14} />
                    </button>
                </div>
            );
        }
        if (field.fieldKey === 'timeline' && Array.isArray(value) && value.length >= 2) {
            const startDate = new Date(value[0] as string).toLocaleDateString();
            const endDate = new Date(value[1] as string).toLocaleDateString();
            return (
                <div className="flex items-center gap-2">
                    <div className="bg-[#8f8e8c] rounded-full px-7 mb-1 mt-1 cursor-pointer transition-colors group relative">
                        <div className="w-[100px] justify-center flex items-center py-0.5 gap-2 group-hover:hidden transition-opacity duration-150">
                            <span className="text-white font-medium group-hover:text-black">{DateTime.fromISO(value[0] as string).toFormat('MMM dd')}</span>
                            <div className="w-3 h-px bg-white"></div>
                            <span className="text-white font-medium group-hover:text-black">{DateTime.fromISO(value[1] as string).toFormat('MMM dd')}</span>
                        </div>
                        <div className="w-[100px] text-white py-0.5 bg-[#8f8e8c] rounded-full justify-center hidden group-hover:flex items-center px-2 text-sm font-medium transition-opacity duration-150">
                            {(() => {
                                const start = new Date(value[0] as string);
                                const end = new Date(value[1] as string);
                                const msPerDay = 1000 * 60 * 60 * 24;
                                const daysBetween = Math.max(0, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
                                return `${daysBetween} day${daysBetween !== 1 ? 's' : ''}`;
                            })()}
                        </div>
                    </div>
                </div>
            );
        }

        // Handle Due Date (from dueDate array) with interactive date picker
        if (field.fieldKey === 'dueDate') {
            const projectId = row?.id ?? row?._id;

            if (!projectId) {
                return <div className="text-sm text-gray-500">-</div>;
            }

            return (
                <DueDatePicker
                    currentValue={value as string | null}
                    onDateChange={async (newDate: string | null) => {
                        try {
                            if (!currentUser?.id) {
                                toast.error('User information not available. Please refresh the page.');
                                return;
                            }

                            await updateProjectDueDateWithTimeline({
                                id: projectId,
                                dueDate: newDate,
                                reason: 'Updated via table interface',
                                changedById: currentUser.id
                            }).unwrap();
                            toast.success('Due date and timeline updated successfully');
                        } catch (error: unknown) {
                            console.error('Failed to update due date:', error);
                            const errorMessage = (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data)
                                ? (error.data as { message: string }).message
                                : 'Failed to update due date';
                            toast.error(errorMessage);
                        }
                    }}
                    disabled={userLoading || !currentUser?.id}
                />
            );
        }
        if (field.fieldKey === 'startDate') {
            const latestStartDate = value as string;
            return (
                <div className="text-sm font-semibold border-[1px] border-[#309b71] py-0.5 rounded-full text-[#309b71] px-[27px] w-fit">
                    {DateTime.fromISO(latestStartDate).toFormat('MMM dd, yyyy')}
                </div>
            );
        }

        // Handle Project Type (single value)
        if (field.fieldKey === 'projectType' && value) {
            const displayValue = Array.isArray(value) ? value[0] : value;
            return (
                <span className="px-13 py-0.5 text-sm capitalize">
                    {displayValue as string}
                </span>
            );
        }

        // Handle Tags (array) with interactive editor
        if (field.fieldKey === 'tags') {
            const projectId = row?.id ?? row?._id;
            const currentTags = Array.isArray(value) ? value : [];

            if (!projectId) {
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

                            await updateProjectTags({
                                id: projectId,
                                tags: newTags
                            }).unwrap();
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

        // Handle Team (array of user objects)
        if (field.fieldKey === 'team' && Array.isArray(value)) {
            const projectId = row?.id ?? row?._id;

            return (
                <div
                    className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity items-center justify-center w-full"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (projectId) {
                            setTeamSelectorState({
                                isOpen: true,
                                projectId,
                                currentTeam: value as UserObject[],
                                anchorEl: e.currentTarget as HTMLElement
                            });
                        }
                    }}
                >
                    {(value as UserObject[]).slice(0, 3).map((member: UserObject, index: number) => (
                        <div
                            key={member?.id ?? index}
                            className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white overflow-hidden"
                            title={`${member?.firstName ?? ''} ${member?.lastName ?? ''}`}
                        >
                            {member?.avatar
                                ? (
                                    <Image
                                        src={member.avatar}
                                        alt={`${member?.firstName ?? ''} ${member?.lastName ?? ''}`}
                                        width={32}
                                        height={32}
                                        className="object-cover w-full h-full"
                                    />
                                )
                                : (
                                    <span className="uppercase">
                                        {String(member?.firstName ?? '').charAt(0) || '?'}
                                    </span>
                                )
                            }
                        </div>
                    ))}
                    {(value as UserObject[]).length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                            +{(value as UserObject[]).length - 3}
                        </div>
                    )}
                </div>
            );
        }

        // Handle Manager (array of user objects)
        if (field.fieldKey === 'manager' && Array.isArray(value)) {
            const projectId = row?.id ?? row?._id;

            return (
                <div
                    className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity items-center justify-center w-full"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (projectId) {
                            setManagerSelectorState({
                                isOpen: true,
                                projectId,
                                currentManagers: value as UserObject[],
                                anchorEl: e.currentTarget as HTMLElement
                            });
                        }
                    }}
                >
                    {(value as UserObject[]).slice(0, 2).map((manager: UserObject, index: number) => (
                        <div
                            key={manager?.id ?? index}
                            className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white overflow-hidden"
                            title={`${manager?.firstName ?? ''} ${manager?.lastName ?? ''}`}
                        >
                            {manager?.avatar
                                ? (
                                    <Image
                                        src={manager.avatar}
                                        alt={`${manager?.firstName ?? ''} ${manager?.lastName ?? ''}`}
                                        width={32}
                                        height={32}
                                        className="object-cover w-full h-full"
                                    />
                                )
                                : (
                                    <span className="uppercase">
                                        {String(manager?.firstName ?? '').charAt(0) || '?'}
                                    </span>
                                )
                            }
                        </div>
                    ))}
                    {(value as UserObject[]).length > 2 && (
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                            +{(value as UserObject[]).length - 2}
                        </div>
                    )}
                </div>
            );
        }

        // Handle Progress (number to progress bar)
        if (field.fieldKey === 'progress' && typeof value === 'number') {
            return (
                <div className="w-full relative flex items-center">
                    <div className="absolute -right-1 flex justify-between items-center text-xs mb-1 z-2">
                        {value !== 100 && <span className="font-semibold">{value}%</span>}
                        {value === 100 && (
                            <Image src={checkProgress} alt="Check Progress" width={16} height={16} />
                        )}
                    </div>
                    <div className="w-full bg-gray-200 h-1 relative overflow-hidden">
                        <div
                            className={`h-2 transition-all duration-500 ease-in-out ${value < 50
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : value < 100
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                    : 'bg-gradient-to-r from-green-500 to-[#008450]'
                                }`}
                            style={{
                                width: `${Math.min(100, Math.max(0, value))}%`,
                                boxShadow: value > 0 ? 'inset 0 1px 2px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {/* Shine effect for completed progress */}
                            {value === 100 && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full"></div>
                            )}
                        </div>

                        {/* Progress indicator dot */}
                        {value > 0 && value < 100 && (
                            <div
                                className={`absolute top-0 w-2 h-2 rounded-full border-2 border-white shadow-sm transform -translate-y-0 ${value < 50
                                    ? 'bg-red-600'
                                    : 'bg-yellow-500'
                                    }`}
                                style={{
                                    left: `calc(${Math.min(100, Math.max(0, value))}% - 6px)`,
                                }}
                            ></div>
                        )}
                    </div>
                </div>
            );
        }

        // Status field with StatusDropdown (keep existing logic)
        if (field.fieldKey === 'status') {
            const choices = (field.options as FieldOptions)?.choices ?? [];
            const options: StatusOption[] = choices.map((c: OptionItem) => ({
                fieldKey: String(c.value || c),
                displayName: c.label ?? String(c.value || c),
                color: c.color ?? '#6b7280',
            }));
            let currentKey = '';
            if (value && typeof value === 'object' && (value as { value: string }).value) {
                currentKey = String((value as { value: string }).value);
            } else {
                const raw = String(value ?? '');
                const matched = options.find(o => o.fieldKey === raw) || options.find(o => o.displayName === raw);
                currentKey = matched ? matched.fieldKey : raw;
            }
            const projectId = row?.id ?? row?._id;
            return (
                <StatusDropdown
                    currentStatus={currentKey}
                    options={options}
                    onStatusChange={async (newKey: string) => {
                        if (!projectId) return;
                        try {
                            const sel = options.find((o: StatusOption) => o.fieldKey === newKey);
                            // Use dedicated status API - expects string value
                            await updateProjectStatus({
                                id: projectId,
                                status: sel ? sel.fieldKey : newKey
                            }).unwrap();

                            toast.success(`Status updated to "${sel?.displayName || newKey}"`);
                        } catch (e) {
                            console.error('Failed to update project status', e);
                            toast.error('Failed to update project status');
                        }
                    }}
                    onUpdateOption={async (fieldKey: string, updates: { displayName?: string; color?: string }) => await handleUpdateOption(field.fieldKey, updates)}
                    onAddOption={async (option: { displayName: string; color: string }) => await handleAddOption(field.fieldKey, option)}
                    onReorderOptions={async (ordered: StatusOption[]) => await handleReorderOptions(field.fieldKey, ordered)}
                    disabled={false}
                    className="w-fit! rounded-lg! h-[21px]!"
                />
            );
        }
        if (field.fieldKey === 'priority') {
            const choices = (field.options as FieldOptions)?.choices ?? [];
            const options: StatusOption[] = choices.map((c: OptionItem) => ({
                fieldKey: String(c.value || c),
                displayName: c.label ?? String(c.value || c),
                color: c.color ?? '#6b7280',
            }));
            let currentKey = '';
            if (value && typeof value === 'object' && (value as { value: string }).value) {
                currentKey = String((value as { value: string }).value);
            } else {
                const raw = String(value ?? '');
                const matched = options.find(o => o.fieldKey === raw) || options.find(o => o.displayName === raw);
                currentKey = matched ? matched.fieldKey : raw;
            }
            const projectId = row?.id ?? row?._id;
            return (
                <StatusDropdown
                    currentStatus={currentKey}
                    options={options}
                    onStatusChange={async (newKey: string) => {
                        if (!projectId) return;
                        try {
                            const sel = options.find((o: StatusOption) => o.fieldKey === newKey);

                            // Use dedicated priority API - expects string value
                            await updateProjectPriority({
                                id: projectId,
                                priority: sel ? sel.fieldKey : newKey
                            }).unwrap();

                            toast.success(`Priority updated to "${sel?.displayName || newKey}"`);
                        } catch (e) {
                            console.error('Failed to update project priority', e);
                            toast.error('Failed to update project priority');
                        }
                    }}
                    onUpdateOption={async (fieldKey: string, updates: { displayName?: string; color?: string }) => await handleUpdatePriorityOption(updates)}
                    onAddOption={async (option: { displayName: string; color: string }) => await handleAddPriorityOption(option)}
                    onReorderOptions={async (ordered: StatusOption[]) => await handleReorderPriorityOptions(ordered)}
                    disabled={false}
                    className="w-fit rounded-lg! h-[21px]!"
                />
            );
        }

        // PHONE field inline editing (keep existing logic)
        if (field.fieldType === 'PHONE') {
            const projectId = row?.id ?? row?._id;
            return (
                <PhoneValue
                    field={field}
                    value={value as string}
                    onCommit={async (next: string) => {
                        if (!projectId) return;
                        try {
                            await updateProject({ id: projectId, updateData: { [field.fieldKey]: next } }).unwrap();
                            toast.success('Phone number updated');
                        } catch (e) {
                            console.error('Failed to update project phone', e);
                            toast.error('Failed to update phone number');
                        }
                    }}
                />
            );
        }

        return undefined;
    };

    const filteredTabs = getFilteredTabs();

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
                            <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                                <BreadcrumbsNavBar
                                    customItems={[
                                        { label: 'Project Management', href: '/dashboard' },
                                        { label: 'Project', href: '/dashboard/lazykill/projects' },

                                    ]}
                                />
                            </div>
                            <div
                                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                                style={{
                                    backgroundColor: isDark ? colors.dark.sidebar : undefined
                                }}
                            >
                                <Title projectTitleObj={projectTitleBtn} name="Project List" />
                            </div>
                            <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 flex justify-end items-center h-fit' style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}>
                                <div className="flex items-center gap-2">
                                    <SearchBar
                                        onSearch={handleSearch}
                                        placeholder="Search"
                                        defaultSelectedColumns={['name', 'status']}
                                        defaultOperator="cn"
                                        showOperatorSelector={false}
                                        className="flex-shrink-0"
                                    />

                                    {/* Person Filter Button */}
                                    <button
                                        onClick={handlePersonFilterClick}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                        title="Filter by Person"
                                    >
                                        <img src="/projecticon/Person.svg" alt="Person Icon" width={17} height={17} />
                                        <span>Person</span>
                                        {(personFilters.managerIds?.length || personFilters.teamIds?.length) ? (
                                            <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                                {Math.max(personFilters.managerIds?.length || 0, personFilters.teamIds?.length || 0)}
                                            </span>
                                        ) : null}
                                    </button>

                                    {/* Add Filters Button */}
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

                                    {/* Sort Filter Button */}
                                    <button
                                        onClick={handleSortFilterClick}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700"
                                        title="Sort Projects"
                                    >
                                        <Image src="/sort.svg" alt="Filters" width={16} height={16} />
                                        <span>Sort</span>
                                    </button>
                                </div>
                            </div>
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

                            <div className="flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 w-full min-w-0 min-h-0 overflow-auto">
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
                                        frozenColumnKeys={['projectId']}
                                        sortConfig={sort}
                                        onSortChange={(cfg) => {
                                            if (cfg) {
                                                setSort(cfg);
                                                setCurrentPage(1); // Reset to first page when sorting changes
                                            }
                                        }}
                                        loading={loading}
                                        onRenameColumn={handleRenameColumn}
                                        onHideColumn={handleHideColumn}
                                        onToggleColumnVisibility={handleToggleColumnVisibility}
                                        onColumnOrderChange={handleReorderColumns}
                                        getCellRenderer={getCellRenderer as any}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Modal */}

                        <FormModal
                            isOpen={open}
                            onClose={handleModalClose}
                            title={getModalTitle()}
                            size="xl"
                            maxHeight="95vh"
                            disabled={!isEditMode && activeView === "default"}
                            // Add these props for back navigation
                            onBack={activeView !== "default" ? () => setActiveView("default") : undefined}
                            showBackButton={activeView !== "default"}
                        >
                            <TabbedFormLayout
                                tabs={filteredTabs}
                                activeTab={activeView === "default" ? activeTab : "overview"}
                                onTabChange={setActiveTab}
                                className="h-full"
                            />
                        </FormModal>

                        {/* Manager Selector Popover */}
                        <ManagerSelector
                            projectId={managerSelectorState.projectId}
                            currentManagers={managerSelectorState.currentManagers as any}
                            isOpen={managerSelectorState.isOpen}
                            onClose={() => setManagerSelectorState(prev => ({ ...prev, isOpen: false }))}
                            anchorEl={managerSelectorState.anchorEl}
                        />

                        {/* Team Selector Popover */}
                        <TeamSelector
                            projectId={teamSelectorState.projectId}
                            currentTeam={teamSelectorState.currentTeam as any}
                            isOpen={teamSelectorState.isOpen}
                            onClose={() => setTeamSelectorState(prev => ({ ...prev, isOpen: false }))}
                            anchorEl={teamSelectorState.anchorEl}
                        />

                        {/* Advanced Filter Popover */}
                        <AdvancedFilterPopover
                            // modelType="project"
                            anchorEl={filterAnchorEl}
                            open={openAdvancedFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Project Filters"
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
                            onApplySort={(s) => handleApplySort(s.field, s.direction)}
                            currentSort={sort || { field: 'createdAt', direction: 'desc' }}
                        />

                        {/* Delete Confirmation Modal */}
                        <DeleteConfirmationModal
                            isOpen={deleteModalState.isOpen}
                            onClose={handleCancelDelete}
                            onConfirm={handleConfirmDelete}
                            title="Are you sure?"
                            message="Do you really want to delete this project permanently?"
                            itemName={deleteModalState.projectName || undefined}
                            isDeleting={deleteModalState.isDeleting}
                        />

                        {/* Gantt View Popover */}
                        {selectedProjectForGantt && (
                            <GanttViewPopover
                                open={ganttViewOpen}
                                onClose={() => {
                                    setGanttViewOpen(false);
                                    setGanttAnchorEl(null);
                                    setSelectedProjectForGantt(null);
                                }}
                                anchorEl={ganttAnchorEl}
                                projectId={selectedProjectForGantt.id}
                                projectName={selectedProjectForGantt.name || selectedProjectForGantt.projectName || 'Project'}
                            />
                        )}

                        <ProjectExportModal
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            fields={finalFields}
                            rows={rows as unknown as Record<string, unknown>[]}
                            fetchAllProjects={async () => {
                                try {
                                    const pageSizeAll = 1000;
                                    let p = 1;
                                    const allProjects: Record<string, unknown>[] = [];

                                    while (true) {
                                        const params: QueryParams = {
                                            page: p,
                                            countPerPage: pageSizeAll,
                                            sort: sort?.field || 'createdAt', // Handle null sort
                                            sortDirection: sort?.direction || 'desc', // Handle null sort
                                        };

                                        // Add existing filters
                                        if (personFilters.managerIds && personFilters.managerIds.length > 0) {
                                            params['manager.id'] = `in:${personFilters.managerIds.join(',')}`;
                                        }
                                        if (personFilters.teamIds && personFilters.teamIds.length > 0) {
                                            params['team.id'] = `in:${personFilters.teamIds.join(',')}`;
                                        }
                                        if (Object.keys(searchQueryParams).length > 0) {
                                            Object.entries(searchQueryParams).forEach(([key, value]) => {
                                                params[key] = value;
                                            });
                                        }

                                        const response = await triggerGetAllProjects(params).unwrap();
                                        const projects = (response as ProjectsResponse)?.data?.projects || [];
                                        allProjects.push(...projects as unknown as Record<string, unknown>[]);

                                        if (projects.length < pageSizeAll) break;
                                        p += 1;
                                    }
                                    return allProjects;
                                } catch (e) {
                                    console.error('Export fetchAll (projects) failed', e);
                                    return [];
                                }
                            }}
                            fetchAllTasks={async () => {
                                try {
                                    // Use the existing allTasksData from the hook at the top of your component
                                    if (allTasksData?.data?.data?.tasks) {
                                        return allTasksData.data.data.tasks as Record<string, unknown>[];
                                    }

                                    // Fallback: make a direct API call if needed
                                    const response = await fetch('/api/tasks?page=1&countPerPage=10000');
                                    const result = await response.json();
                                    return result.data?.data?.tasks || result.data?.tasks || [];
                                } catch (e) {
                                    console.error('Export fetchAll (tasks) failed', e);
                                    return [];
                                }
                            }}
                            fetchAllSubtasks={async () => {
                                try {
                                    // Use existing tasks data or fetch directly
                                    let tasks = [];
                                    if (allTasksData?.data?.data?.tasks) {
                                        tasks = allTasksData.data.data.tasks;
                                    } else {
                                        const response = await fetch('/api/tasks?page=1&countPerPage=10000');
                                        const result = await response.json();
                                        tasks = result.data?.data?.tasks || result.data?.tasks || [];
                                    }

                                    const allSubtasks: Record<string, unknown>[] = [];

                                    tasks.forEach((task: any) => {
                                        if (Array.isArray(task.subtasks)) {
                                            task.subtasks.forEach((subtask: any) => {
                                                allSubtasks.push({
                                                    ...subtask,
                                                    taskId: task.id, // Add parent task ID
                                                    projectId: task.projectId, // Add project ID
                                                });
                                            });
                                        }
                                    });

                                    return allSubtasks;
                                } catch (e) {
                                    console.error('Export fetchAll (subtasks) failed', e);
                                    return [];
                                }
                            }}
                        />

                        {/* <Footer /> */}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
