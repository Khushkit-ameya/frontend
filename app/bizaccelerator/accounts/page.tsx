"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/common/Sidebar/Sidebar';
import Header from '../../../components/common/Header';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FinalTable from '../../../components/common/CommonTable';
import { useTheme } from '../../../store/hooks';
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import Bar from "@/components/Project/PaginationBar";
import SearchBoard from "@/components/common/SearchBoard";
import FilterDropdown, { FilterCondition } from "@/components/common/FilterDropdown";
import PersonButton from '@/components/ui buttons/PersonButton';
import AddFiltersButton from '@/components/ui buttons/AddFiltersButton';
import ExportModal from '@/components/common/ExportModal';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import DescriptionModal from '../../../components/common/DescriptionModal';
import { TableTagsRenderer } from '@/components/dropdowns/TableTagsRenderer';
import { Popover, TextField, Button } from '@mui/material';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { customToast } from '../../../utils/toast';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';

// Saved filters API (shared)
import { useGetSavedFiltersQuery, useSaveFilterMutation, useDeleteFilterMutation } from '@/store/api_query/BizAccelerator/filter.api';
import type { FilterGroup, FilterRule } from '@/store/api_query/BizAccelerator/filter.api';

// Field definitions (shared)
import { useGetFieldDefinitionsByEntityQuery, useAddDropdownChoiceMutation, useUpdateDropdownChoiceMutation, useReorderDropdownChoicesMutation, useDeleteDropdownChoiceMutation } from '../../../store/api_query/field_definitions.api';

// Company users
import { useGetCompanyUsersQuery, useGetCurrentUserQuery } from '@/store/api_query/auth.api';

// Accounts API
import {
  useGetAccountFieldsQuery,
  useGetAccountsQuery,
  useFilterAccountsMutation,
  useUpdateAccountFieldMutation,
  useReorderAccountFieldsMutation,
  useUpdateAccountMutation,
  useGetAccountUpdatesQuery,
  useAddAccountUpdateMutation,
  useEditAccountUpdateMutation,
  useDeleteAccountUpdateMutation,
  useGetAccountActivitiesQuery,
} from '../../../store/api_query/BizAcceleratorAccounts.api';

import StatusDropdown from '../../../components/dropdowns/StatusDropdown';
import EmailValue from '../../../components/common/FieldType/components/EmailValue';
import PhoneValue from '../../../components/common/FieldType/components/PhoneValue';
import UrlValue from '../../../components/common/FieldType/components/UrlValue';
import TextValue from '../../../components/common/FieldType/components/TextValue';
import DatePicker from '../../../components/common/DatePicker';

// Form Modal Components
import { FormModal } from '@/components/BizAccelerator/FormModal/FormModal';
import { TabbedFormLayout } from '@/components/BizAccelerator/TabbedFormLayout/TabbedFormLayout';
import { OverviewTabContent } from '@/components/BizAccelerator/TabContents/OverviewTabContent';
import { UpdatesTabContent } from '@/components/BizAccelerator/TabContents/UpdatesTabContent';
import { FilesLinksTabContent } from '@/components/BizAccelerator/TabContents/FilesLinksTabContent';
import { getDynamicFieldConfig } from '@/components/common/forms/DynamicForm/dynamicFieldConfig';
import { ActivityModal } from '@/components/BizAccelerator/TabContents/ActivityModal';
import { useGetActivitiesByEntityQuery, useCreateActivityMutation } from '@/store/api_query/BizAccelerator/activities.api';

// Icons for tabs
import search from "@/public/icons/search 1.svg";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";
import ViewIcon from '../../../components/ui buttons/ViewButton';
import { Edit } from 'lucide-react';

type EditableTagsCellProps = { tags: unknown; onCommit: (newTags: string[]) => Promise<void> };
const EditableTagsCell: React.FC<EditableTagsCellProps> = ({ tags, onCommit }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [input, setInput] = React.useState('');
  const normalized = React.useMemo(() => {
    if (!tags) return [] as string[];
    const toArray = (v: unknown) => Array.isArray(v) ? v : typeof v === 'object' ? [v] : typeof v === 'string' ? (() => { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch { return [v]; } })() : [];
    const arr = toArray(tags);
    return (arr as unknown[]).map((t) => {
      if (t && typeof t === 'object') {
        const obj = t as Record<string, unknown>;
        return (obj.label as string) || (obj.value as string) || '';
      }
      return String(t ?? '');
    }).filter(Boolean) as string[];
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

const AccountsPage: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();

  // Sort and pagination
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showLessColumns, setShowLessColumns] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilterId, setSavedFilterId] = useState<string | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  type GenericRow = Record<string, unknown> & { id?: string | number; _id?: string | number; createdByName?: string; createdBy?: { firstName?: string; lastName?: string } | null; updates?: unknown };
  const [descriptionRow, setDescriptionRow] = useState<GenericRow | null>(null);

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeView, setActiveView] = useState<"default" | "email" | "signature">("default");
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'meeting' | 'call' | 'notes' | 'todo' | 'email'>('call');
  const [createActivityMutation] = useCreateActivityMutation();

  // Saved filters
  const { data: savedFiltersData } = useGetSavedFiltersQuery('account');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();

  // Person filter
  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  // Queries
  const { data: allFieldsFull, refetch: refetchFieldDefinitions } = useGetFieldDefinitionsByEntityQuery('account');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetAccountFieldsQuery();
  const { data: initialAccountsData, isLoading: initialAccountsLoading } = useGetAccountsQuery({
    page: currentPage,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
  });
  const [filterAccounts, { isLoading: accountsLoading }] = useFilterAccountsMutation();
  const [currentAccountsData, setCurrentAccountsData] = useState<unknown>(null);

  const [updateField] = useUpdateAccountFieldMutation();
  const [reorderFields] = useReorderAccountFieldsMutation();
  const [updateAccount] = useUpdateAccountMutation();
  const [addAccountUpdate] = useAddAccountUpdateMutation();
  const [editAccountUpdate] = useEditAccountUpdateMutation();
  const [deleteAccountUpdate] = useDeleteAccountUpdateMutation();

  const { data: companyUsersData } = useGetCompanyUsersQuery({});

  // Activities and Updates for the form modal
  const { data: activitiesResponse } = useGetActivitiesByEntityQuery(
    { entityType: 'account', entityId: String(editData?.id ?? '') },
    { skip: !isFormModalOpen || !editData?.id }
  );
  const activitiesData = ((activitiesResponse as { data?: { items?: unknown[] }, items?: unknown[] } | undefined)?.data?.items) ?? ((activitiesResponse as { items?: unknown[] } | undefined)?.items) ?? [];

  const { data: updatesData, isLoading: updatesLoading } = useGetAccountUpdatesQuery(
    String(editData?.id ?? ''),
    { skip: !isFormModalOpen || !editData?.id }
  );
  console.log("udpatessssssssssssssssssssssssssssssssssssssssssssssssss", updatesData)

  // Normalize data shapes safely for TS
  const initialAccObj = initialAccountsData as { items?: GenericRow[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentAccObj = currentAccountsData as { items?: GenericRow[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const fieldsRawArray = useMemo(() => {
    const fr = fieldsRaw as unknown;
    if (Array.isArray(fr)) return fr as unknown[];
    const items = (fr as { items?: unknown[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  }, [fieldsRaw]);

  // Dropdown CRUD mutations (for StatusDropdown option edits)
  const [addDropdownChoice] = useAddDropdownChoiceMutation();
  const [updateDropdownChoice] = useUpdateDropdownChoiceMutation();
  const [reorderDropdownChoices] = useReorderDropdownChoicesMutation();
  const [deleteDropdownChoice] = useDeleteDropdownChoiceMutation();

  // Field definitions for table
  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    let fields: FieldDefinition[] = [];
    if (fromShared.length > 0) {
      fields = mapBackendListToFrontend(fromShared as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    } else {
      const fromApi = fieldsRawArray as unknown[];
      const fromData = ((currentAccObj?.fieldDefinitions ?? initialAccObj?.fieldDefinitions) ?? []) as unknown[];
      const mergedByKey = new Map<string, Record<string, unknown>>();
      [...fromApi, ...fromData].forEach((f: unknown) => {
        if (!f) return;
        const fk = String((f as { fieldKey?: unknown }).fieldKey ?? '');
        if (!fk) return;
        mergedByKey.set(fk, { ...(mergedByKey.get(fk) || {}), ...(f as Record<string, unknown>) });
      });
      fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    }
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
  }, [allFieldsFull, fieldsRawArray, currentAccObj?.fieldDefinitions, initialAccObj?.fieldDefinitions]);

  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    return [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
  }, [finalFields, showLessColumns]);

  // Ensure default selected columns for SearchBoard once fields are ready
  const autoSelectedOnceRef = useRef(false);
  useEffect(() => {
    if (!autoSelectedOnceRef.current && finalFields.length > 0 && selectedColumns.length === 0) {
      const allKeys = finalFields.map(f => f.fieldKey);
      setSelectedColumns(allKeys);
      autoSelectedOnceRef.current = true;
    }
  }, [finalFields, selectedColumns.length]);

  // Search transformation
  const buildSearchFilterRules = useMemo<FilterGroup | null>(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;
    const rules: FilterRule[] = selectedColumns.map((columnKey) => ({
      fieldKey: columnKey,
      condition: 'CONTAINS',
      value: searchQuery,
    }));
    return { logic: 'OR', rules };
  }, [searchQuery, selectedColumns]);

  // Transform saved filter from backend into FilterDropdown format (for loading saved filters)
  const transformBackendFiltersToFrontend = (filterGroup: unknown): FilterCondition[] => {
    const group = filterGroup as { logic?: string; rules?: unknown[] } | undefined;
    if (!group || !Array.isArray(group.rules)) return [];

    const logic = (group.logic || 'AND') as string;
    const acc: FilterCondition[] = [];
    group.rules.forEach((rule: unknown, index: number) => {
      const rGroup = rule as { logic?: string; rules?: unknown[] } | undefined;
      if (rGroup?.logic && rGroup.rules) {
        acc.push(...transformBackendFiltersToFrontend(rGroup));
        return;
      }

      const r = rule as { fieldKey?: string; condition?: string; values?: unknown[]; value?: unknown };
      const raw = r.values || (r.value !== undefined ? [r.value] : []);
      const value = (Array.isArray(raw) ? raw : [raw]).map(v => String(v ?? ''));

      acc.push({
        id: `filter-${Date.now()}-${index}`,
        field: (r.fieldKey as string) || '',
        condition: r.condition || 'CONTAINS',
        value,
        logicalOperator: logic as 'AND' | 'OR'
      });
    });
    return acc;
  };

  // Transform FilterDropdown filters into backend format
  const transformFiltersToBackendFormat = (filters: FilterCondition[]): FilterGroup | null => {
    if (filters.length === 0) return null;

    const noValueConditions = [
      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
      'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK',
      'IS_THIS_MONTH', 'IS_LAST_MONTH', 'IS_NEXT_MONTH',
      'IS_TRUE', 'IS_FALSE'
    ];
    const orMultiValueConditions = [
      'CONTAINS', 'DOES_NOT_CONTAIN', 'IS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'IN'
    ];
    const andMultiValueConditions = [
      'IS_NOT', 'NOT_EQUALS', 'DOES_NOT_CONTAIN', 'NOT_IN'
    ];

    const transformedRules: Array<FilterRule | FilterGroup> = [];

    filters.forEach(filter => {
      if (noValueConditions.includes(filter.condition)) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: '',
        });
        return;
      }

      if (!filter.value || filter.value.length === 0) {
        return;
      }

      if (filter.condition === 'DATE_BETWEEN') {
        const [from, to] = filter.value;
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          values: [from, to],
          value: [from, to].filter(Boolean).join(','),
        });
        return;
      }

      if (filter.condition === 'BETWEEN') {
        const [min, max] = filter.value;
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          values: [min, max],
          value: [min, max].filter(Boolean).join(','),
        });
        return;
      }

      if (['IN', 'NOT_IN'].includes(filter.condition)) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          values: filter.value,
          value: filter.value.join(','),
        });
        return;
      }

      if (filter.value.length === 1) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0],
        });
        return;
      }

      if (filter.value.length > 1) {
        if (orMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map(val => ({
            fieldKey: filter.field,
            condition: filter.condition,
            value: val,
          }));
          transformedRules.push({ logic: 'OR', rules: nestedRules });
          return;
        }

        if (andMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map(val => ({
            fieldKey: filter.field,
            condition: filter.condition,
            value: val,
          }));
          transformedRules.push({ logic: 'AND', rules: nestedRules });
          return;
        }

        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0],
        });
      }
    });

    if (transformedRules.length === 0) return null;

    const logic = (filters[0]?.logicalOperator || 'AND') as 'AND' | 'OR';
    return { logic, rules: transformedRules };
  };

  // Advanced filters transformation (FilterDropdown -> backend format)
  const buildAdvancedFilterRules = useMemo<FilterGroup | null>(() => {
    const noValueConditions = [
      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
      'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK',
      'IS_THIS_MONTH', 'IS_LAST_MONTH', 'IS_NEXT_MONTH',
      'IS_TRUE', 'IS_FALSE'
    ];
    const valid = activeFilters.filter(f => {
      if (noValueConditions.includes(f.condition)) return true;
      return f.value && f.value.length > 0;
    });
    if (valid.length === 0) return null;
    return transformFiltersToBackendFormat(valid);
  }, [activeFilters]);

  // Person filter config
  const availablePersonFilterFields = useMemo(() => {
    return ['assignedTo', 'createdBy'] as Array<'assignedTo' | 'createdBy'>;
  }, []);

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

  const buildPersonFilterRules = useMemo<FilterGroup | FilterRule | null>(() => {
    if (selectedPeopleIds.length === 0) return null;

    let fieldKeys: string[] = [];
    if (personFilterField === 'assignedTo') {
      const candidates = ['assignedTo', 'assignTo', 'assignedToId', 'ownerId', 'owner', 'ownerName'];
      fieldKeys = finalFields
        .filter(f => candidates.includes(f.fieldKey))
        .map(f => f.fieldKey);
      if (fieldKeys.length === 0) fieldKeys = ['assignedTo'];
    } else {
      const possibleFields = ['createdBy', 'createdByName', 'createdById', 'creator', 'creatorId'];
      fieldKeys = finalFields
        .filter(f => possibleFields.includes(f.fieldKey))
        .map(f => f.fieldKey);
      if (fieldKeys.length === 0) fieldKeys = ['createdBy'];
    }

    const personRules: Array<FilterGroup | FilterRule> = selectedPeopleIds.map((personId) => {
      const fieldRules: FilterRule[] = fieldKeys.map((fieldKey) => ({ fieldKey, condition: 'EQUALS', value: personId }));
      if (fieldRules.length > 1) return { logic: 'OR', rules: fieldRules };
      return fieldRules[0];
    });

    if (personRules.length === 1) return personRules[0];
    return { logic: 'OR', rules: personRules as (FilterGroup | FilterRule)[] };
  }, [selectedPeopleIds, personFilterField, finalFields]);

  const hasActiveSearchOrFilters = useMemo(() => {
    return (
      savedFilterId ||
      (searchQuery && selectedColumns.length > 0) ||
      selectedPeopleIds.length > 0 ||
      activeFilters.some(f => {
        const noValueConditions = [
          'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
          'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK',
          'IS_THIS_MONTH', 'IS_LAST_MONTH', 'IS_NEXT_MONTH',
          'IS_TRUE', 'IS_FALSE'
        ];
        if (noValueConditions.includes(f.condition)) return true;
        return f.value && f.value.length > 0;
      })
    );
  }, [searchQuery, selectedColumns, activeFilters, savedFilterId, selectedPeopleIds]);

  const makeUpdateBody = (field: FieldDefinition, row: GenericRow, nextValue: unknown) => {
    const body: Record<string, unknown> = {};
    (finalFields || []).forEach((f) => {
      if (f?.isRequired) {
        body[f.fieldKey] = row?.[f.fieldKey] ?? '';
      }
    });
    const companyCandidates = new Set(['company', 'companyId', 'companyName']);
    const companyFieldFromDefs = (finalFields || []).find((f) => companyCandidates.has(String(f.fieldKey)) || String(f.displayName || '').toLowerCase().includes('company'));
    const companyKey = companyFieldFromDefs?.fieldKey || (['company', 'companyId', 'companyName'].find(k => row?.[k] !== undefined) as string | undefined);
    if (companyKey && body[companyKey] === undefined) {
      body[companyKey] = row?.[companyKey];
    }
    body[field.fieldKey] = nextValue;
    return body;
  };

  const patchAccountRowLocally = (accountId: string, patch: Partial<GenericRow> | ((prev: GenericRow) => GenericRow)) => {
    setCurrentAccountsData((p: unknown) => {
      const prev = p as { items?: GenericRow[] } | null;
      if (!prev?.items) return prev as unknown;
      const items = Array.isArray(prev.items) ? [...prev.items] : [] as GenericRow[];
      const idx = items.findIndex((r: GenericRow) => (r?.id ?? r?._id) === accountId);
      if (idx === -1) return prev;
      const before = items[idx];
      const nextRow = typeof patch === 'function' ? (patch as (prev: GenericRow) => GenericRow)(before) : ({ ...before, ...patch } as GenericRow);
      items[idx] = nextRow;
      return { ...(prev as Record<string, unknown>), items } as unknown;
    });
  };

  const optimisticCellUpdate = async (
    accountId: string,
    prevRow: GenericRow,
    localPatch: Partial<GenericRow>,
    performUpdate: () => Promise<unknown>,
  ) => {
    patchAccountRowLocally(accountId, localPatch);
    try {
      await performUpdate();
    } catch (err) {
      patchAccountRowLocally(accountId, prevRow);
      throw err;
    }
  };

  // Reset to first page when search/sort/filters change
  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [
    searchQuery,
    selectedColumns,
    JSON.stringify(activeFilters),
    selectedPeopleIds,
    personFilterField,
    savedFilterId,
    sort?.field,
    sort?.direction
  ]);

  // Fetch accounts with server-side pagination and filters
  useEffect(() => {
    const fetchAccounts = async () => {
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
            params.filterGroup = filterRules.length === 1
              ? filterRules[0]
              : { logic: 'AND', rules: filterRules } as FilterGroup;
          }
        }

        const result = await filterAccounts(params).unwrap();
        setCurrentAccountsData(result);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        customToast.error('Failed to load accounts');
      }
    };

    fetchAccounts();
  }, [
    searchQuery,
    selectedColumns,
    sort,
    activeFilters,
    selectedPeopleIds,
    personFilterField,
    filterAccounts,
    savedFilterId,
    currentPage,
    pageSize
  ]);

  // Helper to refetch with current state
  const refetchAccounts = async () => {
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
          params.filterGroup = filterRules.length === 1
            ? filterRules[0]
            : { logic: 'AND', rules: filterRules } as FilterGroup;
        }
      }

      const result = await filterAccounts(params).unwrap();
      setCurrentAccountsData(result);
    } catch (error) {
      console.error('Failed to refetch accounts:', error);
    }
  };

  // Column operations (rename, hide, toggle visibility, reorder)
  const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
    if (!field.id) return;
    const clean = newName.trim();
    if (!clean || clean === field.displayName) return;
    try {
      await updateField({ fieldId: field.id, data: { displayName: clean } }).unwrap();
      await refetchFieldDefinitions();
      await refetchAccounts();
    } catch (e) {
      console.error('Failed to update field displayName', e);
    }
  };

  const handleHideColumn = async (field: FieldDefinition) => {
    if (!field.id) return;
    try {
      await updateField({ fieldId: field.id, data: { isVisible: false } }).unwrap();
    } catch (e) {
      console.error('Failed to hide field', e);
    }
  };

  const handleToggleColumnVisibility = async (field: FieldDefinition, visible: boolean) => {
    if (!field.id) return;
    try {
      await updateField({ fieldId: field.id, data: { isVisible: visible } }).unwrap();
    } catch (e) {
      console.error('Failed to toggle visibility', e);
    }
  };

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

  // Person filter handlers
  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setCurrentPage(1);
    setSelectedPeopleIds(selectedIds);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setCurrentPage(1);
    setPersonFilterField(field);
  };

  // Table data & loading
  const rows = (currentAccObj?.items ?? initialAccObj?.items) ?? [];
  const loading = fieldsLoading || accountsLoading || initialAccountsLoading;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    accountName: 260,
    name: 220,
    companyName: 220,
    createdBy: 180,
    createdByName: 180,
    createdAt: 160,
    updatedAt: 160,
    action: 150,
    annualRevenue: 180,
    employees: 200,
  });

  // Form Fields for Modal
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

    return transformedFields;
  }, [fieldsRawArray]);

  // Form Submit Handler
  const handleFormSubmit = async (values: Record<string, unknown>) => {
    try {
      if (userLoading) {
        customToast.info("Please wait while we load your user information");
        return;
      }
      if (isEditMode && editData?.id) {
        await updateAccount({ accountId: String(editData.id), data: values }).unwrap();
        customToast.success("Account updated successfully!");
        await refetchAccounts();
      }
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Failed to save account:", error);
      customToast.error("Failed to save account");
    }
  };

  // Updates Handlers
  const handleCreateAccountUpdate = async (content: string) => {
    if (!editData?.id) {
      customToast.error("No account selected");
      return;
    }

    try {
      await addAccountUpdate({
        accountId: String(editData.id),
        content: content
      }).unwrap();

      customToast.success("Update added successfully");
      await refetchAccounts();
    } catch (error) {
      console.error("Failed to add update:", error);
      customToast.error("Failed to add update");
    }
  };

  const handleEditAccountUpdate = async (updateId: string, content: string) => {
    if (!editData?.id) {
      customToast.error("No account selected");
      return;
    }

    try {
      await editAccountUpdate({
        accountId: String(editData.id),
        updateId: updateId,
        content: content
      }).unwrap();

      customToast.success("Update edited successfully");
      await refetchAccounts();
    } catch (error) {
      console.error("Failed to edit update:", error);
      customToast.error("Failed to edit update");
    }
  };

  const handleDeleteAccountUpdate = async (updateId: string) => {
    if (!editData?.id) {
      customToast.error("No account selected");
      return;
    }

    try {
      await deleteAccountUpdate({
        accountId: String(editData.id),
        updateId: updateId
      }).unwrap();

      customToast.success("Update deleted successfully");
      await refetchAccounts();
    } catch (error) {
      console.error("Failed to delete update:", error);
      customToast.error("Failed to delete update");
    }
  };

  // Activity Handler
  const handleCreateActivity = async (activityPayload: any): Promise<void> => {
    try {
      if (!currentUser?.id) throw new Error('User information not available');
      const accountId = editData?.id;
      if (!accountId) throw new Error('Account ID is required to create activity');

      const apiPayload = {
        type: activityPayload.type?.toUpperCase(),
        subject: activityPayload.subject || activityPayload.title,
        description: activityPayload.description || '',
        scheduledAt: activityPayload.scheduledAt || activityPayload.startDate,
        duration: parseInt(activityPayload.duration) || 30,
        status: 'SCHEDULED',
        priority: activityPayload.priority || 'MEDIUM',
        assignedToId: currentUser.companyUserId || currentUser.id,
        createdBy: currentUser.id,
        accountId,
      } as any;

      if (!apiPayload.subject?.trim()) throw new Error('Subject is required');
      if (!apiPayload.scheduledAt) throw new Error('Scheduled date is required');
      if (!apiPayload.type) throw new Error('Activity type is required');

      await createActivityMutation(apiPayload).unwrap();
      customToast.success('Activity created successfully!');
      setIsActivityModalOpen(false);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }, message?: string };
      console.error('Failed to create activity:', err);
      customToast.error(err?.data?.message || err?.message || 'Failed to create activity');
      throw error;
    }
  };

  // Dropdown CRUD handlers for OverviewTabContent & table menus
  const handleAddDropdownOption = async (fieldId: string, option: { displayName: string; color: string }) => {
    try {
      const base = option.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
      await addDropdownChoice({ fieldId, value: base, label: option.displayName, color: option.color, order: Date.now() }).unwrap();
      customToast.success('Dropdown option added');
      await refetchAccounts();
    } catch (e: any) {
      console.error('Failed to add dropdown choice', e);
      customToast.error(e?.data?.message || 'Failed to add dropdown option');
    }
  };

  const handleUpdateDropdownOption = async (fieldId: string, value: string, updates: { displayName?: string; color?: string }) => {
    try {
      const apiUpdates: any = {};
      if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
      if (typeof updates.color === 'string') apiUpdates.color = updates.color;
      if (Object.keys(apiUpdates).length === 0) return;
      await updateDropdownChoice({ fieldId, value, updates: apiUpdates }).unwrap();
      customToast.success('Dropdown option updated');
      await refetchAccounts();
    } catch (e: any) {
      console.error('Failed to update dropdown choice', e);
      customToast.error(e?.data?.message || 'Failed to update dropdown option');
    }
  };

  const handleReorderDropdownOptions = async (fieldId: string, orderedOptions: Array<{ fieldKey: string; displayName: string; color: string }>) => {
    try {
      const payload = orderedOptions.map((o, idx) => ({ value: o.fieldKey, order: idx + 1, label: o.displayName, color: o.color }));
      await reorderDropdownChoices({ fieldId, choices: payload }).unwrap();
      customToast.success('Dropdown options reordered');
      await refetchAccounts();
    } catch (e: any) {
      console.error('Failed to reorder dropdown choices', e);
      customToast.error(e?.data?.message || 'Failed to reorder dropdown options');
    }
  };

  const handleDeleteDropdownOption = async (fieldId: string, value: string) => {
    try {
      await deleteDropdownChoice({ fieldId, value }).unwrap();
      customToast.success('Dropdown option deleted');
      await refetchAccounts();
    } catch (e: any) {
      console.error('Failed to delete dropdown choice', e);
      customToast.error(e?.data?.message || 'Failed to delete dropdown option');
    }
  };

  // Modal helpers
  const getModalTitle = () => (isEditMode ? 'Edit Account' : 'Add Account');
  const shouldShowBackButton = activeView !== 'default';
  const handleBackToDefault = () => setActiveView('default');

  const handleEditAccount = (accountData: any) => {
    // Process the data before setting it for editing
    const processedData = { ...accountData };

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

  const handleRowClick = (row: any) => handleEditAccount(row);

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
          accountId: isEditMode && editData?.id ? editData.id : undefined,
          updatesData: updatesData || [],
          isLoading: updatesLoading,
          onCreateUpdate: handleCreateAccountUpdate,
          onEditUpdate: handleEditAccountUpdate,
          onDeleteUpdate: handleDeleteAccountUpdate,
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
  const accountTitleBtn = [
    { name: 'Export', icon: <FiPlus />, onClick: () => setShowExportModal(true) },
  ];

  // Export: fetch all accounts using filter across pages
  const fetchAllForExport = async (): Promise<GenericRow[]> => {
    try {
      const pageSizeAll = 1000;
      let page = 1;
      const all: GenericRow[] = [];
      while (true) {
        const res = await filterAccounts({
          page,
          limit: pageSizeAll,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
        }).unwrap();
        const r = res as { items?: GenericRow[]; pagination?: { total?: number } };
        const items = r?.items ?? [];
        all.push(...items);
        const total = r?.pagination?.total ?? items.length;
        if (items.length < pageSizeAll || all.length >= total) break;
        page += 1;
      }
      return all;
    } catch (e) {
      console.error('Export fetchAll (accounts) failed', e);
      return [];
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="w-screen h-screen overflow-hidden flex" style={{
          backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
        }}>
          <Sidebar />
          <div className="flex-1 flex flex-col relative min-w-0 w-full">
            <Header />
            <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
              <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                <BreadcrumbsNavBar
                  customItems={[
                    { label: 'SM', href: '/dashboard' },
                    { label: 'Accounts', href: '/dashboard/biz-accelerator/accounts' }
                  ]}
                />
              </div>

              <div
                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}
              >
                <Title projectTitleObj={accountTitleBtn} name="Accounts" />
              </div>

              <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end items-center gap-[6px] h-fit relative' style={{
                backgroundColor: isDark ? colors.dark.sidebar : undefined
              }}>
                <SearchBoard
                  fieldDefinitions={finalFields.map(f => ({
                    ...f,
                    isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : true
                  }))}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedColumns={selectedColumns}
                  onColumnsChange={setSelectedColumns}
                  placeholder="Search accounts"
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

                <AddFiltersButton
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={activeFilters.some(f => f.value.length > 0) ? 'bg-red-100 border-gray-400' : ''}
                />

                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={() => setIsFilterDropdownOpen(false)}
                  fields={finalFields
                    .filter(f => {
                      const disallowedKeys = new Set(['action', 'filesLinks', 'activityTimeline', 'updates']);
                      const allowedTypes = new Set(['TEXT', 'EMAIL', 'PHONE', 'URL', 'TEXTAREA', 'NUMBER', 'CURRENCY', 'DATE', 'DATE_TIME', 'DROPDOWN', 'MULTISELECT', 'CHECKBOX']);
                      if (disallowedKeys.has(String(f.fieldKey))) return false;
                      if (!allowedTypes.has(String(f.fieldType))) return false;
                      if (f.isFilterable === false) return false;
                      return true;
                    })
                    .map(f => ({
                      value: f.fieldKey,
                      label: f.displayName,
                      fieldType: f.fieldType,
                      isSearchable: true
                    }))}
                  currentFilters={activeFilters}
                  onApplyFilters={(filters) => {
                    setActiveFilters(filters);
                    setIsFilterDropdownOpen(false);
                    setSavedFilterId(null);
                  }}
                  hasActiveFilters={activeFilters.some(f => {
                    const noValueConditions = [
                      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
                      'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK',
                      'IS_THIS_MONTH', 'IS_LAST_MONTH', 'IS_NEXT_MONTH',
                      'IS_TRUE', 'IS_FALSE'
                    ];
                    if (noValueConditions.includes(f.condition)) return true;
                    return f.value && f.value.length > 0;
                  })}
                  savedFilters={savedFiltersData || []}
                  onLoadSavedFilter={async (filterId) => {
                    try {
                      const saved = (savedFiltersData || []).find(f => f.id === filterId);
                      if (!saved) {
                        customToast.error('Saved filter not found');
                        return;
                      }
                      const transformed = transformBackendFiltersToFrontend(saved.filterDefinition);
                      setActiveFilters(transformed);
                      setSavedFilterId(filterId);
                      setCurrentPage(1);
                    } catch (e) {
                      console.error('Failed to load saved filter', e);
                      customToast.error('Failed to load saved filter');
                    }
                  }}
                  onSaveFilter={async (filterName, filters) => {
                    try {
                      const filterGroup = transformFiltersToBackendFormat(filters);
                      if (!filterGroup) {
                        customToast.error('Please add at least one filter condition');
                        return;
                      }
                      await saveFilter({
                        name: filterName,
                        entityType: 'account',
                        filterGroup,
                        isDefault: false,
                        isShared: false
                      }).unwrap();
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
                      if (savedFilterId === filterId) {
                        setSavedFilterId(null);
                        setActiveFilters([]);
                      }
                    } catch (error) {
                      console.error('Failed to delete filter:', error);
                      customToast.error('Failed to delete filter');
                    }
                  }}
                />
              </div>

              <div className='mx-5 mt-11 py-2 px-2 rounded flex h-fit min-w-0 overflow-x-auto'>
                <Bar
                  total={currentAccObj?.pagination?.total ?? initialAccObj?.pagination?.total ?? 0}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setCurrentPage(1); setPageSize(size); }}
                  onToggleColumns={() => setShowLessColumns((s) => !s)}
                  showLessColumns={showLessColumns}
                />
              </div>

              <div className="flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 w-full min-w-0 min-h-0 overflow-auto">
                {loading ? (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                    <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                  </div>
                ) : (
                  <FinalTable
                    data={rows}
                    fieldDefinitions={visibleFields}
                    rowKey="id"
                    stickyHeader
                    appearance="figma"
                    sortConfig={sort}
                    onSortChange={(cfg) => setSort(cfg)}
                    loading={false}
                    columnWidths={columnWidths}
                    onColumnResize={(key, width) => setColumnWidths((prev) => ({ ...prev, [key]: width }))}
                    onRenameColumn={handleRenameColumn}
                    onHideColumn={handleHideColumn}
                    onToggleColumnVisibility={handleToggleColumnVisibility}
                    onColumnOrderChange={handleReorderColumns}
                    pinnedColumnKeys={["accountName", "name", "companyName"]}
                    // onRowClick={handleRowClick}
                    getCellRenderer={({ field, row, value }: { field: FieldDefinition; row: GenericRow; value: unknown }) => {
                      const accountId = row?.id ?? row?._id;
                      const key = String(field.fieldKey || '').toLowerCase();
                      const name = String(field.displayName || '').toLowerCase();

                      if (field.fieldKey === 'action') {
                        return (
                          <div className="flex items-center gap-2 h-6 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAccount(row);
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

                      if (field.fieldKey === 'accountStatus' || field.fieldKey === 'accountType') {
                        const choices = (field.options as { choices?: unknown })?.choices ?? [];
                        const options: { fieldKey: string; displayName: string; color: string }[] = (choices as unknown[]).map((c) => {
                          const obj = (c && typeof c === 'object') ? (c as { value?: unknown; label?: string; color?: string }) : undefined;
                          return {
                            fieldKey: String(obj?.value ?? c),
                            displayName: obj?.label ?? String(obj?.value ?? c),
                            color: obj?.color ?? '#6b7280',
                          };
                        });
                        let currentKey = '';
                        if (value && typeof value === 'object' && (value as { value?: unknown })?.value !== undefined) {
                          currentKey = String((value as { value?: unknown }).value);
                        } else {
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
                              if (!accountId) return;
                              const prevSnap = row;
                              try {
                                const sel = options.find((o) => o.fieldKey === newKey);
                                const payload = sel ? { value: sel.fieldKey, label: sel.displayName, color: sel.color } : newKey;
                                const updateBody = makeUpdateBody(field, row, payload);
                                await optimisticCellUpdate(
                                  String(accountId),
                                  prevSnap,
                                  { [field.fieldKey]: payload },
                                  () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                                );
                                customToast.success('Status updated');
                              } catch (e) {
                                console.error('Failed to update account status/type', e);
                                customToast.error('Failed to update status');
                              }
                            }}
                            onUpdateOption={async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                              try {
                                if (!fieldId) return;
                                const apiUpdates: Record<string, unknown> = {};
                                if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
                                if (typeof updates.color === 'string') apiUpdates.color = updates.color;
                                if (Object.keys(apiUpdates).length === 0) return;
                                await updateDropdownChoice({ fieldId, value: choiceKey, updates: apiUpdates }).unwrap();
                                customToast.success('Dropdown option updated');
                                await refetchAccounts();
                              } catch (err) {
                                console.error('Failed to update dropdown choice', err);
                                customToast.error('Failed to update dropdown option');
                              }
                            }}
                            onAddOption={async (opt: { displayName: string; color: string }) => {
                              try {
                                if (!fieldId) return;
                                const base = opt.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'option';
                                let val = base;
                                const existing = new Set(options.map((o) => o.fieldKey));
                                let i = 1;
                                while (existing.has(val)) { val = `${base}_${i++}`; }
                                await addDropdownChoice({ fieldId, value: val, label: opt.displayName, color: opt.color, order: Date.now() }).unwrap();
                                customToast.success('Dropdown option added');
                                await refetchAccounts();
                              } catch (err) {
                                console.error('Failed to add dropdown choice', err);
                                customToast.error('Failed to add dropdown option');
                              }
                            }}
                            onDeleteOption={async (choiceKey: string) => {
                              try {
                                if (!fieldId) return;
                                await deleteDropdownChoice({ fieldId, value: choiceKey }).unwrap();
                                customToast.success('Dropdown option deleted');
                                await refetchAccounts();
                              } catch (err) {
                                console.error('Failed to delete dropdown choice', err);
                                customToast.error('Failed to delete dropdown option');
                              }
                            }}
                            onReorderOptions={async (ordered: { fieldKey: string; displayName: string; color: string }[]) => {
                              try {
                                if (!fieldId) return;
                                const payload = ordered.map((o, idx) => ({ value: o.fieldKey, order: idx + 1, label: o.displayName, color: o.color }));
                                await reorderDropdownChoices({ fieldId, choices: payload }).unwrap();
                                customToast.success('Dropdown options reordered');
                                await refetchAccounts();
                              } catch (err) {
                                console.error('Failed to reorder dropdown choices', err);
                                customToast.error('Failed to reorder dropdown options');
                              }
                            }}
                            disabled={false}
                            className="min-w-[140px]"
                          />
                        );
                      }

                      if (field.fieldType === 'EMAIL') {
                        return (
                          <EmailValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              try {
                                if (!accountId) return;
                                const prevSnap = row;
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  String(accountId),
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                                );
                                customToast.success('Email updated');
                              } catch (e) {
                                console.error('Failed to update account email', e);
                                customToast.error('Failed to update email');
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'PHONE') {
                        return (
                          <PhoneValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              try {
                                if (!accountId) return;
                                const prevSnap = row;
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  String(accountId),
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                                );
                                customToast.success('Phone updated');
                              } catch (e) {
                                console.error('Failed to update account phone', e);
                                customToast.error('Failed to update phone');
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'URL') {
                        return (
                          <UrlValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              try {
                                if (!accountId) return;
                                const prevSnap = row;
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  String(accountId),
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                                );
                                customToast.success('URL updated');
                              } catch (e) {
                                console.error('Failed to update account URL', e);
                                customToast.error('Failed to update URL');
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'DATE') {
                        const v = typeof value === 'string' ? value : (value ? new Date(value as any).toISOString().slice(0, 10) : '');
                        return (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DatePicker
                              value={v}
                              onChange={async (newDate) => {
                                if (!accountId) return;
                                const prevSnap = row;
                                try {
                                  await optimisticCellUpdate(
                                    String(accountId),
                                    prevSnap,
                                    { [field.fieldKey]: newDate },
                                    () => updateAccount({ accountId: String(accountId), data: makeUpdateBody(field, row, newDate) }).unwrap()
                                  );
                                } catch (e) {
                                  console.error('Failed to update date', e);
                                }
                              }}
                            />
                          </div>
                        );
                      }

                      // Nice display for createdBy variants
                      if (field.fieldKey === 'createdBy' || field.fieldKey === 'createdById' || field.fieldKey === 'createdByName') {
                        const fullName = typeof row?.createdByName === 'string' && row.createdByName.trim().length > 0
                          ? row.createdByName
                          : row?.createdBy
                            ? [row.createdBy.firstName, row.createdBy.lastName].filter(Boolean).join(' ').trim()
                            : '';
                        return (
                          <div className="flex items-center justify-center gap-2">
                            <img
                              src="/Person.svg"
                              alt="Person"
                              className="w-4 h-4 shrink-0"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span className="truncate" title={fullName}>{fullName || '-'}</span>
                          </div>
                        );
                      }

                      // Account name with notes icon (freeze via pinnedColumnKeys)
                      if (["accountName", "name", "companyName"].includes(field.fieldKey)) {
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              try {
                                if (!accountId) return;
                                const prevSnap = row;
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  String(accountId),
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                                );
                                customToast.success('Name updated');
                              } catch (e) {
                                console.error('Failed to update account name', e);
                                customToast.error('Failed to update name');
                              }

                            }}
                            onNotesClick={() => {
                              // Open the edit form modal when clicking the notes icon
                              handleEditAccount(row);
                            }}
                          // onClick={() => {
                          //   // Open the edit form modal when clicking the name
                          //   handleEditAccount(row);
                          // }}
                          />
                        );
                      }

                      if (field.fieldKey === 'tags') {
                        return (
                          <EditableTagsCell
                            tags={value}
                            onCommit={async (newTags: string[]) => {
                              try {
                                if (!accountId) return;
                                const prevSnap = row;
                                const updateBody = makeUpdateBody(field, row, newTags);
                                await optimisticCellUpdate(
                                  String(accountId),
                                  prevSnap,
                                  { [field.fieldKey]: newTags },
                                  () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                                );
                                customToast.success('Tags updated');
                              } catch (e) {
                                customToast.error('Failed to update tags');
                              }
                            }}
                          />
                        );
                      }

                      // Files/Links quick view button
                      if (field.fieldKey === 'filesLinks') {
                        return (
                          <div className="flex items-center justify-center cursor-pointer" onClick={(e) => {
                            e.stopPropagation();
                            setEditData(row);
                            setIsEditMode(true);
                            setActiveTab('files/links');
                            setIsFormModalOpen(true);
                          }}>
                            <ViewIcon width="61" height="20" />
                          </div>
                        );
                      }

                      // Updates: show latest plain text content
                      {
                        const key = String(field.fieldKey || '').toLowerCase();
                        const name = String(field.displayName || '').toLowerCase();
                        const isUpdatesCol = key === 'updates' || name === 'updates' || key === 'lastupdate' || key === 'latestupdate';
                        if (isUpdatesCol) {
                          const tryParse = (v: unknown) => {
                            if (Array.isArray(v) || (v && typeof v === 'object')) return v;
                            if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } }
                            return v;
                          };
                          const source = tryParse(value) ?? tryParse(row?.updates);
                          let latestItem: unknown = null;
                          if (Array.isArray(source) && source.length > 0) latestItem = source[0]; else if (source && typeof source === 'object') latestItem = source;
                          const latestObj = latestItem as { content?: unknown } | null;
                          const raw = typeof latestObj?.content === 'string' ? latestObj.content : (typeof source === 'string' ? source : '');
                          const content = (() => {
                            if (!raw) return '';
                            try {
                              if (typeof window !== 'undefined') {
                                const el = document.createElement('div');
                                el.innerHTML = raw;
                                return (el.textContent || '').trim();
                              }
                            } catch { }
                            return String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                          })();
                          return (<span className="truncate" title={content}>{content || '-'}</span>);
                        }
                      }

                      // Text fallback
                      return (
                        <TextValue
                          field={field}
                          value={value}
                          onCommit={async (next: string) => {
                            try {
                              if (!accountId) return;
                              const prevSnap = row;
                              const updateBody = makeUpdateBody(field, row, next);
                              await optimisticCellUpdate(
                                String(accountId),
                                prevSnap,
                                { [field.fieldKey]: next },
                                () => updateAccount({ accountId: String(accountId), data: updateBody }).unwrap()
                              );
                              customToast.success('Field updated');
                            } catch (e) {
                              console.error('Failed to update text field', e);
                              customToast.error('Failed to update field');
                            }
                          }}
                        />
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

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          entityLabel="accounts"
          fields={finalFields}
          rows={rows}
          fetchAll={fetchAllForExport}
        />

        <DescriptionModal
          open={isDescriptionModalOpen}
          initialText={descriptionDraft}
          title="Update Description"
          onClose={() => setIsDescriptionModalOpen(false)}
          onSave={async (text) => {
            try {
              const theRow = descriptionRow;
              const id = theRow?.id ?? theRow?._id;
              if (!id) return;
              const fieldDef = (finalFields || []).find((f) => String(f.fieldKey).toLowerCase() === 'description' || String(f.displayName || '').toLowerCase().includes('description'));
              const key = fieldDef?.fieldKey || 'description';
              const updateBody = fieldDef ? makeUpdateBody(fieldDef, theRow as GenericRow, text) : ({ [key]: text } as Record<string, unknown>);
              await optimisticCellUpdate(
                String(id),
                theRow as GenericRow,
                { [key]: text },
                () => updateAccount({ accountId: String(id), data: updateBody }).unwrap()
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
          relatedEntity={editData?.id ? { id: String(editData.id), name: String((editData as any)?.name ?? (editData as any)?.accountName ?? 'Account'), type: 'account' } : undefined}
          onCreateActivity={handleCreateActivity}
        />
      </div>
    </ProtectedRoute>
  );
};

export default AccountsPage;