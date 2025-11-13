'use client';

import React, { useState, useMemo } from 'react';
import TaskTable, { TaskData } from '@/components/common/TaskTable';
import { FieldDefinition } from '@/types/FieldDefinitions';

// Sample task data matching your image
const sampleTasks: TaskData[] = [
  {
    id: 'AH-1',
    taskId: 'AH-1',
    taskName: 'Absolute ERP',
    description: 'Absolute ERP (My...)',
    priority: 'Medium',
    status: 'Completed',
    progress: 100,
    startDate: 'Apr 8 2025',
    endDate: 'Apr 8 2025',
    subtasks: [
      {
        id: 'AH-1.1',
        taskId: 'AH-1.1',
        taskName: 'Absolute ERP - Subtask 1',
        description: 'Absolute ERP (My...)',
        priority: 'Medium',
        status: 'Completed',
        progress: 100,
        startDate: 'Apr 8 2025',
        endDate: 'Apr 8 2025',
      },
    ],
  },
  {
    id: 'AH-2',
    taskId: 'AH-2',
    taskName: 'Absolute ERP',
    description: 'Absolute ERP (My...)',
    priority: 'High',
    status: 'In-Progress',
    progress: 60,
    startDate: 'Apr 8 2025',
    endDate: 'Apr 8 2025',
  },
  {
    id: 'AH-3',
    taskId: 'AH-3',
    taskName: 'Absolute ERP',
    description: 'Absolute ERP (My...)',
    priority: 'Low',
    status: 'Pause',
    progress: 30,
    startDate: 'Apr 8 2025',
    endDate: 'Apr 8 2025',
  },
  {
    id: 'AH-4',
    taskId: 'AH-4',
    taskName: 'Absolute ERP',
    description: 'Absolute ERP (My...)',
    priority: 'High',
    status: 'In-Progress',
    progress: 75,
    startDate: 'Apr 8 2025',
    endDate: 'Apr 8 2025',
    subtasks: [
      {
        id: 'AH-4.1',
        taskId: 'AH-4.1',
        taskName: 'Absolute ERP - Phase 1',
        description: 'Absolute ERP (My...)',
        priority: 'High',
        status: 'Completed',
        progress: 100,
        startDate: 'Apr 8 2025',
        endDate: 'Apr 8 2025',
      },
      {
        id: 'AH-4.2',
        taskId: 'AH-4.2',
        taskName: 'Absolute ERP - Phase 2',
        description: 'Absolute ERP (My...)',
        priority: 'Medium',
        status: 'In-Progress',
        progress: 50,
        startDate: 'Apr 8 2025',
        endDate: 'Apr 8 2025',
      },
    ],
  },
  {
    id: 'AH-5',
    taskId: 'AH-5',
    taskName: 'Absolute ERP',
    description: 'Absolute ERP (My...)',
    priority: 'Low',
    status: 'Pause',
    progress: 20,
    startDate: 'Apr 8 2025',
    endDate: 'Apr 8 2025',
  },
];

// Field definitions for the task table
const fieldDefinitions: FieldDefinition[] = [
  {
    fieldKey: 'taskName',
    displayName: 'Task Tree',
    fieldType: 'TEXT',
    isVisible: true,
    isSortable: true,
    columnWidth: 280,
    displayOrder: 0,
  },
  {
    fieldKey: 'taskId',
    displayName: 'Task ID',
    fieldType: 'TEXT',
    isVisible: true,
    isSortable: true,
    columnWidth: 120,
    displayOrder: 1,
  },
  {
    fieldKey: 'description',
    displayName: 'Description',
    fieldType: 'TEXT',
    isVisible: true,
    isSortable: false,
    columnWidth: 220,
    displayOrder: 2,
  },
  {
    fieldKey: 'priority',
    displayName: 'Priority',
    fieldType: 'DROPDOWN',
    isVisible: true,
    isSortable: true,
    columnWidth: 120,
    displayOrder: 3,
  },
  {
    fieldKey: 'status',
    displayName: 'Status',
    fieldType: 'DROPDOWN',
    isVisible: true,
    isSortable: true,
    columnWidth: 140,
    displayOrder: 4,
  },
  {
    fieldKey: 'progress',
    displayName: 'Progress',
    fieldType: 'NUMBER',
    isVisible: true,
    isSortable: true,
    columnWidth: 180,
    displayOrder: 5,
  },
  {
    fieldKey: 'startDate',
    displayName: 'Timeline',
    fieldType: 'TEXT',
    isVisible: true,
    isSortable: false,
    columnWidth: 200,
    displayOrder: 6,
  },
];

/**
 * Example Task Management Page using TaskTable
 * 
 * This example demonstrates:
 * - Hierarchical task display with expand/collapse
 * - Custom cell rendering for priority, status, and progress
 * - Expand all / Collapse all functionality
 * - Row selection
 * - Theme support
 */
export default function TaskManagementPage() {
  const [expandedIds, setExpandedIds] = useState<(string | number)[]>(['AH-1']);
  const [selectedRows, setSelectedRows] = useState<TaskData[]>([]);

  // Get all task IDs (including subtasks) for expand all functionality
  const getAllTaskIds = (tasks: TaskData[]): (string | number)[] => {
    const ids: (string | number)[] = [];
    const collect = (items: TaskData[]) => {
      items.forEach((item) => {
        ids.push(item.id);
        if (item.subtasks) collect(item.subtasks);
      });
    };
    collect(tasks);
    return ids;
  };

  const handleExpandAll = () => {
    setExpandedIds(getAllTaskIds(sampleTasks));
  };

  const handleCollapseAll = () => {
    setExpandedIds([]);
  };

  // Custom cell renderer for enhanced visual representation
  const getCellRenderer = ({
    field,
    row,
    value,
    rowIndex,
    isSubtask,
    level,
  }: {
    field: FieldDefinition;
    row: TaskData;
    value: string | number;
    rowIndex: number;
    isSubtask: boolean;
    level: number;
  }) => {
    // Priority column with color-coded badges
    if (field.fieldKey === 'priority') {
      const colorMap = {
        High: 'border-red-500 text-red-600',
        Medium: 'border-yellow-500 text-yellow-600',
        Low: 'border-green-500 text-green-600',
      };
      return (
        <span
          className={`inline-block px-3 py-1 rounded-full border ${colorMap[value as keyof typeof colorMap] || 'border-gray-300'
            }`}
        >
          {value}
        </span>
      );
    }

    // Status column with color-coded badges
    if (field.fieldKey === 'status') {
      const statusMap = {
        Completed: 'bg-green-100 text-green-700',
        'In-Progress': 'bg-yellow-100 text-yellow-700',
        Pause: 'bg-purple-100 text-purple-700',
      };
      return (
        <span
          className={`inline-block px-3 py-1.5 rounded ${statusMap[value as keyof typeof statusMap] || 'bg-gray-100'
            }`}
        >
          {value}
        </span>
      );
    }

    // Progress column with progress bar
    if (field.fieldKey === 'progress') {
      const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
      const progressValue = Number(numericValue) || 0;

      const progressColor =
        progressValue >= 100
          ? 'bg-green-500'
          : progressValue >= 75
            ? 'bg-blue-500'
            : progressValue >= 50
              ? 'bg-yellow-500'
              : 'bg-orange-500';

      return (
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-300`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <span className="text-xs font-medium w-10 text-right">{progressValue}%</span>
        </div>
      );
    }

    // Timeline column (combining start and end date)
    if (field.fieldKey === 'startDate') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📅</span>
          <span>Start {row.startDate}</span>
          <span className="text-gray-400">📍</span>
          <span>End {row.endDate}</span>
        </div>
      );
    }

    // Task Name column - different styling for subtasks
    if (field.fieldKey === 'taskName') {
      return (
        <span className={isSubtask ? 'text-gray-600' : 'font-medium text-gray-900'}>
          {value}
        </span>
      );
    }

    // Default rendering
    return undefined;
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your tasks with hierarchical subtask support
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Selection info */}
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          {selectedRows.length} task(s) selected
        </div>
      )}

      {/* Task Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <TaskTable
          tasks={sampleTasks}
          fieldDefinitions={fieldDefinitions}
          treeColumnKey="taskName"
          taskIdKey="id"
          subtasksKey="subtasks"
          initialExpandedIds={expandedIds}
          onExpandChange={setExpandedIds}
          selectable={true}
          stickyHeader={true}
          indentationSize={28}
          getCellRenderer={getCellRenderer}
          onSelectionChange={(selectedKeys: (string | number)[], rows: Record<string, unknown>[]) => {
            // Type cast the rows to TaskData[]
            setSelectedRows(rows as TaskData[]);
            console.log('Selected task IDs:', selectedKeys);
          }}
          onRowClick={(row, index) => {
            console.log('Clicked task:', row);
            // Navigate to task detail or open modal
          }}
          appearance="figma"
          style={{ maxHeight: '80vh' }}
          rowKey="id"
        />
      </div>

      {/* Footer info */}
      <div className="text-xs text-gray-500 text-center">
        Showing {sampleTasks.length} tasks •{' '}
        {expandedIds.length > 0 ? `${expandedIds.length} expanded` : 'All collapsed'}
      </div>
    </div>
  );
}
