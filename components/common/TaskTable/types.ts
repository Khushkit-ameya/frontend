/**
 * Type definitions for TaskTable component
 * 
 * This file provides comprehensive TypeScript types for the TaskTable component
 * and related utilities.
 */

import { FinalTableProps } from '../CommonTable';
import { FieldDefinition } from '@/types/FieldDefinitions';

/**
 * Base interface for hierarchical task data
 * Extend this interface to add your own fields
 */
export interface TaskData {
  /**
   * Unique identifier for the task
   */
  id: string | number;
  
  /**
   * Any additional fields your task needs
   */
  [key: string]: any;
  
  /**
   * Optional array of nested subtasks
   * Each subtask follows the same TaskData structure (recursive)
   */
  subtasks?: TaskData[];
}

/**
 * Props for the TaskTable component
 */
export interface TaskTableProps extends Omit<FinalTableProps, 'data' | 'getCellRenderer'> {
  /**
   * Hierarchical task data with optional subtasks
   * @example
   * ```typescript
   * const tasks = [
   *   {
   *     id: 'T1',
   *     name: 'Parent Task',
   *     subtasks: [
   *       { id: 'T1.1', name: 'Child Task' }
   *     ]
   *   }
   * ];
   * ```
   */
  tasks: TaskData[];
  
  /**
   * Field key for the tree column (column that shows expand/collapse icons)
   * This should match one of your fieldDefinitions' fieldKey
   * 
   * @example "taskName" or "name"
   */
  treeColumnKey: string;
  
  /**
   * Key used to identify tasks in your data
   * @default "id"
   * @example "taskId" or "itemId"
   */
  taskIdKey?: string;
  
  /**
   * Key used to identify the subtasks array in your task objects
   * @default "subtasks"
   * @example "children" or "subItems"
   */
  subtasksKey?: string;
  
  /**
   * Initial set of expanded task IDs
   * Use this for controlled expansion state
   * 
   * @example ['T1', 'T2']
   */
  initialExpandedIds?: (string | number)[];
  
  /**
   * Callback fired when expand/collapse state changes
   * 
   * @param expandedIds - Array of currently expanded task IDs
   * @example
   * ```typescript
   * onExpandChange={(ids) => {
   *   console.log('Expanded tasks:', ids);
   *   localStorage.setItem('expandedTasks', JSON.stringify(ids));
   * }}
   * ```
   */
  onExpandChange?: (expandedIds: (string | number)[]) => void;
  
  /**
   * Custom cell renderer with hierarchy context
   * Enhanced version of FinalTable's getCellRenderer with additional context
   * 
   * @param args - Renderer arguments with hierarchy information
   * @returns React node to render in the cell, or undefined for default rendering
   * 
   * @example
   * ```typescript
   * getCellRenderer={({ field, row, value, isSubtask, level }) => {
   *   if (field.fieldKey === 'status') {
   *     return (
   *       <span className={isSubtask ? 'text-sm' : 'font-bold'}>
   *         {value}
   *       </span>
   *     );
   *   }
   *   return undefined; // Use default rendering
   * }}
   * ```
   */
  getCellRenderer?: (args: TaskTableCellRendererArgs) => React.ReactNode;
  
  /**
   * Indentation in pixels per nesting level
   * @default 24
   * @example 32 for more spacing, 16 for compact
   */
  indentationSize?: number;
}

/**
 * Arguments passed to getCellRenderer in TaskTable
 * Extends the base cell renderer with hierarchy information
 */
export interface TaskTableCellRendererArgs {
  /**
   * Field definition for the current column
   */
  field: FieldDefinition;
  
  /**
   * The current row data (task or subtask)
   */
  row: TaskData;
  
  /**
   * The value for the current cell
   */
  value: any;
  
  /**
   * Index of the current row in the flattened display
   */
  rowIndex: number;
  
  /**
   * Whether this row is a subtask
   * @example true for subtasks, false for top-level tasks
   */
  isSubtask: boolean;
  
  /**
   * Nesting level of the current row
   * @example 0 for top-level, 1 for first-level subtasks, 2 for nested subtasks, etc.
   */
  level: number;
}

/**
 * Internal flattened task data structure
 * Used internally by TaskTable to render hierarchical data in a flat table
 * 
 * @internal
 */
export interface FlattenedTask extends TaskData {
  /**
   * Nesting level (0 for top-level tasks)
   */
  _level: number;
  
  /**
   * Whether this task has subtasks
   */
  _hasSubtasks: boolean;
  
  /**
   * Whether this is a subtask
   */
  _isSubtask: boolean;
  
  /**
   * Parent task ID (if subtask)
   */
  _parentId?: string | number;
}

/**
 * Utility type for task with specific fields
 * Use this to create strongly-typed task objects
 * 
 * @example
 * ```typescript
 * type MyTask = TaskWithFields<{
 *   name: string;
 *   status: 'Not Started' | 'In Progress' | 'Completed';
 *   priority: 'Low' | 'Medium' | 'High';
 *   assignee: string;
 *   dueDate: string;
 * }>;
 * 
 * const tasks: MyTask[] = [
 *   {
 *     id: 'T1',
 *     name: 'Design homepage',
 *     status: 'In Progress',
 *     priority: 'High',
 *     assignee: 'John Doe',
 *     dueDate: '2025-11-01',
 *     subtasks: [...]
 *   }
 * ];
 * ```
 */
export type TaskWithFields<T extends Record<string, any>> = TaskData & T;

/**
 * Helper type for extract task ID type from task data
 * 
 * @example
 * ```typescript
 * type MyTaskId = TaskId<MyTask>; // string | number
 * ```
 */
export type TaskId<T extends TaskData = TaskData> = T['id'];

/**
 * Type guard to check if a task has subtasks
 * 
 * @example
 * ```typescript
 * if (hasSubtasks(task)) {
 *   // TypeScript knows task.subtasks exists and is an array
 *   console.log('Has', task.subtasks.length, 'subtasks');
 * }
 * ```
 */
export function hasSubtasks(task: TaskData): task is TaskData & { subtasks: TaskData[] } {
  return Array.isArray(task.subtasks) && task.subtasks.length > 0;
}

/**
 * Utility function to flatten hierarchical tasks
 * Useful for searching, counting, or processing all tasks
 * 
 * @param tasks - Hierarchical task array
 * @param subtasksKey - Key for subtasks array (default: 'subtasks')
 * @returns Flat array of all tasks (including nested ones)
 * 
 * @example
 * ```typescript
 * const allTasks = flattenTasks(tasks);
 * const totalCount = allTasks.length;
 * const completedCount = allTasks.filter(t => t.status === 'Completed').length;
 * ```
 */
export function flattenTasks(tasks: TaskData[], subtasksKey: string = 'subtasks'): TaskData[] {
  const result: TaskData[] = [];
  
  const flatten = (items: TaskData[]) => {
    items.forEach(item => {
      result.push(item);
      const subtasks = item[subtasksKey] as TaskData[] | undefined;
      if (Array.isArray(subtasks)) {
        flatten(subtasks);
      }
    });
  };
  
  flatten(tasks);
  return result;
}

/**
 * Utility function to find a task by ID in hierarchical structure
 * 
 * @param tasks - Hierarchical task array
 * @param taskId - ID to search for
 * @param taskIdKey - Key for task ID (default: 'id')
 * @param subtasksKey - Key for subtasks array (default: 'subtasks')
 * @returns Found task or undefined
 * 
 * @example
 * ```typescript
 * const task = findTaskById(tasks, 'T1.2');
 * if (task) {
 *   console.log('Found:', task.name);
 * }
 * ```
 */
export function findTaskById(
  tasks: TaskData[],
  taskId: string | number,
  taskIdKey: string = 'id',
  subtasksKey: string = 'subtasks'
): TaskData | undefined {
  for (const task of tasks) {
    if (task[taskIdKey] === taskId) {
      return task;
    }
    
    const subtasks = task[subtasksKey] as TaskData[] | undefined;
    if (Array.isArray(subtasks)) {
      const found = findTaskById(subtasks, taskId, taskIdKey, subtasksKey);
      if (found) return found;
    }
  }
  
  return undefined;
}

/**
 * Utility function to get all task IDs (useful for expand all functionality)
 * 
 * @param tasks - Hierarchical task array
 * @param taskIdKey - Key for task ID (default: 'id')
 * @param subtasksKey - Key for subtasks array (default: 'subtasks')
 * @returns Array of all task IDs
 * 
 * @example
 * ```typescript
 * const allIds = getAllTaskIds(tasks);
 * setExpandedIds(allIds); // Expand all
 * ```
 */
export function getAllTaskIds(
  tasks: TaskData[],
  taskIdKey: string = 'id',
  subtasksKey: string = 'subtasks'
): (string | number)[] {
  const ids: (string | number)[] = [];
  
  const collect = (items: TaskData[]) => {
    items.forEach(item => {
      ids.push(item[taskIdKey]);
      const subtasks = item[subtasksKey] as TaskData[] | undefined;
      if (Array.isArray(subtasks)) {
        collect(subtasks);
      }
    });
  };
  
  collect(tasks);
  return ids;
}

/**
 * Utility function to convert flat data with parentId to hierarchical structure
 * Useful when your API returns flat data with parent references
 * 
 * @param flatData - Flat array of tasks with parentId references
 * @param idKey - Key for task ID (default: 'id')
 * @param parentIdKey - Key for parent ID (default: 'parentId')
 * @param subtasksKey - Key for subtasks array (default: 'subtasks')
 * @returns Hierarchical task array
 * 
 * @example
 * ```typescript
 * const flatData = [
 *   { id: 'T1', name: 'Parent', parentId: null },
 *   { id: 'T1.1', name: 'Child', parentId: 'T1' }
 * ];
 * const hierarchical = buildHierarchy(flatData);
 * // Result: [{ id: 'T1', name: 'Parent', subtasks: [{ id: 'T1.1', name: 'Child' }] }]
 * ```
 */
export function buildHierarchy(
  flatData: any[],
  idKey: string = 'id',
  parentIdKey: string = 'parentId',
  subtasksKey: string = 'subtasks'
): TaskData[] {
  const map = new Map<string | number, TaskData>();
  const roots: TaskData[] = [];
  
  // Create map of all items with empty subtasks array
  flatData.forEach(item => {
    map.set(item[idKey], { ...item, [subtasksKey]: [] });
  });
  
  // Build hierarchy
  flatData.forEach(item => {
    const node = map.get(item[idKey])!;
    const parentId = item[parentIdKey];
    
    if (parentId !== null && parentId !== undefined) {
      const parent = map.get(parentId);
      if (parent) {
        if (!Array.isArray(parent[subtasksKey])) {
          parent[subtasksKey] = [];
        }
        parent[subtasksKey].push(node);
      } else {
        // Parent not found, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}

/**
 * Utility function to filter tasks while preserving hierarchy
 * A parent is included if it matches OR any of its descendants match
 * 
 * @param tasks - Hierarchical task array
 * @param predicate - Function to test each task
 * @param subtasksKey - Key for subtasks array (default: 'subtasks')
 * @returns Filtered hierarchical task array
 * 
 * @example
 * ```typescript
 * // Filter by status, preserving hierarchy
 * const activeTasks = filterTasks(tasks, task => task.status === 'Active');
 * 
 * // Search by name, preserving hierarchy
 * const searchResults = filterTasks(tasks, task => 
 *   task.name.toLowerCase().includes(searchTerm.toLowerCase())
 * );
 * ```
 */
export function filterTasks(
  tasks: TaskData[],
  predicate: (task: TaskData) => boolean,
  subtasksKey: string = 'subtasks'
): TaskData[] {
  return tasks
    .map(task => {
      const subtasks = task[subtasksKey] as TaskData[] | undefined;
      const filteredSubtasks = subtasks ? filterTasks(subtasks, predicate, subtasksKey) : [];
      const matchesSelf = predicate(task);
      const hasMatchingSubtasks = filteredSubtasks.length > 0;
      
      if (matchesSelf || hasMatchingSubtasks) {
        return { ...task, [subtasksKey]: filteredSubtasks };
      }
      return null;
    })
    .filter((task): task is TaskData => task !== null);
}

/**
 * Utility function to get the depth (maximum nesting level) of task hierarchy
 * 
 * @param tasks - Hierarchical task array
 * @param subtasksKey - Key for subtasks array (default: 'subtasks')
 * @returns Maximum depth (0 for flat list, 1 for one level of nesting, etc.)
 * 
 * @example
 * ```typescript
 * const depth = getTaskDepth(tasks);
 * console.log(`Maximum nesting level: ${depth}`);
 * ```
 */
export function getTaskDepth(tasks: TaskData[], subtasksKey: string = 'subtasks'): number {
  if (tasks.length === 0) return 0;
  
  const maxSubtaskDepth = Math.max(
    ...tasks.map(task => {
      const subtasks = task[subtasksKey] as TaskData[] | undefined;
      return subtasks ? getTaskDepth(subtasks, subtasksKey) : 0;
    })
  );
  
  return 1 + maxSubtaskDepth;
}
