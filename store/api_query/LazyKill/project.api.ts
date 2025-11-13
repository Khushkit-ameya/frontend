import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

const ProjectApi = createApi({
    reducerPath: 'project_form_api',
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

    tagTypes: ['Project', 'ProjectMDM', 'ProjectField', 'ProjectOption', 'ProjectUpdate'],
    endpoints: (builder) => ({
        getProjectFields: builder.query<unknown, void>({
            query: () => `lazyKill/project/mdm`,
            providesTags: ['ProjectMDM', 'ProjectField'],
        }),

        getProjectFieldsTable: builder.query<unknown, void>({
            query: () => `lazyKill/project/mdm/table`,
            providesTags: ['ProjectField'],
        }),

        // Get MDM details by ID (needed for option management)
        getProjectMDMById: builder.query<unknown, string>({
            query: (id) => `lazyKill/project/mdm/${id}`,
            providesTags: (result, error, id) => [{ type: 'ProjectMDM', id }],
        }),

        // Get MDM info for current company (includes MDM ID)
        getProjectMDMInfo: builder.query<unknown, void>({
            query: () => `lazyKill/project/mdm/info`,
            providesTags: ['ProjectMDM'],
        }),

        // Create a new project
        createProject: builder.mutation<unknown, Record<string, unknown>>({
            query: (createProjectDto) => ({
                url: 'api/projects',
                method: 'POST',
                body: createProjectDto,
            }),
            invalidatesTags: ['Project'],
        }),

        // Get all projects with query parameters for filtering, sorting, and pagination
        getAllProjects: builder.query({
            query: (params) => {
                if (!params || Object.keys(params).length === 0) {
                    return 'api/projects';
                }
                
                // Build query string from params object
                const queryString = Object.entries(params as Record<string, unknown>)
                    .map(([key, value]) => {
                        if (value === undefined || value === null) return null;
                        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
                    })
                    .filter(Boolean)
                    .join('&');
                
                return queryString ? `api/projects?${queryString}` : 'api/projects';
            },
            providesTags: (result, error) => 
                (result as { data?: { projects?: Array<{ id: string }> } })?.data?.projects
                    ? [
                        ...((result as { data?: { projects?: Array<{ id: string }> } })?.data?.projects || []).map((p: { id: string }) => ({ type: 'Project' as const, id: p.id })),
                        { type: 'Project' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Project' as const, id: 'LIST' }],
        }),

        // Get a single project by ID
        getProjectById: builder.query({
            query: (id) => `api/projects/${id}`,
            providesTags: (result, error, id) => [{ type: 'Project', id }],
        }),

        // Update a project
        updateProject: builder.mutation({
            query: ({ id, updateData }) => ({
                url: `api/projects/${id}`,
                method: 'PATCH',
                body: updateData,
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, updateData }, { dispatch, queryFulfilled }) {
                // Update individual project cache
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectById', id, (draft) => {
                        if (draft) {
                            // Apply all updates from updateData
                            Object.assign(draft, updateData);
                        }
                    })
                );

                // Update project list cache
                const listPatchResult = dispatch(
                    ProjectApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
                        const d = draft as { data?: { projects?: Array<{ id: string }> } };
                        const list = d?.data?.projects;
                        if (Array.isArray(list)) {
                            const project = list.find((p: { id: string }) => p.id === id);
                            if (project) {
                                Object.assign(project as Record<string, unknown>, updateData);
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
                    console.error('Failed to update project, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Update project due date
        updateProjectDueDate: builder.mutation({
            query: ({ id, dueDate, reason, changedById }) => ({
                url: `api/projects/${id}/due-date`,
                method: 'PATCH',
                body: { dueDate, reason, changedById },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Project', id },
                { type: 'Project', id: 'LIST' },
            ],
        }),

        // Update project due date and timeline together
        updateProjectDueDateWithTimeline: builder.mutation({
            query: ({ id, dueDate, reason, changedById }) => ({
                url: `api/projects/${id}/due-date-with-timeline`,
                method: 'PATCH',
                body: { dueDate, reason, changedById },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, dueDate }, { dispatch, queryFulfilled }) {
                // Update individual project cache - update timeline end date
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectById', id, (draft) => {
                        if (draft && dueDate) {
                            // Update timeline end date if timeline exists
                            if (draft.timeline && Array.isArray(draft.timeline) && draft.timeline.length >= 1) {
                                if (draft.timeline.length === 1) {
                                    draft.timeline.push(dueDate);
                                } else {
                                    draft.timeline[1] = dueDate;
                                }
                            }
                        }
                    })
                );

                // Update project list cache
                const listPatchResult = dispatch(
                    ProjectApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
                        if (Array.isArray(draft?.data?.projects) && dueDate) {
                            const project = draft.data.projects.find((p: { id: string }) => p.id === id) as { timeline?: string[] } | undefined;
                            if (project && Array.isArray(project.timeline) && project.timeline.length >= 1) {
                                if (project.timeline.length === 1) {
                                    project.timeline.push(dueDate);
                                } else {
                                    project.timeline[1] = dueDate;
                                }
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
                    console.error('Failed to update project due date and timeline, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Get current due date
        getCurrentDueDate: builder.query<unknown, string>({
            query: (id) => `api/projects/${id}/due-date`,
            providesTags: (result, error, id) => [{ type: 'Project', id }],
        }),

        // Get due date history
        getDueDateHistory: builder.query<unknown, string>({
            query: (id) => `api/projects/${id}/due-date/history`,
            providesTags: (result, error, id) => [{ type: 'Project', id }],
        }),

        // Delete a project
        deleteProject: builder.mutation<unknown, string>({
            query: (id) => ({
                url: `api/projects/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Project', id },
                { type: 'Project', id: 'LIST' },
            ],
        }),

        // Field Management Endpoints
        updateProjectField: builder.mutation<unknown, { fieldId: string; data: Record<string, unknown> }>({
            query: ({ fieldId, data }) => ({
                url: `field-definitions/${fieldId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['ProjectField', 'ProjectMDM'],
        }),

        updateProjectFieldDisplayName: builder.mutation<unknown, { 
            mdmId: string; 
            fieldKey: string; 
            displayName: string 
        }>({
            query: ({ mdmId, fieldKey, displayName }) => ({
                url: `lazyKill/project/mdm/${mdmId}/display-name`,
                method: 'PATCH',
                body: { fieldKey, displayName },
            }),
            invalidatesTags: ['ProjectField', 'ProjectMDM'],
        }),

        updateProjectFieldDisplayOrder: builder.mutation<unknown, { 
            mdmId: string; 
            fieldKey: string; 
            displayOrder: number 
        }>({
            query: ({ mdmId, fieldKey, displayOrder }) => ({
                url: `lazyKill/project/mdm/${mdmId}/display-order`,
                method: 'PATCH',
                body: { fieldKey, displayOrder },
            }),
            invalidatesTags: ['ProjectField', 'ProjectMDM'],
        }),

        reorderProjectFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>({
            query: ({ fieldOrders }) => ({
                url: `field-definitions/reorder`,
                method: 'POST',
                body: { fieldOrders },
            }),
            invalidatesTags: ['ProjectField', 'ProjectMDM'],
        }),

        createPriorityOption: builder.mutation<unknown, {
            projectId: string;
            optionData: { label: string; value: string; color: string }
        }>({
            query: ({ projectId, optionData }) => ({
                url: `lazyKill/project/mdm/${projectId}/priority/options`,
                method: 'POST',
                body: optionData,
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        updatePriorityOption: builder.mutation<unknown, {
            projectId: string;
            optionData: { label: string; value: string; color: string }
        }>({
            query: ({ projectId, optionData }) => ({
                url: `lazyKill/project/mdm/${projectId}/priority/options`,
                method: 'PUT',
                body: optionData,
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        deletePriorityOption: builder.mutation<unknown, {
            projectId: string;
            optionValue: string
        }>({
            query: ({ projectId, optionValue }) => ({
                url: `lazyKill/project/mdm/${projectId}/priority/options`,
                method: 'DELETE',
                body: { value: optionValue },
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        // Generic field option management (for status and other dropdown fields)
        createFieldOption: builder.mutation<unknown, {
            mdmId: string;
            fieldKey: string;
            option: { label: string; value: string; color?: string }
        }>({
            query: ({ mdmId, fieldKey, option }) => ({
                url: `lazyKill/project/mdm/${mdmId}/status-option`,
                method: 'POST',
                body: { fieldKey, option },
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        updateFieldOption: builder.mutation<unknown, {
            mdmId: string;
            fieldKey: string;
            option: { label: string; value: string; color?: string }
        }>({
            query: ({ mdmId, fieldKey, option }) => ({
                url: `lazyKill/project/mdm/${mdmId}/update/status-option`,
                method: 'POST',
                body: { fieldKey, option },
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        deleteFieldOption: builder.mutation<unknown, {
            mdmId: string;
            fieldKey: string;
            option: { label: string; value: string; color?: string }
        }>({
            query: ({ mdmId, fieldKey, option }) => ({
                url: `lazyKill/project/mdm/${mdmId}/status-option`,
                method: 'DELETE',
                body: { fieldKey, option },
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        updateFieldOptionSequence: builder.mutation<unknown, {
            mdmId: string;
            fieldKey: string;
            optionValue: string;
            newSequence: number
        }>({
            query: ({ mdmId, fieldKey, optionValue, newSequence }) => ({
                url: `lazyKill/project/mdm/${mdmId}/status-sequence`,
                method: 'PATCH',
                body: { fieldKey, optionValue, newSequence },
            }),
            invalidatesTags: ['ProjectOption', 'ProjectMDM', 'ProjectField'],
        }),

        // Project Manager Management
        updateProjectManager: builder.mutation<unknown, { id: string; managers: string[] }>({
            query: ({ id, managers }) => ({
                url: `api/projects/${id}/manager`,
                method: 'PATCH',
                body: { managers },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, managers }, { dispatch, queryFulfilled }) {
                // Note: managers array contains IDs, but we need to update the manager relationship
                // The actual manager objects will be populated by the backend response
                // For now, we'll let the invalidation handle the full update
                try {
                    await queryFulfilled;
                } catch (error) {
                    console.error('Failed to update project managers:', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Project Team Management
        updateProjectTeam: builder.mutation<unknown, { id: string; teams: string[] }>({
            query: ({ id, teams }) => ({
                url: `api/projects/${id}/team`,
                method: 'PATCH',
                body: { teams },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, teams }, { dispatch, queryFulfilled }) {
                // Note: teams array contains IDs, but we need to update the team relationship
                // The actual team objects will be populated by the backend response
                // For now, we'll let the invalidation handle the full update
                try {
                    await queryFulfilled;
                } catch (error) {
                    console.error('Failed to update project team:', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Project Timeline Management
        updateProjectTimeline: builder.mutation<unknown, { id: string; timeline: string[] }>({
            query: ({ id, timeline }) => ({
                url: `api/projects/${id}/timeline`,
                method: 'PATCH',
                body: { timeline },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, timeline }, { dispatch, queryFulfilled }) {
                // Update individual project cache
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectById', id, (draft) => {
                        if (draft) {
                            draft.timeline = timeline.map(date => new Date(date).toISOString());
                        }
                    })
                );

                // Update project list cache
                const listPatchResult = dispatch(
                    ProjectApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
                        const d = draft as { data?: { projects?: Array<{ id: string; timeline?: string[] }> } };
                        const list = d?.data?.projects;
                        if (Array.isArray(list)) {
                            const project = list.find((p: { id: string }) => p.id === id) as { timeline?: string[] } | undefined;
                            if (project) {
                                project.timeline = timeline.map(date => new Date(date).toISOString());
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
                    console.error('Failed to update project timeline, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Project Status Management
        updateProjectStatus: builder.mutation<unknown, { id: string; status: string }>({
            query: ({ id, status }) => ({
                url: `api/projects/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
                // Update individual project cache
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectById', id, (draft) => {
                        if (draft) {
                            draft.status = status;
                        }
                    })
                );

                // Update project list cache
                const listPatchResult = dispatch(
                    ProjectApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
                        const d = draft as { data?: { projects?: Array<{ id: string; status?: string }> } };
                        const list = d?.data?.projects;
                        if (Array.isArray(list)) {
                            const project = list.find((p: { id: string }) => p.id === id) as { status?: string } | undefined;
                            if (project) {
                                project.status = status;
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
                    console.error('Failed to update project status, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Project Priority Management
        updateProjectPriority: builder.mutation<unknown, { id: string; priority: string }>({
            query: ({ id, priority }) => ({
                url: `api/projects/${id}/priority`,
                method: 'PATCH',
                body: { priority },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, priority }, { dispatch, queryFulfilled }) {
                // Update individual project cache
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectById', id, (draft) => {
                        if (draft) {
                            draft.priority = priority;
                        }
                    })
                );

                // Update project list cache
                const listPatchResult = dispatch(
                    ProjectApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
                        const d = draft as { data?: { projects?: Array<{ id: string; priority?: string }> } };
                        const list = d?.data?.projects;
                        if (Array.isArray(list)) {
                            const project = list.find((p: { id: string }) => p.id === id) as { priority?: string } | undefined;
                            if (project) {
                                project.priority = priority;
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
                    console.error('Failed to update project priority, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // Project Tags Management
        updateProjectTags: builder.mutation<unknown, { id: string; tags: string[] }>({
            query: ({ id, tags }) => ({
                url: `api/projects/${id}/tags`,
                method: 'PATCH',
                body: { tags },
            }),
            // ⚡ Optimistic update for instant UI feedback
            async onQueryStarted({ id, tags }, { dispatch, queryFulfilled }) {
                // Update individual project cache
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectById', id, (draft) => {
                        if (draft) {
                            draft.tags = tags;
                        }
                    })
                );

                // Update project list cache
                const listPatchResult = dispatch(
                    ProjectApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
                        const d = draft as { data?: { projects?: Array<{ id: string; tags?: string[] }> } };
                        const list = d?.data?.projects;
                        if (Array.isArray(list)) {
                            const project = list.find((p: { id: string }) => p.id === id) as { tags?: string[] } | undefined;
                            if (project) {
                                project.tags = tags;
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
                    console.error('Failed to update project tags, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { id }) =>
                error ? [] : [
                    { type: 'Project', id },
                    { type: 'Project', id: 'LIST' },
                ],
        }),

        // ==================== Project Updates Endpoints ====================

        // Get all updates for a project
        getProjectUpdates: builder.query<unknown, string>({
            query: (projectId) => `api/projects/${projectId}/updates`,
            providesTags: (result, error, projectId) => 
                (result as { data?: Array<{ id: string }> })?.data
                    ? [
                        ...(((result as { data?: Array<{ id: string }> })?.data) || []).map((u: { id: string }) => ({ type: 'ProjectUpdate' as const, id: u.id })),
                        { type: 'ProjectUpdate' as const, id: `PROJECT_${projectId}` },
                    ]
                    : [{ type: 'ProjectUpdate' as const, id: `PROJECT_${projectId}` }],
        }),

        // Create a new update for a project
        createProjectUpdate: builder.mutation<unknown, { projectId: string; updateNotes: string; companyId: string; createdById: string }>({
            query: ({ projectId, updateNotes, companyId, createdById }) => ({
                url: `api/projects/${projectId}/updates`,
                method: 'POST',
                body: { projectId, updateNotes, companyId, createdById },
            }),
            // Optimistic update
            async onQueryStarted({ projectId, updateNotes, createdById }, { dispatch, queryFulfilled, getState }) {
                // Create a temporary update object for optimistic UI
                const tempUpdate = {
                    id: `temp-${Date.now()}`,
                    updateNotes,
                    projectId,
                    createdById,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: {
                        id: createdById,
                        firstName: 'Loading',
                        lastName: '...',
                        avatar: null,
                    },
                };

                // Optimistically update the cache
                const patchResult = dispatch(
                    ProjectApi.util.updateQueryData('getProjectUpdates', projectId, (draft) => {
                        const d = draft as { data: { id: string; updateNotes: string; projectId: string; createdById: string; createdAt: string; updatedAt: string; createdBy: { id: string; firstName: string; lastName: string; avatar: null; }; }[] };
                        if (Array.isArray(d?.data)) {
                            d.data.unshift(tempUpdate);
                        }
                    })
                );

                try {
                    // Wait for backend confirmation
                    await queryFulfilled;
                } catch (error) {
                    // Rollback on failure
                    patchResult.undo();
                    console.error('Failed to create project update, reverting...', error);
                }
            },
            invalidatesTags: (result, error, { projectId }) =>
                error ? [] : [
                    { type: 'ProjectUpdate', id: `PROJECT_${projectId}` },
                ],
        }),
    }),
});

export const {
    useGetProjectFieldsQuery,
    useGetProjectFieldsTableQuery,
    useGetProjectMDMByIdQuery,
    useGetProjectMDMInfoQuery,
    useCreateProjectMutation,
    useGetAllProjectsQuery,
    useLazyGetAllProjectsQuery,
    useGetProjectByIdQuery,
    useUpdateProjectMutation,
    useUpdateProjectDueDateMutation,
    useUpdateProjectDueDateWithTimelineMutation,
    useGetCurrentDueDateQuery,
    useGetDueDateHistoryQuery,
    useDeleteProjectMutation,
    useUpdateProjectFieldMutation,
    useUpdateProjectFieldDisplayNameMutation,
    useUpdateProjectFieldDisplayOrderMutation,
    useReorderProjectFieldsMutation,
    useCreatePriorityOptionMutation,
    useUpdatePriorityOptionMutation,
    useDeletePriorityOptionMutation,
    useCreateFieldOptionMutation,
    useUpdateFieldOptionMutation,
    useDeleteFieldOptionMutation,
    useUpdateFieldOptionSequenceMutation,
    useUpdateProjectManagerMutation,
    useUpdateProjectTeamMutation,
    useUpdateProjectTimelineMutation,
    useUpdateProjectStatusMutation,
    useUpdateProjectPriorityMutation,
    useUpdateProjectTagsMutation,
    useGetProjectUpdatesQuery,
    useCreateProjectUpdateMutation,
} = ProjectApi;
export default ProjectApi;
