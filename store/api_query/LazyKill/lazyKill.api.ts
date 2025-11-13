// @ts-nocheck
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

const LazyKillApi: ReturnType<typeof createApi> = createApi({
    reducerPath: 'lazyKill_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as { auth?: { token?: string } }).auth?.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Accept", "application/json");
            return headers;
        },
    }),

    tagTypes: [
        'Task', 'Tasks', 'TaskByProject', 'TaskUpdate', 'TaskStatus', 'TaskPriority', 'TaskAssignee', 'TaskTags', 'TaskProgress',
        'TaskMDM', 'TaskMDMField', 'TaskMDMOption', 'TaskMDMTable', 'TaskStatusOption', 'TaskPriorityOption',
        'Subtask', 'Subtasks', 'SubtaskStatus', 'SubtaskPriority', 'SubtaskAssignee', 'SubtaskTags', 'SubtaskProgress',
        'TimeTracking', 'TimeTrackings', 'TaskTimeTracking', 'SubtaskTimeTracking', 'TotalTaskTime', 'TotalSubtaskTime', 'RepetitiveTask', 'RepetitiveTasks',
    ],
    endpoints: (builder) => ({
        // ==================== TASK QUERY ENDPOINTS ====================

        // Get all tasks with pagination, filtering, and sorting
        getAllTasks: builder.query({
            query: (params) => {
                if (!params || Object.keys(params).length === 0) {
                    return 'api/tasks';
                }

                // Build query string from params object
                const queryString = Object.entries(params as Record<string, unknown>)
                    .map(([key, value]) => {
                        if (value === undefined || value === null) return null;
                        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
                    })
                    .filter(Boolean)
                    .join('&');

                return queryString ? `api/tasks?${queryString}` : 'api/tasks';
            },
            providesTags: (result, error) =>
                (result as { data?: { tasks?: Array<{ id: string }> } })?.data?.tasks
                    ? [
                        ...((result as { data?: { tasks?: Array<{ id: string }> } })?.data?.tasks || []).map((t: { id: string }) => ({ type: 'Task' as const, id: t.id })),
                        { type: 'Tasks' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Tasks' as const, id: 'LIST' }],
        }),

        // Get tasks by project ID
        getTasksByProject: builder.query({
            query: (projectId) => `api/tasks/project/${projectId}`,
            providesTags: (result, error, projectId) => [
                { type: 'TaskByProject', id: projectId },
            ],
        }),

        // Get a single task by ID
        getTaskById: builder.query({
            query: (id) => `api/tasks/${id}`,
            providesTags: (result, error, id) => [{ type: 'Task', id }],
        }),

        // ==================== TASK MUTATION ENDPOINTS ====================

        // Create a new task
        createTask: builder.mutation<unknown, Record<string, unknown>>({
            query: (createTaskDto) => ({
                url: 'api/tasks',
                method: 'POST',
                body: createTaskDto,
            }),
            invalidatesTags: ['Tasks', 'TaskByProject'],
        }),

        // Update entire task (multiple fields)
        updateTask: builder.mutation({
            query: ({ id, updateData }) => ({
                url: `api/tasks/${id}`,
                method: 'PATCH',
                body: updateData,
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, updateData }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            Object.assign(draft, updateData);
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                Object.assign(task as Record<string, unknown>, updateData);
                            }
                        }
                    })
                );

                try {
                    // Wait for backend confirmation
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'Tasks', id: 'LIST' },
                    { type: 'TaskByProject', id: 'LIST' },
                ],
        }),

        // Update task status only
        updateTaskStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `api/tasks/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { status?: string }).status = status;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; status?: string }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.status = status;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task status, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskStatus', id },
                    { type: 'Tasks', id: 'LIST' },
                ],
        }),

        // Update task priority only
        updateTaskPriority: builder.mutation({
            query: ({ id, priority }) => ({
                url: `api/tasks/${id}/priority`,
                method: 'PATCH',
                body: { priority },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, priority }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { priority?: string }).priority = priority;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; priority?: string }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.priority = priority;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task priority, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskPriority', id },
                    { type: 'Tasks', id: 'LIST' },
                ],
        }),

        // Update task assignee(s)
        updateTaskAssignee: builder.mutation({
            query: ({ id, assignedToId }) => ({
                url: `api/tasks/${id}/assignee`,
                method: 'PATCH',
                body: { assignedToId },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, assignedToId }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { assignedToId?: string | string[] }).assignedToId = assignedToId;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; assignedToId?: string | string[] }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.assignedToId = assignedToId;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task assignee, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskAssignee', id },
                    { type: 'Tasks', id: 'LIST' },
                ],
        }),

        // Pick task from company job bucket (assign to current user and remove from companyJobBucket)
        pickTaskFromCompanyJobBucket: builder.mutation({
            query: (id) => ({
                url: `api/tasks/${id}/pick`,
                method: 'PATCH',
            }),
            // After picking, refetch task and lists
            invalidatesTags: (result, error, id) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'Tasks', id: 'LIST' },
                    { type: 'TaskByProject', id: 'LIST' },
                ],
        }),

        // Update task tags
        updateTaskTags: builder.mutation({
            query: ({ id, tags }) => ({
                url: `api/tasks/${id}/tags`,
                method: 'PATCH',
                body: { tags },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, tags }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { tags?: string[] }).tags = tags;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; tags?: string[] }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.tags = tags;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task tags, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskTags', id },
                    { type: 'Tasks', id: 'LIST' },
                ],
        }),

        // Update task progress
        updateTaskProgress: builder.mutation({
            query: ({ id, progress }) => ({
                url: `api/tasks/${id}/progress`,
                method: 'PATCH',
                body: { progress },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, progress }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { progress?: number }).progress = progress;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; progress?: number }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.progress = progress;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task progress, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskProgress', id },
                    { type: 'Tasks', id: 'LIST' },
                ],
        }),

        // Rename/Update task name (header)
        updateTaskName: builder.mutation({
            query: ({ id, taskName }) => ({
                url: `api/tasks/${id}/name`,
                method: 'PATCH',
                body: { taskName },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, taskName }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { taskName?: string }).taskName = taskName;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; taskName?: string }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.taskName = taskName;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task name, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'Tasks', id: 'LIST' },
                    { type: 'TaskByProject', id: 'LIST' },
                ],
        }),

        // Update task due date (endDate)
        updateTaskDueDate: builder.mutation({
            query: ({ id, dueDate }) => ({
                url: `api/tasks/${id}/dueDate`,
                method: 'PATCH',
                body: { dueDate },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, dueDate }, { dispatch, queryFulfilled }) {
                // Update individual task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, (draft) => {
                        if (draft) {
                            (draft as { endDate?: string }).endDate = dueDate;
                        }
                    })
                );

                // Update task list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string; endDate?: string }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const task = list.find((t: { id: string }) => t.id === id);
                            if (task) {
                                task.endDate = dueDate;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update task due date, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'Tasks', id: 'LIST' },
                    { type: 'TaskByProject', id: 'LIST' },
                ],
        }),

        // Delete a task
        deleteTask: builder.mutation({
            query: (id) => ({
                url: `api/tasks/${id}`,
                method: 'DELETE',
            }),
            // ⚡ Optimistic delete for instant UI feedback
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                // Remove from individual cache
                const deleteResult = dispatch(
                    LazyKillApi.util.updateQueryData('getTaskById', id, () => undefined)
                );

                // Remove from list cache
                const listDeleteResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllTasks', undefined, (draft) => {
                        const d = draft as { data?: { tasks?: Array<{ id: string }> } };
                        const list = d?.data?.tasks;
                        if (Array.isArray(list)) {
                            const index = list.findIndex((t: { id: string }) => t.id === id);
                            if (index !== -1) {
                                list.splice(index, 1);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    deleteResult.undo();
                    listDeleteResult.undo();
                    console.error('Failed to delete task, reverting...', error);
                }
            },
            invalidatesTags: (result, error, id) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'Tasks', id: 'LIST' },
                    { type: 'TaskByProject', id: 'LIST' },
                ],
        }),

        // ==================== TASK MDM QUERY ENDPOINTS ====================

        // Get all task MDM fields for current company
        getTaskMDMFields: builder.query<unknown, void>({
            query: () => `lazyKill/task/mdm`,
            providesTags: ['TaskMDM', 'TaskMDMField'],
        }),

        // Get task MDM fields in table format
        getTaskMDMFieldsTable: builder.query<unknown, void>({
            query: () => `lazyKill/task/mdm/table`,
            providesTags: ['TaskMDMTable'],
        }),

        // Get MDM info for current company (includes MDM ID)
        getTaskMDMInfo: builder.query<unknown, void>({
            query: () => `lazyKill/task/mdm/info`,
            providesTags: ['TaskMDM'],
        }),

        // Get MDM details by ID (needed for option management)
        getTaskMDMById: builder.query<unknown, string>({
            query: (id) => `lazyKill/task/mdm/${id}`,
            providesTags: (result, error, id) => [{ type: 'TaskMDM', id }],
        }),

        // ==================== TASK MDM MUTATION ENDPOINTS ====================

        // Create new task MDM - 🔥 ALSO REFETCH TASKS
        createTaskMDM: builder.mutation<unknown, Record<string, unknown>>({
            query: (createTaskMdmDto) => ({
                url: 'lazyKill/task/mdm',
                method: 'POST',
                body: createTaskMdmDto,
            }),
            invalidatesTags: ['TaskMDM', 'TaskMDMField', 'Tasks'],
        }),

        // Update task MDM (general update) - 🔥 ALSO REFETCH TASKS
        updateTaskMDM: builder.mutation({
            query: ({ id, updateData }) => ({
                url: `lazyKill/task/mdm/${id}`,
                method: 'PATCH',
                body: updateData,
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskMDM', id: 'INFO' },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Update field display name - 🔥 ALSO REFETCH TASKS
        updateTaskMDMDisplayName: builder.mutation({
            query: ({ id, displayName, fieldKey }) => ({
                url: `lazyKill/task/mdm/${id}/display-name`,
                method: 'PATCH',
                body: { displayName, fieldKey },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'TaskMDMTable', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Update field display order - 🔥 ALSO REFETCH TASKS
        updateTaskMDMDisplayOrder: builder.mutation({
            query: ({ id, displayOrder, fieldKey }) => ({
                url: `lazyKill/task/mdm/${id}/display-order`,
                method: 'PATCH',
                body: { displayOrder, fieldKey },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'TaskMDMTable', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // ==================== STATUS OPTION MANAGEMENT - 🔥 REFETCH TASKS ====================

        // Create status option - 🔥 ALSO REFETCH TASKS
        createTaskStatusOption: builder.mutation({
            query: ({ id, fieldKey, option }) => ({
                url: `lazyKill/task/mdm/${id}/status-option`,
                method: 'POST',
                body: { fieldKey, option },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskStatusOption', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Update status option - 🔥 ALSO REFETCH TASKS
        updateTaskStatusOption: builder.mutation({
            query: ({ id, fieldKey, option }) => ({
                url: `lazyKill/task/mdm/${id}/update/status-option`,
                method: 'POST',
                body: { fieldKey, option },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskStatusOption', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Delete status option - 🔥 ALSO REFETCH TASKS
        deleteTaskStatusOption: builder.mutation({
            query: ({ id, fieldKey, option }) => ({
                url: `lazyKill/task/mdm/${id}/status-option`,
                method: 'DELETE',
                body: { fieldKey, option },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskStatusOption', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // ==================== PRIORITY OPTION MANAGEMENT - 🔥 REFETCH TASKS ====================

        // Create priority option - 🔥 ALSO REFETCH TASKS
        createTaskPriorityOption: builder.mutation({
            query: ({ id, fieldKey, option }) => ({
                url: `lazyKill/task/mdm/${id}/priority/options`,
                method: 'POST',
                body: { fieldKey, option },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskPriorityOption', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Update priority option - 🔥 ALSO REFETCH TASKS
        updateTaskPriorityOption: builder.mutation({
            query: ({ id, fieldKey, option }) => ({
                url: `lazyKill/task/mdm/${id}/priority/options`,
                method: 'PUT',
                body: { fieldKey, option },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskPriorityOption', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Delete priority option - 🔥 ALSO REFETCH TASKS
        deleteTaskPriorityOption: builder.mutation({
            query: ({ id, fieldKey, option }) => ({
                url: `lazyKill/task/mdm/${id}/priority/options`,
                method: 'DELETE',
                body: { fieldKey, option },
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TaskMDM', id },
                    { type: 'TaskPriorityOption', id },
                    { type: 'TaskMDMField', id: 'LIST' },
                    { type: 'Tasks', id: 'LIST' }, // 🔥 Refetch all tasks
                ],
        }),

        // Delete task MDM - 🔥 ALSO REFETCH TASKS
        deleteTaskMDM: builder.mutation({
            query: (id) => ({
                url: `lazyKill/task/mdm/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TaskMDM', 'TaskMDMField', 'TaskMDMTable', 'Tasks'],
        }),

        // ==================== SUBTASK QUERY ENDPOINTS ====================

        // Get all subtasks with pagination, filtering, and sorting
        getAllSubtasks: builder.query({
            query: (params) => {
                if (!params || Object.keys(params).length === 0) {
                    return 'api/subtasks';
                }

                const queryString = Object.entries(params as Record<string, unknown>)
                    .map(([key, value]) => {
                        if (value === undefined || value === null) return null;
                        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
                    })
                    .filter(Boolean)
                    .join('&');

                return queryString ? `api/subtasks?${queryString}` : 'api/subtasks';
            },
            providesTags: (result, error) =>
                (result as { data?: { subtasks?: Array<{ id: string }> } })?.data?.subtasks
                    ? [
                        ...((result as { data?: { subtasks?: Array<{ id: string }> } })?.data?.subtasks || []).map((s: { id: string }) => ({ type: 'Subtask' as const, id: s.id })),
                        { type: 'Subtasks' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Subtasks' as const, id: 'LIST' }],
        }),

        // Get subtasks by task ID
        getSubtasksByTask: builder.query({
            query: (taskId) => `api/subtasks/task/${taskId}`,
            providesTags: (result, error, taskId) => [
                { type: 'Subtask', id: taskId },
            ],
        }),

        // Get a single subtask by ID
        getSubtaskById: builder.query({
            query: (id) => `api/subtasks/${id}`,
            providesTags: (result, error, id) => [{ type: 'Subtask', id }],
        }),

        // ==================== REPEAT TASK QUERY ENDPOINTS ====================

        // Get all repeat tasks with pagination, filtering, and sorting
        // Backend expects: skip, take, projectId, status, isEnabled, frequenceType
        // Backend AUTOMATICALLY filters by companyId from req.user
        getRepeatTasks: builder.query({
            query: (params) => {
                if (!params || Object.keys(params).length === 0) {
                    return 'lazyKill/repeat-tasks';
                }

                // Build query string - backend uses skip/take not page/limit
                const queryParams: Record<string, string> = {};
                
                // Pagination: Convert page/limit to skip/take if provided
                if (params.page && params.limit) {
                    queryParams.skip = String((params.page - 1) * params.limit);
                    queryParams.take = String(params.limit);
                } else {
                    if (params.skip !== undefined) queryParams.skip = String(params.skip);
                    if (params.take !== undefined) queryParams.take = String(params.take);
                }
                
                // Filters
                if (params.projectId) queryParams.projectId = params.projectId;
                if (params.status) queryParams.status = params.status;
                if (params.isEnabled !== undefined) queryParams.isEnabled = String(params.isEnabled);
                if (params.frequenceType) queryParams.frequenceType = params.frequenceType;

                const queryString = Object.entries(queryParams)
                    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join('&');

                return queryString ? `lazyKill/repeat-tasks?${queryString}` : 'lazyKill/repeat-tasks';
            },
            providesTags: (result, error) =>
                result?.data
                    ? [
                        ...result.data.map((rt: { id: string }) => ({ type: 'RepetitiveTask' as const, id: rt.id })),
                        { type: 'RepetitiveTasks' as const, id: 'LIST' },
                    ]
                    : [{ type: 'RepetitiveTasks' as const, id: 'LIST' }],
        }),

        // Get repeat tasks by project ID
        getRepeatTasksByProject: builder.query({
            query: ({ projectId, skip, take }) => {
                const params = new URLSearchParams();
                if (skip !== undefined) params.append('skip', String(skip));
                if (take !== undefined) params.append('take', String(take));
                const queryString = params.toString();
                return queryString 
                    ? `lazyKill/repeat-tasks/project/${projectId}?${queryString}`
                    : `lazyKill/repeat-tasks/project/${projectId}`;
            },
            providesTags: (result, error, { projectId }) =>
                result?.data
                    ? [
                        ...result.data.map((rt: { id: string }) => ({ type: 'RepetitiveTask' as const, id: rt.id })),
                        { type: 'RepetitiveTask' as const, id: `PROJECT_${projectId}` },
                    ]
                    : [{ type: 'RepetitiveTask' as const, id: `PROJECT_${projectId}` }],
        }),

        // Search repeat tasks by name
        searchRepeatTasks: builder.query({
            query: ({ searchTerm, skip, take }) => {
                const params = new URLSearchParams();
                if (skip !== undefined) params.append('skip', String(skip));
                if (take !== undefined) params.append('take', String(take));
                const queryString = params.toString();
                return queryString
                    ? `lazyKill/repeat-tasks/search/${encodeURIComponent(searchTerm)}?${queryString}`
                    : `lazyKill/repeat-tasks/search/${encodeURIComponent(searchTerm)}`;
            },
            providesTags: (result, error) =>
                result?.data
                    ? [
                        ...result.data.map((rt: { id: string }) => ({ type: 'RepetitiveTask' as const, id: rt.id })),
                        { type: 'RepetitiveTasks' as const, id: 'SEARCH' },
                    ]
                    : [{ type: 'RepetitiveTasks' as const, id: 'SEARCH' }],
        }),

        // Get a single repeat task by ID
        getRepeatTaskById: builder.query({
            query: (taskId) => `lazyKill/repeat-tasks/${taskId}`,
            providesTags: (result, error, taskId) => [{ type: 'RepetitiveTask', id: taskId }],
        }),

        // ==================== REPEAT TASK MUTATION ENDPOINTS ====================

        // Create a new repeat task
        // Backend expects companyId and createdById from req.user (JWT)
        createRepeatTask: builder.mutation<unknown, Record<string, unknown>>({
            query: (createRepeatTaskDto) => ({
                url: 'lazyKill/repeat-tasks',
                method: 'POST',
                body: createRepeatTaskDto,
            }),
            invalidatesTags: ['RepetitiveTasks', 'RepetitiveTask'],
        }),

        // Update repeat task
        updateRepeatTask: builder.mutation({
            query: ({ taskId, updateData }) => ({
                url: `lazyKill/repeat-tasks/${taskId}`,
                method: 'PUT',
                body: updateData,
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ taskId, updateData }, { dispatch, queryFulfilled }) {
                // Update individual repeat task cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getRepeatTaskById', taskId, (draft) => {
                        if (draft) {
                            Object.assign(draft, updateData);
                        }
                    })
                );

                // Update repeat tasks list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getRepeatTasks', undefined, (draft) => {
                        if (draft && Array.isArray(draft.data)) {
                            const repeatTask = draft.data.find((rt: { id: string }) => rt.id === taskId);
                            if (repeatTask) {
                                Object.assign(repeatTask as Record<string, unknown>, updateData);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update repeat task, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { taskId }) =>
                error ? [] : [
                    { type: 'RepetitiveTask', id: taskId },
                    { type: 'RepetitiveTasks', id: 'LIST' },
                ],
        }),

        // Toggle repeat task enable/disable
        toggleRepeatTask: builder.mutation({
            query: (taskId) => ({
                url: `lazyKill/repeat-tasks/${taskId}/toggle`,
                method: 'PATCH',
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted(taskId, { dispatch, queryFulfilled }) {
                // Update individual repeat task cache - toggle isEnabled
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getRepeatTaskById', taskId, (draft) => {
                        if (draft && typeof draft === 'object' && 'isEnabled' in draft) {
                            (draft as { isEnabled: boolean }).isEnabled = !(draft as { isEnabled: boolean }).isEnabled;
                        }
                    })
                );

                // Update repeat tasks list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getRepeatTasks', undefined, (draft) => {
                        if (draft && Array.isArray(draft.data)) {
                            const repeatTask = draft.data.find((rt: { id: string }) => rt.id === taskId) as { isEnabled?: boolean } | undefined;
                            if (repeatTask && 'isEnabled' in repeatTask) {
                                repeatTask.isEnabled = !repeatTask.isEnabled;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to toggle repeat task, reverting...', error);
                }
            },
            invalidatesTags: (result, error, taskId) =>
                error ? [] : [
                    { type: 'RepetitiveTask', id: taskId },
                    { type: 'RepetitiveTasks', id: 'LIST' },
                ],
        }),

        // Delete repeat task
        deleteRepeatTask: builder.mutation({
            query: (taskId) => ({
                url: `lazyKill/repeat-tasks/${taskId}`,
                method: 'DELETE',
            }),
            // ⚡ Optimistic delete for instant UI feedback
            async onQueryStarted(taskId, { dispatch, queryFulfilled }) {
                // Remove from individual cache
                const deleteResult = dispatch(
                    LazyKillApi.util.updateQueryData('getRepeatTaskById', taskId, () => undefined)
                );

                // Remove from list cache
                const listDeleteResult = dispatch(
                    LazyKillApi.util.updateQueryData('getRepeatTasks', undefined, (draft) => {
                        if (draft && Array.isArray(draft.data)) {
                            const index = draft.data.findIndex((rt: { id: string }) => rt.id === taskId);
                            if (index !== -1) {
                                draft.data.splice(index, 1);
                                if (draft.total) draft.total--;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    deleteResult.undo();
                    listDeleteResult.undo();
                    console.error('Failed to delete repeat task, reverting...', error);
                }
            },
            invalidatesTags: (result, error, taskId) =>
                error ? [] : [
                    { type: 'RepetitiveTask', id: taskId },
                    { type: 'RepetitiveTasks', id: 'LIST' },
                ],
        }),

        // ==================== SUBTASK MUTATION ENDPOINTS ====================

        // Create a new subtask
        createSubtask: builder.mutation<unknown, Record<string, unknown>>({
            query: (createSubtaskDto) => ({
                url: 'api/subtasks',
                method: 'POST',
                body: createSubtaskDto,
            }),
            invalidatesTags: (result, error, createSubtaskDto) => 
                error ? [] : [
                    'Subtasks',
                    'Subtask',
                    ...(createSubtaskDto.taskId ? [{ type: 'Task' as const, id: createSubtaskDto.taskId as string }] : []), // 🔥 Refetch parent task
                    { type: 'Tasks', id: 'LIST' },
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask status
        updateSubtaskStatus: builder.mutation({
            query: ({ id, status, taskId }) => ({
                url: `api/subtasks/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, status, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { status?: string }).status = status;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; status?: string }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.status = status;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask status, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskStatus', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask priority
        updateSubtaskPriority: builder.mutation({
            query: ({ id, priority, taskId }) => ({
                url: `api/subtasks/${id}/priority`,
                method: 'PATCH',
                body: { priority },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, priority, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { priority?: string }).priority = priority;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; priority?: string }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.priority = priority;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask priority, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskPriority', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask assignee(s)
        updateSubtaskAssignee: builder.mutation({
            query: ({ id, assignedToId, taskId }) => ({
                url: `api/subtasks/${id}/assignee`,
                method: 'PATCH',
                body: { assignedToId },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, assignedToId, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { assignedToId?: string | string[] }).assignedToId = assignedToId;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; assignedToId?: string | string[] }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.assignedToId = assignedToId;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask assignee, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskAssignee', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask tags
        updateSubtaskTags: builder.mutation({
            query: ({ id, tags, taskId }) => ({
                url: `api/subtasks/${id}/tags`,
                method: 'PATCH',
                body: { tags },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, tags, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { tags?: string[] }).tags = tags;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; tags?: string[] }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.tags = tags;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask tags, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskTags', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask progress
        updateSubtaskProgress: builder.mutation({
            query: ({ id, progress, taskId }) => ({
                url: `api/subtasks/${id}/progress`,
                method: 'PATCH',
                body: { progress },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, progress, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { progress?: number }).progress = progress;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; progress?: number }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.progress = progress;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask progress, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskProgress', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask name
        updateSubtaskName: builder.mutation({
            query: ({ id, subtaskName, taskId }) => ({
                url: `api/subtasks/${id}/name`,
                method: 'PATCH',
                body: { subtaskName },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, subtaskName, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { subtaskName?: string }).subtaskName = subtaskName;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; subtaskName?: string }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.subtaskName = subtaskName;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask name, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update subtask due date (endDate)
        updateSubtaskDueDate: builder.mutation({
            query: ({ id, dueDate, taskId }) => ({
                url: `api/subtasks/${id}/dueDate`,
                method: 'PATCH',
                body: { dueDate },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, dueDate, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            (draft as { endDate?: string }).endDate = dueDate;
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string; endDate?: string }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                subtask.endDate = dueDate;
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask due date, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Update entire subtask
        updateSubtask: builder.mutation({
            query: ({ id, updateData, taskId }) => ({
                url: `api/subtasks/${id}`,
                method: 'PATCH',
                body: updateData,
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, updateData, taskId }, { dispatch, queryFulfilled }) {
                // Update individual subtask cache
                const patchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, (draft) => {
                        if (draft) {
                            Object.assign(draft, updateData);
                        }
                    })
                );

                // Update subtask list cache
                const listPatchResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const subtask = list.find((s: { id: string }) => s.id === id);
                            if (subtask) {
                                Object.assign(subtask as Record<string, unknown>, updateData);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    patchResult.undo();
                    listPatchResult.undo();
                    console.error('Failed to update subtask, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // Delete subtask
        deleteSubtask: builder.mutation({
            query: ({ id, taskId }) => ({
                url: `api/subtasks/${id}`,
                method: 'DELETE',
            }),
            // ⚡ Optimistic delete for instant UI feedback
            async onQueryStarted({ id, taskId }, { dispatch, queryFulfilled }) {
                // Remove from individual cache
                const deleteResult = dispatch(
                    LazyKillApi.util.updateQueryData('getSubtaskById', id, () => undefined)
                );

                // Remove from list cache
                const listDeleteResult = dispatch(
                    LazyKillApi.util.updateQueryData('getAllSubtasks', undefined, (draft) => {
                        const d = draft as { data?: { subtasks?: Array<{ id: string }> } };
                        const list = d?.data?.subtasks;
                        if (Array.isArray(list)) {
                            const index = list.findIndex((s: { id: string }) => s.id === id);
                            if (index !== -1) {
                                list.splice(index, 1);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                } catch (error) {
                    // ❌ Rollback on failure
                    deleteResult.undo();
                    listDeleteResult.undo();
                    console.error('Failed to delete subtask, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id, taskId }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'Subtasks', id: 'LIST' },
                    ...(taskId ? [{ type: 'Task' as const, id: taskId }] : []), // 🔥 Refetch parent task
                    { type: 'TaskByProject', id: 'LIST' }, // 🔥 Refetch tasks by project
                ],
        }),

        // fetchSubtaskMDMFields 
        SubtaskMDMFields: builder.query<unknown, void>({
            query: () => `lazyKill/subtask/mdm`,
            providesTags: ['Subtasks', 'Subtasks'],
        }),

        // ==================== TIME TRACKING QUERY ENDPOINTS ====================

        // Get all time tracking records for a task
        getTaskTimeTrackings: builder.query({
            query: (taskId) => `api/lazy-kill/tasks/${taskId}/time-tracking`,
            providesTags: (result, error, taskId) => [
                { type: 'TaskTimeTracking', id: taskId },
            ],
        }),

        // Get whether authenticated user is currently running a task time tracking
        getUserRunningTask: builder.query({
            query: () => `api/tasks/running`,
        }),

        // Get all time tracking records for a subtask
        getSubtaskTimeTrackings: builder.query({
            query: (subtaskId) => `api/lazy-kill/subtasks/${subtaskId}/time-tracking`,
            providesTags: (result, error, subtaskId) => [
                { type: 'SubtaskTimeTracking', id: subtaskId },
            ],
        }),

        // Get total time spent on a task
        getTotalTaskTime: builder.query({
            query: (taskId) => `api/lazy-kill/tasks/${taskId}/time-tracking/total`,
            providesTags: (result, error, taskId) => [
                { type: 'TotalTaskTime', id: taskId },
            ],
        }),

        // Get detailed time invested by a user on a task (includes subtasks) and totals across all users
        // Params: { taskId: string, companyUserId?: string }
        getTaskTimeInvestedByUser: builder.query<any, { taskId: string; companyUserId?: string } | string>({
            query: (params) => {
                if (typeof params === 'string') return `api/tasks/${params}/time-invested`;
                const { taskId, companyUserId } = params;
                const qp = companyUserId ? `?companyUserId=${encodeURIComponent(companyUserId)}` : '';
                return `api/tasks/${taskId}/time-invested${qp}`;
            },
            providesTags: (result, error, params) => {
                const id = typeof params === 'string' ? params : params?.taskId;
                return id ? [{ type: 'TotalTaskTime' as const, id }] : [{ type: 'TotalTaskTime' as const, id: 'LIST' }];
            }
        }),

        // Get total time spent on a subtask
        getTotalSubtaskTime: builder.query({
            query: (subtaskId) => `api/lazy-kill/subtasks/${subtaskId}/time-tracking/total`,
            providesTags: (result, error, subtaskId) => [
                { type: 'TotalSubtaskTime', id: subtaskId },
            ],
        }),

        // Get whether authenticated user is currently running a subtask time tracking
        getUserRunningSubtask: builder.query({
            query: () => `api/subtasks/running`,
        }),

        // ==================== TIME TRACKING MUTATION ENDPOINTS ====================

        // Create time tracking record for a task
        createTaskTimeTracking: builder.mutation({
            query: ({ taskId, dto }) => ({
                url: `api/lazy-kill/tasks/${taskId}/time-tracking`,
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: (result, error, { taskId }) =>
                error ? [] : [
                    { type: 'TaskTimeTracking', id: taskId },
                    { type: 'TotalTaskTime', id: taskId },
                    { type: 'Task', id: taskId },
                    { type: 'Tasks', id: 'LIST' },
                ],
        }),

        // Create time tracking record for a subtask
        createSubtaskTimeTracking: builder.mutation({
            query: ({ subtaskId, dto }) => ({
                url: `api/lazy-kill/subtasks/${subtaskId}/time-tracking`,
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: (result, error, { subtaskId }) =>
                error ? [] : [
                    { type: 'SubtaskTimeTracking', id: subtaskId },
                    { type: 'TotalSubtaskTime', id: subtaskId },
                    { type: 'Subtask', id: subtaskId },
                    { type: 'Subtasks', id: 'LIST' },
                ],
        }),

        // Start/stop time tracking for a subtask (toggle)
        // Start time tracking for a task
        startTaskTimeTracking: builder.mutation({
            query: (id) => ({
                url: `api/tasks/${id}/start-time-tracking`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskTimeTracking', id },
                    { type: 'TotalTaskTime', id },
                ],
        }),

        // Stop time tracking for a task
        stopTaskTimeTracking: builder.mutation<any, { id: string; notes?: string }>({
            query: ({ id, notes }) => ({
                url: `api/tasks/${id}/stop-time-tracking`,
                method: 'PATCH',
                body: notes ? { notes } : {},
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Task', id },
                    { type: 'TaskTimeTracking', id },
                    { type: 'TotalTaskTime', id },
                ],
        }),

        startSubtaskTimeTracking: builder.mutation({
            query: (id) => ({
                url: `api/subtasks/${id}/start-time-tracking`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskTimeTracking', id },
                    { type: 'TotalSubtaskTime', id },
                ],
        }),
        stopSubtaskTimeTracking: builder.mutation<any, { id: string; notes?: string }>({
            query: ({ id, notes }) => ({
                url: `api/subtasks/${id}/stop-time-tracking`,
                method: 'PATCH',
                body: notes ? { notes } : {},
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Subtask', id },
                    { type: 'SubtaskTimeTracking', id },
                    { type: 'TotalSubtaskTime', id },
                ],
        }),

        // Update time tracking record
        updateTimeTracking: builder.mutation({
            query: ({ id, dto }) => ({
                url: `api/lazy-kill/time-tracking/${id}`,
                method: 'PUT',
                body: dto,
            }),
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'TimeTracking', id },
                    { type: 'TaskTimeTracking', id: 'LIST' },
                    { type: 'SubtaskTimeTracking', id: 'LIST' },
                ],
        }),

        // Delete time tracking record
        deleteTimeTracking: builder.mutation({
            query: (id) => ({
                url: `api/lazy-kill/time-tracking/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TimeTracking', 'TaskTimeTracking', 'SubtaskTimeTracking', 'TotalTaskTime', 'TotalSubtaskTime'],
        }),

        // Get task updates
        getTaskUpdates: builder.query({
            query: ({ projectId, taskId }) => `api/projects/${projectId}/updates/tasks/${taskId}/updates`,
            providesTags: (result, error, { taskId }) => [
                { type: 'TaskUpdate', id: taskId },
            ],
        }),

        // Get subtask updates  
        getSubtaskUpdates: builder.query({
            query: ({ projectId, subTaskId }) => `api/projects/${projectId}/updates/subtasks/${subTaskId}/updates`,
            providesTags: (result, error, { subTaskId }) => [
                { type: 'TaskUpdate', id: subTaskId },
            ],
        }),

        // Create project update (for both tasks and subtasks)
        createProjectUpdate: builder.mutation({
            query: (updateData) => ({
                url: `api/projects/${updateData.projectId}/updates`,
                method: 'POST',
                body: updateData,
            }),
            invalidatesTags: (result, error, updateData) => [
                { type: 'TaskUpdate', id: updateData.taskId },
                { type: 'TaskUpdate', id: updateData.subTaskId },
            ],
        }),
        
    }),
});

export default LazyKillApi;

// ==================== TASK HOOKS ====================
export const {
    useGetAllTasksQuery,
    useGetTasksByProjectQuery,
    useGetTaskByIdQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useUpdateTaskStatusMutation,
    useUpdateTaskPriorityMutation,
    useUpdateTaskAssigneeMutation,
    usePickTaskFromCompanyJobBucketMutation,
    useUpdateTaskTagsMutation,
    useUpdateTaskProgressMutation,
    useUpdateTaskNameMutation,
    useUpdateTaskDueDateMutation,
    useDeleteTaskMutation,
    useGetTaskUpdatesQuery,
    useGetSubtaskUpdatesQuery,
    useCreateProjectUpdateMutation,
} = LazyKillApi;

// ==================== REPEAT TASK HOOKS ====================
export const {
    useGetRepeatTasksQuery,
    useGetRepeatTasksByProjectQuery,
    useSearchRepeatTasksQuery,
    useGetRepeatTaskByIdQuery,
    useCreateRepeatTaskMutation,
    useUpdateRepeatTaskMutation,
    useToggleRepeatTaskMutation,
    useDeleteRepeatTaskMutation,
} = LazyKillApi;

// ==================== TASK MDM HOOKS ====================
export const {
    useGetTaskMDMFieldsQuery,
    useGetTaskMDMFieldsTableQuery,
    useGetTaskMDMInfoQuery,
    useGetTaskMDMByIdQuery,
    useCreateTaskMDMMutation,
    useUpdateTaskMDMMutation,
    useUpdateTaskMDMDisplayNameMutation,
    useUpdateTaskMDMDisplayOrderMutation,
    useCreateTaskStatusOptionMutation,
    useUpdateTaskStatusOptionMutation,
    useDeleteTaskStatusOptionMutation,
    useCreateTaskPriorityOptionMutation,
    useUpdateTaskPriorityOptionMutation,
    useDeleteTaskPriorityOptionMutation,
    useDeleteTaskMDMMutation,
} = LazyKillApi;

// ==================== SUBTASK HOOKS ====================
export const {
    useGetAllSubtasksQuery,
    useGetSubtasksByTaskQuery,
    useGetSubtaskByIdQuery,
    useCreateSubtaskMutation,
    useUpdateSubtaskStatusMutation,
    useUpdateSubtaskPriorityMutation,
    useUpdateSubtaskAssigneeMutation,
    useUpdateSubtaskTagsMutation,
    useUpdateSubtaskProgressMutation,
    useUpdateSubtaskNameMutation,
    useUpdateSubtaskDueDateMutation,
    useUpdateSubtaskMutation,
    useDeleteSubtaskMutation,
    useSubtaskMDMFieldsQuery,
} = LazyKillApi;

// ==================== TIME TRACKING HOOKS ====================
export const {
    useGetTaskTimeTrackingsQuery,
    useGetSubtaskTimeTrackingsQuery,
    useGetTotalTaskTimeQuery,
    useGetTaskTimeInvestedByUserQuery,
    useGetTotalSubtaskTimeQuery,
    useGetUserRunningTaskQuery,
    useGetUserRunningSubtaskQuery,
    useCreateTaskTimeTrackingMutation,
    useCreateSubtaskTimeTrackingMutation,
    useStartTaskTimeTrackingMutation,
    useStopTaskTimeTrackingMutation,
    useStartSubtaskTimeTrackingMutation,
    useStopSubtaskTimeTrackingMutation,
    useUpdateTimeTrackingMutation,
    useDeleteTimeTrackingMutation,
} = LazyKillApi;
