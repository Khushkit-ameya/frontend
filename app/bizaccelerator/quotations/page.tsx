"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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
import { customToast } from '../../../utils/toast';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import type { BackendFieldDefinition } from '../../../utils/fieldDefinitions';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';

// Saved filters API (shared)
import { useGetSavedFiltersQuery, useSaveFilterMutation, useDeleteFilterMutation } from '@/store/api_query/BizAccelerator/filter.api';
import type { FilterGroup, FilterRule } from '@/store/api_query/BizAccelerator/filter.api';

// Field definitions (shared CRUD for dropdown options)
import { useGetFieldDefinitionsByEntityQuery } from '../../../store/api_query/field_definitions.api';

// Quotations API
import {
  useGetQuotationFieldsQuery,
  useGetQuotationsQuery,
  useFilterQuotationsMutation,
  useUpdateQuotationFieldMutation,
  useReorderQuotationFieldsMutation,
} from '../../../store/api_query/BizAcceleratorQuotations.api';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';

const QuotationsPage: React.FC = () => {
  const { isDark, colors } = useTheme();
  const searchParams = useSearchParams();

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

  // Person filter state
  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  // Saved filters
  const { data: savedFiltersData } = useGetSavedFiltersQuery('quotation');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();

  // Queries
  const { data: allFieldsFull } = useGetFieldDefinitionsByEntityQuery('quotation');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetQuotationFieldsQuery();
  const { data: initialQuotationsData, isLoading: initialQuotationsLoading } = useGetQuotationsQuery({
    page: currentPage,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
  });
  const [filterQuotations, { isLoading: quotationsLoading }] = useFilterQuotationsMutation();
  const [currentQuotationsData, setCurrentQuotationsData] = useState<unknown>(null);

  // Field updates (column manager)
  const [updateField] = useUpdateQuotationFieldMutation();
  const [reorderFields] = useReorderQuotationFieldsMutation();

  // Normalize shapes
  const initialObj = initialQuotationsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentObj = currentQuotationsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const fieldsRawArray = useMemo(() => {
    const fr = fieldsRaw as unknown;
    if (Array.isArray(fr)) return fr as unknown[];
    const items = (fr as { items?: unknown[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  }, [fieldsRaw]);

  // Compute final fields (shared + endpoint provided)
  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    let fields: FieldDefinition[] = [];
    if (fromShared.length > 0) {
      fields = mapBackendListToFrontend(fromShared as unknown as BackendFieldDefinition[]);
    } else {
      const fromApi = fieldsRawArray as unknown[];
      const fromData = ((currentObj?.fieldDefinitions ?? initialObj?.fieldDefinitions) ?? []) as unknown[];
      const mergedByKey = new Map<string, Record<string, unknown>>();
      [...fromApi, ...fromData].forEach((f: unknown) => {
        if (!f) return;
        const field = f as Record<string, unknown>;
        mergedByKey.set(field.fieldKey as string, { ...mergedByKey.get(field.fieldKey as string), ...field });
      });
      fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as BackendFieldDefinition[]);
    }
    return fields;
  }, [allFieldsFull, fieldsRawArray, currentObj?.fieldDefinitions, initialObj?.fieldDefinitions]);

  const fieldIdByKey = useMemo(() => {
    const src1 = (allFieldsFull ?? []) as unknown[];
    const src2 = fieldsRawArray as unknown[];
    const map = new Map<string, string>();
    [...src1, ...src2].forEach((f: unknown) => {
      if (!f) return;
      const field = f as Record<string, unknown>;
      const k = String(field.fieldKey || '');
      const id = String(field.id || '');
      if (k && id) map.set(k, id);
    });
    return map;
  }, [allFieldsFull, fieldsRawArray]);

  // Company users for PersonFilterModal
  const { data: companyUsersData } = useGetCompanyUsersQuery({});
  const peopleForFilter = useMemo(() => {
    const users = (companyUsersData as { users?: unknown[] } | undefined)?.users;
    if (!Array.isArray(users)) return [] as Array<{ id: string; name: string; email?: string; role?: unknown; avatar?: string }>;
    return users.map((user: unknown) => {
      const u = user as { id?: string; firstName?: string; lastName?: string; email?: string; role?: unknown; avatar?: string };
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      return {
        id: String(u.id || ''),
        name: name || String(u.email || ''),
        email: u.email as string,
        role: u.role,
        avatar: u.avatar as string,
      };
    });
  }, [companyUsersData]);

  // Person filter helpers and options (match other pages)
  const availablePersonFilterFields = useMemo(() => {
    return ['assignedTo', 'createdBy'] as Array<'assignedTo' | 'createdBy'>;
  }, []);

  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setSelectedPeopleIds(selectedIds);
    setCurrentPage(1);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setPersonFilterField(field);
    setCurrentPage(1);
  };

  // Derived filters from URL context (dealId / opportunityId)
  const contextFilter = useMemo<FilterGroup | null>(() => {
    const dealId = searchParams.get('dealId');
    const opportunityId = searchParams.get('opportunityId');
    const rules: Array<FilterRule> = [];
    if (dealId) rules.push({ fieldKey: 'dealId', condition: 'EQUALS', value: dealId });
    if (opportunityId) rules.push({ fieldKey: 'opportunityId', condition: 'EQUALS', value: opportunityId });
    if (rules.length === 0) return null;
    return rules.length === 1 ? (rules[0] as unknown as FilterGroup) : ({ logic: 'AND', rules } as FilterGroup);
  }, [searchParams.get('dealId'), searchParams.get('opportunityId')]);

  // Quick search filters
  const buildSearchFilterRules = useMemo<FilterGroup | null>(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;
    const rules: FilterRule[] = selectedColumns.map((columnKey) => ({ fieldKey: columnKey, condition: 'CONTAINS', value: searchQuery }));
    return { logic: 'OR', rules } as FilterGroup;
  }, [searchQuery, selectedColumns]);

  // Advanced filter rules
  const buildAdvancedFilterRules = useMemo(() => {
    const valid = activeFilters.filter(f => {
      const noVal = ['IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY', 'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'];
      if (noVal.includes(f.condition)) return true;
      return f.value && f.value.length > 0;
    });
    if (valid.length === 0) return null;
    // Convert to backend FilterGroup (flat OR/AND rules)
    const orMultiValue = ['CONTAINS', 'DOES_NOT_CONTAIN', 'IS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'IN'];
    const andMultiValue = ['IS_NOT', 'NOT_EQUALS', 'DOES_NOT_CONTAIN', 'NOT_IN'];
    const transformed: Array<FilterRule | FilterGroup> = [];
    valid.forEach((f) => {
      if (['IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY', 'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'].includes(f.condition)) {
        transformed.push({ fieldKey: f.field, condition: f.condition, value: '' });
        return;
      }
      if (!f.value || f.value.length === 0) return;
      if (['IN', 'NOT_IN'].includes(f.condition)) {
        transformed.push({ fieldKey: f.field, condition: f.condition, values: f.value, value: f.value.join(',') });
        return;
      }
      if (f.value.length === 1) {
        transformed.push({ fieldKey: f.field, condition: f.condition, value: f.value[0] });
        return;
      }
      if (orMultiValue.includes(f.condition)) {
        const nested: FilterRule[] = f.value.map((val) => ({ fieldKey: f.field, condition: f.condition, value: val }));
        transformed.push({ logic: 'OR', rules: nested } as FilterGroup);
      } else if (andMultiValue.includes(f.condition)) {
        const nested: FilterRule[] = f.value.map((val) => ({ fieldKey: f.field, condition: f.condition, value: val }));
        transformed.push({ logic: 'AND', rules: nested } as FilterGroup);
      } else {
        transformed.push({ fieldKey: f.field, condition: f.condition, value: f.value[0] });
      }
    });
    if (transformed.length === 0) return null;
    const logic = (valid[0]?.logicalOperator || 'AND') as 'AND' | 'OR';
    return { logic, rules: transformed } as FilterGroup;
  }, [activeFilters]);

  // Person filter group
  const buildPersonFilterRules = useMemo(() => {
    if (selectedPeopleIds.length === 0) return null;
    let fieldKeys: string[] = [];
    if (personFilterField === 'assignedTo') {
      fieldKeys = ['assignedTo'];
    } else {
      const possibleFields = ['createdBy', 'createdByName', 'createdById'];
      fieldKeys = finalFields.filter(f => possibleFields.includes(f.fieldKey)).map(f => f.fieldKey);
      if (fieldKeys.length === 0) fieldKeys = ['createdBy'];
    }
    const personRules = selectedPeopleIds.map(pid => {
      const fieldRules = fieldKeys.map(fieldKey => ({ fieldKey, condition: 'EQUALS', value: pid }));
      return fieldRules.length > 1 ? ({ logic: 'OR', rules: fieldRules } as FilterGroup) : fieldRules[0];
    });
    if (personRules.length === 1) return personRules[0] as FilterGroup;
    return { logic: 'OR', rules: personRules } as FilterGroup;
  }, [selectedPeopleIds, personFilterField, finalFields]);

  // Reset to first page when criteria change
  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [searchQuery, selectedColumns, JSON.stringify(activeFilters), selectedPeopleIds, personFilterField, savedFilterId, sort?.field, sort?.direction, searchParams.get('dealId'), searchParams.get('opportunityId')]);

  // Fetch quotations with server-side pagination and filters
  useEffect(() => {
    const fetchQuotations = async () => {
      await refetchQuotations();
    };
    fetchQuotations();
  }, [
    currentPage,
    pageSize,
    sort?.field,
    sort?.direction,
    savedFilterId,
    searchQuery,
    selectedColumns,
    JSON.stringify(activeFilters),
    selectedPeopleIds.join(','),
    personFilterField,
    searchParams.get('dealId'),
    searchParams.get('opportunityId'),
  ]);

  // Refetch quotations helper
  const refetchQuotations = async () => {
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: sort?.direction || 'desc',
      };
      if (savedFilterId) {
        params.savedFilterId = String(savedFilterId);
      } else {
        const rules: Array<FilterGroup | FilterRule> = [];
        if (contextFilter) rules.push(contextFilter);
        if (buildSearchFilterRules) rules.push(buildSearchFilterRules);
        if (buildAdvancedFilterRules) rules.push(buildAdvancedFilterRules as FilterGroup);
        if (buildPersonFilterRules) rules.push(buildPersonFilterRules as FilterGroup);
        if (rules.length > 0) {
          params.filterGroup = rules.length === 1 ? rules[0] : ({ logic: 'AND', rules } as FilterGroup);
        }
      }
      const result = await filterQuotations(params).unwrap();
      setCurrentQuotationsData(result);
    } catch (error) {
      console.error('Failed to refetch quotations:', error);
    }
  };

  // Fetch-all for export
  const fetchAllForExport = async (): Promise<Record<string, unknown>[]> => {
    try {
      const pageSizeAll = 1000;
      let page = 1;
      const all: Record<string, unknown>[] = [];
      while (true) {
        const res = await filterQuotations({
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

  // Column width manager
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    quotationName: 220,
    name: 240,
    status: 160,
    dealId: 180,
    opportunityId: 180,
    createdByName: 180,
    createdAt: 160,
    updatedAt: 160,
  });

  // Data
  const rows = ((currentObj?.items ?? initialObj?.items) ?? []) as Record<string, unknown>[];
  const loading = fieldsLoading || quotationsLoading || initialQuotationsLoading;

  // Visible fields (Show Less toggle)
  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    return [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
  }, [finalFields, showLessColumns]);

  // Handlers for column manager (persist displayName, isVisible, columnWidth, order)
  const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
    try {
      const fieldId = fieldIdByKey.get(field.fieldKey);
      if (!fieldId) return;
      await updateField({ fieldId, data: { displayName: newName } }).unwrap();
      customToast.success('Column renamed');
      await refetchQuotations();
    } catch (e) {
      console.error('Rename failed', e);
      customToast.error('Failed to rename column');
    }
  };

  const handleColumnResize = async (fieldKey: string, width: number) => {
    try {
      setColumnWidths(prev => ({ ...prev, [fieldKey]: width }));
      const fieldId = fieldIdByKey.get(fieldKey);
      if (!fieldId) return;
      await updateField({ fieldId, data: { columnWidth: width } }).unwrap();
    } catch (e) {
      console.error('Resize failed', e);
    }
  };

  const handleToggleColumnVisibility = async (field: FieldDefinition, visible: boolean) => {
    try {
      const fieldId = fieldIdByKey.get(field.fieldKey);
      if (!fieldId) return;
      await updateField({ fieldId, data: { isVisible: visible } }).unwrap();
      await refetchQuotations();
    } catch (e) {
      console.error('Visibility toggle failed', e);
    }
  };

  const handleReorderColumns = async (orderedFieldKeys: string[]) => {
    try {
      const fieldOrders = orderedFieldKeys.map((key, idx) => {
        const fieldId = fieldIdByKey.get(key);
        return fieldId ? { fieldId, displayOrder: idx + 1 } : null;
      }).filter(Boolean) as Array<{ fieldId: string; displayOrder: number }>;
      if (fieldOrders.length > 0) {
        await reorderFields({ fieldOrders }).unwrap();
        await refetchQuotations();
      }
    } catch (e) {
      console.error('Reorder failed', e);
    }
  };

  // Saved filters handlers for dropdown
  const handleLoadSavedFilter = async (filterId: string) => {
    setSavedFilterId(filterId);
    setCurrentPage(1);
  };

  const handleSaveCurrentFilter = async (filterName: string, filters: FilterCondition[]) => {
    try {
      // Transform to backend
      const orMultiValue = ['CONTAINS', 'DOES_NOT_CONTAIN', 'IS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'IN'];
      const andMultiValue = ['IS_NOT', 'NOT_EQUALS', 'DOES_NOT_CONTAIN', 'NOT_IN'];
      const rules: Array<FilterRule | FilterGroup> = [];
      filters.forEach(f => {
        if (['IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY', 'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'].includes(f.condition)) {
          rules.push({ fieldKey: f.field, condition: f.condition, value: '' });
          return;
        }
        if (!f.value || f.value.length === 0) return;
        if (['IN', 'NOT_IN'].includes(f.condition)) {
          rules.push({ fieldKey: f.field, condition: f.condition, values: f.value, value: f.value.join(',') });
          return;
        }
        if (f.value.length === 1) {
          rules.push({ fieldKey: f.field, condition: f.condition, value: f.value[0] });
          return;
        }
        if (orMultiValue.includes(f.condition)) {
          const nested = f.value.map(val => ({ fieldKey: f.field, condition: f.condition, value: val }));
          rules.push({ logic: 'OR', rules: nested } as FilterGroup);
        } else if (andMultiValue.includes(f.condition)) {
          const nested = f.value.map(val => ({ fieldKey: f.field, condition: f.condition, value: val }));
          rules.push({ logic: 'AND', rules: nested } as FilterGroup);
        } else {
          rules.push({ fieldKey: f.field, condition: f.condition, value: f.value[0] });
        }
      });
      const filterGroup = rules.length === 1 ? (rules[0] as FilterGroup) : ({ logic: 'AND', rules } as FilterGroup);
      await saveFilter({ name: filterName, entityType: 'quotation', filterGroup }).unwrap();
      customToast.success('Filter saved');
    } catch (e) {
      console.error('Save filter failed', e);
      customToast.error('Failed to save filter');
    }
  };

  const handleDeleteSavedFilter = async (filterId: string) => {
    try {
      await deleteFilter(filterId).unwrap();
      customToast.success('Filter deleted');
    } catch (e) {
      console.error('Delete filter failed', e);
      customToast.error('Failed to delete filter');
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div
          className="w-screen h-screen overflow-hidden flex"
          style={{ backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg }}
        >
          <Sidebar />
          <div className="flex-1 flex flex-col relative min-w-0 w-full">
            <Header />
            <div className='border-t-2 border-b-2 border-l-2 border-red-600 flex-1 m-1 overflow-hidden flex flex-col relative'>
              <div className=' border-b-gray-400 border-b-[0.5px] px-5 py-1 h-fit' style={{ borderBottomColor: isDark ? colors.dark.text : undefined }}>
                <BreadcrumbsNavBar
                  customItems={[
                    { label: 'BizAccelerator', href: '/bizaccelerator' },
                    { label: 'Quotations', href: '/bizaccelerator/quotations' },
                  ]}
                />
              </div>

            {/* Header Title bar (black) */}
            <div
              className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
              style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}
            >
              <Title
                name="Quotation List"
                projectTitleObj={[{ name: 'Export', icon: <></>, onClick: () => setShowExportModal(true) }]}
              />
            </div>

            {/* Toolbar (light grey) */}
            <div
              className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end items-center gap-[6px] h-fit relative'
              style={{ backgroundColor: isDark ? colors.dark.sidebar : undefined }}
            >
              <SearchBoard
                fieldDefinitions={finalFields as unknown as import('@/components/common/SearchBoard').FieldDefinition[]}
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

              <AddFiltersButton
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={activeFilters.length > 0 ? 'bg-red-100 border-gray-400' : ''}
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
                  .map(f => ({ value: f.fieldKey, label: f.displayName, fieldType: f.fieldType, isSearchable: true }))}
                currentFilters={activeFilters}
                onApplyFilters={(filters) => { setActiveFilters(filters); setSavedFilterId(null); setCurrentPage(1); setIsFilterDropdownOpen(false); }}
                savedFilters={(savedFiltersData || []).map(sf => ({ id: sf.id, name: sf.name, isDefault: sf.isDefault }))}
                onLoadSavedFilter={handleLoadSavedFilter}
                onSaveFilter={handleSaveCurrentFilter}
                onDeleteSavedFilter={handleDeleteSavedFilter}
              />
            </div>

            {/* Pagination Bar (top) */}
            <div className='mx-5 mt-11 py-2 px-2 rounded flex h-fit min-w-0 overflow-x-auto'>
              <Bar
                total={(currentObj?.pagination?.total ?? initialObj?.pagination?.total ?? rows.length) as number}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setCurrentPage(1); setPageSize(size); }}
                onToggleColumns={() => setShowLessColumns((s) => !s)}
                showLessColumns={showLessColumns}
              />
            </div>

            {/* Table */}
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
                  onSortChange={(next) => { setSort(next); setCurrentPage(1); }}
                  loading={false}
                  columnWidths={columnWidths}
                  onColumnResize={handleColumnResize}
                  onRenameColumn={handleRenameColumn}
                  onColumnOrderChange={handleReorderColumns}
                  onToggleColumnVisibility={handleToggleColumnVisibility}
                  pinnedColumnKeys={[ 'quotationName', 'name' ]}
                  selectable={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entityLabel="quotations"
        fields={finalFields}
        rows={rows as Array<Record<string, unknown>>}
        fetchAll={fetchAllForExport}
      />
      </div>
    </ProtectedRoute>
  );
};

export default QuotationsPage;
