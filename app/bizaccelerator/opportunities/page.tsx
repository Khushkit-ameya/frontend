"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/common/Sidebar/Sidebar';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FinalTable from '../../../components/common/CommonTable';
import { KanbanBoard } from '@/components/BizAccelerator/Kanban';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import { useTheme } from '../../../store/hooks';
import {
  useGetOpportunityFieldsQuery,
  useGetOpportunitiesQuery,
  useFilterOpportunitiesMutation,
  useUpdateOpportunityMutation,
  useGetOpportunityQuery,
  useUpdateOpportunityFieldMutation,
  useReorderOpportunityFieldsMutation,
  useCreateOpportunityMutation,
  useGetOpportunityUpdatesQuery,
  useAddOpportunityUpdateMutation,
  useEditOpportunityUpdateMutation,
  useDeleteOpportunityMutation,
  useGetOpportunityDealsQuery,
} from '../../../store/api_query/opportunities.api';
import {
  useGetFieldDefinitionsByEntityQuery,
  useAddDropdownChoiceMutation,
  useUpdateDropdownChoiceMutation,
  useReorderDropdownChoicesMutation,
  useDeleteDropdownChoiceMutation
} from '../../../store/api_query/field_definitions.api';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import type { BackendFieldDefinition } from '../../../utils/fieldDefinitions';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';
import PhoneValue from '../../../components/common/FieldType/components/PhoneValue';
import EmailValue from '../../../components/common/FieldType/components/EmailValue';
import UrlValue from '../../../components/common/FieldType/components/UrlValue';
import TextValue from '../../../components/common/FieldType/components/TextValue';
// import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import ViewIcon from '../../../components/ui buttons/ViewButton';
import DatePicker from '../../../components/common/DatePicker';
import OpportunityDealsModal from '../../../components/common/OpportunityDealsModal';
import StatusDropdown from '../../../components/dropdowns/StatusDropdown';
import { Plus, DollarSign, TrendingUp, Target, Edit } from 'lucide-react';
import { FiPlus } from "react-icons/fi";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import Bar from "@/components/Project/PaginationBar";
import SearchBoard from "@/components/common/SearchBoard";
import FilterDropdown, { FilterCondition } from "@/components/common/FilterDropdown";
import PersonButton from '@/components/ui buttons/PersonButton';
import AddFiltersButton from '@/components/ui buttons/AddFiltersButton';
import { customToast } from '../../../utils/toast';
import { useGetSavedFiltersQuery, useSaveFilterMutation, useDeleteFilterMutation } from '@/store/api_query/BizAccelerator/filter.api';
import type { FilterGroup, FilterRule } from '@/store/api_query/BizAccelerator/filter.api';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';
import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import { useGetActivitiesByEntityQuery } from '../../../store/api_query/BizAccelerator/activities.api';
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";
import { ActivityModal } from '@/components/BizAccelerator/TabContents/ActivityModal';
import type { ActivityData } from '@/components/BizAccelerator/TabContents/ActivityModal';
import { useCreateActivityMutation } from '@/store/api_query/BizAccelerator/activities.api';
import { FormModal } from '@/components/BizAccelerator/FormModal/FormModal';
import { TabbedFormLayout } from '@/components/BizAccelerator/TabbedFormLayout/TabbedFormLayout';
import { OverviewTabContent } from '@/components/BizAccelerator/TabContents/OverviewTabContent';
import { UpdatesTabContent } from '@/components/BizAccelerator/TabContents/UpdatesTabContent';
import { FilesLinksTabContent } from '@/components/BizAccelerator/TabContents/FilesLinksTabContent';
import { getDynamicFieldConfig } from '@/components/common/forms/DynamicForm/dynamicFieldConfig';
import search from "@/public/icons/search 1.svg";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";
import { FiEdit2 } from 'react-icons/fi';
import { TableTagsRenderer } from '@/components/dropdowns/TableTagsRenderer';
import { Popover, TextField, Button } from '@mui/material';
import ExportModal from '@/components/common/ExportModal';
import DescriptionModal from '../../../components/common/DescriptionModal';
import DeleteConfirmationModal from '../../../components/common/DeleteConfirmationModal';
import NotesIcon from '@/components/ui buttons/NotesIcon';

interface OpportunityData {
  id: number;
  name?: string;
  opportunityName?: string;
}

type EditableTagsCellProps = { tags: unknown; onCommit: (newTags: string[]) => Promise<void> };

const EditableTagsCell: React.FC<EditableTagsCellProps> = ({ tags, onCommit }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [input, setInput] = React.useState('');
  const normalized = React.useMemo(() => {
    if (!tags) return [] as string[];
    const toArray = (v: unknown) => Array.isArray(v)
      ? v
      : typeof v === 'object'
        ? [v]
        : typeof v === 'string'
          ? (() => { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch { return [v]; } })()
          : [];
    const arr = toArray(tags);
    return (arr as unknown[])
      .map((t) => (t && typeof t === 'object')
        ? ((t as Record<string, unknown>).label as string) || ((t as Record<string, unknown>).value as string) || ''
        : String(t))
      .filter(Boolean) as string[];
  }, [tags]);
  const [local, setLocal] = React.useState<string[]>(normalized);
  React.useEffect(() => { setLocal(normalized); }, [normalized]);
  const add = () => { const v = input.trim(); if (!v) return; if (!local.includes(v)) setLocal(prev => [...prev, v]); setInput(''); };
  const open = Boolean(anchorEl);
  return (
    <div className="w-full flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="min-w-0 flex-1">
        <TableTagsRenderer tags={local} maxWidth="100%" />
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget as HTMLElement); }}
        className="p-1 rounded hover:bg-gray-100"
        title="Edit tags"
      >
        <FiEdit2 size={14} />
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ style: { padding: 12, width: 320 } }}
      >
        <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <TextField size="small" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add tag" fullWidth />
            <Button size="small" variant="outlined" onClick={add}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {local.map((t, i) => (
              <span key={`${t}-${i}`} className="px-2 py-1 bg-gray-200 border border-gray-300 rounded-full text-xs flex items-center gap-1">
                <span>{t}</span>
                <button type="button" className="w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-gray-300" onClick={() => setLocal(prev => prev.filter((_, idx) => idx !== i))}>×</button>
              </span>
            ))}
            {local.length === 0 && <span className="text-xs text-gray-500">No tags</span>}
          </div>
          <div className="flex justify-end gap-2">
            <Button size="small" onClick={() => { setAnchorEl(null); setLocal(normalized); setInput(''); }}>Cancel</Button>
            <Button size="small" variant="contained" color="error" onClick={async () => { await onCommit(local); setAnchorEl(null); }}>Save</Button>
          </div>
        </div>
      </Popover>
    </div>
  );
};

const OpportunitiesPage: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [dealsModalOpen, setDealsModalOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionRow, setDescriptionRow] = useState<Record<string, unknown> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Column visibility: Show Less (first 6 by displayOrder)
  const [showLessColumns, setShowLessColumns] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeView, setActiveView] = useState<"default" | "email" | "signature">("default");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'meeting' | 'call' | 'notes' | 'todo' | 'email'>('call');
  const [createActivityMutation] = useCreateActivityMutation();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilterId, setSavedFilterId] = useState<string | null>(null);

  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  const { data: companyUsersData } = useGetCompanyUsersQuery({});
  const { data: savedFiltersData } = useGetSavedFiltersQuery('opportunity');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();
  const [updateOpportunity] = useUpdateOpportunityMutation();
  const [createOpportunity] = useCreateOpportunityMutation();
  const [addOpportunityUpdate] = useAddOpportunityUpdateMutation();
  const [editOpportunityUpdate] = useEditOpportunityUpdateMutation();
  const [deleteOpportunity] = useDeleteOpportunityMutation();
  const [updatesContent, setUpdatesContent] = useState("");

  // Transform filters between UI <-> backend (moved up to be available to useMemo below)
  const transformBackendFiltersToFrontend = (filterGroup: unknown): FilterCondition[] => {
    const group = filterGroup as { logic?: string; rules?: unknown[] } | undefined;
    if (!group || !Array.isArray(group.rules)) return [];
    const logic = group.logic || 'AND';
    return group.rules.map((rule: unknown, index: number) => {
      const r = rule as { logic?: string; rules?: unknown[]; values?: unknown[]; value?: unknown; fieldKey?: string; condition?: string };
      if (r.logic && r.rules) return transformBackendFiltersToFrontend(rule);
      const value = r.values || (r.value ? [r.value] : []);
      return {
        id: `filter-${Date.now()}-${index}`,
        field: r.fieldKey as string,
        condition: r.condition as string,
        value: Array.isArray(value) ? value : [value],
        logicalOperator: logic as 'AND' | 'OR',
      } as FilterCondition;
    }).flat();
  };

  const transformFiltersToBackendFormat = (filters: FilterCondition[]): FilterGroup | null => {
    if (filters.length === 0) return null;
    const noValueConditions = [
      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
      'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE',
    ];
    const orMultiValueConditions = [
      'CONTAINS', 'DOES_NOT_CONTAIN', 'IS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'IN'
    ];
    const andMultiValueConditions = [
      'IS_NOT', 'NOT_EQUALS', 'DOES_NOT_CONTAIN', 'NOT_IN'
    ];
    const transformedRules: Array<FilterRule | FilterGroup> = [];
    filters.forEach((filter) => {
      if (noValueConditions.includes(filter.condition)) {
        transformedRules.push({ fieldKey: filter.field, condition: filter.condition, value: '' } as FilterRule);
        return;
      }
      if (!filter.value || filter.value.length === 0) return;
      if (['IN', 'NOT_IN'].includes(filter.condition)) {
        transformedRules.push({ fieldKey: filter.field, condition: filter.condition, values: filter.value, value: filter.value.join(',') } as FilterRule);
        return;
      }
      if (filter.value.length === 1) {
        transformedRules.push({ fieldKey: filter.field, condition: filter.condition, value: filter.value[0] } as FilterRule);
        return;
      }
      if (filter.value.length > 1) {
        if (orMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map((val) => ({ fieldKey: filter.field, condition: filter.condition, value: val }));
          transformedRules.push({ logic: 'OR', rules: nestedRules } as FilterGroup);
          return;
        }
        if (andMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map((val) => ({ fieldKey: filter.field, condition: filter.condition, value: val }));
          transformedRules.push({ logic: 'AND', rules: nestedRules } as FilterGroup);
          return;
        }
        transformedRules.push({ fieldKey: filter.field, condition: filter.condition, value: filter.value[0] } as FilterRule);
      }
    });
    if (transformedRules.length === 0) return null;
    const logic = (filters[0]?.logicalOperator || 'AND') as 'AND' | 'OR';
    return { logic, rules: transformedRules } as FilterGroup;
  };

  // DROPDOWN CRUD MUTATIONS
  const [addDropdownChoice] = useAddDropdownChoiceMutation();
  const [updateDropdownChoice] = useUpdateDropdownChoiceMutation();
  const [reorderDropdownChoices] = useReorderDropdownChoicesMutation();
  const [deleteDropdownChoice] = useDeleteDropdownChoiceMutation();
  const { data: allFieldsFull } = useGetFieldDefinitionsByEntityQuery('opportunity');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetOpportunityFieldsQuery();
  const [filterOpportunities, { data: opportunitiesData, isLoading: opportunitiesLoading }] = useFilterOpportunitiesMutation();
  const [currentOpportunitiesData, setCurrentOpportunitiesData] = useState<unknown>(null);
  const { data: initialOpportunitiesData, isLoading: initialOpportunitiesLoading } = useGetOpportunitiesQuery({
    page: currentPage,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
  });

  // Safely typed views of fetched data
  const initialOpsObj = initialOpportunitiesData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentOpsObj = currentOpportunitiesData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const fieldsRawArray = useMemo(() => {
    const fr = fieldsRaw as unknown;
    if (Array.isArray(fr)) return fr as unknown[];
    const items = (fr as { items?: unknown[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  }, [fieldsRaw]);

  // Reset to first page when criteria change
  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [searchQuery, selectedColumns, JSON.stringify(activeFilters), selectedPeopleIds, personFilterField, savedFilterId, sort?.field, sort?.direction]);

  const [updateField] = useUpdateOpportunityFieldMutation();
  const [reorderFields] = useReorderOpportunityFieldsMutation();

  // Activities and Updates for the form modal
  const { data: activitiesResponse } = useGetActivitiesByEntityQuery(
    { entityType: 'opportunity', entityId: String(editData?.id ?? '') },
    { skip: !isFormModalOpen || !editData?.id }
  );
  const activitiesData = ((activitiesResponse as { data?: { items?: unknown[] }, items?: unknown[] } | undefined)?.data?.items) ?? ((activitiesResponse as { items?: unknown[] } | undefined)?.items) ?? [];
  const { data: updatesData, isLoading: updatesLoading } = useGetOpportunityUpdatesQuery(
    String(editData?.id ?? ''),
    { skip: !isFormModalOpen || !editData?.id }
  );
  console.log(updatesData, "updatesDataupdatesDataupdatesDataupdatesDataupdatesDataupdatesDataupdatesData")
  // Derived filters
  const buildSearchFilterRules = useMemo<FilterGroup | null>(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;
    const rules: FilterRule[] = selectedColumns.map((columnKey) => ({ fieldKey: columnKey, condition: 'CONTAINS', value: searchQuery }));
    return { logic: 'OR', rules };
  }, [searchQuery, selectedColumns]);

  const buildAdvancedFilterRules = useMemo(() => {
    const valid = activeFilters.filter(f => {
      const noVal = ['IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY', 'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'];
      if (noVal.includes(f.condition)) return true;
      return f.value && f.value.length > 0;
    });
    if (valid.length === 0) return null;
    return transformFiltersToBackendFormat(valid);
  }, [activeFilters]);

  // Selected opportunity for modal title
  const { data: selectedOppData } = useGetOpportunityQuery(
    selectedOpportunityId || '',
    { skip: !selectedOpportunityId }
  );

  // Person filter helpers
  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setCurrentPage(1);
    setSelectedPeopleIds(selectedIds);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setCurrentPage(1);
    setPersonFilterField(field);
  };

  // Refetch opportunities with current state
  const refetchOpportunities = async () => {
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: sort?.direction || 'desc',
      };
      if (savedFilterId) {
        params.savedFilterId = savedFilterId;
      } else {
        const filterRules: Array<FilterGroup | FilterRule> = [];
        if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules);
        if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules);
        if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules);
        if (filterRules.length > 0) {
          params.filterGroup = filterRules.length === 1 ? filterRules[0] : ({ logic: 'AND', rules: filterRules } as FilterGroup);
        }
      }
      const result = await filterOpportunities(params).unwrap();
      setCurrentOpportunitiesData(result);
    } catch (err) {
      console.error('Failed to refetch opportunities:', err);
    }
  };

  // Saved filters: load handler
  const handleLoadSavedFilter = async (filterId: string) => {
    try {
      const savedFilter = (savedFiltersData || []).find(f => f.id === filterId);
      if (!savedFilter) {
        customToast.error('Saved filter not found');
        return;
      }
      const transformed = transformBackendFiltersToFrontend(savedFilter.filterDefinition);
      setActiveFilters(transformed);
      setSavedFilterId(filterId);
      setCurrentPage(1);
    } catch (e) {
      console.error('Failed to load saved filter:', e);
      customToast.error('Failed to load saved filter');
    }
  };

  // Create activity handler
  const handleCreateActivity = async (activityPayload: ActivityData): Promise<void> => {
    try {
      if (!currentUser?.id) throw new Error('User information not available');
      const opportunityId = editData?.id;
      if (!opportunityId) throw new Error('Opportunity ID is required to create activity');

      const apiPayload: Record<string, unknown> = {
        type: activityPayload.type?.toUpperCase(),
        subject: activityPayload.subject || (activityPayload as unknown as { title?: string }).title,
        description: activityPayload.description || '',
        scheduledAt: activityPayload.scheduledAt,
        duration: parseInt(String(activityPayload.duration || 30)),
        status: 'SCHEDULED',
        priority: activityPayload.priority || 'MEDIUM',
        assignedToId: currentUser.companyUserId || currentUser.id,
        createdBy: currentUser.id,
        opportunityId,
      };
      if (activityPayload.dealId) apiPayload.dealId = activityPayload.dealId;
      if (activityPayload.contactId) apiPayload.contactId = activityPayload.contactId;
      if (activityPayload.leadId) apiPayload.leadId = activityPayload.leadId;

      const subject = apiPayload.subject as string | undefined;
      if (!subject?.trim()) throw new Error('Subject is required');
      if (!apiPayload.scheduledAt) throw new Error('Scheduled date is required');
      if (!apiPayload.type) throw new Error('Activity type is required');

      await createActivityMutation(apiPayload as unknown as import('../../../store/api_query/BizAccelerator/activities.api').CreateActivityData).unwrap();
      customToast.success('Activity created successfully!');
      setIsActivityModalOpen(false);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }, message?: string };
      console.error('Failed to create activity:', err);
      customToast.error(err?.data?.message || err?.message || 'Failed to create activity');
      throw error;
    }
  };

  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    const fromApi = fieldsRawArray as unknown[];
    const fromInitial = (initialOpsObj?.fieldDefinitions ?? []) as unknown[];
    const fromCurrent = ((opportunitiesData as { fieldDefinitions?: unknown[] } | undefined)?.fieldDefinitions ?? []) as unknown[];
    const mergedByKey = new Map<string, Record<string, unknown>>();
    [...fromShared, ...fromApi, ...fromInitial, ...fromCurrent].forEach((f: unknown) => {
      if (!f || typeof f !== 'object') return;
      const obj = f as Record<string, unknown>;
      const k = String(obj.fieldKey || '');
      if (!k) return;
      mergedByKey.set(k, { ...(mergedByKey.get(k) || {}), ...obj });
    });
    const fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as BackendFieldDefinition[]);
    return [
      ...fields,
      {
        fieldKey: 'action',
        displayName: 'Action',
        fieldType: 'ACTION',
        isRequired: false,
        isEditable: false,
        options: {},
        displayOrder: fields.length + 1,
        isCoreField: false,
        isVisible: true,
        isReadOnly: false,
        isSearchable: false,
        isFilterable: false,
        isSortable: false,
        columnWidth: 'w-[150px]',
        defaultValue: null,
      } as unknown as FieldDefinition,
    ];
  }, [allFieldsFull, fieldsRawArray, initialOpsObj?.fieldDefinitions, (opportunitiesData as { fieldDefinitions?: unknown[] } | undefined)?.fieldDefinitions]);

  const availablePersonFilterFields = useMemo(() => {
    // Always provide both options - backend supports filtering even if fields aren't visible
    return ['assignedTo', 'createdBy'] as Array<'assignedTo' | 'createdBy'>;
  }, []);

  // Transform users data for PersonFilterModal
  const peopleForFilter = useMemo(() => {
    if (!companyUsersData?.users) return [];
    return companyUsersData.users.map((user: unknown) => {
      const u = user as { id?: string; firstName?: string; lastName?: string; email?: string; role?: unknown; avatar?: string };
      return {
        id: u.id as string,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email as string),
        email: u.email as string,
        role: u.role,
        avatar: u.avatar as string,
      };
    });
  }, [companyUsersData]);

  // Build person filter rules
  const buildPersonFilterRules = useMemo(() => {
    if (selectedPeopleIds.length === 0) return null;

    // Determine which fields to filter on
    let fieldKeys: string[] = [];

    if (personFilterField === 'assignedTo') {
      const assignField = finalFields.find(f => f.fieldKey === 'assignedTo' || f.fieldKey === 'assignTo');
      fieldKeys = [assignField?.fieldKey || 'assignedTo'];
    } else {
      // For createdBy, search both createdBy and createdByName fields
      const possibleFields = ['createdBy', 'createdByName', 'createdById'];
      fieldKeys = finalFields
        .filter(f => possibleFields.includes(f.fieldKey))
        .map(f => f.fieldKey);
      // Fallback if no fields found
      if (fieldKeys.length === 0) {
        fieldKeys = ['createdBy'];
      }
    }

    // Create rules for each selected person across all relevant fields
    const personRules = selectedPeopleIds.map(personId => {
      // For each person, create rules that check all relevant fields
      const fieldRules = fieldKeys.map(fieldKey => ({
        fieldKey: fieldKey,
        condition: 'EQUALS',
        value: personId
      }));

      // If multiple fields, wrap in OR logic for this person
      if (fieldRules.length > 1) {
        return {
          logic: 'OR' as const,
          rules: fieldRules
        };
      }
      // Single field - return the rule directly
      return fieldRules[0];
    });

    // If only one person selected, return their rules directly
    if (personRules.length === 1) {
      return personRules[0];
    }

    // Multiple people - wrap all their rules in OR logic
    return {
      logic: 'OR' as const,
      rules: personRules
    };
  }, [selectedPeopleIds, personFilterField, finalFields]);

  const formFields = useMemo(() => {
    if (!Array.isArray(fieldsRawArray) || fieldsRawArray.length === 0) {
      return [];
    }

    const transformedFields = fieldsRawArray
      .filter((field: unknown) => {
        const f = field as Record<string, unknown>;
        return f && f.fieldKey && f.fieldType && f.isVisible !== false && f.fieldKey !== 'filesLinks';
      })
      .map((field: unknown) => {
        const f = field as Record<string, unknown>;
        const dynamicConfig = getDynamicFieldConfig(
          f.fieldKey as string,
          f.fieldType as import('@/components/common/forms/DynamicForm/types').FieldType,
          f.displayName as string
        );

        const transformedOptions: Record<string, unknown> = {};

        const opts = (f.options ?? {}) as Record<string, unknown>;
        if (opts) {
          const choices = (opts.choices ?? []) as unknown[];
          if (Array.isArray(choices)) {
            transformedOptions.choices = choices.map((choice: unknown) => {
              const c = choice as { value?: unknown; label?: string; color?: string };
              return { value: c?.value ?? choice, label: c?.label ?? String(c?.value ?? choice), color: c?.color };
            });
          }
          if (opts.placeholder) transformedOptions.placeholder = opts.placeholder as string;
          if (opts.rows) transformedOptions.rows = opts.rows as number;
          if (opts.multiple) transformedOptions.multiple = opts.multiple as boolean;
          if (opts.allowCustomTags) transformedOptions.allowCustom = opts.allowCustomTags as boolean;

          Object.keys(opts).forEach((key) => {
            if (!['choices', 'placeholder', 'rows', 'multiple', 'allowCustomTags'].includes(key)) {
              transformedOptions[key] = (opts as Record<string, unknown>)[key];
            }
          });
        }

        return {
          fieldKey: f.fieldKey as string,
          displayName: f.displayName as string,
          fieldType: f.fieldType as string,
          isRequired: (f.isRequired as boolean) || false,
          isEditable: f.isReadOnly !== true,
          isReadOnly: (f.isReadOnly as boolean) || false,
          options: transformedOptions,
          displayOrder: (f.displayOrder as number) || 0,
          helpText: f.helpText as string,
          fieldId: f.id as string,
          id: f.id as string,
          icon: dynamicConfig.icon,
          tooltip: dynamicConfig.tooltip,
          iconBg: "#C81C1F",
        };
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => ((a.displayOrder as number) || 0) - ((b.displayOrder as number) || 0));
    const hasLinkcreatedeal = transformedFields.some(field =>
      (field as Record<string, unknown>).fieldKey === 'createDeal'
    );
    if (!hasLinkcreatedeal) {
      // ADD THIS: Manually add the createDeal field for the form
      transformedFields.push({
        fieldKey: 'createDeal',
        displayName: 'Create Deal',
        fieldType: 'BUTTON',
        isRequired: false,
        isEditable: true,
        isReadOnly: false,
        options: {},
        displayOrder: transformedFields.length + 1,
        helpText: '',
        fieldId: 'create-deal-field',
        id: 'create-deal-field',
        icon: '💰',
        tooltip: 'Create Deal',
        iconBg: "#C81C1F",
      });
    }

    return transformedFields;
  }, [fieldsRawArray]);

  const handleOpenDealsModalFromForm = (opportunityData: Record<string, unknown>) => {
    console.log("Opening deals modal from form with data:", opportunityData);
    const obj = opportunityData as { id?: unknown; _id?: unknown };
    const opportunityId = String((obj?.id ?? obj?._id) ?? '');
    console.log("Opportunity ID:", opportunityId);

    if (!opportunityId) {
      customToast.error("No opportunity selected");
      return;
    }

    setSelectedOpportunityId(opportunityId);
    setDealsModalOpen(true);
    console.log("Modal should open now - dealsModalOpen:", true);
  };
  const isOpportunityData = (data: unknown): data is OpportunityData => {
    return !!data && typeof data === 'object' && 'id' in data;
  };
  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    return [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
  }, [finalFields, showLessColumns]);

  const rows = ((currentOpsObj?.items ?? initialOpsObj?.items) ?? []) as Record<string, unknown>[];
  const loading = (viewMode === 'kanban') ? (fieldsLoading) : (fieldsLoading || opportunitiesLoading || initialOpportunitiesLoading);
  // Export: fetch all opportunities in DB (ignoring current pagination/filters)
  const fetchAllForExport = async (): Promise<Record<string, unknown>[]> => {
    try {
      const pageSizeAll = 1000;
      let page = 1;
      const all: Record<string, unknown>[] = [];
      while (true) {
        const res = await filterOpportunities({
          page,
          limit: pageSizeAll,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
        }).unwrap();
        const r = res as { items?: Record<string, unknown>[]; pagination?: { total?: number } };
        const items = r?.items ?? [];
        all.push(...items);
        const total = r?.pagination?.total ?? items.length;
        if (items.length < pageSizeAll || all.length >= total) break;
        page += 1;
      }
      return all;
    } catch (e) {
      console.error('Export fetchAll failed', e);
      return [];
    }
  };
  // Column Width Manager: tune widths by fieldKey (px)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    email: 260,
    phone: 200,
    opportunityStatus: 180,
    stage: 180,
    value: 160,
    createdByName: 180,
    alternatePhone: 200,
    createdBy: 180,
    createdById: 180,
    createdAt: 160,
    updatedAt: 160,
    filesLinks: 140,
    createDeal: 180,
    deals: 140,
    action: 150,
  });

  const makeUpdateBody = (field: FieldDefinition, row: Record<string, unknown>, nextValue: unknown) => {
    const body: Record<string, unknown> = {};
    (finalFields || []).forEach((f) => {
      if (f?.isRequired) {
        body[f.fieldKey] = row?.[f.fieldKey] ?? '';
      }
    });
    body[field.fieldKey] = nextValue;
    return body;
  };

  // Kanban: determine status field (stage/opportunityStatus preferred)
  const statusField = useMemo(() => {
    const lc = (s?: string) => String(s || '').toLowerCase();
    const byKey = (finalFields || []).find((f) => ['opportunitystatus', 'status', 'stage'].includes(lc(f.fieldKey)));
    if (byKey) return byKey;
    const byName = (finalFields || []).find((f) => /status|stage/.test(lc(f.displayName)));
    return byName;
  }, [finalFields]);

  const kanbanColumns = useMemo(() => {
    if (!statusField) return [] as Array<{ id: string; title: string; value: string | number | null; color?: string }>;
    const choices = ((statusField.options as { choices?: unknown[] } | undefined)?.choices ?? []) as Array<Record<string, unknown>>;
    return choices.map((c) => ({
      id: String(c.value ?? c.fieldKey ?? c.label ?? ''),
      title: String(c.label ?? c.displayName ?? c.value ?? ''),
      value: (c.value as string | number | null) ?? null,
      color: typeof c.color === 'string' ? c.color : undefined,
    }));
  }, [statusField]);

  const OppKanbanCard: React.FC<{ row: Record<string, unknown> }> = ({ row }) => {
    const oppId = String((row?.id as string) ?? (row?._id as string) ?? '');
    const { data: dealsData } = useGetOpportunityDealsQuery(oppId, { skip: !oppId });
    const deals = (dealsData as Array<Record<string, unknown>> | undefined) ?? [];
    const firstDealName = String(deals[0]?.name || deals[0]?.dealName || deals[0]?.title || deals[0]?.recordId || '').trim();
    const extra = Math.max(0, deals.length - 1);
    const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}...` : s);
    const openDealsModal = () => {
      const id = oppId;
      if (!id) return;
      setSelectedOpportunityId(id);
      setDealsModalOpen(true);
    };
    const defsByKey = useMemo(() => Object.fromEntries(finalFields.map((f) => [f.fieldKey, f])), [finalFields]);
    const emailDef = (defsByKey['email']
      ?? finalFields.find((f) => f.fieldType === 'EMAIL' || /email/i.test(String(f.displayName)))) as FieldDefinition | undefined;
    const phoneDef = (defsByKey['phone'] ?? finalFields.find((f) => f.fieldType === 'PHONE' || /phone/i.test(String(f.displayName)))) as FieldDefinition | undefined;
    const companyDef = (defsByKey['company']
      ?? defsByKey['companyName']
      ?? defsByKey['account']
      ?? defsByKey['accountName']
      ?? defsByKey['client']
      ?? finalFields.find((f) => /company|account|client/i.test(String(f.displayName)))) as FieldDefinition | undefined;
    return (
      <div className={['text-card-foreground overflow-hidden bg-white shadow-sm border border-gray-200 rounded-xl', 'transition-all duration-200 relative select-none px-3 hover:shadow-md hover:border-gray-400', 'pt-[0.4375rem] pb-1.5 w-full'].join(' ')}>
        <button type="button" onClick={() => handleEditOpportunity(row)} className="absolute top-2 right-2 p-1.5 rounded hover:bg-gray-100" title="Notes" aria-label="Notes">
          <NotesIcon />
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm leading-tight truncate" title={String(row?.name || row?.opportunityName || '')}>
              {String(row?.name || row?.opportunityName || '')}
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 text-[11px] text-gray-500">Deals</span>
              <button type="button" onClick={openDealsModal} className="truncate flex-1 hover:underline text-left" style={{ color: '#C81C1F' }}>
                {deals.length === 0 ? 'View/Link Deals' : `${trunc(firstDealName, 14)}${extra > 0 ? ` +${extra}` : ''}`}
              </button>
            </div>
            {phoneDef && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-[11px] text-gray-500">Phone</span>
                <div className="truncate flex-1">
                  <PhoneValue
                    field={phoneDef}
                    value={row?.[phoneDef.fieldKey as keyof typeof row]}
                    onCommit={async (next: string) => {
                      const id = oppId;
                      if (!id) return;
                      const prevSnap = row as Record<string, unknown>;
                      await optimisticCellUpdate(
                        id,
                        prevSnap,
                        { [phoneDef.fieldKey]: next },
                        () => updateOpportunity({ opportunityId: id, data: makeUpdateBody(phoneDef, prevSnap, next) }).unwrap()
                      );
                    }}
                  />
                </div>
              </div>
            )}
            {emailDef && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-[11px] text-gray-500">Email</span>
                <div className="truncate flex-1">
                  <EmailValue
                    field={emailDef}
                    value={row?.[emailDef.fieldKey as keyof typeof row]}
                    onCommit={async (next: string) => {
                      const id = oppId;
                      if (!id) return;
                      const prevSnap = row as Record<string, unknown>;
                      await optimisticCellUpdate(
                        id,
                        prevSnap,
                        { [emailDef.fieldKey]: next },
                        () => updateOpportunity({ opportunityId: id, data: makeUpdateBody(emailDef, prevSnap, next) }).unwrap()
                      );
                    }}
                  />
                </div>
              </div>
            )}
            {companyDef && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-[11px] text-gray-500">Company</span>
                <div className="truncate flex-1">
                  <TextValue
                    field={companyDef}
                    value={row?.[companyDef.fieldKey as keyof typeof row]}
                    onCommit={async (next: string) => {
                      const id = oppId;
                      if (!id) return;
                      const prevSnap = row as Record<string, unknown>;
                      await optimisticCellUpdate(
                        id,
                        prevSnap,
                        { [companyDef.fieldKey]: next },
                        () => updateOpportunity({ opportunityId: id, data: makeUpdateBody(companyDef, prevSnap, next) }).unwrap()
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    try {
      if (userLoading) {
        customToast.info("Please wait while we load your user information");
        return;
      }
      if (isEditMode && editData?.id) {
        await updateOpportunity({ opportunityId: String(editData.id), data: values }).unwrap();
        customToast.success("Opportunity updated successfully!");
        await refetchOpportunities();
      } else {
        const userId = currentUser?.id;
        if (!userId) {
          customToast.error("User information not available. Please refresh and try again.");
          return;
        }
        const createData = { ...values, createdBy: userId };
        await createOpportunity({ data: createData }).unwrap();
        customToast.success("Opportunity created successfully!");
        await refetchOpportunities();
      }
      setIsFormModalOpen(false);
    } catch (error: unknown) {
      console.error("Failed to save opportunity:", error);
      const err = error as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || "Failed to save opportunity");
    }
  };

  // ...

  const handleCreateOpportunityUpdate = async (content: string) => {
    if (!editData?.id) {
      customToast.error("No opportunity selected");
      return;
    }

    try {
      await addOpportunityUpdate({
        opportunityId: String(editData.id),
        content: content
      }).unwrap();

      customToast.success("Update added successfully");
      setUpdatesContent("");
      await refetchOpportunities();
    } catch (error: unknown) {
      console.error("Failed to add update:", error);
      const err = error as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || "Failed to add update");
    }
  };

  // ...

  const handleEditOpportunityUpdate = async (updateId: string, content: string) => {
    if (!editData?.id) {
      customToast.error("No opportunity selected");
      return;
    }

    try {
      await editOpportunityUpdate({
        opportunityId: String(editData.id),
        updateId: updateId,
        content: content
      }).unwrap();

      customToast.success("Update edited successfully");
      await refetchOpportunities();
    } catch (error: unknown) {
      console.error("Failed to edit update:", error);
      const err = error as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || "Failed to edit update");
    }
  };

  // ...

  const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
    if (!field.id) return;
    const clean = newName.trim();
    if (!clean || clean === field.displayName) return;
    try {
      await updateField({ fieldId: field.id, data: { displayName: clean } }).unwrap();
      await refetchOpportunities();
    } catch (e) {
      console.error('Failed to update field displayName', e);
    }
  };

  // ...

  const handleHideColumn = async (field: FieldDefinition) => {
    if (!field.id) return;
    try {
      await updateField({ fieldId: field.id, data: { isVisible: false } }).unwrap();
    } catch (e) {
      console.error('Failed to hide field', e);
    }
  };

  // ...

  const handleToggleColumnVisibility = async (field: FieldDefinition, visible: boolean) => {
    if (!field.id) return;
    try {
      await updateField({ fieldId: field.id, data: { isVisible: visible } }).unwrap();
    } catch (e) {
      console.error('Failed to toggle visibility', e);
    }
  };

  // ...

  const handleReorderColumns = async (orderedFieldKeys: string[]) => {
    try {
      const byKey = new Map(finalFields.map(f => [f.fieldKey, f] as const));
      const fieldOrders = orderedFieldKeys
        .map((k, idx) => byKey.get(k))
        .filter((f): f is FieldDefinition => !!f && !!f.id)
        .map((f, idx) => ({ fieldId: f.id!, displayOrder: idx + 1 }));
      if (fieldOrders.length > 0) {
        await reorderFields({ fieldOrders }).unwrap();
      }
    } catch (e) {
      console.error('Failed to reorder fields', e);
    }
  };

  // ...

  const patchOpportunityRowLocally = (
    opportunityId: string,
    patch: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)
  ) => {
    setCurrentOpportunitiesData((prev: unknown) => {
      const p = prev as { items?: unknown[] } | undefined;
      let items: unknown[] | null = null;
      if (p?.items && Array.isArray(p.items)) {
        items = [...p.items];
      } else if (initialOpsObj?.items && Array.isArray(initialOpsObj.items)) {
        items = [...(initialOpsObj.items as unknown[])];
      }
      if (!items) return prev;
      const idx = items.findIndex((r: unknown) => ((r as Record<string, unknown>)?.id ?? (r as Record<string, unknown>)?._id) === opportunityId);
      if (idx === -1) return prev;
      const before = items[idx] as Record<string, unknown>;
      const nextRow = typeof patch === 'function'
        ? (patch as (prev: Record<string, unknown>) => Record<string, unknown>)(before)
        : { ...before, ...(patch as Record<string, unknown>) };
      items[idx] = nextRow as unknown as Record<string, unknown>;
      return { ...((p as Record<string, unknown>) || {}), items } as unknown;
    });
  };

  // ...

  const optimisticCellUpdate = async (
    opportunityId: string,
    prevRow: Record<string, unknown>,
    localPatch: Record<string, unknown>,
    performUpdate: () => Promise<unknown>,
  ) => {
    patchOpportunityRowLocally(opportunityId, localPatch);
    try {
      await performUpdate();
    } catch (err) {
      patchOpportunityRowLocally(opportunityId, prevRow);
      throw err;
    }
  };

  // Dropdown CRUD handlers for OverviewTabContent & table menus
  const handleAddDropdownOption = async (fieldId: string, option: { displayName: string; color: string }) => {
    try {
      const base = option.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
      await addDropdownChoice({ fieldId, value: base, label: option.displayName, color: option.color, order: Date.now() }).unwrap();
      customToast.success('Dropdown option added');
      await refetchOpportunities();
    } catch (e: unknown) {
      console.error('Failed to add dropdown choice', e);
      const err = e as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || 'Failed to add dropdown option');
    }
  };

  const handleUpdateDropdownOption = async (fieldId: string, value: string, updates: { displayName?: string; color?: string }) => {
    try {
      const apiUpdates: Record<string, unknown> = {};
      if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
      if (typeof updates.color === 'string') apiUpdates.color = updates.color;
      if (Object.keys(apiUpdates).length === 0) return;
      await updateDropdownChoice({ fieldId, value, updates: apiUpdates }).unwrap();
      customToast.success('Dropdown option updated');
      await refetchOpportunities();
    } catch (e: unknown) {
      console.error('Failed to update dropdown choice', e);
      const err = e as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || 'Failed to update dropdown option');
    }
  };

  const handleReorderDropdownOptions = async (fieldId: string, orderedOptions: Array<{ fieldKey: string; displayName: string; color: string }>) => {
    try {
      const payload = orderedOptions.map((o, idx) => ({ value: o.fieldKey, order: idx + 1, label: o.displayName, color: o.color }));
      await reorderDropdownChoices({ fieldId, choices: payload }).unwrap();
      customToast.success('Dropdown options reordered');
      await refetchOpportunities();
    } catch (e: unknown) {
      console.error('Failed to reorder dropdown choices', e);
      const err = e as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || 'Failed to reorder dropdown options');
    }
  };

  const handleDeleteDropdownOption = async (fieldId: string, value: string) => {
    try {
      await deleteDropdownChoice({ fieldId, value }).unwrap();
      customToast.success('Dropdown option deleted');
      await refetchOpportunities();
    } catch (e: unknown) {
      console.error('Failed to delete dropdown choice', e);
      const err = e as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || 'Failed to delete dropdown option');
    }
  };

  // Modal helpers
  const getModalTitle = () => (isEditMode ? 'Edit Opportunity' : 'Add Opportunity');
  const shouldShowBackButton = activeView !== 'default';
  const handleBackToDefault = () => setActiveView('default');

  const handleAddOpportunity = () => {
    setIsEditMode(false);
    setEditData({});
    setActiveTab('overview');
    setActiveView('default');
    setIsFormModalOpen(true);
  };

  const handleEditOpportunity = (oppData: Record<string, unknown>) => {
    // Process the data before setting it for editing
    const processedData = { ...oppData };

    // Handle updates field - extract latest content and remove HTML tags
    if (processedData.updates && Array.isArray(processedData.updates)) {
      const updatesArray = processedData.updates as any[];
      if (updatesArray.length > 0) {
        // Get the latest update (first item in array)
        const latestUpdate = updatesArray[0];
        // Extract the content and remove HTML tags
        const rawContent = latestUpdate.content || latestUpdate.updateNotes || '';
        // Remove HTML tags
        const cleanContent = rawContent.replace(/<[^>]*>/g, '');
        processedData.updates = cleanContent;
      } else {
        processedData.updates = '';
      }
    }

    setIsEditMode(true);
    setEditData(processedData);
    setActiveTab('overview');
    setActiveView('default');
    setIsFormModalOpen(true);
  };

  const handleRowClick = (row: Record<string, unknown>) => handleEditOpportunity(row);

  const handleOpenDealsModal = (row: Record<string, unknown>) => {
    const id = (row as Record<string, unknown>)?.id ?? (row as Record<string, unknown>)?._id;
    if (!id) return;
    setSelectedOpportunityId(String(id));
    setDealsModalOpen(true);
  };

  const getTabs = () => {
    const baseTabs = [
      {
        key: 'overview',
        label: 'Overview',
        icon: search,
        component: OverviewTabContent,
        componentProps: {
          formFields,
          onSubmit: handleFormSubmit,
          isEditMode,
          initialValues: editData || {},
          className: 'h-full',
          isLoading: fieldsLoading,
          activitiesData: activitiesData,
          onAddActivity: (t: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => { setActivityModalType(t); setIsActivityModalOpen(true); },
          activeView: activeView,
          onViewChange: setActiveView,
          onAddDropdownOption: handleAddDropdownOption,
          onUpdateDropdownOption: handleUpdateDropdownOption,
          onReorderDropdownOptions: handleReorderDropdownOptions,
          onDeleteDropdownOption: handleDeleteDropdownOption,
          dealData: editData || {},
          suiteApp: 'biz-accelator',
          relatedItem: editData?.id,
        },
        disabled: false,
      },
      {
        key: 'updates',
        label: 'Updates',
        icon: home,
        component: UpdatesTabContent,
        componentProps: {
          className: 'h-full',
          opportunityId: isEditMode && editData?.id ? editData.id : undefined,
          updatesData: updatesData || [],
          isLoading: updatesLoading,
          onCreateUpdate: handleCreateOpportunityUpdate,
          onEditUpdate: handleEditOpportunityUpdate,
        },
        disabled: !isEditMode || activeView !== 'default',
      },
      {
        key: 'files/links',
        label: 'Files / Links',
        icon: update,
        component: FilesLinksTabContent,
        componentProps: {
          className: 'h-full',
        },
        disabled: !isEditMode || activeView !== 'default',
      },
    ];

    if (activeView !== 'default') {
      return baseTabs.filter(tab => !tab.disabled);
    }
    return baseTabs;
  };

  // Header buttons
  const opportunityTitleBtn = [
    { name: 'Export', icon: <FiPlus />, onClick: () => setShowExportModal(true) },
    { name: 'Add Opportunity', icon: <FiPlus />, onClick: handleAddOpportunity },
  ];

  // Main return UI
  return (
    <ProtectedRoute>
      <div>
        <div className="w-screen h-screen overflow-hidden flex" style={{ backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg }}>
          <Sidebar />
          <div className="flex-1 flex flex-col relative min-w-0 w-full">
            <Header />
            <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
              <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                <BreadcrumbsNavBar customItems={[{ label: 'SM', href: '/dashboard' }, { label: 'Opportunities', href: '/dashboard/biz-accelerator/opportunities' }]} />
              </div>
              <div className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit' style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}>
                <Title projectTitleObj={opportunityTitleBtn} name="Opportunity List" />
              </div>
              <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end items-center gap-[6px] h-fit relative' style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}>
                <SearchBoard
                  fieldDefinitions={finalFields.map(f => ({ ...f, isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : true }))}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedColumns={selectedColumns}
                  onColumnsChange={setSelectedColumns}
                  placeholder="Search this board"
                />
                <PersonButton
                  onClick={() => setIsPersonFilterOpen(!isPersonFilterOpen)}
                  hasActiveFilter={selectedPeopleIds.length > 0}
                />
                <PersonFilterModal
                  isOpen={isPersonFilterOpen}
                  onClose={() => setIsPersonFilterOpen(false)}
                  people={peopleForFilter}
                  selectedPeople={selectedPeopleIds}
                  onApply={handleApplyPersonFilter}
                  filterFields={availablePersonFilterFields}
                  selectedFilterField={personFilterField}
                  onFilterFieldChange={handlePersonFilterFieldChange}
                />
                <AddFiltersButton onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} className={activeFilters.some(f => f.value.length > 0) ? 'bg-red-100 border-gray-400' : ''} />
                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={() => setIsFilterDropdownOpen(false)}
                  fields={finalFields.map(f => ({ value: f.fieldKey, label: f.displayName, fieldType: f.fieldType, isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : false }))}
                  currentFilters={activeFilters}
                  onApplyFilters={(filters) => { setActiveFilters(filters); setIsFilterDropdownOpen(false); setSavedFilterId(null); }}
                  hasActiveFilters={activeFilters.some(f => { const noValueConditions = ['IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY', 'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE']; if (noValueConditions.includes(f.condition)) return true; return f.value.length > 0; })}
                  savedFilters={savedFiltersData || []}
                  onLoadSavedFilter={handleLoadSavedFilter}
                  onSaveFilter={async (filterName, filters) => {
                    try {
                      const filterGroup = transformFiltersToBackendFormat(filters);
                      if (!filterGroup) { customToast.error('Please add at least one filter condition'); return; }
                      await saveFilter({ name: filterName, entityType: 'opportunity', filterGroup, isDefault: false, isShared: false }).unwrap();
                      customToast.success('Filter saved successfully');
                    } catch (error) {
                      console.error('Failed to save filter:', error);
                      customToast.error('Failed to save filter');
                    }
                  }}
                  onDeleteSavedFilter={async (filterId) => {
                    try {
                      await deleteFilter(filterId).unwrap();
                      customToast.success('Filter deleted successfully');
                      if (savedFilterId === filterId) { setSavedFilterId(null); setActiveFilters([]); }
                    } catch (error) {
                      console.error('Failed to delete filter:', error);
                      customToast.error('Failed to delete filter');
                    }
                  }}
                />
              </div>

              <div className='mx-5 mt-11 py-2 px-2 rounded flex items-center justify-between h-fit min-w-0 overflow-x-auto'>
                <Bar
                  total={currentOpsObj?.pagination?.total ?? initialOpsObj?.pagination?.total ?? 0}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setCurrentPage(1); setPageSize(size); }}
                  onToggleColumns={() => setShowLessColumns((s) => !s)}
                  showLessColumns={showLessColumns}
                  viewToggle={<ViewModeToggle mode={viewMode} onChange={setViewMode} size={{ width: 105, height: 30 }} />}
                />
              </div>

              <div className={[
                'flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 w-full min-w-0 min-h-0',
                viewMode === 'kanban' ? 'overflow-hidden' : 'overflow-auto'
              ].join(' ')}>
                {loading ? (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                    <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                  </div>
                ) : viewMode === 'kanban' ? (
                  <KanbanBoard
                    className="h-full"
                    items={rows as Record<string, any>[]}
                    fieldDefinitions={finalFields}
                    columnKey={statusField?.fieldKey || 'stage'}
                    columns={kanbanColumns.map(c => ({ id: c.id, title: c.title, value: c.value, color: c.color }))}
                    rowKey="id"
                    addColumnLabel="Add a New Status"
                    onAddColumn={async ({ name, color }) => {
                      try {
                        const fieldId = statusField?.id as string | undefined;
                        if (!fieldId) return;
                        const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'status';
                        let val = base;
                        const existing = new Set(kanbanColumns.map((c) => String(c.value)));
                        let i = 1;
                        while (existing.has(val)) { val = `${base}_${i++}`; }
                        await addDropdownChoice({ fieldId, value: val, label: name.trim(), color }).unwrap();
                        customToast.success('Status added');
                        void refetchOpportunities();
                        return { id: val, title: name.trim(), value: val, color };
                      } catch (e) {
                        customToast.error('Failed to add status');
                      }
                    }}
                    renderCard={(row) => <OppKanbanCard row={row as Record<string, unknown>} />}
                    onItemMove={async ({ item, destColumnId }) => {
                      if (!statusField) return;
                      const oppId = String((item as any)?.id ?? (item as any)?._id ?? '');
                      if (!oppId) return;
                      const sel = kanbanColumns.find((c) => String(c.id) === String(destColumnId));
                      if (!sel) return;
                      const current = (item as any)?.[statusField.fieldKey];
                      const objectPayload = { value: sel.value, label: sel.title, color: sel.color } as unknown;
                      const stringPayload = sel.value as unknown;
                      const prevRow = rows.find(r => String((r as any)?.id ?? (r as any)?._id) === oppId) as Record<string, unknown> | undefined;
                      const doUpdate = async (payload: unknown) => {
                        if (prevRow) {
                          await optimisticCellUpdate(
                            oppId,
                            prevRow,
                            { [statusField.fieldKey]: payload },
                            () => updateOpportunity({ opportunityId: oppId, data: makeUpdateBody(statusField, prevRow, payload) }).unwrap()
                          );
                        } else {
                          patchOpportunityRowLocally(oppId, { [statusField.fieldKey]: payload });
                          await updateOpportunity({ opportunityId: oppId, data: { [statusField.fieldKey]: payload } }).unwrap();
                        }
                      };
                      try {
                        if (current && typeof current === 'object' && 'value' in current) {
                          await doUpdate(objectPayload);
                        } else {
                          await doUpdate(stringPayload);
                        }
                      } catch (_e) {
                        try {
                          if (current && typeof current === 'object' && 'value' in current) {
                            await doUpdate(stringPayload);
                          } else {
                            await doUpdate(objectPayload);
                          }
                        } catch (e2) {
                          console.error('Failed to update status via Kanban', e2);
                        }
                      }
                    }}
                    onColumnOrderChange={async (ordered) => {
                      try {
                        if (!statusField?.id) return;
                        const choices = ordered.map((c, idx) => ({ value: String(c.value), order: idx + 1, label: c.title, color: c.color }));
                        await reorderDropdownChoices({ fieldId: statusField.id as string, choices }).unwrap();
                      } catch (e) {
                        console.error('Failed to reorder statuses', e);
                      }
                    }}
                  />
                ) : (
                  <FinalTable
                    data={rows}
                    fieldDefinitions={visibleFields}
                    rowKey="id"
                    stickyHeader
                    appearance="figma"
                    frozenColumnKeys={['name']}
                    sortConfig={sort}
                    onSortChange={(cfg) => setSort(cfg)}
                    loading={false}
                    columnWidths={columnWidths}
                    onColumnResize={(key, width) => setColumnWidths((prev) => ({ ...prev, [key]: width }))}
                    onRenameColumn={handleRenameColumn}
                    onHideColumn={handleHideColumn}
                    onToggleColumnVisibility={handleToggleColumnVisibility}
                    onColumnOrderChange={handleReorderColumns}
                    // onRowClick={handleRowClick}
                    getCellRenderer={({ field, row, value }: { field: FieldDefinition; row: Record<string, unknown>; value: unknown }) => {
                      const opportunityId = String(row?.id ?? row?._id ?? '');

                      if (field.fieldKey === 'action') {
                        return (
                          <div className="flex items-center gap-2 h-6 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOpportunity(row);
                              }}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              className="w-6 h-6 p-0 rounded-full bg-black flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!opportunityId) return;
                                const name = String(row?.name || row?.opportunityName || row?.recordId || 'Opportunity');
                                setToDelete({ id: opportunityId, name });
                                setIsDeleteOpen(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6M14 11v6"></path>
                                <path d="M9 6V4h6v2"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              title="More"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <span className="text-white text-sm leading-none">⋯</span>
                            </button>
                          </div>
                        );
                      }

                      {
                        const key = String(field.fieldKey || '').toLowerCase();

                        const name = String((field.displayName || '')).toLowerCase();
                        if (key === 'description' || key.includes('description') || name.includes('description')) {
                          const text = typeof value === 'string' ? value : (value ?? '');
                          const raw = String(text ?? '');
                          const show = raw.trim().length > 0;
                          const label = show ? raw : 'Add description';
                          return (
                            <div className="flex justify-start items-center w-full">
                              <span
                                className={show ? "truncate block max-w-[280px] cursor-pointer" : "truncate block max-w-[280px] cursor-pointer text-gray-400 italic"}
                                title={String(raw || '')}
                                onClickCapture={(e) => {
                                  e.stopPropagation();
                                  setDescriptionRow(row);
                                  setDescriptionDraft(String(raw || ''));
                                  setIsDescriptionModalOpen(true);
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        }
                      }

                      // Created By field
                      if (field.fieldKey === 'createdBy' || field.fieldKey === 'createdById' || field.fieldKey === 'createdByName') {
                        const createdByName = row?.createdByName as string | undefined;
                        const createdByObj = row?.createdBy as Record<string, unknown> | undefined;
                        const fullName = typeof createdByName === 'string' && createdByName.trim().length > 0
                          ? createdByName
                          : createdByObj
                            ? [createdByObj.firstName, createdByObj.lastName].filter(Boolean).join(' ').trim()
                            : '';

                        return (
                          <div className="flex items-center justify-center gap-2">
                            <img
                              src="/Person.svg"
                              alt="Person"
                              className="w-4 h-4 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="truncate" title={fullName}>{fullName || '-'}</span>
                          </div>
                        );
                      }

                      // Files/Links
                      if (field.fieldKey === 'filesLinks') {
                        return (
                          <div className="flex items-center justify-center h-4 cursor-pointer" onClick={(e) => {
                            e.stopPropagation();
                            setEditData(row);
                            setIsEditMode(true);
                            setActiveTab('files/links');
                            setIsFormModalOpen(true);
                          }}>
                            <ViewIcon width="57" height="16" />
                          </div>
                        );
                      }

                      // Deals
                      if (field.fieldKey === 'createDeal') {
                        return (
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              className="px-3 h-5 text-xs font-medium rounded transition-colors border"
                              style={{ borderColor: '#C81C1F', color: '#C81C1F', backgroundColor: 'transparent' }}
                              onClick={(e) => { e.stopPropagation(); handleOpenDealsModal(row); }}
                            >
                              Create Deal
                            </button>
                          </div>
                        );
                      }
                      if (field.fieldKey === 'deals') {
                        return (
                          <button type="button" className="px-2 py-1 text-xs rounded border" onClick={(e) => { e.stopPropagation(); handleOpenDealsModal(row); }}>View</button>
                        );
                      }

                      // Name cell
                      if (String(field.fieldKey).toLowerCase() === 'name' || String(field.displayName).toLowerCase() === 'name') {
                        const display = (row?.name as string) || (row?.opportunityName as string) || '-';
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={display}
                            onCommit={async (next: string) => {
                              if (!opportunityId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: next }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap());
                              } catch (e) {
                                console.error('Failed to update name', e);
                              }
                            }}
                            onNotesClick={() => {
                              handleEditOpportunity(row); // Add this line to open the edit form
                            }}
                          />
                        );
                      }

                      // Tags
                      if (field.fieldKey === 'tags' || String(field.fieldType).toUpperCase() === 'TAGS') {
                        return (
                          <EditableTagsCell
                            tags={value}
                            onCommit={async (newTags) => {
                              if (!opportunityId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, newTags);
                                await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: newTags }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap());
                                customToast.success('Tags updated');
                              } catch (e) {
                                console.error('Failed to update tags', e);
                                customToast.error('Failed to update tags');
                              }
                            }}
                          />
                        );
                      }

                      // Dropdown
                      if (field.fieldType === 'DROPDOWN' || field.fieldType === 'CREATABLE_DROPDOWN') {
                        const choices = (field.options?.choices ?? []) as unknown[];
                        const options = choices.map((c) => {
                          const choice = c as { value?: unknown; fieldKey?: unknown; label?: string; displayName?: string; color?: string };
                          return {
                            fieldKey: String(choice.value ?? choice.fieldKey ?? c),
                            displayName: choice.label ?? choice.displayName ?? String(c),
                            color: choice.color ?? '#999',
                          };
                        });
                        let currentKey = '';
                        if (value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) currentKey = String((value as { value: unknown }).value);
                        else {
                          const raw = String(value ?? '');
                          const matched = options.find((o) => o.fieldKey === raw) || options.find((o) => o.displayName === raw);
                          currentKey = matched ? matched.fieldKey : raw;
                        }
                        const fieldId = field.id;
                        return (
                          <StatusDropdown
                            currentStatus={currentKey}
                            options={options}
                            placeholder={`Select ${field.displayName}`}
                            onStatusChange={async (newKey: string) => {
                              if (!opportunityId) return; const prevSnap = row;
                              try {
                                const sel = options.find((o) => o.fieldKey === newKey);
                                const payload = sel ? { value: sel.fieldKey, label: sel.displayName, color: sel.color } : newKey;
                                const updateBody = makeUpdateBody(field, row, payload);
                                await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: payload }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap());
                                customToast.success('Status updated');
                              } catch (e) {
                                console.error('Failed to update status', e);
                                customToast.error('Failed to update status');
                              }
                            }}
                            onUpdateOption={async (choiceKey, upd) => { if (!fieldId) return; await handleUpdateDropdownOption(fieldId, choiceKey, upd); }}
                            onAddOption={async (opt) => { if (!fieldId) return; await handleAddDropdownOption(fieldId, opt); }}
                            onDeleteOption={async (choiceKey) => { if (!fieldId) return; await handleDeleteDropdownOption(fieldId, choiceKey); }}
                            onReorderOptions={async (ordered) => { if (!fieldId) return; await handleReorderDropdownOptions(fieldId, ordered as Array<{ fieldKey: string; displayName: string; color: string }>); }}
                            disabled={false}
                            className="min-w-[140px]"
                          />
                        );
                      }

                      if (field.fieldType === 'PHONE') {
                        return (
                          <PhoneValue field={field} value={value} onCommit={async (next: string) => { if (!opportunityId) return; const prevSnap = row; try { const updateBody = makeUpdateBody(field, row, next); await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: next }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap()); } catch (e) { console.error('Failed to update phone', e); } }} />
                        );
                      }
                      if (field.fieldType === 'EMAIL') {
                        return (
                          <EmailValue field={field} value={value} onCommit={async (next: string) => { if (!opportunityId) return; const prevSnap = row; try { const updateBody = makeUpdateBody(field, row, next); await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: next }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap()); } catch (e) { console.error('Failed to update email', e); } }} />
                        );
                      }
                      if (field.fieldType === 'URL') {
                        return (
                          <UrlValue field={field} value={value} onCommit={async (next: string) => { if (!opportunityId) return; const prevSnap = row; try { const updateBody = makeUpdateBody(field, row, next); await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: next }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap()); } catch (e) { console.error('Failed to update url', e); } }} />
                        );
                      }
                      if (field.fieldType === 'DATE') {
                        const v = (() => {
                          if (!value) return '';
                          if (typeof value === 'string') return value;
                          const d = value instanceof Date ? value : new Date(String(value));
                          return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
                        })();
                        return (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DatePicker
                              value={v}
                              onChange={async (newDate) => {
                                if (!opportunityId) return;
                                const prevSnap = row;
                                try {
                                  await optimisticCellUpdate(
                                    opportunityId,
                                    prevSnap,
                                    { [field.fieldKey]: newDate },
                                    () => updateOpportunity({ opportunityId: opportunityId, data: makeUpdateBody(field, row, newDate) }).unwrap()
                                  );
                                } catch (e) {
                                  console.error('Failed to update date', e);
                                }
                              }}
                            />
                          </div>
                        );
                      }
                      // Text fallback
                      return (
                        <TextValue field={field} value={value} onCommit={async (next: string) => { if (!opportunityId) return; const prevSnap = row; try { const updateBody = makeUpdateBody(field, row, next); await optimisticCellUpdate(opportunityId, prevSnap, { [field.fieldKey]: next }, () => updateOpportunity({ opportunityId: opportunityId, data: updateBody }).unwrap()); } catch (e) { console.error('Failed to update text', e); } }} />
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <FormModal
          isOpen={isFormModalOpen}
          onClose={() => { if (activeView === 'default') setIsFormModalOpen(false); else setActiveView('default'); }}
          title={getModalTitle()}
          size="xl"
          disabled={!isEditMode && activeView === 'default'}
          onBack={shouldShowBackButton ? handleBackToDefault : undefined}
          showBackButton={shouldShowBackButton}
        >
          <TabbedFormLayout tabs={getTabs()} activeTab={activeView !== 'default' ? 'overview' : activeTab} onTabChange={setActiveTab} className="h-[80vh]" />
        </FormModal>

        {dealsModalOpen && selectedOpportunityId && !!selectedOppData && (
          <OpportunityDealsModal
            opportunityId={selectedOpportunityId}
            opportunityName={(selectedOppData as { name?: string; opportunityName?: string })?.name || (selectedOppData as { opportunityName?: string })?.opportunityName || 'Unnamed Opportunity'}
            onClose={() => { setDealsModalOpen(false); setSelectedOpportunityId(null); }}
          />
        )}

        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} entityLabel="opportunities" fields={finalFields} rows={rows} fetchAll={fetchAllForExport} />

        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => { if (!isDeleting) { setIsDeleteOpen(false); setToDelete(null); } }}
          onConfirm={async () => {
            if (!toDelete?.id) return;
            try {
              setIsDeleting(true);
              await deleteOpportunity(toDelete.id).unwrap();
              customToast.success('Opportunity deleted');
              setIsDeleteOpen(false);
              setToDelete(null);
              await refetchOpportunities();
            } catch (err) {
              const e = err as { data?: { message?: string } };
              customToast.error(e?.data?.message || 'Failed to delete opportunity');
            } finally {
              setIsDeleting(false);
            }
          }}
          title={`Are you sure to delete`}
          message={''}
          itemName={`${toDelete?.name || ''} Opportunity`}
          isDeleting={isDeleting}
        />

        <DescriptionModal
          open={isDescriptionModalOpen}
          initialText={descriptionDraft}
          title="Update Description"
          onClose={() => setIsDescriptionModalOpen(false)}
          onSave={async (text) => {
            try {
              const theRow = descriptionRow;

              // Safe ID extraction with proper typing
              const id = String(
                (theRow as { id?: unknown })?.id ??
                (theRow as { _id?: unknown })?._id ??
                ''
              );

              if (!id) return;

              const fieldDef = (finalFields || []).find((f) =>
                String(f.fieldKey).toLowerCase() === 'description'
              );

              const prevSnap = (theRow || {}) as Record<string, unknown>;

              // Properly typed body creation
              const body = fieldDef
                ? makeUpdateBody(fieldDef, prevSnap, text)
                : { description: text };

              await optimisticCellUpdate(
                id,
                prevSnap,
                { description: text },
                () => updateOpportunity({
                  opportunityId: id,
                  data: body as Record<string, unknown>
                }).unwrap()
              );

              setIsDescriptionModalOpen(false);
              customToast.success('Description updated');
            } catch (e) {
              customToast.error('Failed to update description');
            }
          }}
        />

        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          type={activityModalType}
          relatedEntity={
            editData?.id && isOpportunityData(editData)
              ? {
                id: String(editData.id),
                name: String(editData.name ?? editData.opportunityName ?? 'Opportunity'),
                type: 'opportunity' as const
              }
              : undefined
          }
          onCreateActivity={handleCreateActivity}
        />
      </div>
    </ProtectedRoute>
  );
};

export default OpportunitiesPage;