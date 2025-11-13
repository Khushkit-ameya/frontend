"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import { TableTagsRenderer } from '@/components/dropdowns/TableTagsRenderer';
import { Popover, TextField, Button } from '@mui/material';
import { FiEdit2 } from 'react-icons/fi';
import { Edit } from 'lucide-react';
import { customToast } from '../../../utils/toast';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';
import DescriptionModal from '../../../components/common/DescriptionModal';
import DeleteConfirmationModal from '../../../components/common/DeleteConfirmationModal';

// Saved filters API
import { useGetSavedFiltersQuery, useSaveFilterMutation, useDeleteFilterMutation } from '@/store/api_query/BizAccelerator/filter.api';
import type { FilterGroup, FilterRule } from '@/store/api_query/BizAccelerator/filter.api';

// Field definitions (shared)
import { useGetFieldDefinitionsByEntityQuery, useUpdateFieldDefinitionMutation, useReorderFieldsForEntityMutation } from '../../../store/api_query/field_definitions.api';

// Company users
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';

// Payments API
import {
  useGetPaymentsQuery,
  useFilterPaymentsMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from '../../../store/api_query/BizAcceleratorPayment.api';

// Editable tags inline cell
type EditableTagsCellProps = { tags: unknown; onCommit: (newTags: string[]) => Promise<void> };
const EditableTagsCell: React.FC<EditableTagsCellProps> = ({ tags, onCommit }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [input, setInput] = React.useState('');
  const normalized = React.useMemo(() => {
    if (!tags) return [] as string[];
    const toArray = (v: unknown) => Array.isArray(v) ? v : typeof v === 'object' ? [v] : typeof v === 'string' ? (() => { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch { return [v]; } })() : [];
    const arr = toArray(tags);
    return arr.map((t: unknown) => typeof t === 'object' && t !== null ? ((t as Record<string, unknown>).label || (t as Record<string, unknown>).value || '') : String(t)).filter(Boolean) as string[];
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

const PaymentsPage: React.FC = () => {
  const { isDark, colors } = useTheme();

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
  type GenericRow = Record<string, unknown> & { id?: string | number; _id?: string | number; createdByName?: string; createdBy?: { firstName?: string; lastName?: string } | null };
  const [descriptionRow, setDescriptionRow] = useState<GenericRow | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  // Saved filters
  const { data: savedFiltersData } = useGetSavedFiltersQuery('payment');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();

  // Person filter
  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  // Queries
  const { data: allFieldsFull } = useGetFieldDefinitionsByEntityQuery('payment');
  const { data: initialPaymentsData, isLoading: initialPaymentsLoading } = useGetPaymentsQuery({
    page: currentPage,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
  });
  const [filterPayments, { isLoading: paymentsLoading }] = useFilterPaymentsMutation();
  const [currentPaymentsData, setCurrentPaymentsData] = useState<unknown>(null);

  const [updatePayment] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const [updateFieldDefinition] = useUpdateFieldDefinitionMutation();
  const [reorderFieldsForEntity] = useReorderFieldsForEntityMutation();

  const { data: companyUsersData } = useGetCompanyUsersQuery({});

  // Normalize data shapes
  const initialObj = initialPaymentsData as { items?: GenericRow[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentObj = currentPaymentsData as { items?: GenericRow[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;

  const fieldsRawArray = useMemo(() => {
    const list = (allFieldsFull ?? []) as unknown[];
    return Array.isArray(list) ? list : [];
  }, [allFieldsFull]);

  // Field definitions for table
  const finalFields: FieldDefinition[] = useMemo(() => {
    const fields = mapBackendListToFrontend(fieldsRawArray as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
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
  }, [fieldsRawArray]);

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
      condition: 'CONTAINS' as any,
      value: searchQuery,
    }));
    return { logic: 'OR', rules } as unknown as FilterGroup;
  }, [searchQuery, selectedColumns]);

  // Person filter options
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

  const availablePersonFilterFields = useMemo(() => ['assignedTo', 'createdBy'] as Array<'assignedTo' | 'createdBy'>, []);

  const buildPersonFilterRules = useMemo<FilterGroup | FilterRule | null>(() => {
    if (selectedPeopleIds.length === 0) return null;

    let fieldKeys: string[] = [];
    if (personFilterField === 'assignedTo') {
      const candidates = ['assignedTo', 'assignedToId', 'owner', 'ownerId'];
      fieldKeys = finalFields.filter(f => candidates.includes(f.fieldKey)).map(f => f.fieldKey);
      if (fieldKeys.length === 0) fieldKeys = ['assignedTo'];
    } else {
      const possibleFields = ['createdBy', 'createdByName', 'createdById'];
      fieldKeys = finalFields.filter(f => possibleFields.includes(f.fieldKey)).map(f => f.fieldKey);
      if (fieldKeys.length === 0) fieldKeys = ['createdBy'];
    }

    const personRules: Array<FilterGroup | FilterRule> = selectedPeopleIds.map((personId) => {
      const fieldRules: FilterRule[] = fieldKeys.map((fieldKey) => ({ fieldKey, condition: 'EQUALS' as any, value: personId }));
      if (fieldRules.length > 1) return { logic: 'OR', rules: fieldRules } as unknown as FilterGroup;
      return fieldRules[0];
    });

    if (personRules.length === 1) return personRules[0];
    return { logic: 'OR', rules: personRules as (FilterGroup | FilterRule)[] } as unknown as FilterGroup;
  }, [selectedPeopleIds, personFilterField, finalFields]);

  const hasActiveSearchOrFilters = useMemo(() => {
    return (
      savedFilterId ||
      (searchQuery && selectedColumns.length > 0) ||
      selectedPeopleIds.length > 0 ||
      activeFilters.some(f => {
        const noValueConditions = [
          'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
          'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'
        ];
        if (noValueConditions.includes(f.condition)) return true;
        return f.value && f.value.length > 0;
      })
    );
  }, [searchQuery, selectedColumns, activeFilters, savedFilterId, selectedPeopleIds]);

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

  // Build advanced filter group from UI filters
  const buildAdvancedFilterRules = useMemo(() => {
    const validFilters = activeFilters.filter(f => {
      const noValueConditions = [
        'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
        'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK',
        'IS_THIS_MONTH', 'IS_LAST_MONTH', 'IS_NEXT_MONTH',
        'IS_TRUE', 'IS_FALSE'
      ];
      if (noValueConditions.includes(f.condition)) return true;
      return f.value && f.value.length > 0;
    });
    if (validFilters.length === 0) return null;
    return transformFiltersToBackendFormat(validFilters);
  }, [activeFilters]);

  // Fetch payments with server-side pagination and filters
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: pageSize,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
          search: searchQuery || undefined,
        };

        if (savedFilterId) params.savedFilterId = savedFilterId;

        // Compose filterGroup from available sources
        const filterRules: Array<FilterGroup | FilterRule> = [] as any;
        if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules);
        if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules as any);
        if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules as any);
        if (filterRules.length > 0) {
          params.filterGroup = filterRules.length === 1 ? filterRules[0] : ({ logic: 'AND', rules: filterRules } as FilterGroup);
        } else if (selectedPeopleIds.length > 0 && personFilterField === 'assignedTo') {
          // Fallback if backend doesn't parse filterGroup via GET
          params.assignedToId = selectedPeopleIds[0];
        }

        const result = await filterPayments(params as any).unwrap();
        setCurrentPaymentsData(result);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
        customToast.error('Failed to load payments');
      }
    };

    fetchPayments();
  }, [
    searchQuery,
    selectedColumns,
    sort,
    activeFilters,
    selectedPeopleIds,
    personFilterField,
    savedFilterId,
    currentPage,
    pageSize
  ]);

  // Helper to refetch with current state
  const refetchPayments = async () => {
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: sort?.direction || 'desc',
        search: searchQuery || undefined,
      };

      if (savedFilterId) params.savedFilterId = savedFilterId;
      const filterRules: Array<FilterGroup | FilterRule> = [] as any;
      if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules);
      if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules as any);
      if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules as any);
      if (filterRules.length > 0) {
        params.filterGroup = filterRules.length === 1 ? filterRules[0] : ({ logic: 'AND', rules: filterRules } as FilterGroup);
      } else if (selectedPeopleIds.length > 0 && personFilterField === 'assignedTo') {
        params.assignedToId = selectedPeopleIds[0];
      }

      const result = await filterPayments(params as any).unwrap();
      setCurrentPaymentsData(result);
    } catch (error) {
      console.error('Failed to refetch payments:', error);
    }
  };

  // Advanced filters transformation (to save/load)
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
          condition: filter.condition as any,
          value: '',
        } as any);
        return;
      }

      if (!filter.value || filter.value.length === 0) return;

      if (filter.condition === 'DATE_BETWEEN') {
        const [from, to] = filter.value;
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition as any,
          values: [from, to],
          value: [from, to].filter(Boolean).join(','),
        } as any);
        return;
      }

      if (filter.condition === 'BETWEEN') {
        const [min, max] = filter.value;
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition as any,
          values: [min, max],
          value: [min, max].filter(Boolean).join(','),
        } as any);
        return;
      }

      if (['IN', 'NOT_IN'].includes(filter.condition)) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition as any,
          values: filter.value,
          value: filter.value.join(','),
        } as any);
        return;
      }

      if (filter.value.length === 1) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition as any,
          value: filter.value[0],
        } as any);
        return;
      }

      if (filter.value.length > 1) {
        if (orMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map(val => ({
            fieldKey: filter.field,
            condition: filter.condition as any,
            value: val,
          }));
          transformedRules.push({ logic: 'OR', rules: nestedRules } as any);
          return;
        }

        if (andMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map(val => ({
            fieldKey: filter.field,
            condition: filter.condition as any,
            value: val,
          }));
          transformedRules.push({ logic: 'AND', rules: nestedRules } as any);
          return;
        }

        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition as any,
          value: filter.value[0],
        } as any);
      }
    });

    if (transformedRules.length === 0) return null;

    const logic = (filters[0]?.logicalOperator || 'AND') as 'AND' | 'OR';
    return { logic, rules: transformedRules } as unknown as FilterGroup;
  };

  // Table data & loading
  const rows = (currentObj?.items ?? initialObj?.items) ?? [];
  const loading = paymentsLoading || initialPaymentsLoading;

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    paymentName: 260,
    customerName: 220,
    totalAmount: 160,
    paidAmount: 160,
    createdBy: 180,
    createdByName: 180,
    createdAt: 160,
    updatedAt: 160,
    action: 150,
    createdDate: 160,
    isInterstate: 200,
    paymentMethod: 160,
    nextPaymentDate: 190,
    gstRate: 150,
    numberOfInstallments: 190,
    paymentInterval: 160,
    discountAmount: 175,
    discountValue: 160,
    discountType: 150,
    remainingAmount: 190
  });

  // Export: fetch all payments using current filters across pages
  const fetchAllForExport = async (): Promise<GenericRow[]> => {
    try {
      const pageSizeAll = 1000;
      let page = 1;
      const all: GenericRow[] = [];
      while (true) {
        const res = await filterPayments({
          page,
          limit: pageSizeAll,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
          search: searchQuery || undefined,
          ...(savedFilterId ? { savedFilterId } : {}),
          ...(buildSearchFilterRules || buildAdvancedFilterRules || buildPersonFilterRules
            ? { filterGroup: ((): FilterGroup => {
                const fr: Array<FilterGroup | FilterRule> = [] as any;
                if (buildSearchFilterRules) fr.push(buildSearchFilterRules);
                if (buildAdvancedFilterRules) fr.push(buildAdvancedFilterRules as any);
                if (buildPersonFilterRules) fr.push(buildPersonFilterRules as any);
                return fr.length === 1 ? (fr[0] as FilterGroup) : ({ logic: 'AND', rules: fr } as FilterGroup);
              })() }
            : (selectedPeopleIds.length > 0 && personFilterField === 'assignedTo' ? { assignedToId: selectedPeopleIds[0] } : {})),
        } as any).unwrap();
        const r = res as { items?: GenericRow[]; pagination?: { total?: number } };
        const items = r?.items ?? [];
        all.push(...items);
        const total = r?.pagination?.total ?? items.length;
        if (items.length < pageSizeAll || all.length >= total) break;
        page += 1;
      }
      return all;
    } catch (e) {
      console.error('Export fetchAll (payments) failed', e);
      return [];
    }
  };

  // Inline update helpers
  const patchRowLocally = (paymentId: string, patch: Partial<GenericRow> | ((prev: GenericRow) => GenericRow)) => {
    setCurrentPaymentsData((p: unknown) => {
      const prev = p as { items?: GenericRow[] } | null;
      if (!prev?.items) return prev as unknown;
      const items = Array.isArray(prev.items) ? [...prev.items] : [] as GenericRow[];
      const idx = items.findIndex((r: GenericRow) => (r?.id ?? r?._id) === paymentId);
      if (idx === -1) return prev;
      const before = items[idx];
      const nextRow = typeof patch === 'function' ? (patch as (prev: GenericRow) => GenericRow)(before) : ({ ...before, ...patch } as GenericRow);
      items[idx] = nextRow;
      return { ...(prev as Record<string, unknown>), items } as unknown;
    });
  };

  const optimisticCellUpdate = async (
    paymentId: string,
    prevRow: GenericRow,
    localPatch: Partial<GenericRow>,
    performUpdate: () => Promise<unknown>,
  ) => {
    patchRowLocally(paymentId, localPatch);
    try {
      await performUpdate();
    } catch (err) {
      patchRowLocally(paymentId, prevRow);
      throw err;
    }
  };

  // Render
  return (
    <ProtectedRoute>
      <div>
        <div className="w-screen h-screen overflow-hidden flex" style={{ backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg }}>
          <Sidebar />
          <div className="flex-1 flex flex-col relative min-w-0 w-full">
            <Header />

            <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
              <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                <BreadcrumbsNavBar 
                  customItems={[{ label: 'SM', href: '/dashboard' }, { label: 'Payments', href: '/dashboard/biz-accelerator/payments' }]}
                />
              </div>

              <div className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit' style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}>
                <Title projectTitleObj={[{ name: 'Export', icon: <></>, onClick: () => setShowExportModal(true) }]} name="Payments" />
              </div>

              <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end items-center gap-[6px] h-fit relative' style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}>
                <SearchBoard
                  fieldDefinitions={finalFields.map(f => ({ ...f, isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : true }))}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedColumns={selectedColumns}
                  onColumnsChange={setSelectedColumns}
                  placeholder="Search payments"
                />

                <PersonButton onClick={() => setIsPersonFilterOpen(!isPersonFilterOpen)} hasActiveFilter={selectedPeopleIds.length > 0} />

                <PersonFilterModal
                  isOpen={isPersonFilterOpen}
                  onClose={() => setIsPersonFilterOpen(false)}
                  people={peopleForFilter}
                  selectedPeople={selectedPeopleIds}
                  onApply={(ids) => { setSelectedPeopleIds(ids); setIsPersonFilterOpen(false); setCurrentPage(1); }}
                  filterFields={availablePersonFilterFields}
                  selectedFilterField={personFilterField}
                  onFilterFieldChange={(field) => { setPersonFilterField(field); setCurrentPage(1); }}
                />

                <AddFiltersButton onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} className={activeFilters.some(f => f.value.length > 0) ? 'bg-red-100 border-gray-400' : ''} />

                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={() => setIsFilterDropdownOpen(false)}
                  fields={finalFields
                    .filter(f => {
                      const disallowedKeys = new Set(['action', 'filesLinks', 'activityTimeline', 'updates']);
                      const allowedTypes = new Set(['TEXT','EMAIL','PHONE','URL','TEXTAREA','NUMBER','CURRENCY','DATE','DATE_TIME','DROPDOWN','MULTISELECT','CHECKBOX']);
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
                      'IS_THIS_WEEK', 'IS_LAST_MONTH', 'IS_NEXT_MONTH', 'IS_TRUE', 'IS_FALSE'
                    ];
                    if (noValueConditions.includes(f.condition)) return true;
                    return f.value && f.value.length > 0;
                  })}
                  savedFilters={savedFiltersData || []}
                  onLoadSavedFilter={async (filterId) => {
                    try {
                      const saved = (savedFiltersData || []).find(f => f.id === filterId);
                      if (!saved) { customToast.error('Saved filter not found'); return; }
                      setSavedFilterId(saved.id);
                      // also reflect in UI
                      // Note: transform saved.filterDefinition -> UI conditions is optional for now
                      setIsFilterDropdownOpen(false);
                    } catch (e) {
                      console.error('Failed to load saved filter:', e);
                      customToast.error('Failed to load saved filter');
                    }
                  }}
                  onSaveFilter={async (filterName, filters) => {
                    try {
                      const filterGroup = transformFiltersToBackendFormat(filters);
                      if (!filterGroup) { customToast.error('Please add at least one filter condition'); return; }
                      await saveFilter({ name: filterName, entityType: 'payment', filterGroup, isDefault: false, isShared: false }).unwrap();
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
                    } catch (e) {
                      console.error('Failed to delete saved filter', e);
                      customToast.error('Failed to delete saved filter');
                    }
                  }}
                />
              </div>
              {/* Pagination */}
              <div className='mx-5 mt-2'>
                <Bar
                  total={(currentObj?.pagination?.total ?? initialObj?.pagination?.total ?? 0) as number}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={(p) => setCurrentPage(p)}
                  onPageSizeChange={(n: number) => setPageSize(n)}
                  onToggleColumns={() => setShowLessColumns((s) => !s)}
                  showLessColumns={showLessColumns}
                />
              </div>

              {/* Table */}
              <div className='flex-1 mx-5 my-3 overflow-hidden rounded border border-gray-300' style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}>
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center p-10">
                    <img src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                  </div>
                ) : (
                  <FinalTable
                    data={rows}
                    fieldDefinitions={visibleFields}
                    rowKey="id"
                    sortConfig={sort}
                    onSortChange={setSort}
                    columnWidths={columnWidths}
                    onColumnResize={(key, width) => setColumnWidths(prev => ({ ...prev, [key]: width }))}
                    pinnedColumnKeys={["paymentName", "customerName"]}
                    onHideColumn={async (field) => {
                      try {
                        if (!field.id) return;
                        await updateFieldDefinition({ fieldId: field.id, updates: { isVisible: false } }).unwrap();
                      } catch (e) {
                        console.error('Failed to hide column', e);
                        customToast.error('Failed to hide column');
                      }
                    }}
                    getCellRenderer={({ field, row, value }) => {
                      const r = row as GenericRow;
                      // Created By: prefer createdByName or user object name over raw ID
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
                      // Opportunity: show recordId from relation if available
                      if (field.fieldKey === 'opportunityId') {
                        const opp = r.opportunity as { recordId?: string } | undefined;
                        const label = (r.opportunityName as string) || (opp?.recordId as string) || (typeof value === 'string' ? value : '');
                        return <span title={label}>{label || '—'}</span>;
                      }
                      // Deal: show recordId from relation if available
                      if (field.fieldKey === 'dealId') {
                        const deal = r.deal as { recordId?: string } | undefined;
                        const label = (r.dealName as string) || (deal?.recordId as string) || (typeof value === 'string' ? value : '');
                        return <span title={label}>{label || '—'}</span>;
                      }
                      if (field.fieldKey === 'paymentName') {
                        const initial = String(value ?? '');
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={initial}
                            onCommit={async (next) => {
                              const paymentId = String(r.id ?? r._id ?? '');
                              const prev = { ...r };
                              await optimisticCellUpdate(paymentId, prev, { paymentName: next }, async () => {
                                await updatePayment({ paymentId, data: { paymentName: next } }).unwrap();
                              });
                            }}
                          />
                        );
                      }
                      if (field.fieldKey === 'tags') {
                        return (
                          <EditableTagsCell
                            tags={value}
                            onCommit={async (nextTags) => {
                              const paymentId = String(r.id ?? r._id ?? '');
                              const prev = { ...r };
                              await optimisticCellUpdate(paymentId, prev, { tags: nextTags }, async () => {
                                await updatePayment({ paymentId, data: { tags: nextTags } }).unwrap();
                              });
                            }}
                          />
                        );
                      }
                      if (field.fieldKey === 'description') {
                        const val = String(value ?? '');
                        return (
                          <div className="truncate cursor-pointer" title={val} onClick={(e) => { e.stopPropagation(); setDescriptionRow(r); setDescriptionDraft(val); setIsDescriptionModalOpen(true); }}>
                            {val || '—'}
                          </div>
                        );
                      }
                      if (field.fieldKey === 'action') {
                        const paymentId = String(r.id ?? r._id ?? '');
                        const name = String((r as Record<string, unknown>)?.paymentName || (r as Record<string, unknown>)?.name || (r as Record<string, unknown>)?.recordId || 'Payment');
                        return (
                          <div className="flex items-center gap-2 h-6 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
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
                                if (!paymentId) return;
                                setToDelete({ id: paymentId, name });
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
                      if (field.fieldKey === 'numberOfInstallments') {
  const isCustom = (r as Record<string, unknown>)?.paymentType === 'custom';
  const count = isCustom
    ? (r as Record<string, unknown>)?.installmentCount
    : value;
  return <span>{typeof count === 'string' || typeof count === 'number' ? count : '—'}</span>;
}
                      return undefined; // default renderer
                    }}
                    onRenameColumn={async (field, newName) => {
                      try {
                        await updateFieldDefinition({ fieldId: field.id!, updates: { displayName: newName } }).unwrap();
                        customToast.success('Column renamed');
                      } catch (e) {
                        customToast.error('Failed to rename column');
                      }
                    }}
                    onHiddenFieldKeysChange={async (keys) => {
                      try {
                        // Optionally could bulk update; left as UI-only hook for now
                      } catch (e) {
                        // noop
                      }
                    }}
                    onToggleColumnVisibility={async (field, visible) => {
                      try {
                        if (!field.id) return;
                        await updateFieldDefinition({ fieldId: field.id, updates: { isVisible: visible } }).unwrap();
                      } catch (e) {
                        console.error('Failed to toggle visibility', e);
                        customToast.error('Failed to update column visibility');
                      }
                    }}
                    onColumnOrderChange={async (orderedKeys) => {
                      try {
                        const orders: Array<{ fieldId: string; displayOrder: number }> = orderedKeys
                          .map((k, idx) => {
                            const f = finalFields.find(ff => ff.fieldKey === k);
                            return f?.id ? { fieldId: f.id, displayOrder: idx + 1 } : null;
                          })
                          .filter(Boolean) as Array<{ fieldId: string; displayOrder: number }>;
                        if (orders.length > 0) await reorderFieldsForEntity({ entityType: 'payment', fieldOrders: orders }).unwrap();
                      } catch (e) {
                        console.error('Failed to reorder', e);
                      }
                    }}
                  />
                )}
              </div>

              {/* Footer spacer */}
              <div className='mx-5 my-2' />
            </div>
          </div>
        </div>

        {/* Export modal */}
        <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} entityLabel="payments" fields={finalFields} rows={rows as Record<string, unknown>[]} fetchAll={fetchAllForExport} />

        {/* Description modal */}
        <DescriptionModal
          open={isDescriptionModalOpen}
          initialText={descriptionDraft}
          onClose={() => setIsDescriptionModalOpen(false)}
          onSave={async (text) => {
            try {
              if (!descriptionRow?.id && !descriptionRow?._id) return;
              const paymentId = String(descriptionRow?.id ?? descriptionRow?._id);
              await updatePayment({ paymentId, data: { description: text } }).unwrap();
              setDescriptionDraft(text);
              setIsDescriptionModalOpen(false);
              await refetchPayments();
              customToast.success('Description updated');
            } catch (e) {
              const err = e as { data?: { message?: string } };
              customToast.error(err?.data?.message || 'Failed to update description');
            }
          }}
          title="Payment Description"
        />

        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => { if (!isDeleting) { setIsDeleteOpen(false); setToDelete(null); } }}
          onConfirm={async () => {
            if (!toDelete?.id) return;
            try {
              setIsDeleting(true);
              await deletePayment(toDelete.id).unwrap();
              customToast.success('Payment deleted');
              setIsDeleteOpen(false);
              setToDelete(null);
              await refetchPayments();
            } catch (err) {
              const e = err as { data?: { message?: string } };
              customToast.error(e?.data?.message || 'Failed to delete payment');
            } finally {
              setIsDeleting(false);
            }
          }}
          title={`Are you sure to delete`}
          message={''}
          itemName={`${toDelete?.name || ''} Payment`}
          isDeleting={isDeleting}
        />
      </div>
    </ProtectedRoute>
  );
};

export default PaymentsPage;
