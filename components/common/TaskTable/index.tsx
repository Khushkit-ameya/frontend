'use client';

import React, { useCallback, useMemo, useState } from 'react';
import FinalTable, { FinalTableProps } from '../CommonTable';
import { FieldDefinition } from '@/types/FieldDefinitions';
import { MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowDown } from 'react-icons/md';

export interface TaskData {
  id: string | number;
  [key: string]: any;
  subtasks?: TaskData[]; // Nested subtasks
}

export interface TaskTableProps extends Omit<FinalTableProps, 'data' | 'getCellRenderer'> {
  /**
   * Hierarchical task data with optional subtasks
   */
  tasks: TaskData[];
  
  /**
   * Key to identify tasks (defaults to 'id')
   */
  taskIdKey?: string;
  
  /**
   * Key to identify subtasks array (defaults to 'subtasks')
   */
  subtasksKey?: string;
  
  /**
   * Field key for the tree column (first column with expand/collapse)
   * This should match one of your fieldDefinitions' fieldKey
   */
  treeColumnKey: string;
  
  /**
   * Initial set of expanded task IDs
   */
  initialExpandedIds?: (string | number)[];
  
  /**
   * Callback when expand/collapse state changes
   */
  onExpandChange?: (expandedIds: (string | number)[]) => void;
  
  /**
   * Custom cell renderer (optional, works alongside tree rendering)
   */
  getCellRenderer?: (args: { 
    field: FieldDefinition; 
    row: TaskData; 
    value: any; 
    rowIndex: number;
    isSubtask: boolean;
    level: number; // nesting level (0 for top-level, 1 for subtasks, 2 for sub-subtasks, etc.)
  }) => React.ReactNode;
  
  /**
   * Indentation in pixels per level (defaults to 24)
   */
  indentationSize?: number;
}

/**
 * TaskTable - Enhanced table component with hierarchical task/subtask support
 * 
 * Features:
 * - All FinalTable features (sorting, column management, selection, etc.)
 * - Tree view with expand/collapse for tasks with subtasks
 * - Visual indentation for subtask hierarchy
 * - Supports multiple nesting levels
 * - Maintains row selection across hierarchy
 */
const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  taskIdKey = 'id',
  subtasksKey = 'subtasks',
  treeColumnKey,
  initialExpandedIds = [],
  onExpandChange,
  getCellRenderer,
  indentationSize = 24,
  fieldDefinitions,
  ...restProps
}) => {
  // Track which tasks are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(
    new Set(initialExpandedIds)
  );

  // Toggle expand/collapse for a task
  const toggleExpand = useCallback((taskId: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      onExpandChange?.(Array.from(next));
      return next;
    });
  }, [onExpandChange]);

  // Flatten hierarchical data into a flat list for table rendering
  // Add metadata about hierarchy (level, hasSubtasks, parentId)
  const flattenedData = useMemo(() => {
    interface FlattenedTask extends TaskData {
      _level: number;
      _hasSubtasks: boolean;
      _isSubtask: boolean;
      _parentId?: string | number;
    }

    const result: FlattenedTask[] = [];

    const flatten = (
      items: TaskData[],
      level: number = 0,
      parentId?: string | number
    ) => {
      items.forEach((item) => {
        const taskId = item[taskIdKey];
        const subtasks = item[subtasksKey] as TaskData[] | undefined;
        const hasSubtasks = Array.isArray(subtasks) && subtasks.length > 0;

        // Add the current task
        result.push({
          ...item,
          _level: level,
          _hasSubtasks: hasSubtasks,
          _isSubtask: level > 0,
          _parentId: parentId,
        });

        // If expanded and has subtasks, recursively add subtasks
        if (hasSubtasks && expandedIds.has(taskId)) {
          flatten(subtasks, level + 1, taskId);
        }
      });
    };

    flatten(tasks);
    return result;
  }, [tasks, expandedIds, taskIdKey, subtasksKey]);

  // Enhanced cell renderer that handles tree column with expand/collapse
  const enhancedCellRenderer = useCallback(
    (args: {
      field: FieldDefinition;
      row: any;
      value: any;
      rowIndex: number;
    }) => {
      const { field, row, value, rowIndex } = args;
      const level = row._level ?? 0;
      const hasSubtasks = row._hasSubtasks ?? false;
      const isSubtask = row._isSubtask ?? false;
      const taskId = row[taskIdKey];
      const isExpanded = expandedIds.has(taskId);

      // Check if this is the tree column
      const isTreeColumn = field.fieldKey === treeColumnKey;

      // Calculate indentation
      const indentation = level * indentationSize;

      if (isTreeColumn) {
        return (
          <div
            className="flex items-center w-full"
            style={{ paddingLeft: `${indentation}px` }}
          >
            {/* Expand/collapse button (only for tasks with subtasks) */}
            {hasSubtasks ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(taskId);
                }}
                className="mr-2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
              >
                {isExpanded ? (
                  <MdOutlineKeyboardArrowDown className="w-4 h-4" />
                ) : (
                  <MdOutlineKeyboardArrowRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              // Spacer for tasks without subtasks to maintain alignment
              <span className="mr-2 w-5 flex-shrink-0" />
            )}

            {/* Render custom cell content if provided */}
            {getCellRenderer ? (
              getCellRenderer({ field, row, value, rowIndex, isSubtask, level })
            ) : (
              // Default rendering
              <span className="truncate">{value}</span>
            )}
          </div>
        );
      }

      // For non-tree columns, use custom renderer if provided
      if (getCellRenderer) {
        return getCellRenderer({ field, row, value, rowIndex, isSubtask, level });
      }

      // Default cell rendering (FinalTable will handle this)
      return undefined;
    },
    [
      expandedIds,
      getCellRenderer,
      indentationSize,
      taskIdKey,
      toggleExpand,
      treeColumnKey,
    ]
  );

  // Ensure tree column is pinned/frozen
  const enhancedFieldDefinitions = useMemo(() => {
    return fieldDefinitions.map((field) => {
      if (field.fieldKey === treeColumnKey) {
        return {
          ...field,
          // Make tree column non-hideable and sortable
          isVisible: true,
          isSortable: field.isSortable !== false, // respect original setting
        };
      }
      return field;
    });
  }, [fieldDefinitions, treeColumnKey]);

  return (
    <FinalTable
      {...restProps}
      fieldDefinitions={enhancedFieldDefinitions}
      data={flattenedData}
      getCellRenderer={enhancedCellRenderer}
      // Ensure tree column is pinned/frozen
      frozenColumnKeys={
        restProps.frozenColumnKeys || [treeColumnKey]
      }
    />
  );
};

export default TaskTable;
