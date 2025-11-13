"use client";

import * as React from "react";
import { X, Paperclip, List, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { useTheme } from "@/store/hooks";
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";
import { useCreateActivityMutation } from "@/store/api_query/LazyKill/activities.api";
import { customToast as toast } from "@/utils/toast";
import Image from "next/image";
import CustomCalendar from "@/components/CustomCalendar";
import { UserDropdown } from "../UserDropdown";

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "meeting" | "call" | "notes" | "todo" | "email";
    relatedItem?: {
        type: "project" | "task" | "subtask";
        projectId?: string;
        projectName?: string;
        taskId?: string;
        taskName?: string;
        subTaskId?: string;
        subTaskName?: string;
    };
}

interface Project {
    id: string;
    name: string;
    projectId: string;
}

interface Task {
    id: string;
    title: string;
    projectId: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role?: string | { name: string; [key: string]: unknown };
}

interface SubTask {
    id: string;
    title: string;
    taskId: string;
}

interface CompanyUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyUserId: string;
    company?: {
        id: string;
        name: string;
        slug: string;
        themeColor?: string;
    };
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
    isOpen,
    onClose,
    type,
    relatedItem,
}) => {
    const [startDate, setStartDate] = React.useState<Date | null>(new Date());
    const [endDate, setEndDate] = React.useState<Date | null>(
        new Date(new Date().getTime() + 60 * 60 * 1000)
    );
    const [openPicker, setOpenPicker] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const [description, setDescription] = React.useState<string>("");
    const [title, setTitle] = React.useState<string>("");
    const [owner, setOwner] = React.useState<User | User[] | null>(null);
    
    // Remove individual state for related items - use the prop directly
    const [selectedProject, setSelectedProject] = React.useState<string>("");
    const [selectedTask, setSelectedTask] = React.useState<string>("");
    const [selectedSubTask, setSelectedSubTask] = React.useState<string>("");

    // Data states
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [subTasks, setSubTasks] = React.useState<SubTask[]>([]);
    const [currentUser, setCurrentUser] = React.useState<CompanyUser | null>(null);

    const { companyThemeColor } = useTheme();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Use RTK Query to get current user
    const { data: currentUserData, isLoading: isLoadingUser, error: userError } = useGetCurrentUserQuery();

    // Use RTK Query mutation to create activity
    const [createActivity, { isLoading: isCreating }] = useCreateActivityMutation();

    // Set current user and owner from RTK Query
    React.useEffect(() => {
        if (currentUserData) {
            setCurrentUser(currentUserData as CompanyUser & { id: string });
            const userData = currentUserData;
            setOwner({
                id: String(userData.id || userData.companyUserId || ''),
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                role: userData.role || 'Owner'
            });
        }
    }, [currentUserData]);

    // Initialize related items based on props when modal opens
    React.useEffect(() => {
        if (isOpen && relatedItem) {
            console.log("ActivityModal - Initializing with relatedItem:", relatedItem);
            
            // Directly use the relatedItem prop to set the IDs
            if (relatedItem.projectId) {
                setSelectedProject(relatedItem.projectId);
                console.log("Auto-selected project:", relatedItem.projectId, relatedItem.projectName);
            }
            
            if (relatedItem.taskId) {
                setSelectedTask(relatedItem.taskId);
                console.log("Auto-selected task:", relatedItem.taskId, relatedItem.taskName);
            }

            if (relatedItem.subTaskId) {
                setSelectedSubTask(relatedItem.subTaskId);
                console.log("Auto-selected subtask:", relatedItem.subTaskId, relatedItem.subTaskName);
            }

            // Fetch projects for dropdown (but don't change selection if we have relatedItem)
            fetchProjects();
        }
    }, [isOpen, relatedItem]);

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const projectsData = await response.json();
                setProjects(projectsData.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchTasks = async (projectId: string) => {
        try {
            const response = await fetch(`/api/tasks?projectId=eq:${projectId}`);
            if (response.ok) {
                const tasksData = await response.json();
                setTasks(tasksData.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const fetchSubTasks = async (taskId: string) => {
        try {
            const response = await fetch(`/api/subtasks?taskId=eq:${taskId}`);
            if (response.ok) {
                const subTasksData = await response.json();
                setSubTasks(subTasksData.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch subtasks:', error);
        }
    };

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    // Apply text formatting inside textarea
    const applyFormatting = (tag: string, align?: string) => {
        const textarea = document.getElementById("desc-area") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = description.substring(start, end);

        let newText = description;

        if (tag === "underline") {
            newText =
                description.substring(0, start) +
                `<u>${selectedText}</u>` +
                description.substring(end);
        } else if (align) {
            newText =
                description.substring(0, start) +
                `<div style="text-align:${align}">${selectedText}</div>` +
                description.substring(end);
        }

        setDescription(newText);
    };

    const handleSubmit = async () => {
        // Comprehensive validation
        if (!title.trim()) {
            toast.error('Please enter a title for the activity');
            return;
        }

        if (!startDate || !endDate) {
            toast.error('Please select start and end dates');
            return;
        }

        if (startDate >= endDate) {
            toast.error('Start time must be before end time');
            return;
        }

        if (!currentUser) {
            toast.error('User information not available. Please log in again.');
            return;
        }

        if (!currentUser.companyUserId && !currentUser.id) {
            toast.error('User ID not found. Please log in again.');
            return;
        }

        if (!currentUser.company?.id) {
            toast.error('Company information not found. Please contact support.');
            return;
        }

        try {
            const activityData: any = {
                scheduleTimeFrom: startDate.toISOString(),
                scheduleTimeTo: endDate.toISOString(),
                title: title.trim(),
                description: description.trim() || '',
                documents: files.map(file => file.name),
                type: (type === "todo" ? "toDo" : type) as "meeting" | "call" | "notes" | "toDo" | "email",
                status: {
                    statusName: 'not-started',
                    color: '#9CA3AF'
                },
                assignedToId: currentUser.companyUserId || currentUser.id,
                companyId: currentUser.company.id
            };

            // CRITICAL FIX: Only send the relevant ID based on the context
            // Priority: subtask > task > project
            if (relatedItem?.subTaskId) {
                activityData.subTaskId = relatedItem.subTaskId;
                console.log("Sending subTaskId for activity:", relatedItem.subTaskId);
            } else if (relatedItem?.taskId) {
                activityData.taskId = relatedItem.taskId;
                console.log("Sending taskId for activity:", relatedItem.taskId);
            } else if (relatedItem?.projectId) {
                activityData.projectId = relatedItem.projectId;
                console.log("Sending projectId for activity:", relatedItem.projectId);
            }

            console.log('Submitting activity data:', activityData);

            // Use RTK Query mutation
            const result = await createActivity(activityData).unwrap();

            console.log('Activity created successfully:', result);
            toast.success('Activity created successfully!');
            resetForm();
            onClose();
        } catch (error: any) {
            console.error('Error creating activity:', error);
            const errorMessage = error?.data?.message || error?.message || 'Failed to create activity. Please try again.';
            toast.error(`Failed to create activity: ${errorMessage}`);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setFiles([]);
        setSelectedProject("");
        setSelectedTask("");
        setSelectedSubTask("");
        setStartDate(new Date());
        setEndDate(new Date(new Date().getTime() + 60 * 60 * 1000));
    };

    const handleOwnerChange = (newOwner: User[] | User | null) => {
        if (newOwner && !Array.isArray(newOwner)) {
            setOwner(newOwner);
        } else if (Array.isArray(newOwner) && newOwner.length > 0) {
            setOwner(newOwner[0]);
        } else {
            setOwner(null);
        }
    };

    // Helper to determine what to show in the Related Items section
    const renderRelatedItemDisplay = () => {
        if (!relatedItem) return null;

        const items = [];
        
        if (relatedItem.projectName) {
            items.push(
                <div key="project" className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">Project</label>
                    <div className="text-sm font-medium text-gray-800">{relatedItem.projectName}</div>
                </div>
            );
        }
        
        if (relatedItem.taskName) {
            items.push(
                <div key="task" className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">Task</label>
                    <div className="text-sm font-medium text-gray-800">{relatedItem.taskName}</div>
                </div>
            );
        }
        
        if (relatedItem.subTaskName) {
            items.push(
                <div key="subtask" className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">Sub Task</label>
                    <div className="text-sm font-medium text-gray-800">{relatedItem.subTaskName}</div>
                </div>
            );
        }

        return items;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 h-auto -top-56">
                {isLoadingUser ? (
                    <div className="rounded-[10px] bg-white shadow-xl p-4 md:p-8 text-center w-full max-w-md">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading user information...</p>
                    </div>
                ) : (
                    <div className="rounded-[10px] bg-white shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-[#33333312] p-5 flex items-center justify-between rounded-t-[10px]">
                            <h2 className="font-inter font-medium text-[16px] leading-[100%]">
                                Activity ({type})
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-white rounded px-2 py-1"
                                style={{ backgroundColor: "#C81C1F" }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 md:p-5">
                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Left Panel */}
                                <div className="w-full lg:w-2/3 flex-1 border border-[#0000004F] rounded-[10px] p-3 md:p-4 flex flex-col">
                                    {/* Custom Date Range Button */}
                                    <button
                                        onClick={() => setOpenPicker(true)}
                                        className="flex items-center gap-2 w-full border border-[#0000004F] rounded px-3 py-2 text-left hover:bg-gray-50"
                                    >
                                        <Image src="/icons/time.svg" alt="Select date" width={17} height={17} />
                                        <span className="text-sm text-gray-800">
                                            {startDate && endDate
                                                ? `${format(startDate, "dd/MM/yyyy")} ${format(startDate, "HH:mm")} - ${format(endDate, "dd/MM/yyyy")} ${format(endDate, "HH:mm")}`
                                                : "Select date & time"}
                                        </span>
                                    </button>
                                    {openPicker && (
                                        <CustomCalendar
                                            startDate={startDate}
                                            endDate={endDate}
                                            onChange={(s, e) => {
                                                console.log(s, e);
                                                setStartDate(s);
                                                setEndDate(e);
                                            }}
                                            onClose={() => setOpenPicker(false)}
                                            themeColor={"#C81C1F"}
                                        />
                                    )}

                                    {/* Title */}
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="mt-4 border-b border-b-[#0000004F] bg-transparent focus:outline-none focus:ring-0 px-3 py-2"
                                    />

                                    {/* Description (textarea with wrap) */}
                                    <textarea
                                        id="desc-area"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Description"
                                        className="mt-4 border-b border-b-[#0000004F] bg-transparent focus:outline-none focus:ring-0 px-3 py-2"
                                    />

                                    {/* File Upload */}
                                    <div className="mt-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        <div className="max-h-[100px] overflow-y-auto mt-2 space-y-1 pr-1">
                                            {files.map((file, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 text-sm"
                                                >
                                                    <span className="truncate">{file.name}</span>
                                                    <button
                                                        onClick={() => removeFile(idx)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer Add + Icons */}
                                    <div className="mt-auto flex flex-col sm:flex-row items-center justify-between border-t pt-3 gap-2">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isCreating}
                                            className="text-white px-4 py-2 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-w-[80px]"
                                            style={{ backgroundColor: "#C81C1F" }}
                                        >
                                            {isCreating ? 'Adding...' : 'Add'}
                                        </button>

                                        <div className="flex gap-4 text-gray-700">
                                            <Paperclip
                                                size={20}
                                                className="cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            />
                                            <List size={20} className="cursor-pointer" />
                                            <Underline
                                                size={20}
                                                className="cursor-pointer"
                                                onClick={() => applyFormatting("underline")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel */}
                                <div className="w-full lg:w-1/3 h-auto lg:h-[363px] border border-[#0000004F] rounded-[10px] p-3 md:p-4">
                                    {/* Owner */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center">
                                            <div
                                                className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                                style={{ background: "#C81C1F" }}
                                            >
                                                <Image
                                                    src="/icons/project/Owner.svg"
                                                    alt="Owner"
                                                    width={16}
                                                    height={16}
                                                />
                                            </div>
                                            <label className="block text-sm font-medium">Owner</label>
                                        </div>
                                        <UserDropdown
                                            value={owner}
                                            onChange={handleOwnerChange}
                                            placeholder="Select Owner"
                                            multiple={false}
                                            error={false}
                                            disabled
                                            options={[]}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center">
                                            <div
                                                className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                                style={{ background: "#C81C1F" }}
                                            >
                                                <Image
                                                    src="/icons/project/status.svg"
                                                    alt="Status"
                                                    width={16}
                                                    height={16}
                                                />
                                            </div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Status
                                            </label>
                                        </div>
                                        <div className="w-full rounded-md bg-[#9CA3AF] px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm">
                                            Not Started
                                        </div>
                                    </div>

                                    {/* Related Items Display - Simplified */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center">
                                            <div
                                                className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-white"
                                                style={{ background: "#C81C1F" }}
                                            >
                                                <Image
                                                    src="/icons/project/tags.svg"
                                                    alt="Related Items"
                                                    width={16}
                                                    height={16}
                                                />
                                            </div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Related To
                                            </label>
                                        </div>
                                        
                                        {relatedItem ? (
                                            <div className="border border-gray-200 rounded p-3 bg-gray-50">
                                                {renderRelatedItemDisplay()}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic">
                                                No related item selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LocalizationProvider>
    );
};