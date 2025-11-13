"use client";
import React, { useState } from "react";
import { TaskData } from "@/components/common/TaskTable";
import { TaskDataExtended } from "@/app/lazykill/projects/[id]/page";
import { GrFormAdd } from "react-icons/gr";
import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { DateTime } from "luxon";

interface KanbanBoardProps {
    tasks: TaskData[];
    statusOptions: any[];
    onEditTask: (task: TaskDataExtended) => void;
    onOpenSubtaskModal: (parentTaskId: string) => void;
    onOpenCreateTask: () => void;
    onUpdateTaskStatus: (taskId: string, status: string) => Promise<void>;
    onRefresh?: () => void;
    onCreateStatus?: (statusData: { displayName: string; color: string }) => void; // Add this prop
}

interface StatusColumn {
    value: string;
    label: string;
    color: string;
    sequence: number;
}

interface ExpandedTasksState {
    [taskId: string]: boolean;
}

export default function KanbanBoard({
    tasks,
    statusOptions,
    onEditTask,
    onOpenSubtaskModal,
    onOpenCreateTask,
    onUpdateTaskStatus,
    onRefresh,
    onCreateStatus // Add this prop
}: KanbanBoardProps) {
    const [expandedTasks, setExpandedTasks] = useState<ExpandedTasksState>({});
    const [draggedTask, setDraggedTask] = useState<TaskData | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showAddStatus, setShowAddStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#3b82f6');

    // Transform status options from API
    const columns: StatusColumn[] = statusOptions
        .filter((option: any) => option.fieldKey === 'status')
        .flatMap((statusField: any) => 
            (statusField.options || []).map((opt: any) => ({
                value: opt.value,
                label: opt.label,
                color: opt.color,
                sequence: opt.sequence
            }))
        )
        .sort((a: StatusColumn, b: StatusColumn) => a.sequence - b.sequence);

    // Group tasks by status
    const tasksByStatus = tasks.reduce((acc, task) => {
        const status = task.status?.toString().toLowerCase() || 'todo';
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {} as Record<string, TaskData[]>);

    // Handle creating new status
    const handleCreateStatus = () => {
        if (newStatusName.trim() && onCreateStatus) {
            onCreateStatus({
                displayName: newStatusName.trim(),
                color: newStatusColor
            });
            setShowAddStatus(false);
            setNewStatusName('');
            setNewStatusColor('#3b82f6');
        }
    };

    // Render the empty "Add Label" card
    const renderAddLabelCard = () => {
        if (!showAddStatus) {
            return (
                <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer hover:bg-gray-100 transition-colors min-h-[120px] flex items-center justify-center"
                    onClick={() => setShowAddStatus(true)}>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                            <GrFormAdd size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">+ Add Label</span>
                        <span className="text-xs text-gray-500">Create new status</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h5 className="font-medium text-sm text-gray-900 mb-3">Create New Status</h5>
                
                {/* Status Name Input */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Status Name
                    </label>
                    <input
                        type="text"
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        placeholder="Enter status name"
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateStatus();
                            } else if (e.key === 'Escape') {
                                setShowAddStatus(false);
                                setNewStatusName('');
                            }
                        }}
                    />
                </div>

                {/* Color Picker - Simple version */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'].map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`w-6 h-6 rounded-full border-2 ${newStatusColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewStatusColor(color)}
                            />
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleCreateStatus}
                        disabled={!newStatusName.trim()}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowAddStatus(false);
                            setNewStatusName('');
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    };

    // Drag event handlers (keep your existing drag handlers)
    const handleDragStart = (e: React.DragEvent, task: TaskData) => {
        setDraggedTask(task);
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', task.id as string);
        e.dataTransfer.effectAllowed = 'move';
        
        // Add visual feedback
        const element = e.currentTarget as HTMLElement;
        element.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);
        setDraggedTask(null);
        
        // Remove visual feedback
        const element = e.currentTarget as HTMLElement;
        element.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Add visual feedback for drop target
        const element = e.currentTarget as HTMLElement;
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Remove visual feedback
        const element = e.currentTarget as HTMLElement;
        element.style.backgroundColor = '';
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        
        // Remove visual feedback
        const element = e.currentTarget as HTMLElement;
        element.style.backgroundColor = '';

        if (!draggedTask) return;

        const taskId = draggedTask.id as string;
        const currentStatus = draggedTask.status?.toString().toLowerCase();

        // Don't do anything if dropping in the same column
        if (currentStatus === targetStatus) {
            return;
        }

        try {
            // Call the update status API
            await onUpdateTaskStatus(taskId, targetStatus);
            
            // Show success feedback
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('bg-green-50', 'border-green-200');
                setTimeout(() => {
                    taskElement.classList.remove('bg-green-50', 'border-green-200');
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to update task status:', error);
            // You might want to show an error toast here
        }
    };

    // Toggle subtask expansion
    const toggleTaskExpansion = (taskId: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = String(taskId);
        setExpandedTasks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Render assignee avatars (keep your existing function)
    const renderAssigneeAvatars = (assignedTo: any[]) => {
        if (!assignedTo || assignedTo.length === 0) {
            return <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">?</div>;
        }

        const displayUsers = assignedTo.slice(0, 3);
        const remainingCount = assignedTo.length - 3;

        return (
            <div className="flex -space-x-2">
                {displayUsers.map((user: any, index: number) => {
                    const initial = user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || '?';
                    return (
                        <div
                            key={index}
                            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white overflow-hidden flex-shrink-0"
                            title={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                        >
                            {user?.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                                    width={24}
                                    height={24}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span className="uppercase">{initial}</span>
                            )}
                        </div>
                    );
                })}
                {remainingCount > 0 && (
                    <div
                        className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white flex-shrink-0"
                        title={`+${remainingCount} more`}
                    >
                        +{remainingCount}
                    </div>
                )}
            </div>
        );
    };

    // Format date for display (keep your existing function)
    const formatDate = (dateString: string) => {
        try {
            return DateTime.fromISO(dateString).toFormat('MMM dd');
        } catch {
            return 'Invalid date';
        }
    };

    // Get priority color (keep your existing function)
    const getPriorityColor = (priority: string) => {
        const priorityMap: Record<string, string> = {
            'high': 'bg-red-100 text-red-800 border-red-200',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'low': 'bg-green-100 text-green-800 border-green-200',
            'critical': 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return priorityMap[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Get status color for subtasks (keep your existing function)
    const getStatusColor = (status: string) => {
        const statusOption = columns.find(col => col.value === status?.toLowerCase());
        return statusOption?.color || '#6b7280';
    };

    // Render subtask card (keep your existing function)
    const renderSubtaskCard = (subtask: any, parentTaskId: string | number) => {
        return (
            <div
                key={subtask.id}
                className="ml-6 mt-2 bg-gray-50 rounded-lg border border-gray-200 p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    const subtaskExtended: TaskDataExtended = {
                        ...subtask,
                        id: subtask.id,
                        taskId: subtask.subtaskId,
                        taskName: subtask.subtaskName,
                        isSubtask: true,
                        parentTaskId: String(parentTaskId)
                    };
                    onEditTask(subtaskExtended);
                }}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getStatusColor(subtask.status) }}
                            />
                            <h5 className="font-medium text-xs text-gray-800 line-clamp-1">
                                {subtask.subtaskName}
                            </h5>
                        </div>
                        
                        {subtask.description && (
                            <p className="text-xs text-gray-600 line-clamp-1 mb-1">
                                {subtask.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between">
                            {/* Assignees */}
                            <div>
                                {renderAssigneeAvatars(subtask.assignedTo || [])}
                            </div>

                            {/* Priority */}
                            {subtask.priority && (
                                <div className={`px-1.5 py-0.5 rounded text-xs ${getPriorityColor(subtask.priority)}`}>
                                    {subtask.priority.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Due Date */}
                        {subtask.endDate && (
                            <div className="text-xs text-gray-500 mt-1">
                                Due: {formatDate(subtask.endDate)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render main task card (keep your existing function)
    const renderTaskCard = (task: TaskData) => {
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
        const isExpanded = expandedTasks[String(task.id)];
        const subtasks = task.subtasks || [];

        return (
            <div
                key={task.id}
                data-task-id={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer draggable-task"
                onClick={() => onEditTask(task as unknown as TaskDataExtended)}
            >
                {/* Task Header */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2 flex-1">
                        {/* Expand/Collapse Icon for tasks with subtasks */}
                        {hasSubtasks && (
                            <button
                                onClick={(e) => toggleTaskExpansion(task.id, e)}
                                className="w-5 h-5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex-shrink-0 flex items-center justify-center"
                                title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                            >
                                {isExpanded ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </button>
                        )}
                        
                        {/* Placeholder for alignment when no subtasks */}
                        {!hasSubtasks && <div className="w-5 h-5 flex-shrink-0" />}
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                {task.taskName}
                            </h4>
                        </div>
                    </div>
                    
                    {/* Add Subtask Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenSubtaskModal(String(task.id));
                        }}
                        className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0 ml-2"
                        title="Add subtask"
                    >
                        <GrFormAdd size={14} />
                    </button>
                </div>

                {/* Description */}
                {task.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                    </p>
                )}

                {/* Priority */}
                {task.priority && (
                    <div className={`inline-block px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority.toString())} mb-2`}>
                        {task.priority.toString().charAt(0).toUpperCase() + task.priority.toString().slice(1)}
                    </div>
                )}

                {/* Task Details */}
                <div className="flex items-center justify-between mt-2">
                    {/* Assignees */}
                    <div>
                        {renderAssigneeAvatars(task.assignedTo || [])}
                    </div>

                    {/* Due Date */}
                    {task.endDate && (
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Due: {formatDate(task.endDate)}
                        </div>
                    )}
                </div>

                {/* Progress */}
                {typeof task.progress === 'number' && (
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Subtasks Section */}
                {hasSubtasks && (
                    <div className="mt-3">
                        {/* Subtasks Header */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span className="font-medium">
                                {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
                            </span>
                            {isExpanded && (
                                <span className="text-gray-400 text-xs">Click subtask to edit</span>
                            )}
                        </div>

                        {/* Subtasks List */}
                        {isExpanded && (
                            <div className="space-y-2 border-t pt-2">
                                {subtasks.map((subtask: any) => 
                                    renderSubtaskCard(subtask, task.id)
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-full p-2">
            {columns.map((column) => {
                const columnTasks = tasksByStatus[column.value] || [];
                
                return (
                    <div
                        key={column.value}
                        className="flex-shrink-0 w-80 bg-gray-50 rounded-lg border border-gray-200"
                        onDragOver={(e) => handleDragOver(e, column.value)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.value)}
                    >
                        {/* Column Header */}
                        <div 
                            className="p-4 border-b border-gray-200 flex items-center justify-between"
                            style={{ borderLeft: `4px solid ${column.color}` }}
                        >
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: column.color }}
                                />
                                <h3 className="font-semibold text-gray-700">{column.label}</h3>
                                <span className="bg-white px-2 py-1 rounded-full text-sm text-gray-600">
                                    {columnTasks.length}
                                </span>
                            </div>
                            
                            {/* Add Task button for the first column */}
                            {column.sequence === 1 && (
                                <button
                                    onClick={onOpenCreateTask}
                                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                    title="Add Task"
                                >
                                    <GrFormAdd size={14} />
                                </button>
                            )}
                        </div>

                        {/* Tasks List */}
                        <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                            {columnTasks.map((task) => renderTaskCard(task))}

                            {/* Drop zone indicator when dragging */}
                            {isDragging && (
                                <div 
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm"
                                    style={{ 
                                        borderColor: column.color,
                                        backgroundColor: `${column.color}20`
                                    }}
                                >
                                    Drop here to move to {column.label}
                                </div>
                            )}

                            {/* Empty state */}
                            {columnTasks.length === 0 && !isDragging && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No tasks in {column.label}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {/* Add Label Column - Always show this at the end */}
            <div className="flex-shrink-0 w-80">
                {renderAddLabelCard()}
            </div>
        </div>
    );
}