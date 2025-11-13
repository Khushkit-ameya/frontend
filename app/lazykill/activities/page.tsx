// C:\Users\Nezuko\Desktop\ameya suite\AmeyaSuite_Frontend\app\lazykill\activities\page.tsx
"use client";
import React, { useState, useRef, useEffect, JSX, useMemo, useCallback } from "react";
import { Edit, FolderPlus, Clock, Calendar, Users, FileText, LucideCircleUserRound, ArrowUpDown } from "lucide-react";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useTheme } from '@/store/hooks';
import { TabbedFormLayout } from "@/components/common/forms/TabbedFormLayout";
import { OverviewTabContent } from "@/components/common/forms/tab-contents/OverviewTabContent";
import { UpdatesTabContent } from "@/components/common/forms/tab-contents/UpdatesTabContent";
import { FilesLinksTabContent } from "@/components/common/forms/tab-contents/FilesLinksTabContent";
import { FormModal } from "@/components/common/forms/FormModal";
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
import {
    useGetAllActivitiesQuery,
    useCreateActivityMutation,
    useUpdateActivityMutation,
    useDeleteActivityMutation,
    useUpdateActivityStatusMutation,
    useUpdateActivityStatusOnlyMutation,
    ActivityType,
    ActivityStatus,
    CreateActivityDto,
    UpdateActivityDto,
    Activity,
    useGetAllActivitiesInQuery
} from "@/store/api_query/LazyKill/activities.api";
import { useGetCurrentUserQuery, useGetCompanyUsersQuery } from "@/store/api_query/auth.api";
import { useGetAllTasksQuery, useGetAllSubtasksQuery } from "@/store/api_query/LazyKill/lazyKill.api";
import ActivitySearchBar from "@/components/common/ActivitySearchBar";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";
import Image from "next/image";
import FinalTable from "@/components/common/CommonTable";
import StatusDropdown from "@/components/dropdowns/StatusDropdown";
import { mapBackendListToFrontend } from "@/utils/fieldDefinitions";
import type { FieldDefinition, SortConfig } from "@/types/FieldDefinitions";
import { customToast as toast } from '@/utils/toast';
import ActivityAdvancedFilterPopover from '../../../components/common/ActivityAdvancedFilterPopover';
import type { ActivityFilterCondition } from '../../../components/common/ActivityAdvancedFilterPopover';
import AssignedUserSelector from '../../../components/Activity/AssignedUserSelector';
import PersonFilterPopover from '../../../components/Activity/PersonFilterPopover';
import SortFilterPopover from '../../../components/Activity/SortFilterPopover';
import PagerIcon from '@/assests/pager.svg';
import editpencil from '@/assests/editpencil.png';
import deleteForever from '@/assests/delete_forever.png';
import threeDot from '@/assests/threeDots.png';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import FilterIcon from '@/assests/filter-icon.png'

// ADD THESE IMPORTS FOR FORM FUNCTIONALITY
import { getDynamicFieldConfig } from '@/components/common/forms/DynamicForm/dynamicFieldConfig';
import { useGetProjectUpdatesQuery, useCreateProjectUpdateMutation, useGetAllProjectsQuery } from '@/store/api_query/LazyKill/project.api';
import DynamicForm from '@/components/common/forms/DynamicForm/DynamicForm';

// Define proper types for form fields and related entities
interface FormField {
    fieldKey: string;
    displayName: string;
    fieldType: string;
    isRequired: boolean;
    isEditable: boolean;
    displayOrder: number;
    options?: {
        placeholder?: string;
        choices?: string[] | Array<{ value: string; label: string }>;
        multiple?: boolean;
    };
    // icon?: React.ComponentType<any>;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    tooltip?: string;
    iconBg?: string;
    id?: string;
    fieldId?: string;
    isReadOnly?: boolean;
    helpText?: string;
}

interface DropdownOption {
    fieldKey: string;
    displayName: string;
    color: string;
}

type RelatedType = 'project' | 'task' | 'subtask';

const normalizeRelatedType = (value: unknown, fallback: RelatedType = 'project'): RelatedType => {
    if (typeof value === 'string') {
        if (value === 'task' || value === 'subtask') {
            return value;
        }
        return 'project';
    }

    if (value && typeof value === 'object') {
        const candidate = (value as Record<string, unknown>).value;
        if (candidate === 'task' || candidate === 'subtask') {
            return candidate;
        }
    }

    return fallback;
};

const extractSelectionId = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.value === 'string') return record.value;
        if (typeof record.id === 'string') return record.id;
    }
    return null;
};

const ActivityFormOverviewTabContent: React.FC<{
    formFields: FormField[];
    onSubmit: (values: Record<string, unknown>) => void;
    isEditMode?: boolean;
    initialValues?: Record<string, unknown>;
    className?: string;
    onAddDropdownOption?: (fieldId: string, option: DropdownOption) => Promise<void>;
    onUpdateDropdownOption?: (fieldId: string, value: string, updates: { displayName?: string; color?: string }) => Promise<void>;
    onReorderDropdownOptions?: (fieldId: string, orderedOptions: DropdownOption[]) => Promise<void>;
    onDeleteDropdownOption?: (fieldId: string, value: string) => Promise<void>;
}> = ({
    formFields,
    onSubmit,
    isEditMode = false,
    initialValues = {},
    className = "",
    onAddDropdownOption,
    onUpdateDropdownOption,
    onReorderDropdownOptions,
    onDeleteDropdownOption,
}) => {
        // State for related entity data - with cascading hierarchy
        const [selectedRelatedType, setSelectedRelatedType] = useState<RelatedType>(() =>
            normalizeRelatedType(
                (initialValues.relatedTo as string) ||
                (initialValues.subTaskId ? 'subtask' : initialValues.taskId ? 'task' : 'project')
            )
        );
        const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => (initialValues.projectId as string) || null);
        const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => (initialValues.taskId as string) || null);
        const [selectedSubTaskId, setSelectedSubTaskId] = useState<string | null>(() => (initialValues.subTaskId as string) || null);

        const validateEntitySelection = (values: Record<string, unknown>): string | null => {
            const relatedTo = values.relatedTo as string;

            if (!relatedTo) {
                return 'Please select what this activity is related to';
            }

            if (relatedTo === 'project' && !values.selectedProject) {
                return 'Please select a project';
            }
            else if (relatedTo === 'task') {
                if (!values.selectedProject) return 'Please select a project';
                if (!values.selectedTask) return 'Please select a task';
            }
            else if (relatedTo === 'subtask') {
                if (!values.selectedProject) return 'Please select a project';
                if (!values.selectedTask) return 'Please select a task';
                if (!values.selectedSubTask) return 'Please select a subtask';
            }

            return null;
        };

        // Fetch data for different entity types
        const { data: projectsData } = useGetAllProjectsQuery({
            page: 1,
            countPerPage: 1000
        });

        // Fetch ALL tasks
        const { data: tasksData } = useGetAllTasksQuery({
            page: 1,
            countPerPage: 1000
        });

        // Fetch ALL subtasks
        const { data: subTasksData } = useGetAllSubtasksQuery({
            page: 1,
            countPerPage: 1000
        });


        // Enhanced debugging in your component
        useEffect(() => {
            console.log('=== TASKS DATA DEBUG ===');
            console.log('Full tasksData:', tasksData);
            console.log('Tasks data structure:', tasksData?.data);
            console.log('Tasks array:', tasksData?.data?.data?.tasks);
            console.log('Tasks count:', tasksData?.data?.data?.tasks?.length);
        }, [tasksData]);

        useEffect(() => {
            console.log('=== SUBTASKS DATA DEBUG ===');
            console.log('Full subTasksData:', subTasksData);
            console.log('Subtasks data structure:', subTasksData?.data);
            console.log('Subtasks array:', subTasksData?.data?.data?.subtasks);
            console.log('Subtasks count:', subTasksData?.data?.data?.subtasks?.length);
        }, [subTasksData]);
        const projects = useMemo(() => {
            console.log('🔍 Projects data structure:', projectsData);

            if (projectsData?.data?.data?.projects) {
                return projectsData.data.data.projects;
            }
            if (projectsData?.data?.projects) {
                return projectsData.data.projects;
            }
            if (projectsData?.projects) {
                return projectsData.projects;
            }
            return [];
        }, [projectsData]);

        const tasks = useMemo(() => {
            console.log('🔍 Tasks data structure:', tasksData);

            if (tasksData?.data?.data?.tasks) {
                console.log('✅ Tasks found (nested):', tasksData.data.data.tasks);
                return tasksData.data.data.tasks;
            }
            if (tasksData?.data?.tasks) {
                console.log('✅ Tasks found (direct):', tasksData.data.tasks);
                return tasksData.data.tasks;
            }
            if (tasksData?.tasks) {
                return tasksData.tasks;
            }
            console.log('❌ No tasks found');
            return [];
        }, [tasksData]);

        const subTasks = useMemo(() => {
            console.log('🔍 Subtasks data structure:', subTasksData);

            if (subTasksData?.data?.data?.subtasks) {
                console.log('✅ Subtasks found (nested):', subTasksData.data.data.subtasks);
                return subTasksData.data.data.subtasks;
            }
            if (subTasksData?.data?.subtasks) {
                console.log('✅ Subtasks found (direct):', subTasksData.data.subtasks);
                return subTasksData.data.subtasks;
            }
            if (subTasksData?.subtasks) {
                return subTasksData.subtasks;
            }
            console.log('❌ No subtasks found');
            return [];
        }, [subTasksData]);


        // UPDATE the handleSubmit function in ActivityFormOverviewTabContent
        const handleSubmit = (values: Record<string, unknown>) => {
            const submitData = { ...values };
            const relatedToValue = normalizeRelatedType(values.relatedTo, selectedRelatedType);
            submitData.relatedTo = relatedToValue;

            const projectSelectionId =
                extractSelectionId(values.selectedProject) ||
                (submitData.projectId as string | null) ||
                selectedProjectId;
            const taskSelectionId =
                extractSelectionId(values.selectedTask) ||
                (submitData.taskId as string | null) ||
                selectedTaskId;
            const subTaskSelectionId =
                extractSelectionId(values.selectedSubTask) ||
                (submitData.subTaskId as string | null) ||
                selectedSubTaskId;

            console.log('Form values before submission:', values); // Debug log
            console.log('Selected entities:', {
                projectId: projectSelectionId,
                taskId: taskSelectionId,
                subTaskId: subTaskSelectionId,
            });

            if (projectSelectionId) {
                submitData.projectId = projectSelectionId;
            }

            if (relatedToValue === 'task' || relatedToValue === 'subtask') {
                if (taskSelectionId) {
                    submitData.taskId = taskSelectionId;
                }
            }

            if (relatedToValue === 'subtask' && subTaskSelectionId) {
                submitData.subTaskId = subTaskSelectionId;
            }

            const validationError = validateEntitySelection({
                relatedTo: relatedToValue,
                selectedProject: submitData.projectId,
                selectedTask: submitData.taskId,
                selectedSubTask: submitData.subTaskId,
            });

            if (validationError) {
                toast.error(validationError);
                return;
            }

            // Remove the temporary selection fields
            delete submitData.selectedProject;
            delete submitData.selectedTask;
            delete submitData.selectedSubTask;

            console.log('Final submit data with IDs:', submitData); // Debug log

            onSubmit(submitData);
        };

        const enhancedFormFields = useMemo(() => {
            let fields = [...formFields];

            // Remove any existing related entity fields to avoid duplicates
            fields = fields.filter(field =>
                field.fieldKey !== 'selectedProject' &&
                field.fieldKey !== 'selectedTask' &&
                field.fieldKey !== 'selectedSubTask'
            );

            const relatedToFieldIndex = fields.findIndex(field => field.fieldKey === 'relatedTo');
            let insertIndex = relatedToFieldIndex !== -1 ? relatedToFieldIndex + 1 : fields.length;

            // Show Project selector for all types
            if (selectedRelatedType === 'project' || selectedRelatedType === 'task' || selectedRelatedType === 'subtask') {
                const projectOptions = (projects as Array<Record<string, unknown>>).map((entity) => ({
                    value: entity.id as string,
                    label: (entity.name || entity.projectId || entity.id) as string,
                }));

                console.log('🎯 Project dropdown options:', projectOptions.length, projectOptions);

                const projectField: FormField = {
                    fieldKey: 'selectedProject',
                    displayName: 'Select Project',
                    fieldType: 'DROPDOWN',
                    isRequired: true,
                    isEditable: true,
                    isReadOnly: false,
                    options: {
                        choices: projectOptions,
                        placeholder: projectOptions.length > 0 ? 'Select a project' : 'No projects available',
                        multiple: false,
                    },
                    displayOrder: insertIndex,
                    helpText: 'Select the project this activity is related to',
                    fieldId: 'selected-project',
                    id: 'selected-project',
                    icon: FolderPlus,
                    tooltip: 'Select Project',
                    iconBg: "#C81C1F",
                };

                fields.splice(insertIndex, 0, projectField);
                insertIndex++; // IMPORTANT: Increment after inserting project
            }

            // Show Task selector if type is 'task' or 'subtask' AND a project is selected
            if ((selectedRelatedType === 'task' || selectedRelatedType === 'subtask') && selectedProjectId) {
                const filteredTasks = (tasks as Array<Record<string, any>>).filter((task) => {
                    const projectId = task.projectId || task.project?.id;
                    return projectId === selectedProjectId;
                });
                
                const taskOptions = filteredTasks.map((entity: Record<string, unknown>) => {
                    const taskName = entity.taskName || entity.taskId || entity.id || 'Unnamed Task';
                    return {
                        value: entity.id as string,
                        label: taskName as string,
                    };
                });

                console.log('🎯 Task dropdown options (filtered by project):', taskOptions.length, taskOptions);

                const taskField: FormField = {
                    fieldKey: 'selectedTask',
                    displayName: 'Select Task',
                    fieldType: 'DROPDOWN',
                    isRequired: true,
                    isEditable: true,
                    isReadOnly: false,
                    options: {
                        choices: taskOptions,
                        placeholder: taskOptions.length > 0 ? 'Select a task' : 'No tasks available for this project',
                        multiple: false,
                    },
                    displayOrder: insertIndex,
                    helpText: 'Select the task this activity is related to',
                    fieldId: 'selected-task',
                    id: 'selected-task',
                    icon: FolderPlus,
                    tooltip: 'Select Task',
                    iconBg: "#C81C1F",
                };

                fields.splice(insertIndex, 0, taskField);
                insertIndex++; // IMPORTANT: Increment after inserting task
            }

            // Show SubTask selector if type is 'subtask' AND a task is selected
            if (selectedRelatedType === 'subtask' && selectedProjectId && selectedTaskId) {
                const filteredSubTasks = (subTasks as Array<Record<string, any>>).filter((subtask) => 
                    subtask.taskId === selectedTaskId
                );
                
                const subTaskOptions = filteredSubTasks.map((entity: Record<string, unknown>) => {
                    const subTaskName = entity.subtaskName || entity.subTaskName || entity.subTaskId || entity.id || 'Unnamed Subtask';
                    return {
                        value: entity.id as string,
                        label: subTaskName as string,
                        entity: entity
                    };
                });

                console.log('🎯 Subtask dropdown options (filtered by task):', subTaskOptions.length, subTaskOptions);

                const subTaskField: FormField = {
                    fieldKey: 'selectedSubTask',
                    displayName: 'Select Sub Task',
                    fieldType: 'DROPDOWN',
                    isRequired: true,
                    isEditable: true,
                    isReadOnly: false,
                    options: {
                        choices: subTaskOptions,
                        placeholder: subTaskOptions.length > 0 ? 'Select a sub task' : 'No sub tasks available for this task',
                        multiple: false,
                    },
                    displayOrder: insertIndex,
                    helpText: 'Select the sub task this activity is related to',
                    fieldId: 'selected-subtask',
                    id: 'selected-subtask',
                    icon: FolderPlus,
                    tooltip: 'Select Sub Task',
                    iconBg: "#C81C1F",
                };

                fields.splice(insertIndex, 0, subTaskField);
                // No need to increment here since this is the last field
            }

            console.log('🏁 Final enhanced form fields:', fields);
            return fields.sort((a: FormField, b: FormField) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }, [formFields, selectedRelatedType, selectedProjectId, selectedTaskId, selectedSubTaskId, projects, tasks, subTasks]);

        // Set initial related entity when in edit mode
        useEffect(() => {
            if (isEditMode && initialValues) {
                const inferredType = normalizeRelatedType(
                    initialValues.relatedTo ||
                    (initialValues.subTaskId ? 'subtask' : initialValues.taskId ? 'task' : 'project')
                );
                setSelectedRelatedType(inferredType);
                setSelectedProjectId((initialValues.projectId as string) || null);
                setSelectedTaskId((initialValues.taskId as string) || null);
                setSelectedSubTaskId((initialValues.subTaskId as string) || null);
            } else if (!isEditMode) {
                setSelectedRelatedType('project');
                setSelectedProjectId(null);
                setSelectedTaskId(null);
                setSelectedSubTaskId(null);
            }
        }, [
            isEditMode,
            initialValues?.id,
            initialValues?.projectId,
            initialValues?.taskId,
            initialValues?.subTaskId,
            initialValues?.relatedTo,
        ]);

        return (
            <div className={`${className}`}>
                <div className="border border-[#0000004F] rounded-lg bg-white dark:bg-gray-900 overflow-auto">
                    <div className="p-5">
                        <DynamicForm
                            fields={enhancedFormFields as any}
                            onSubmit={handleSubmit}
                            isEditMode={isEditMode}
                            initialValues={{
                                ...initialValues,
                                relatedTo: selectedRelatedType,
                                selectedProject: selectedProjectId,
                                selectedTask: selectedTaskId,
                                selectedSubTask: selectedSubTaskId
                            }}
                            submitButtonText={isEditMode ? "Update Activity" : "Create Activity"}
                            onFieldChange={(field: string, value: any) => {
                                // Handle dropdown changes
                                if (field === 'relatedTo') {
                                    const newRelatedTo = normalizeRelatedType(value, 'project');
                                    setSelectedRelatedType(newRelatedTo);
                                    // Reset selections when type changes
                                    setSelectedProjectId(null);
                                    setSelectedTaskId(null);
                                    setSelectedSubTaskId(null);
                                } else if (field === 'selectedProject') {
                                    setSelectedProjectId(extractSelectionId(value));
                                    // Reset task and subtask when project changes
                                    setSelectedTaskId(null);
                                    setSelectedSubTaskId(null);
                                } else if (field === 'selectedTask') {
                                    setSelectedTaskId(extractSelectionId(value));
                                    // Reset subtask when task changes
                                    setSelectedSubTaskId(null);
                                } else if (field === 'selectedSubTask') {
                                    setSelectedSubTaskId(extractSelectionId(value));
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

export default function Activities() {
    const { isDark, colors } = useTheme();

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['title', 'type']);

    // Advanced filter state
    const [advancedFilters, setAdvancedFilters] = useState<ActivityFilterCondition[]>([]);
    const [advancedFilterParams, setAdvancedFilterParams] = useState<Record<string, string>>({});
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);

    // Person filter state
    const [personFilterAnchorEl, setPersonFilterAnchorEl] = useState<HTMLElement | null>(null);
    const [openPersonFilter, setOpenPersonFilter] = useState(false);
    const [personFilters, setPersonFilters] = useState<{
        assignedToIds?: string[];
        createdByIds?: string[];
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

    // ADD FORM MODAL STATE
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
    const [activeTab, setActiveTab] = useState("form-overview");

    // Build query parameters for search and pagination according to API format (operator:value)
    const queryParams = useMemo(() => {
        const params: Record<string, string | number> = {};

        // Add pagination parameters
        params.page = currentPage;
        params.countPerPage = pageSize;

        // Add sorting parameters
        if (sort) {
            params.sort = sort.field;
            params.sortDirection = sort.direction;
        }

        // Add person filters (assignedTo and createdBy)
        if (personFilters.assignedToIds && personFilters.assignedToIds.length > 0) {
            // Use "in" operator for multiple user IDs
            params.assignedToId = `in:${personFilters.assignedToIds.join(',')}`;
        }

        if (personFilters.createdByIds && personFilters.createdByIds.length > 0) {
            // Use "in" operator for multiple user IDs - map to createdById for backend
            params.createdBy = `in:${personFilters.createdByIds.join(',')}`;
        }

        // Add search filters for selected columns if there's a search term
        if (searchTerm && searchTerm.trim() && selectedColumns.length > 0) {
            const trimmedTerm = searchTerm.trim();
            selectedColumns.forEach(column => {
                // Use "cn" (contains) operator for case-insensitive text search
                params[column] = `cn:${trimmedTerm}`;
            });
        }

        // Add advanced filter parameters
        Object.keys(advancedFilterParams).forEach(key => {
            // Only add if not already added by search or person filters
            if (!params[key]) {
                params[key] = advancedFilterParams[key];
            }
        });

        return params;
    }, [searchTerm, selectedColumns, advancedFilterParams, currentPage, pageSize, sort, personFilters]);

    // Queries and Mutations
    const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();
    const { data: companyUsersData, isLoading: usersLoading } = useGetCompanyUsersQuery({});
    const { data: activitiesData, isLoading: activitiesLoading } = useGetAllActivitiesInQuery(queryParams);
    const [createActivity] = useCreateActivityMutation();
    const [updateActivity] = useUpdateActivityMutation();
    const [deleteActivity] = useDeleteActivityMutation();
    const [updateActivityStatus] = useUpdateActivityStatusMutation();
    const [updateActivityStatusOnly] = useUpdateActivityStatusOnlyMutation();

    // ADD PROJECT UPDATES MUTATIONS AND QUERIES
    const [createProjectUpdate] = useCreateProjectUpdateMutation();
    const { data: projectUpdatesData, isLoading: projectUpdatesLoading } = useGetProjectUpdatesQuery(
        (editData?.projectId as string) || '',
        { skip: !isFormModalOpen || !editData?.projectId }
    );

    // User Selector State
    const [userSelectorState, setUserSelectorState] = useState<{
        isOpen: boolean;
        activityId: string;
        currentAssignedUser: Record<string, unknown> | null;
        anchorEl: HTMLElement | null;
    }>({
        isOpen: false,
        activityId: '',
        currentAssignedUser: null,
        anchorEl: null
    });

    // Delete Modal State
    const [deleteModalState, setDeleteModalState] = useState<{
        isOpen: boolean;
        activityId: string | null;
        activityTitle: string | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        activityId: null,
        activityTitle: null,
        isDeleting: false
    });

    // Define static field definitions for activities
    const finalFields: FieldDefinition[] = useMemo(() => [
        {
            id: '1',
            fieldKey: 'title',
            displayName: 'Title',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: true,
            isEditable: true,
            displayOrder: 1,
        },
        {
            id: '2',
            fieldKey: 'description',
            displayName: 'Description',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: false,
            isEditable: true,
            displayOrder: 2,
        },
        {
            id: '3',
            fieldKey: 'type',
            displayName: 'Type',
            fieldType: 'DROPDOWN',
            isVisible: true,
            isRequired: true,
            isEditable: true,
            displayOrder: 3,
            options: {
                choices: ['meeting', 'call', 'notes', 'toDo', 'email']
            }
        },
        {
            id: '4',
            fieldKey: 'status',
            displayName: 'Status',
            fieldType: 'DROPDOWN',
            isVisible: true,
            isRequired: false,
            isEditable: true,
            displayOrder: 4,
            options: {
                choices: ['not-started', 'scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold']
            }
        },
        {
            id: '5',
            fieldKey: 'scheduleTimeFrom',
            displayName: 'Start Time',
            fieldType: 'DATE_TIME',
            isVisible: true,
            isRequired: true,
            isEditable: true,
            displayOrder: 5,
        },
        {
            id: '6',
            fieldKey: 'scheduleTimeTo',
            displayName: 'End Time',
            fieldType: 'DATE_TIME',
            isVisible: true,
            isRequired: true,
            isEditable: true,
            displayOrder: 6,
        },
        {
            id: '7',
            fieldKey: 'assignedTo',
            displayName: 'Assigned To',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: false,
            isEditable: false,
            displayOrder: 7,
        },
        {
            id: '8',
            fieldKey: 'createdBy',
            displayName: 'Owner',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: false,
            isEditable: false,
            displayOrder: 8,
        },
        {
            id: '9',
            fieldKey: 'project',
            displayName: 'Project',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: false,
            isEditable: false,
            displayOrder: 9,
        },
        {
            id: '10',
            fieldKey: 'task',
            displayName: 'Task',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: false,
            isEditable: false,
            displayOrder: 10,
        },
        {
            id: '11',
            fieldKey: 'subTask',
            displayName: 'Subtask',
            fieldType: 'TEXT',
            isVisible: true,
            isRequired: false,
            isEditable: false,
            displayOrder: 11,
        },
        {
            id: '12',
            fieldKey: 'action',
            displayName: 'Action',
            fieldType: 'ACTION',
            isVisible: true,
            isRequired: false,
            isEditable: false,
            displayOrder: 12,
        },
    ], []);

    // Filter columns based on showLessColumns state
    const visibleFields: FieldDefinition[] = useMemo(() => {
        if (!showLessColumns) {
            return finalFields;
        }

        // Show only the first 6 columns when showLessColumns is true
        const columnsToShow = 6;
        return finalFields.slice(0, columnsToShow);
    }, [finalFields, showLessColumns]);

    // In your activities page - update getCompanyUsersChoices function
    const getCompanyUsersChoices = (): Array<{ id: string; name?: string; firstName?: string; lastName?: string; value: string; label: string }> => {
        if (!companyUsersData?.users || companyUsersData.users.length === 0) {
            return [];
        }

        return companyUsersData.users.map((user: any) => {
            // Ensure the user object has the expected structure
            const firstName = user.first_name || user.firstName || '';
            const lastName = user.last_name || user.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();

            return {
                id: user.id as string,
                value: user.id as string,
                label: fullName,
                name: fullName,
                firstName: firstName,
                lastName: lastName
            };
        });
    };

    // UPDATE the activityFields configuration to make project required
    const activityFields = useMemo(() => {
        const baseFields: FormField[] = [
            {
                fieldKey: 'title',
                displayName: 'Activity Title',
                fieldType: 'TEXT',
                isRequired: true,
                isEditable: true,
                displayOrder: 1,
                options: {
                    placeholder: 'Enter activity title'
                },
                icon: FileText,
                tooltip: 'Enter the activity title',
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'description',
                displayName: 'Description',
                fieldType: 'TEXT',
                isRequired: false,
                isEditable: true,
                displayOrder: 2,
                options: {
                    placeholder: 'Enter activity description'
                },
                icon: FileText,
                tooltip: 'Enter activity description',
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'type',
                displayName: 'Activity Type',
                fieldType: 'DROPDOWN',
                isRequired: true,
                isEditable: true,
                displayOrder: 3,
                options: {
                    choices: ['meeting', 'call', 'notes', 'toDo', 'email'].map(type => ({
                        value: type,
                        label: type === 'toDo' ? 'To Do' : type.charAt(0).toUpperCase() + type.slice(1)
                    })),
                    placeholder: 'Select activity type'
                },
                icon: Edit,
                tooltip: 'Select activity type',
                iconBg: "#C81C1F",
            },
            // Add relatedTo field here to make it required
            {
                fieldKey: 'relatedTo',
                displayName: 'Related To',
                fieldType: 'DROPDOWN',
                isRequired: true, // Make this required
                isEditable: true,
                displayOrder: 4,
                options: {
                    choices: [
                        { value: 'project', label: 'Project' },
                        { value: 'task', label: 'Task' },
                        { value: 'subtask', label: 'Sub Task' }
                    ],
                    placeholder: 'Select related entity type'
                },
                icon: FolderPlus,
                tooltip: 'Select what this activity is related to',
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'scheduleTimeFrom',
                displayName: 'Start Time',
                fieldType: 'DATE_TIME',
                isRequired: true,
                isEditable: true,
                displayOrder: 5,
                options: {
                    placeholder: 'Select start date and time'
                },
                icon: Clock,
                tooltip: 'Select start date and time',
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'scheduleTimeTo',
                displayName: 'End Time',
                fieldType: 'DATE_TIME',
                isRequired: true,
                isEditable: true,
                displayOrder: 6,
                options: {
                    placeholder: 'Select end date and time'
                },
                icon: Clock,
                tooltip: 'Select end date and time',
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'status',
                displayName: 'Status',
                fieldType: 'DROPDOWN',
                isRequired: false,
                isEditable: true,
                displayOrder: 7,
                options: {
                    choices: ['not-started', 'scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold'].map(status => ({
                        value: status,
                        label: status.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                    })),
                    placeholder: 'Select activity status'
                },
                icon: Edit,
                tooltip: 'Select activity status',
                iconBg: "#C81C1F",
            },
            {
                fieldKey: 'assignedToId',
                displayName: 'Assigned To',
                fieldType: 'USER_DROPDOWN',
                isRequired: false,
                isEditable: true,
                displayOrder: 8,
                options: {
                    choices: getCompanyUsersChoices().map(user => ({
                        value: user.id,
                        label: user.name || `${user.firstName} ${user.lastName}`.trim()
                    })),
                    placeholder: 'Assign to user',
                    multiple: false
                },
                icon: Users,
                tooltip: 'Assign activity to a user',
                iconBg: "#C81C1F",
            }
        ];

        // Apply dynamic field config
        return baseFields.map(field => {
            const dynamicConfig = getDynamicFieldConfig(
                field.fieldKey,
                // field.fieldType as any,
                field.fieldType as 'TEXT' | 'DROPDOWN' | 'DATE_TIME' | 'USER_DROPDOWN',
                field.displayName
            );

            return {
                ...field,
                icon: dynamicConfig.icon || field.icon,
                tooltip: dynamicConfig.tooltip || field.tooltip,
            };
        });
    }, [companyUsersData]);

    const handleFormSubmit = async (values: Record<string, unknown>) => {
        try {
            if (!currentUser?.id && !isEditMode) {
                toast.error("User information not available. Please refresh and try again.");
                return;
            }

            console.log('Form values before transformation:', values);

            // Transform values for LazyKill API
            const transformedValues: CreateActivityDto | UpdateActivityDto = {
                title: (values.title as string)?.trim(),
                description: (values.description as string)?.trim(),
                type: values.type as ActivityType,
                scheduleTimeFrom: values.scheduleTimeFrom as string,
                scheduleTimeTo: values.scheduleTimeTo as string,
                documents: values.documents as string[] || [],
            };

            // Handle status
            if (values.status) {
                const statusColors: Record<string, string> = {
                    'not-started': '#6b7280',
                    'scheduled': '#3b82f6',
                    'in-progress': '#f59e0b',
                    'completed': '#10b981',
                    'cancelled': '#ef4444',
                    'on-hold': '#fbbf24'
                };

                let statusName: string;

                if (typeof values.status === 'object' && values.status !== null) {
                    const statusObj = values.status as Record<string, unknown>;
                    statusName = (statusObj.value || statusObj.statusName || String(statusObj)) as string;
                } else {
                    statusName = String(values.status);
                }

                transformedValues.status = {
                    statusName: statusName,
                    color: statusColors[statusName] || '#6b7280'
                };
            } else {
                transformedValues.status = {
                    statusName: 'not-started',
                    color: '#6b7280'
                };
            }

            // Handle assigned user
            if (values.assignedToId) {
                if (typeof values.assignedToId === 'object' && values.assignedToId !== null) {
                    const assignedObj = values.assignedToId as Record<string, unknown>;
                    transformedValues.assignedToId = (assignedObj.id || assignedObj.value) as string;
                } else {
                    transformedValues.assignedToId = values.assignedToId as string;
                }
            } else {
                transformedValues.assignedToId = currentUser?.id;
            }

            // FIXED: Handle project, task, and subtask IDs based on selected entities
            // Extract IDs from selected entities regardless of relatedTo value
            const selectedProjectIdFromForm = extractSelectionId(values['selectedProject']);
            if (selectedProjectIdFromForm) {
                transformedValues.projectId = selectedProjectIdFromForm;
                console.log('✅ Setting projectId:', transformedValues.projectId);
            }

            const selectedTaskIdFromForm = extractSelectionId(values['selectedTask']);
            if (selectedTaskIdFromForm) {
                transformedValues.taskId = selectedTaskIdFromForm;
                console.log('✅ Setting taskId:', transformedValues.taskId);
            }

            const selectedSubTaskIdFromForm = extractSelectionId(values['selectedSubTask']);
            if (selectedSubTaskIdFromForm) {
                transformedValues.subTaskId = selectedSubTaskIdFromForm;
                console.log('✅ Setting subTaskId:', transformedValues.subTaskId);
            }

            console.log('Final transformed values:', transformedValues);

            if (isEditMode && editData?.id) {
                // For edit mode, remove any undefined values but keep valid IDs
                const updateData: Record<string, unknown> = { ...transformedValues };

                // Only include fields that have values (not undefined or null)
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === undefined || updateData[key] === null) {
                        delete updateData[key];
                    }
                });

                console.log('Sending update data:', updateData);

                await updateActivity({
                    id: editData.id as string,
                    updateData: updateData as UpdateActivityDto
                }).unwrap();
                toast.success("Activity updated successfully!");
            } else {
                const createData = transformedValues as CreateActivityDto;
                if (!currentUser?.company?.id) {
                    throw new Error("Company information not found. Please ensure you're logged in.");
                }
                if (!currentUser?.id) {
                    throw new Error("User information not found. Please ensure you're logged in.");
                }

                const payload: Record<string, unknown> = {
                    ...createData,
                    companyId: currentUser.company.id,
                    assignedToId: createData.assignedToId || currentUser.id,
                    createdById: currentUser.id,
                };

                console.log('Creating activity with final payload:', payload);

                await createActivity(payload as any).unwrap();
                toast.success("Activity created successfully!");
            }

            setIsFormModalOpen(false);
            setIsEditMode(false);
            setEditData(null);
        } catch (error: unknown) {
            console.error("Failed to save activity:", error);
            let errorMessage = "An unexpected error occurred. Please try again.";

            if (error && typeof error === 'object' && 'data' in error) {
                const errorData = error as { data?: { message?: string } };
                if (errorData.data?.message) {
                    errorMessage = errorData.data.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toast.error(errorMessage);
        }
    };

    // ADD ACTIVITY UPDATES HANDLER
    const handleCreateActivityUpdate = async (content: string) => {
        if (!editData?.projectId || !currentUser?.company?.id || !currentUser?.id) {
            toast.error("Missing required information for update");
            return;
        }

        try {
            await createProjectUpdate({
                projectId: editData.projectId as string,
                updateNotes: content,
                companyId: currentUser.company.id,
                createdById: currentUser.id
            }).unwrap();

            toast.success("Update added successfully!");
        } catch (error: unknown) {
            console.error("Failed to add update:", error);
            let errorMessage = "Failed to add update";
            if (error && typeof error === 'object' && 'data' in error) {
                const errorData = error as { data?: { message?: string } };
                if (errorData.data?.message) {
                    errorMessage = errorData.data.message;
                }
            }
            toast.error(errorMessage);
        }
    };

    const handleAddActivity = () => {
        setIsEditMode(false);
        setEditData(null);
        setActiveTab("form-overview");
        setIsFormModalOpen(true);
    };

    const handleEditActivity = (activityData: Record<string, unknown>) => {
        setIsEditMode(true);
        setEditData(activityData);
        setActiveTab("form-overview");
        setIsFormModalOpen(true);
    };

    // UPDATE the getTabs function to this:
    const getTabs = () => {
        const baseTabs = [
            {
                key: "form-overview",
                label: "Activity Form",
                icon: search,
                component: ActivityFormOverviewTabContent,
                componentProps: {
                    formFields: activityFields,
                    onSubmit: handleFormSubmit,
                    isEditMode,
                    initialValues: editData || {},
                    className: "h-full",
                },
                disabled: false
            },
            // {
            //     key: "updates",
            //     label: "Updates",
            //     icon: home,
            //     component: UpdatesTabContent,
            //     componentProps: {
            //         className: "h-full",
            //         projectId: isEditMode && editData?.projectId ? editData.projectId as string : undefined,
            //         // Add these props for updates functionality
            //         updateOptions: [
            //             { value: "email", label: "Email", icon: "/icons/email (1).svg" },
            //             { value: "whatsapp", label: "WhatsApp", icon: "/icons/whatsapp.svg" },
            //             { value: "sms", label: "SMS", icon: "/icons/sms.svg" },
            //         ],
            //     },
            //     disabled: !isEditMode
            // },
            // {
            //     key: "files/links",
            //     label: "Files / Links",
            //     icon: update,
            //     component: FilesLinksTabContent,
            //     componentProps: {
            //         className: "h-full"
            //     },
            //     disabled: !isEditMode
            // },
        ];

        return baseTabs;
    };

    const getModalTitle = () => {
        return isEditMode ? "Edit Activity" : "Create Activity";
    };

    // Data and loading state
    const rows = activitiesData?.data?.activities ?? [];
    const totalCount = activitiesData?.data?.total ?? 0;
    const loading = activitiesLoading || userLoading;

    // Search handlers
    const handleSearch = useCallback((term: string, columns: string[], searchParams?: Record<string, string>) => {
        setSearchTerm(term);
        setSelectedColumns(columns);
        setCurrentPage(1); // Reset to first page when searching
        console.log('Search params built by SearchBar:', searchParams);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSelectedColumns([]);
        setCurrentPage(1); // Reset to first page when clearing search
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

    const handleApplyAdvancedFilters = useCallback((filters: ActivityFilterCondition[], queryParams: Record<string, string>) => {
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

    const handleApplyPersonFilter = useCallback((selectedUsers: string[], filterType: 'assignedTo' | 'createdBy' | 'both') => {
        if (selectedUsers.length === 0) {
            // Clear person filters
            setPersonFilters({});
        } else if (filterType === 'assignedTo') {
            setPersonFilters({ assignedToIds: selectedUsers });
        } else if (filterType === 'createdBy') {
            setPersonFilters({ createdByIds: selectedUsers });
        } else {
            // Both - filter by either assignedTo OR createdBy
            setPersonFilters({
                assignedToIds: selectedUsers,
                createdByIds: selectedUsers
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

    // Delete activity handlers
    const handleDeleteActivity = (activityId: string, activityTitle: string) => {
        setDeleteModalState({
            isOpen: true,
            activityId,
            activityTitle,
            isDeleting: false
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.activityId) return;

        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

        try {
            await deleteActivity(deleteModalState.activityId).unwrap();
            toast.success(`Activity "${deleteModalState.activityTitle}" deleted successfully`);
            handleCancelDelete();
        } catch (error: unknown) {
            console.error('Failed to delete activity:', error);
            let errorMessage = 'Failed to delete activity. Please try again.';

            if (error && typeof error === 'object' && 'data' in error) {
                const errorData = error as { data?: { message?: string } };
                if (errorData.data?.message) {
                    errorMessage = errorData.data.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalState({
            isOpen: false,
            activityId: null,
            activityTitle: null,
            isDeleting: false
        });
    };

    const activityTitleBtn: Array<{ name: string; icon: JSX.Element; onClick: () => void }> = [
        {
            name: "Add Activity",
            icon: <FiPlus />,
            onClick: handleAddActivity
        },
    ];

    // Cell renderer for table - UPDATED to include edit functionality
    const getCellRenderer = ({ field, row, value }: { field: FieldDefinition; row: Record<string, unknown>; value: unknown }) => {
        if (field.fieldKey === 'title' && typeof value === 'string') {
            const maxLength = 40;
            const truncatedTitle =
                value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;

            return (
                <div className="flex items-center gap-1">
                    <div
                        className="flex-1 cursor-pointer text-sm font-semibold text-[#c81c1f] whitespace-nowrap overflow-hidden text-ellipsis"
                        title={value}
                        style={{
                            maxWidth: '180px',
                            display: 'inline-block',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditActivity(row);
                        }}
                    >
                        {truncatedTitle}
                    </div>
                    <div
                        className="px-4 cursor-pointer border-l-[1px] border-gray-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditActivity(row);
                        }}
                    >
                        <Image src={PagerIcon} alt="Pager Icon" width={18} height={18} />
                    </div>
                </div>
            );
        }

        // Handle Activity Type
        if (field.fieldKey === 'type' && typeof value === 'string') {
            return (() => {
                const typeColors: Record<string, string> = {
                    toDo: '#ef4444',
                    email: '#8b5cf6',
                    meeting: '#3b82f6',
                    call: '#10b981',
                    notes: '#f59e0b',
                };
                const color = typeColors[value] || '#6b7280';
                return (
                    <span
                        className="text-sm capitalize border rounded-md px-2 py-1 inline-block text-center"
                        style={{
                            color,
                            border: `1px solid ${color}`,
                            minWidth: '150px',
                            width: '150px',
                        }}
                    >
                        {value === 'toDo' ? 'To Do' : value}
                    </span>
                );
            })();
        }

        // Handle Status with StatusDropdown
        if (field.fieldKey === 'status') {
            const choices = (field.options as { choices?: string[] })?.choices ?? [];
            const statusColors: Record<string, string> = {
                'not-started': '#6b7280',
                'scheduled': '#3b82f6',
                'in-progress': '#f59e0b',
                'completed': '#10b981',
                'cancelled': '#ef4444',
                'on-hold': '#fbbf24'
            };

            const options: DropdownOption[] = choices.map((choice: string) => ({
                fieldKey: choice,
                displayName: choice.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                color: statusColors[choice] ?? '#6b7280',
            }));

            let currentKey = '';
            if (value && typeof value === 'object' && 'statusName' in value) {
                const statusValue = value as { statusName: unknown };
                currentKey = String(statusValue.statusName);
            } else if (typeof value === 'string') {
                currentKey = value;
            }

            const activityId = (row?.id ?? row?._id) as string;
            return (
                <StatusDropdown
                    currentStatus={currentKey}
                    options={options}
                    onStatusChange={async (newKey: string) => {
                        if (!activityId) return;
                        try {
                            const sel = options.find((o: DropdownOption) => o.fieldKey === newKey);
                            await updateActivityStatusOnly({
                                id: activityId,
                                status: {
                                    statusName: sel ? sel.fieldKey : newKey,
                                    color: sel ? sel.color : '#6b7280'
                                }
                            }).unwrap();

                            toast.success(`Status updated to "${sel?.displayName || newKey}"`);
                        } catch (e) {
                            console.error('Failed to update activity status', e);
                            toast.error('Failed to update activity status');
                        }
                    }}
                    onUpdateOption={async () => { }} // Not needed for activities
                    onAddOption={async () => { }} // Not needed for activities
                    onReorderOptions={async () => { }} // Not needed for activities
                    disabled={false}
                    className="w-fit! rounded-lg! h-[21px]!"
                />
            );
        }

        // Handle DateTime fields
        if (field.fieldKey === 'scheduleTimeFrom' || field.fieldKey === 'scheduleTimeTo') {
            if (!value) return <div className="text-sm text-gray-500">-</div>;
            return (
                <div className="text-sm">
                    {DateTime.fromISO(value as string).toFormat('MMM dd, yyyy HH:mm')}
                </div>
            );
        }

        // Handle Assigned To
        if (field.fieldKey === 'assignedTo' && value && typeof value === 'object') {
            const assignedUser = value as Record<string, unknown>;
            const activityId = (row?.id ?? row?._id) as string;

            return (
                <div
                    className="flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (activityId) {
                            setUserSelectorState({
                                isOpen: true,
                                activityId,
                                currentAssignedUser: assignedUser,
                                anchorEl: e.currentTarget as HTMLElement
                            });
                        }
                    }}
                    title="Click to reassign activity"
                >
                    {assignedUser.avatar ? (
                        <Image
                            src={assignedUser.avatar as string}
                            alt={`${assignedUser.firstName} ${assignedUser.lastName}`}
                            width={24}
                            height={24}
                            className="rounded-full "
                        />
                    ) : (
                        <span className="text-sm">
                            <LucideCircleUserRound className="inline-block" size={24} />
                        </span>
                    )}
                </div>
            );
        }

        // Handle Created By (Owner - Display only, not editable)
        if (field.fieldKey === 'createdBy' && value && typeof value === 'object') {
            const createdByUser = value as Record<string, unknown>;
            console.log('CreatedBy value:', createdByUser);
            return (
                <div
                    className="flex items-center justify-center gap-2"
                    title={`${createdByUser.firstName} ${createdByUser.lastName}`}
                >
                    {createdByUser.avatar ? (
                        <Image
                            src={createdByUser.avatar as string}
                            alt={`${createdByUser.firstName} ${createdByUser.lastName}`}
                            width={24}
                            height={24}
                            className="rounded-full"
                        />
                    ) : (
                        <span className="text-sm">
                            <LucideCircleUserRound className="inline-block" size={24} />
                        </span>
                    )}
                </div>
            );
        }

        // Handle Project
        if (field.fieldKey === 'project' && value && typeof value === 'object') {
            const project = value as Record<string, unknown>;
            return (
                <div className="text-sm text-blue-600 underline cursor-pointer capitalize">
                    {(project.name || project.projectId) as string}
                </div>
            );
        }

        // Handle Task
        if (field.fieldKey === 'task') {
            // Only show task name if there is a task and no subtask
            if (value && typeof value === 'object' && !row.subTask) {
                const task = value as Record<string, unknown>;
                const taskName = (task.taskName || task.taskId) as string;
                return (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {taskName || '-'}
                    </div>
                );
            }
            return <div className="text-sm text-gray-500">-</div>;
        }

        // Handle Subtask
        if (field.fieldKey === 'subTask') {
            // Only show subtask name if there is a subtask
            if (value && typeof value === 'object') {
                const subTask = value as Record<string, unknown>;
                const subTaskName = (subTask.subTaskName || subTask.subTaskId) as string;
                return (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {subTaskName || '-'}
                    </div>
                );
            }
            return <div className="text-sm text-gray-500">-</div>;
        }

        // Handle Description
        if (field.fieldKey === 'description' && typeof value === 'string') {
            const maxLength = 50;
            const truncatedDesc = value.length > maxLength
                ? `${value.substring(0, maxLength)}...`
                : value;

            return (
                <div
                    className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis"
                    title={value}
                    style={{
                        maxWidth: '100px',
                        display: 'inline-block',
                    }}
                >
                    {truncatedDesc}
                </div>
            );
        }

        // Action buttons (Edit, Delete, More)
        if (field.fieldKey === 'action') {
            const activityId = (row?.id ?? row?._id) as string;
            const activityTitle = (row?.title || 'Untitled Activity') as string;

            return (
                <div className="flex items-center justify-center gap-1">
                    <button
                        type="button"
                        title="Edit"
                        className="w-8 h-8 rounded-full bg-[#c81c1f] hover:bg-[#a01518] flex items-center justify-center transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditActivity(row);
                        }}
                    >
                        <Image
                            src={editpencil}
                            alt="Edit"
                            width={12}
                            height={12}
                        />
                    </button>
                    <button
                        type="button"
                        title="Delete"
                        className="w-8 h-8 rounded-full bg-black dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActivity(activityId, activityTitle);
                        }}
                    >
                        <Image
                            src={deleteForever}
                            alt="Delete"
                            width={12}
                            height={12}
                        />
                    </button>
                    <button
                        type="button"
                        title="More"
                        className="w-8 h-8 rounded-full bg-[#c81c1f] hover:bg-[#a01518] flex items-center justify-center transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add more actions menu
                        }}
                    >
                        <Image
                            src={threeDot}
                            alt="More"
                            width={12}
                            height={12}
                        />
                    </button>
                </div>
            );
        }

        return undefined;
    };

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
                                <BreadcrumbsNavBar />
                            </div>
                            <div
                                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                                style={{
                                    backgroundColor: isDark ? colors.dark.sidebar : undefined
                                }}
                            >
                                <Title projectTitleObj={activityTitleBtn} name="Activities List" />
                            </div>
                            <div className='bg-[#f8f8f2] border gap-4 border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-between items-center h-fit' style={{
                                backgroundColor: isDark ? colors.dark.sidebar : undefined
                            }}>
                                <div className="flex items-center gap-4 flex-1 justify-end">
                                    <ActivitySearchBar
                                        onSearch={handleSearch}
                                        placeholder="Search activities..."
                                        defaultSelectedColumns={['title', 'type']}
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
                                        <Users size={16} className="text-gray-600" />
                                        <span>Person</span>
                                        {(personFilters.assignedToIds?.length || personFilters.createdByIds?.length) ? (
                                            <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                                {Math.max(personFilters.assignedToIds?.length || 0, personFilters.createdByIds?.length || 0)}
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
                                        title="Sort Activities"
                                    >
                                        <ArrowUpDown size={16} className="text-gray-600" />
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
                            <div className="flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 w-full overflow-y-scroll">
                                {loading ? (
                                    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                                        <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                                    </div>
                                ) : (
                                    <FinalTable
                                        data={rows as any}
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
                                        onRenameColumn={() => { }} // Activities don't need dynamic column management
                                        onHideColumn={() => { }}
                                        onToggleColumnVisibility={() => { }}
                                        onColumnOrderChange={() => { }}
                                        getCellRenderer={getCellRenderer}
                                    />
                                )}
                            </div>
                        </div>

                        {/* ADD FORM MODAL */}
                        <FormModal
                            isOpen={isFormModalOpen}
                            onClose={() => {
                                setIsFormModalOpen(false);
                                setIsEditMode(false);
                                setEditData(null);
                            }}
                            title={getModalTitle()}
                            size="lg"
                            className="h-[90vh] overflow-y-auto" // Add this
                            maxHeight="90vh" // Add this
                        >
                            <TabbedFormLayout
                                tabs={getTabs() as any}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                className="h-full" // Ensure this is passed
                            />
                        </FormModal>

                        {/* Advanced Filter Popover */}
                        <ActivityAdvancedFilterPopover
                            anchorEl={filterAnchorEl}
                            open={openAdvancedFilter}
                            onClose={handleAdvancedFilterClose}
                            onApplyFilters={handleApplyAdvancedFilters}
                            initialFilters={advancedFilters}
                            title="Advanced Activity Filters"
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
                            onApplySort={handleApplySort}
                            currentSort={sort}
                        />

                        {/* Assigned User Selector Popover */}
                        <AssignedUserSelector
                            activityId={userSelectorState.activityId}
                            currentAssignedUser={userSelectorState.currentAssignedUser as any}
                            isOpen={userSelectorState.isOpen}
                            onClose={() => setUserSelectorState(prev => ({ ...prev, isOpen: false }))}
                            anchorEl={userSelectorState.anchorEl}
                        />

                        {/* Delete Confirmation Modal */}
                        <DeleteConfirmationModal
                            isOpen={deleteModalState.isOpen}
                            onClose={handleCancelDelete}
                            onConfirm={handleConfirmDelete}
                            title="Delete Activity"
                            message="Are you sure you want to delete this activity? This action cannot be undone."
                            itemName={deleteModalState.activityTitle || ''}
                            isDeleting={deleteModalState.isDeleting}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
