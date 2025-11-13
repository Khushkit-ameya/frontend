import { DateTime } from 'luxon';

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  custom_class?: string;
  parent?: string;
}

/**
 * Converts task and subtask data into Frappe Gantt compatible format
 * @param tasks Array of tasks with their subtasks
 * @returns Array of Gantt tasks in the format Frappe Gantt expects
 */
export function formatTasksForGantt(tasks: any[]): GanttTask[] {
  const ganttTasks: GanttTask[] = [];
  
  console.log('===== FORMAT TASKS DEBUG =====');
  console.log('Input tasks count:', tasks?.length || 0);
  console.log('Input tasks:', tasks);

  if (!tasks || tasks.length === 0) {
    console.warn('⚠️ No tasks provided to formatter');
    return [];
  }

  const taskIdMap = new Map<string, any>();

  // First pass: collect all tasks and subtasks with their IDs
  tasks.forEach((task) => {
    taskIdMap.set(task.id, { ...task, isSubtask: false });
    if (Array.isArray(task.subtasks)) {
      task.subtasks.forEach((subtask: any) => {
        taskIdMap.set(subtask.id, { ...subtask, isSubtask: true, parentId: task.id });
      });
    }
  });

  // Second pass: create Gantt tasks
  tasks.forEach((task, index) => {
    console.log(`\nProcessing task ${index}:`, task);
    const startDate = task.startDate || task.createdAt;
    const endDate = task.endDate || task.dueDate;

    console.log(`  startDate field: ${task.startDate ? 'startDate' : task.createdAt ? 'createdAt' : 'MISSING'}`);
    console.log(`  endDate field: ${task.endDate ? 'endDate' : task.dueDate ? 'dueDate' : 'MISSING'}`);

    // Generate default dates if missing
    let start: DateTime;
    let end: DateTime;
    
    if (startDate && endDate) {
      try {
        start = DateTime.fromISO(startDate);
        end = DateTime.fromISO(endDate);
        console.log(`  ✓ Parsed dates: ${start.toISO()} to ${end.toISO()}`);
      } catch (error) {
        console.error(`  ✗ Error parsing dates:`, error);
        start = DateTime.now();
        end = DateTime.now().plus({ days: 7 });
      }
    } else {
      console.warn(`  ⚠️ Missing date fields, generating defaults`);
      start = DateTime.now();
      end = DateTime.now().plus({ days: 7 });
    }

    if (start && end) {
      // Calculate progress based on status
      const progress = calculateProgressFromStatus(task.status);
      console.log(`  Status: ${task.status} -> Progress: ${progress}%`);

      ganttTasks.push({
        id: task.id,
        name: `📌 ${task.taskName || task.name || 'Untitled Task'}`,
        start: start.toFormat('yyyy-MM-dd'),
        end: end.toFormat('yyyy-MM-dd'),
        progress: progress,
        dependencies: '',
        custom_class: 'parent-task',
      });

      // Add subtasks as children
      if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        console.log(`  Found ${task.subtasks.length} subtasks`);
        task.subtasks.forEach((subtask: any, subIndex: number) => {
          const subStartDate = subtask.startDate || subtask.createdAt;
          const subEndDate = subtask.endDate || subtask.dueDate;

          let subStart: DateTime;
          let subEnd: DateTime;

          if (subStartDate && subEndDate) {
            try {
              subStart = DateTime.fromISO(subStartDate);
              subEnd = DateTime.fromISO(subEndDate);
              console.log(`    Subtask ${subIndex}: ✓ Parsed dates`);
            } catch (error) {
              console.error(`    Subtask ${subIndex}: ✗ Error parsing dates`, error);
              subStart = DateTime.now();
              subEnd = DateTime.now().plus({ days: 3 });
            }
          } else {
            console.warn(`    Subtask ${subIndex}: ⚠️ Missing dates, using defaults`);
            subStart = DateTime.now();
            subEnd = DateTime.now().plus({ days: 3 });
          }

          if (subStart && subEnd) {
            const subProgress = calculateProgressFromStatus(subtask.status);

            ganttTasks.push({
              id: subtask.id,
              name: `  └─ ${subtask.subtaskName || subtask.name || 'Untitled Subtask'}`,
              start: subStart.toFormat('yyyy-MM-dd'),
              end: subEnd.toFormat('yyyy-MM-dd'),
              progress: subProgress,
              dependencies: task.id, // Subtask depends on parent task
              custom_class: 'subtask',
              parent: task.id,
            });
          }
        });
      }
    }
  });

  console.log('Final Gantt tasks count:', ganttTasks.length);
  console.log('Final Gantt tasks:', ganttTasks);
  console.log('===== FORMAT TASKS DEBUG END =====');

  return ganttTasks;
}

/**
 * Calculate progress percentage from status
 * @param status The status of the task/subtask
 * @returns Progress percentage (0-100)
 */
function calculateProgressFromStatus(status: any): number {
  if (!status) return 0;

  const statusStr = typeof status === 'object' ? status.value : String(status).toLowerCase();

  const statusMap: Record<string, number> = {
    'not_started': 0,
    'pending': 10,
    'todo': 20,
    'in_progress': 50,
    'in_review': 75,
    'blocked': 30,
    'completed': 100,
    'done': 100,
    'closed': 100,
  };

  return statusMap[statusStr] || 0;
}

/**
 * Calculate overall project progress
 * @param tasks Array of tasks
 * @returns Overall progress percentage
 */
export function calculateProjectProgress(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 0;

  let totalTasks = 0;
  let completedTasks = 0;

  tasks.forEach((task) => {
    totalTasks++;
    if (calculateProgressFromStatus(task.status) === 100) {
      completedTasks++;
    }

    if (Array.isArray(task.subtasks)) {
      task.subtasks.forEach((subtask: any) => {
        totalTasks++;
        if (calculateProgressFromStatus(subtask.status) === 100) {
          completedTasks++;
        }
      });
    }
  });

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

/**
 * Get date range from tasks
 * @param tasks Array of tasks
 * @returns Object with minDate and maxDate
 */
export function getTasksDateRange(tasks: any[]): { minDate: string; maxDate: string } | null {
  let minDate: DateTime | null = null;
  let maxDate: DateTime | null = null;

  tasks.forEach((task) => {
    const startDate = task.startDate || task.createdAt;
    const endDate = task.endDate || task.dueDate;

    if (startDate) {
      try {
        const start = DateTime.fromISO(startDate);
        if (start.isValid) {
          if (!minDate || start < minDate) minDate = start;
        }
      } catch (error) {
        console.error('Error parsing start date:', error);
      }
    }

    if (endDate) {
      try {
        const end = DateTime.fromISO(endDate);
        if (end.isValid) {
          if (!maxDate || end > maxDate) maxDate = end;
        }
      } catch (error) {
        console.error('Error parsing end date:', error);
      }
    }

    if (Array.isArray(task.subtasks)) {
      task.subtasks.forEach((subtask: any) => {
        const subStartDate = subtask.startDate || subtask.createdAt;
        const subEndDate = subtask.endDate || subtask.dueDate;

        if (subStartDate) {
          try {
            const start = DateTime.fromISO(subStartDate);
            if (start.isValid) {
              if (!minDate || start < minDate) minDate = start;
            }
          } catch (error) {
            console.error('Error parsing subtask start date:', error);
          }
        }

        if (subEndDate) {
          try {
            const end = DateTime.fromISO(subEndDate);
            if (end.isValid) {
              if (!maxDate || end > maxDate) maxDate = end;
            }
          } catch (error) {
            console.error('Error parsing subtask end date:', error);
          }
        }
      });
    }
  });

  if (minDate && maxDate) {
    return {
      minDate: (minDate as DateTime).toFormat('yyyy-MM-dd'),
      maxDate: (maxDate as DateTime).toFormat('yyyy-MM-dd'),
    };
  }

  return null;
}
