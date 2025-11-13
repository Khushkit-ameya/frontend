"use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import TaskTable, { TaskData } from '@/components/common/TaskTable';
import { FieldDefinition } from '@/types/FieldDefinitions';
import {
    useGetAllTasksQuery,
    useGetTaskMDMFieldsTableQuery,
} from '@/store/api_query/LazyKill/lazyKill.api';
import { usePickTaskFromCompanyJobBucketMutation } from '@/store/api_query/LazyKill/lazyKill.api';
import { customToast as toast } from '@/utils/toast';

export interface BucketItem {
    id: string;
    label: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSelectBucket?: (bucketId: string) => void; // called when parent bucket selection is required
    onOpenTask?: (task: TaskData) => void; // optional callback when a task is opened/edited
    buckets?: BucketItem[];
    title?: string;
    projectId?: string | null; // optional project filter passed from parent page
}

export default function CompanyJobBucketDialog({ open, onClose, onSelectBucket, onOpenTask, buckets, title = 'Company Job Bucket', projectId = null }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [taskExpandedIds, setTaskExpandedIds] = useState<(string | number)[]>([]);

    // Use MDM table fields to render columns
    const { data: taskMDMFieldsTable } = useGetTaskMDMFieldsTableQuery();

    // Default query: only tasks with companyJobBucket == true
    // If `projectId` is provided by the parent, include it as a filter so the dialog shows
    // only tasks for that project. We skip the query when the dialog is closed or when
    // no projectId is provided to avoid returning global results by accident.
    const queryParams = useMemo(() => {
        const qp: any = {
            page: currentPage,
            countPerPage: pageSize,
            sort: 'createdAt',
            sortDirection: 'desc',
            companyJobBucket: 'eq:true',
        };

        if (projectId) {
            // API expects filter values like 'eq:<value>' similar to other filters
            qp.projectId = `eq:${projectId}`;
        }

        return qp;
    }, [currentPage, pageSize, projectId]);

    const { data: tasksData } = useGetAllTasksQuery(queryParams, { skip: !open || !projectId });

    // Only show a specific set of columns in this dialog's table
    const fieldDefinitions: FieldDefinition[] = useMemo(() => {
        const desiredKeys = [
            'taskId',
            'taskName',
            'description',
            'priority',
            'taskType',
            'tags',
            'estimationTime',
            'action',
        ];

        const humanNames: Record<string, string> = {
            taskId: 'Task ID',
            taskName: 'Task Name',
            description: 'Description',
            priority: 'Priority',
            taskType: 'Type',
            tags: 'Tags',
            estimationTime: 'Estimate',
            action: 'Action',
        };

        return desiredKeys.map((key, idx) => {
            const base: FieldDefinition = {
                fieldKey: key,
                displayName: humanNames[key] || key,
                fieldType: key === 'action' ? 'ACTION' : 'TEXT',
                isVisible: true,
                isSortable: key !== 'description' && key !== 'tags',
                columnWidth: key === 'taskTree' ? 80 : (key === 'action' ? 120 : 180),
                displayOrder: idx,
            };
            return base;
        });
    }, []);

    // Map tasks to TaskData used by TaskTable
    const tasks: TaskData[] = useMemo(() => {
        const rows = tasksData?.data?.data?.tasks || tasksData?.data?.tasks || [];
        if (!Array.isArray(rows)) return [];
        // Helper: convert seconds to human readable (e.g., "1d 2h 5m")
        const formatEstimate = (val: any) => {
            if (val === null || val === undefined || val === '') return null;
            const n = Number(val);
            if (!Number.isFinite(n) || n <= 0) return null;

            let seconds = Math.floor(n);
            const days = Math.floor(seconds / 86400);
            seconds -= days * 86400;
            const hours = Math.floor(seconds / 3600);
            seconds -= hours * 3600;
            const minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60;

            const parts: string[] = [];
            if (days) parts.push(`${days}d`);
            if (hours) parts.push(`${hours}h`);
            if (minutes) parts.push(`${minutes}m`);
            if (seconds && parts.length === 0) parts.push(`${seconds}s`); // show seconds only if < 1 minute

            return parts.join(' ');
        };

        return rows.map((task: any) => ({
            id: task.id || task._id,
            taskId: task.taskId || task.id,
            taskName: task.taskName || task.name || '',
            description: task.description || '',
            priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium',
            taskType: task.taskType || [],
            tags: task.tags || [],
            estimationTime: formatEstimate(task.estimationTime) || null,
        }));
    }, [tasksData]);

    const totalTasks = tasksData?.data?.data?.total || tasksData?.data?.total || 0;

    // Basic cell renderer: provide capability to open edit via onOpenTask
    const formatValueForCell = (val: any) => {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
        if (Array.isArray(val)) {
            if (val.length === 0) return '-';
            // If array of primitives, join them
            if (val.every(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
                return val.join(', ');
            }
            // If array of objects, try to extract displayable fields
            const mapped = val.map((v: any) => v?.label || v?.taskName || v?.name || v?.id || v?.value).filter(Boolean);
            if (mapped.length > 0) return mapped.join(', ');
            return `${val.length} item${val.length > 1 ? 's' : ''}`;
        }
        if (typeof val === 'object') {
            // Common object shapes: user, timeTracking, document
            if (val.label) return String(val.label);
            if (val.name) return String(val.name);
            if (val.taskName) return String(val.taskName);
            if (val.id) return String(val.id);
            // Fallback to JSON string (shortened)
            try {
                const s = JSON.stringify(val);
                return s.length > 80 ? s.slice(0, 77) + '...' : s;
            } catch {
                return '-';
            }
        }
        return '-';
    };

    const [pickTask, { isLoading: isPicking }] = usePickTaskFromCompanyJobBucketMutation();

    const getCellRenderer = useCallback(({ field, row, value, isSubtask }: any) => {
        if (field.fieldKey === 'taskId' && typeof value === 'string') {
            return (
                <div className="text-sm text-blue-600 underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenTask?.(row); }}>
                    {value}
                </div>
            );
        }

        if (field.fieldKey === 'taskName') {
            return (
                <div className="font-medium text-start cursor-pointer" onClick={(e) => { e.stopPropagation(); onOpenTask?.(row); }}>
                    {formatValueForCell(value)}
                </div>
            );
        }

        if (field.fieldKey === 'taskTree') {
            return (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* placeholder for tree column */}
                    {isSubtask ? <span className="text-xs">•</span> : null}
                </div>
            );
        }

        if (field.fieldKey === 'action') {
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="Pick task"
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                const res = await pickTask(row.id).unwrap();
                                // `res` is expected to be { success, message, data }
                                const updated = (res && (res as any).data) || res;
                                toast.success((res && (res as any).message) || 'Task picked');
                                // Notify parent to open/edit the picked task if requested
                                if (updated) {
                                    onOpenTask?.(updated as TaskData);
                                }
                                // Close the dialog after picking
                                onClose?.();
                            } catch (err: any) {
                                console.error('Failed to pick task from company job bucket', err);
                                const message = (err && err.data && err.data.message) || err?.message || 'Failed to pick task';
                                toast.error(message);
                            }
                        }}
                        disabled={isPicking}
                        sx={{ textTransform: 'none', borderRadius: 1, px: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {isPicking ? 'Picking...' : 'Pick Task'}
                    </Button>
                </div>
            );
        }

        return <span>{formatValueForCell(value)}</span>;
    }, [onOpenTask]);

    useEffect(() => {
        if (!open) {
            // reset pagination and expanded rows when dialog closed
            setCurrentPage(1);
            setTaskExpandedIds([]);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="company-job-dialog-title"
            PaperProps={{ sx: { width: '90vw', height: '90vh', maxWidth: 'none', borderRadius: 2, boxShadow: 6, border: '1px solid', borderColor: 'grey.200', bgcolor: 'background.paper' } }}
        >
            <DialogTitle id="company-job-dialog-title" sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'grey.100', background: 'linear-gradient(180deg, rgba(245,246,250,1) 0%, rgba(250,250,250,1) 100%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 28, bgcolor: 'grey.300', borderRadius: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
                    </Box>
                    <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'grey.600' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers className="p-0">
                <div className="job-bucket-table" style={{ height: 'calc(90vh - 120px)', padding: 12 }}>
                    <TaskTable
                        tasks={tasks}
                        fieldDefinitions={fieldDefinitions}
                        treeColumnKey="taskTree"
                        taskIdKey="id"
                        subtasksKey="subtasks"
                        initialExpandedIds={taskExpandedIds}
                        onExpandChange={setTaskExpandedIds}
                        selectable={true}
                        stickyHeader={true}
                        indentationSize={28}
                        getCellRenderer={getCellRenderer}
                        onSelectionChange={(selectedKeys: any, rows: any) => {
                            // no-op; parent can pass onOpenTask if needed
                        }}
                        onRowClick={(row: any) => {
                            onOpenTask?.(row as TaskData);
                        }}
                        onRenameColumn={() => { /* noop */ }}
                        appearance="figma"
                        rowKey="id"
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Box sx={{ flex: 1, pl: 2 }}>
                    <Typography variant="caption">Total: {totalTasks}</Typography>
                </Box>
                {/* keep a secondary close, but primary is top-right */}
                <Button onClick={onClose} size="small" variant="outlined">Close</Button>
            </DialogActions>
            <style jsx>{`
                .job-bucket-table {
                    overflow: auto;
                    background: linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%);
                    border-radius: 6px;
                }

                /* Webkit scrollbars */
                .job-bucket-table::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .job-bucket-table::-webkit-scrollbar-track {
                    background: #f4f6f8;
                    border-radius: 8px;
                }

                .job-bucket-table::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #cfcfcf, #bdbdbd);
                    border-radius: 8px;
                    border: 2px solid #f4f6f8;
                }

                /* Firefox scrollbar */
                .job-bucket-table {
                    scrollbar-width: thin;
                    scrollbar-color: #bdbdbd #f4f6f8;
                }

                /* Make table header slightly muted */
                :global(.MuiTableCell-head) {
                    background: #fbfbfb;
                    color: rgba(0,0,0,0.85);
                    font-weight: 600;
                }

                /* Rows hover */
                :global(.MuiTableRow-root:hover) {
                    background: rgba(240,240,242,0.6);
                }
            `}</style>
        </Dialog>
    );
}
