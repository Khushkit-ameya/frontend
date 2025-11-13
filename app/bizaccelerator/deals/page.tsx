"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/common/Sidebar/Sidebar';
import Header from '../../../components/common/Header';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FinalTable from '../../../components/common/CommonTable';
import { KanbanBoard } from '@/components/BizAccelerator/Kanban';
import StatusDropdown from '../../../components/dropdowns/StatusDropdown';
import { useTheme } from '../../../store/hooks';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';
import { customToast } from '../../../utils/toast';
import ViewIcon from '../../../components/ui buttons/ViewButton';
import DealOpportunitiesModal from '../../../components/common/DealOpportunitiesModal';
import dynamic from 'next/dynamic';
import DealsApi from '../../../store/api_query/deals.api';
import FieldDefinitionsApi from '../../../store/api_query/field_definitions.api';
import { useDispatch_ } from '../../../store';

// API hooks
import {
  useGetDealsQuery,
  useGetDealFieldsQuery,
  useUpdateDealMutation,
  useReorderDealFieldsMutation,
  useUpdateDealFieldMutation,
  useFilterDealsMutation,
  useGetDealQuery,
  useCreateDealMutation,
  useGetDealUpdatesQuery,
  useAddDealUpdateMutation,
  useEditDealUpdateMutation,
  useDeleteDealMutation,
  useGetDealOpportunitiesQuery,
} from '../../../store/api_query/deals.api';
import {
  useGetFieldDefinitionsByEntityQuery,
  useAddDropdownChoiceMutation,
  useUpdateDropdownChoiceMutation,
  useReorderDropdownChoicesMutation,
  useDeleteDropdownChoiceMutation,
} from '../../../store/api_query/field_definitions.api';

import PhoneValue from '../../../components/common/FieldType/components/PhoneValue';
import EmailValue from '../../../components/common/FieldType/components/EmailValue';
import UrlValue from '../../../components/common/FieldType/components/UrlValue';
import TextValue from '../../../components/common/FieldType/components/TextValue';
import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { Edit } from 'lucide-react';
import NotesIcon from '@/components/ui buttons/NotesIcon';
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import Bar from "@/components/Project/PaginationBar";
import SearchBoard from "@/components/common/SearchBoard";
import FilterDropdown, { FilterCondition } from "@/components/common/FilterDropdown";
import PersonButton from '@/components/ui buttons/PersonButton';
import AddFiltersButton from '@/components/ui buttons/AddFiltersButton';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import { useGetSavedFiltersQuery, useSaveFilterMutation, useDeleteFilterMutation } from '@/store/api_query/BizAccelerator/filter.api';
import type { FilterGroup, FilterRule } from '@/store/api_query/BizAccelerator/filter.api';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';

const ManageQuotationsModal = dynamic(() => import('../../../components/BizAccelerator/ManageQuotationsModal'), { ssr: false });

// Dynamic form components
import { FormModal } from '@/components/BizAccelerator/FormModal/FormModal';
import { TabbedFormLayout } from '@/components/BizAccelerator/TabbedFormLayout/TabbedFormLayout';
import { OverviewTabContent } from '@/components/BizAccelerator/TabContents/OverviewTabContent';
import { UpdatesTabContent } from '@/components/BizAccelerator/TabContents/UpdatesTabContent';
import { FilesLinksTabContent } from '@/components/BizAccelerator/TabContents/FilesLinksTabContent';
import { getDynamicFieldConfig } from '@/components/common/forms/DynamicForm/dynamicFieldConfig';
import { useGetActivitiesByEntityQuery } from '../../../store/api_query/BizAccelerator/activities.api';
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";
import { ActivityModal } from '@/components/BizAccelerator/TabContents/ActivityModal';
import type { ActivityData } from '@/components/BizAccelerator/TabContents/ActivityModal';
import { useCreateActivityMutation } from '@/store/api_query/BizAccelerator/activities.api';

// Icons for tabs
import search from "@/public/icons/search 1.svg";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";

interface Deal {
  id: string;
  _id?: string;
  dealName?: string;
  name?: string;
  title?: string;
  createdByName?: string;
  createdBy?: Record<string, unknown>;
  recordId?: string;
  [key: string]: unknown;
}
import { TableTagsRenderer } from '@/components/dropdowns/TableTagsRenderer';
import { Popover, TextField, Button } from '@mui/material';
import DatePicker from '../../../components/common/DatePicker';
import ExportModal from '@/components/common/ExportModal';
import DescriptionModal from '../../../components/common/DescriptionModal';
import DeleteConfirmationModal from '../../../components/common/DeleteConfirmationModal';

type EditableTagsCellProps = { tags: unknown; onCommit: (newTags: string[]) => Promise<void> };
const EditableTagsCell: React.FC<EditableTagsCellProps> = ({ tags, onCommit }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [input, setInput] = React.useState('');
  const normalized = React.useMemo(() => {
    if (!tags) return [] as string[];
    const toArray = (v: unknown) => Array.isArray(v) ? v : typeof v === 'object' ? [v] : typeof v === 'string' ? (() => { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch { return [v]; } })() : [];
    const arr = toArray(tags);
    return arr.map((t: unknown) => typeof t === 'object' ? ((t as Record<string, unknown>).label || (t as Record<string, unknown>).value || '') : String(t)).filter(Boolean) as string[];
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

const DealsPage: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();

  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealName, setSelectedDealName] = useState<string>('');
  // Manage Quotations modal state
  const [isQuotationsModalOpen, setIsQuotationsModalOpen] = useState(false);
  const [quotationsDealId, setQuotationsDealId] = useState<string | null>(null);
  const [quotationsDealName, setQuotationsDealName] = useState<string>('');

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeView, setActiveView] = useState<"default" | "email" | "signature">("default");

  // Search and column filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilterId, setSavedFilterId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Column visibility: Show Less (first 6 by displayOrder)
  const [showLessColumns, setShowLessColumns] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionRow, setDescriptionRow] = useState<Record<string, unknown> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  // Activity modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'meeting' | 'call' | 'notes' | 'todo' | 'email'>('call');

  // Queries
  const { data: allFieldsFull } = useGetFieldDefinitionsByEntityQuery('deal');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetDealFieldsQuery();
  const [filterDeals, { data: dealsData, isLoading: dealsLoading }] = useFilterDealsMutation();
  const { data: initialDealsData, isLoading: initialDealsLoading } = useGetDealsQuery({
    page,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
    includeConverted: false,
  });

  const DealKanbanCard: React.FC<{ row: Record<string, unknown> }> = ({ row }) => {
    const dealId = String((row?.id as string) ?? (row?._id as string) ?? '');
    const { data: oppsData } = useGetDealOpportunitiesQuery(dealId, { skip: !dealId });
    const opps = (oppsData as Array<Record<string, unknown>> | undefined) ?? [];
    const firstName = String(opps[0]?.name || opps[0]?.title || opps[0]?.recordId || '').trim();
    const extra = Math.max(0, opps.length - 1);
    const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}...` : s);
    const openLinkOpp = () => {
      if (!dealId) return;
      setSelectedDealId(dealId);
      setSelectedDealName(String(row?.dealName || row?.name || row?.title || 'Deal'));
      setLinkModalOpen(true);
    };
    const defsByKey = useMemo(() => Object.fromEntries(finalFields.map((f) => [f.fieldKey, f])), [finalFields]);
    const emailDef = defsByKey['email'];
    const dealValDef = (defsByKey['dealValue']
      ?? defsByKey['value']
      ?? defsByKey['amount']
      ?? finalFields.find((f) => f.fieldType === 'CURRENCY' || /deal\s*value|amount|value/i.test(String(f.displayName)))) as FieldDefinition | undefined;
    const phoneDef = (defsByKey['phone']
      ?? finalFields.find((f) => f.fieldType === 'PHONE' || /phone/i.test(String(f.displayName)))) as FieldDefinition | undefined;
    const [dvEditing, setDvEditing] = useState(false);
    const initialDealVal = String(row?.[dealValDef?.fieldKey as keyof typeof row] ?? '');
    const [dv, setDv] = useState(initialDealVal);
    useEffect(() => { setDv(String(row?.[dealValDef?.fieldKey as keyof typeof row] ?? '')); }, [row, dealValDef?.fieldKey]);
    const commitDealValue = async () => {
      if (!dealValDef) return;
      const id = dealId;
      if (!id) return;
      const prevSnap = row as Record<string, unknown>;
      const cleaned = dv.replace(/[^0-9.\-]/g, '');
      const numeric = Number(cleaned);
      const val = Number.isFinite(numeric) ? numeric : 0;
      await optimisticCellUpdate(
        id,
        prevSnap,
        { [dealValDef.fieldKey]: val },
        () => updateDeal({ dealId: id, data: makeUpdateBody(dealValDef, prevSnap, val) }).unwrap()
      );
      setDv(String(val));
    };
    return (
      <div className={[ 'text-card-foreground overflow-hidden bg-white shadow-sm border border-gray-200 rounded-xl', 'transition-all duration-200 relative select-none px-3 hover:shadow-md hover:border-gray-400', 'pt-[0.4375rem] pb-1.5 w-full' ].join(' ')}>
        <button type="button" onClick={() => handleEditDeal(row)} className="absolute top-2 right-2 p-1.5 rounded hover:bg-gray-100" title="Notes" aria-label="Notes">
          <NotesIcon />
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm leading-tight truncate" title={String(row?.dealName || row?.name || row?.title || '')}>
              {String(row?.dealName || row?.name || row?.title || '')}
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-600">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 text-[11px] text-gray-500">Opportunity</span>
              <button type="button" onClick={openLinkOpp} className="truncate flex-1 hover:underline text-left h-5" style={{ color: '#C81C1F' }}>
                {opps.length === 0 ? 'Link Opportunity' : `${trunc(firstName, 14)}${extra > 0 ? ` +${extra}` : ''}`}
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
                      const id = dealId;
                      if (!id) return;
                      const prevSnap = row as Record<string, unknown>;
                      await optimisticCellUpdate(
                        id,
                        prevSnap,
                        { [phoneDef.fieldKey]: next },
                        () => updateDeal({ dealId: id, data: makeUpdateBody(phoneDef, prevSnap, next) }).unwrap()
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
                      const id = dealId;
                      if (!id) return;
                      const prevSnap = row as Record<string, unknown>;
                      await optimisticCellUpdate(
                        id,
                        prevSnap,
                        { [emailDef.fieldKey]: next },
                        () => updateDeal({ dealId: id, data: makeUpdateBody(emailDef, prevSnap, next) }).unwrap()
                      );
                    }}
                  />
                </div>
              </div>
            )}
            {dealValDef && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-[11px] text-gray-500">Deal Value</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-gray-700">$</span>
                  {dvEditing ? (
                    <input
                      autoFocus
                      value={dv}
                      onChange={(e) => setDv(e.target.value.replace(/[^0-9.\-]/g, ''))}
                      onKeyDown={async (e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { await commitDealValue(); setDvEditing(false); }
                        else if (e.key === 'Escape') { setDv(initialDealVal); setDvEditing(false); }
                      }}
                      onBlur={async () => { await commitDealValue(); setDvEditing(false); }}
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-[80px] bg-transparent border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      inputMode="decimal"
                    />
                  ) : (
                    <button type="button" className="truncate text-left w-full" onClick={() => setDvEditing(true)}>
                      {(() => {
                        const raw = row?.[dealValDef.fieldKey as keyof typeof row];
                        const num = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/[^0-9.\-]/g, ''));
                        return Number.isFinite(num) ? num.toLocaleString() : String(raw ?? '');
                      })()}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const [currentDealsData, setCurrentDealsData] = useState<unknown>(null);
  const [updateField] = useUpdateDealFieldMutation();
  const [reorderFields] = useReorderDealFieldsMutation();
  const [updateDeal] = useUpdateDealMutation();
  const [deleteDeal] = useDeleteDealMutation();

  // Deal mutations
  const [createDeal] = useCreateDealMutation();
  const { data: selectedDealData } = useGetDealQuery(
    selectedDealId || '',
    { skip: !selectedDealId }
  );

  // Dropdown CRUD mutations
  const [addChoice] = useAddDropdownChoiceMutation();
  const [updateChoice] = useUpdateDropdownChoiceMutation();
  const [reorderChoices] = useReorderDropdownChoicesMutation();
  const [deleteChoice] = useDeleteDropdownChoiceMutation();

  const { data: savedFiltersData } = useGetSavedFiltersQuery('deal');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();

  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  const { data: companyUsersData } = useGetCompanyUsersQuery({});
  const dispatch = useDispatch_();

  // Activities and updates queries
  const { data: activitiesResponse } = useGetActivitiesByEntityQuery(
    { entityType: 'deal', entityId: (editData?.id as string) || '' },
    { skip: !isFormModalOpen || !editData?.id }
  );

  const { data: updatesData, isLoading: updatesLoading } = useGetDealUpdatesQuery(
    (editData?.id as string) || '',
    { skip: !isFormModalOpen || !editData?.id }
  );

  const [addDealUpdate] = useAddDealUpdateMutation();
  const [editDealUpdate] = useEditDealUpdateMutation();
  const [createActivityMutation] = useCreateActivityMutation();

  const activitiesData = ((activitiesResponse as { data?: { items?: unknown[] }, items?: unknown[] } | undefined)?.data?.items) ?? ((activitiesResponse as { items?: unknown[] } | undefined)?.items) ?? [];

  const initialDealsObj = initialDealsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentDealsObj = currentDealsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const fieldsRawArray = useMemo(() => {
    const fr = fieldsRaw as unknown;
    if (Array.isArray(fr)) return fr as unknown[];
    const items = (fr as { items?: unknown[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  }, [fieldsRaw]);

  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    let fields: FieldDefinition[] = [];
    if (fromShared.length > 0) {
      fields = mapBackendListToFrontend(fromShared as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    } else {
      const fromApi = fieldsRawArray as unknown[];
      const fromData = ((currentDealsObj?.fieldDefinitions ?? []) as unknown[]);
      const mergedByKey = new Map<string, Record<string, unknown>>();
      [...fromApi, ...fromData].forEach((f: unknown) => {
        if (!f || typeof f !== 'object') return;
        const fObj = f as Record<string, unknown>;
        if (!fObj.fieldKey || typeof fObj.fieldKey !== 'string') return;
        mergedByKey.set(fObj.fieldKey, { ...mergedByKey.get(fObj.fieldKey), ...fObj });
      });
      fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    }
    const hasManageQuotations = fields.some((f) => String(f.fieldKey) === 'manageQuotations');
    const extras: FieldDefinition[] = [];
    if (!hasManageQuotations) {
      extras.push({
        fieldKey: 'manageQuotations',
        displayName: 'Manage Quotations',
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
        columnWidth: 'w-[180px]',
        defaultValue: null,
      } as unknown as FieldDefinition);
    }
    extras.push({
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
    } as unknown as FieldDefinition);
    return [
      ...fields,
      ...extras,
    ];
  }, [allFieldsFull, fieldsRawArray, currentDealsObj?.fieldDefinitions]);

  // Determine the status field (dealStage preferred, fallback to any field named like status/stage)
  const statusField = useMemo(() => {
    const lc = (s?: string) => String(s || '').toLowerCase();
    const byKey = (finalFields || []).find((f) => ['dealstage', 'status', 'stage'].includes(lc(f.fieldKey)));
    if (byKey) return byKey;
    const byName = (finalFields || []).find((f) => /status|stage/.test(lc(f.displayName)));
    return byName;
  }, [finalFields]);

  // Build Kanban columns from status dropdown choices
  const kanbanColumns = useMemo(() => {
    if (!statusField) return [] as { id: string; title: string; value: string; color?: string }[];
    const choices = (((statusField.options as Record<string, unknown> | undefined)?.choices) ?? []) as Array<Record<string, unknown> | string>;
    return choices.map((c) => {
      if (typeof c === 'string') return ({ id: c, title: c, value: c, color: '#6b7280' });
      const value = String((c as Record<string, unknown>).value ?? '');
      const title = String((c as Record<string, unknown>).label ?? value);
      const color = String((c as Record<string, unknown>).color ?? '#6b7280');
      return { id: value, title, value, color };
    });
  }, [statusField?.options]);

  // Determine deal value field for computing column sums
  const dealValueField = useMemo(() => {
    const defsByKey = Object.fromEntries((finalFields || []).map((f) => [f.fieldKey, f] as const));
    return (defsByKey['dealValue']
      ?? defsByKey['value']
      ?? defsByKey['amount']
      ?? (finalFields || []).find((f) => f.fieldType === 'CURRENCY' || /deal\s*value|amount|value/i.test(String(f.displayName)))) as FieldDefinition | undefined;
  }, [finalFields]);

  // Transform fields for form
  const formFields = useMemo(() => {
    if (!Array.isArray(fieldsRawArray) || fieldsRawArray.length === 0) {
      return [];
    }

    const transformedFields = fieldsRawArray
      .filter((field: unknown) => {
        const f = field as Record<string, unknown>;
        return f &&
          f.fieldKey &&
          f.fieldType &&
          f.isVisible !== false &&
          f.fieldKey !== 'filesLinks';
      })

      .map((field: unknown) => {
        const f = field as Record<string, unknown>;
        const dynamicConfig = getDynamicFieldConfig(
          f.fieldKey as string,
          f.fieldType as 'TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'URL' | 'DATE' | 'DATE_TIME' | 'TEXTAREA' | 'DROPDOWN' | 'MULTISELECT' | 'CHECKBOX' | 'RADIO' | 'CURRENCY',
          f.displayName as string
        );

        const transformedOptions: Record<string, unknown> = {};

        if (f.options) {
          const opts = f.options as Record<string, unknown>;
          if (opts.choices && Array.isArray(opts.choices)) {
            transformedOptions.choices = opts.choices.map((choice: unknown) => {
              const c = choice as Record<string, unknown>;
              return {
                value: c.value || choice,
                label: (c.label as string) || String(c.value || choice),
                color: c.color as string
              };
            });
          }

          if (opts.placeholder) transformedOptions.placeholder = opts.placeholder;
          if (opts.rows) transformedOptions.rows = opts.rows;
          if (opts.multiple) transformedOptions.multiple = opts.multiple;
          if (opts.allowCustomTags) transformedOptions.allowCustom = opts.allowCustomTags;

          Object.keys(opts).forEach(key => {
            if (!['choices', 'placeholder', 'rows', 'multiple', 'allowCustomTags'].includes(key)) {
              transformedOptions[key] = opts[key];
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
      .sort((a: unknown, b: unknown) => ((a as Record<string, unknown>).displayOrder as number || 0) - ((b as Record<string, unknown>).displayOrder as number || 0));

    const hasLinkOpportunity = transformedFields.some(field =>
      (field as Record<string, unknown>).fieldKey === 'linkOpportunity'
    );
    if (!hasLinkOpportunity) {
      transformedFields.push({
        fieldKey: 'linkOpportunity',
        displayName: 'Link Opportunity', // Changed from 'Create Deal'
        fieldType: 'BUTTON',
        isRequired: false,
        isEditable: true,
        isReadOnly: false,
        options: {},
        displayOrder: transformedFields.length + 1,
        helpText: 'Link opportunities to this deal',
        fieldId: 'link-opportunity-field',
        id: 'link-opportunity-field',
        icon: '🔗', // Changed from money emoji
        tooltip: 'Link Opportunity',
        iconBg: "#C81C1F",
      });
    }
    return transformedFields;
  }, [fieldsRawArray]);

  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    return [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
  }, [finalFields, showLessColumns]);

  const rows = ((currentDealsObj?.items ?? initialDealsObj?.items) ?? []) as Record<string, unknown>[];
  const loading = (viewMode === 'kanban') ? (fieldsLoading) : (fieldsLoading || dealsLoading || initialDealsLoading);
  // Column Width Manager: adjust per fieldKey (px)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    dealName: 200,
    name: 260,
    email: 280,
    phone: 200,
    dealStage: 180,
    priority: 160,
    createdByName: 180,
    createdBy: 180,
    createdById: 180,
    createdAt: 160,
    updatedAt: 160,
    filesLinks: 140,
    linkOpportunity: 200,
    alternatePhone: 200,
    dealValue: 160,
    closeProbability: 190,
    expectedValue: 190,
    actualDealValue: 190,
    reasonType: 190,
    action: 150,
    manageQuotations: 180,

  });

  // Form submission handler
  const handleFormSubmit = async (values: Record<string, unknown>) => {
    try {
      if (userLoading) {
        customToast.info("Please wait while we load your user information");
        return;
      }

      if (!currentUser?.id && !isEditMode) {
        customToast.error("User information not available. Please refresh and try again.");
        return;
      }

      if (isEditMode && editData?.id) {
        await updateDeal({
          dealId: editData.id as string,
          data: values
        }).unwrap();
        customToast.success("Deal updated successfully!");
        await refetchDeals();
      } else {
        const userId = currentUser?.id;
        if (!userId) {
          customToast.error("User information not available. Please refresh and try again.");
          return;
        }

        const createData = {
          ...values,
          createdBy: userId
        };

        await createDeal({ data: createData }).unwrap();
        customToast.success("Deal created successfully!");
        await refetchDeals();
      }

      setIsFormModalOpen(false);
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to save deal:", error);
      customToast.error(err?.data?.message || "Failed to save deal");
    }
  };

  // Dropdown CRUD handlers for form
  const handleAddDropdownOption = async (fieldId: string, option: { displayName: string; color: string }) => {
    try {
      await addChoice({
        fieldId,
        value: option.displayName.toLowerCase().replace(/\s+/g, '_'),
        label: option.displayName,
        color: option.color,
        order: Date.now()
      }).unwrap();
      customToast.success("Dropdown option added successfully!");
      await refetchDeals();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to add dropdown option:", error);
      customToast.error(err?.data?.message || "Failed to add dropdown option");
    }
  };

  const handleUpdateDropdownOption = async (fieldId: string, value: string, updates: { displayName?: string; color?: string }) => {
    try {
      await updateChoice({
        fieldId,
        value,
        updates: {
          ...(updates.displayName && { label: updates.displayName }),
          ...(updates.color && { color: updates.color })
        }
      }).unwrap();
      customToast.success("Dropdown option updated successfully!");
      await refetchDeals();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to update dropdown option:", error);
      customToast.error(err?.data?.message || "Failed to update dropdown option");
    }
  };

  const handleReorderDropdownOptions = async (fieldId: string, orderedOptions: Array<{ fieldKey: string; displayName: string; color: string }>) => {
    try {
      const choices = orderedOptions.map((option, index) => ({
        value: option.fieldKey,
        order: index + 1,
        label: option.displayName,
        color: option.color
      }));

      await reorderChoices({
        fieldId,
        choices
      }).unwrap();
      customToast.success("Dropdown options reordered successfully!");
      await refetchDeals();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to reorder dropdown options:", error);
      customToast.error(err?.data?.message || "Failed to reorder dropdown options");
    }
  };

  const handleDeleteDropdownOption = async (fieldId: string, value: string) => {
    try {
      await deleteChoice({ fieldId, value }).unwrap();
      customToast.success("Dropdown option deleted successfully!");
      await refetchDeals();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to delete dropdown option:", error);
      customToast.error(err?.data?.message || "Failed to delete dropdown option");
    }
  };

  // Add and Edit deal handlers
  const handleAddDeal = () => {
    setIsEditMode(false);
    setEditData(null);
    setActiveTab("overview");
    setIsFormModalOpen(true);
  };

  const handleEditDeal = (dealData: Record<string, unknown>) => {
    setIsEditMode(true);
    setEditData(dealData);
    setActiveTab("overview");
    setIsFormModalOpen(true);

    if (dealData?.id) {
      setSelectedDealId(dealData.id as string);
    }
  };

  // Updates handlers
  const handleCreateDealUpdate = async (content: string) => {
    if (!editData?.id) {
      customToast.error("No deal selected");
      return;
    }

    try {
      await addDealUpdate({
        dealId: editData.id as string,
        content: content
      }).unwrap();
      customToast.success("Update added successfully");
      await refetchDeals();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to add update:", error);
      customToast.error(err?.data?.message || "Failed to add update");
    }
  };

  const handleEditDealUpdate = async (updateId: string, content: string) => {
    if (!editData?.id) {
      customToast.error("No deal selected");
      return;
    }

    try {
      await editDealUpdate({
        dealId: editData.id as string,
        updateId: updateId,
        content: content
      }).unwrap();
      customToast.success("Update edited successfully");
      await refetchDeals();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to edit update:", error);
      customToast.error(err?.data?.message || "Failed to edit update");
    }
  };

  // Activity modal handler
  const handleOpenActivityModal = (type: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => {
    if (!editData?.id) {
      customToast.error("Please select a deal first");
      return;
    }

    setActivityModalType(type);
    setIsActivityModalOpen(true);
  };

  // Support linking opportunities from the form
  const handleOpenOpportunitiesModalFromForm = (dealData: Record<string, unknown>) => {
    const dealId = (dealData?.id ?? dealData?._id) as string;
    if (!dealId) {
      customToast.error("No deal selected");
      return;
    }
    setSelectedDealId(dealId);
    const name = dealData?.dealName || dealData?.name || dealData?.title || dealData?.recordId || 'Deal';
    setSelectedDealName(String(name));
    setLinkModalOpen(true);
  };

  // Activity creation handler
  const handleCreateActivity = async (activityPayload: ActivityData): Promise<void> => {
    try {
      if (!currentUser?.id) {
        throw new Error('User information not available');
      }

      const type = activityPayload.type as string | undefined;
      const apiPayload: Record<string, unknown> = {
        type: type?.toUpperCase(),
        subject: activityPayload.subject || (activityPayload as unknown as { title?: string }).title,
        description: activityPayload.description || '',
        scheduledAt: activityPayload.scheduledAt,
        duration: parseInt(String(activityPayload.duration || 30)),
        status: 'SCHEDULED',
        priority: activityPayload.priority || 'MEDIUM',
        assignedToId: currentUser.companyUserId,
        createdBy: currentUser.id,
      };
      if (activityPayload.dealId) apiPayload.dealId = activityPayload.dealId;
      if (activityPayload.opportunityId) apiPayload.opportunityId = activityPayload.opportunityId;
      if (activityPayload.leadId) apiPayload.leadId = activityPayload.leadId;
      if (activityPayload.contactId) apiPayload.contactId = activityPayload.contactId;

      const subject = apiPayload.subject as string | undefined;
      if (!subject?.trim()) {
        throw new Error('Subject is required');
      }

      if (!apiPayload.scheduledAt) {
        throw new Error('Scheduled date is required');
      }

      await createActivityMutation(apiPayload as unknown as { type: 'EMAIL' | 'MEETING' | 'CALL' | 'NOTE' | 'TASK'; subject: string; title: string; description?: string; scheduledAt: string; duration: number; status: string; priority: string; assignedToId: string; createdBy: string; dealId?: string; opportunityId?: string; leadId?: string; contactId?: string; }).unwrap();
      customToast.success("Activity created successfully!");
      setIsActivityModalOpen(false);
    } catch (error) {
      const err = error as { data?: { message?: string }, message?: string };
      console.error('Failed to create activity:', error);
      customToast.error(err?.data?.message || err?.message || "Failed to create activity");
      throw error;
    }
  };

  // Modal title and tabs configuration
  const getModalTitle = () => {
    if (activeView === "email") return "New Email";
    if (activeView === "signature") return "Email Signature";
    return isEditMode ? "Edit Deal" : "Create Deal";
  };

  const getTabs = () => {
    const baseTabs = [
      {
        key: "overview",
        label: "Overview",
        icon: search,
        component: OverviewTabContent,
        componentProps: {
          formFields,
          onSubmit: handleFormSubmit,
          isEditMode,
          initialValues: editData || {},
          className: "h-full",
          isLoading: fieldsLoading,
          activitiesData: activitiesData,
          dealId: editData?.id,
          onAddActivity: handleOpenActivityModal,
          activeView: activeView,
          onViewChange: setActiveView,
          onAddDropdownOption: handleAddDropdownOption,
          onUpdateDropdownOption: handleUpdateDropdownOption,
          onReorderDropdownOptions: handleReorderDropdownOptions,
          onDeleteDropdownOption: handleDeleteDropdownOption,
          onLinkOpportunity: handleOpenOpportunitiesModalFromForm,

        },
        disabled: false
      },
      {
        key: "updates",
        label: "Updates",
        icon: home,
        component: UpdatesTabContent,
        componentProps: {
          className: "h-full",
          dealId: isEditMode && editData?.id ? editData.id : undefined,
          updatesData: updatesData || [],
          isLoading: updatesLoading,
          onCreateUpdate: handleCreateDealUpdate,
          onEditUpdate: handleEditDealUpdate,
        },
        disabled: !isEditMode || activeView !== "default"
      },
      {
        key: "files/links",
        label: "Files / Links",
        icon: update,
        component: FilesLinksTabContent,
        componentProps: {
          className: "h-full"
        },
        disabled: !isEditMode || activeView !== "default"
      },
    ];

    if (activeView !== "default") {
      return baseTabs.filter(tab => !tab.disabled);
    }

    return baseTabs;
  };

  const shouldShowBackButton = activeView !== "default";

  // Filter transformations
  const transformFiltersToBackendFormat = (filters: FilterCondition[]): FilterGroup | null => {
    if (filters.length === 0) return null;

    const noValueConditions = [
      'IS_EMPTY',
      'IS_NOT_EMPTY',
      'IS_TODAY',
      'IS_YESTERDAY',
      'IS_THIS_WEEK',
      'IS_LAST_WEEK',
      'IS_NEXT_WEEK',
      'IS_THIS_MONTH',
      'IS_LAST_MONTH',
      'IS_NEXT_MONTH',
      'IS_TRUE',
      'IS_FALSE',
    ];

    const rules: Array<FilterRule | FilterGroup> = filters.map((filter) => {
      if (!noValueConditions.includes(filter.condition)) {
        if (['IN', 'NOT_IN'].includes(filter.condition)) {
          return {
            fieldKey: filter.field,
            condition: filter.condition,
            values: filter.value,
            value: filter.value.join(','),
          } as FilterRule;
        }
        return {
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0] || '',
        } as FilterRule;
      }
      return {
        fieldKey: filter.field,
        condition: filter.condition,
        value: '',
      } as FilterRule;
    });

    const logic = (filters[0]?.logicalOperator || 'AND') as 'AND' | 'OR';
    return { logic, rules };
  };

  const transformBackendFiltersToFrontend = (filterGroup: unknown): FilterCondition[] => {
    const group = filterGroup as { logic?: string; rules?: unknown[] };
    if (!group || !group.rules) return [];

    const logic = group.logic || 'AND';

    return group.rules.map((rule: unknown, index: number) => {
      const r = rule as { logic?: string; rules?: unknown[]; values?: unknown[]; value?: unknown; fieldKey?: string; condition?: string };
      // Handle nested groups
      if (r.logic && r.rules) {
        return transformBackendFiltersToFrontend(rule);
      }

      const value = r.values || (r.value ? [r.value] : []);

      return {
        id: `filter-${Date.now()}-${index}`,
        field: r.fieldKey as string,
        condition: r.condition as string,
        value: Array.isArray(value) ? value.map(v => String(v)) : [String(value)],
        logicalOperator: logic as 'AND' | 'OR'
      };
    }).flat();
  };

  const handleLoadSavedFilter = async (filterId: string) => {
    try {
      // Find the saved filter from the list
      const savedFilter = savedFiltersData?.find(f => f.id === filterId);

      if (!savedFilter) {
        customToast.error('Saved filter not found');
        return;
      }

      // Transform the filter definition to frontend format
      const transformedFilters = transformBackendFiltersToFrontend(
        savedFilter.filterDefinition
      );

      // Populate the filter conditions
      setActiveFilters(transformedFilters);
      setSavedFilterId(filterId);

    } catch (error) {
      console.error('Failed to load saved filter:', error);
      customToast.error('Failed to load saved filter');
    }
  };

  const buildSearchFilterRules = useMemo<FilterGroup | null>(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;
    const rules: FilterRule[] = selectedColumns.map((columnKey) => ({
      fieldKey: columnKey,
      condition: 'CONTAINS',
      value: searchQuery,
    }));
    return { logic: 'OR', rules };
  }, [searchQuery, selectedColumns]);

  const buildAdvancedFilterRules = useMemo(() => {
    const validFilters = activeFilters.filter(f => {
      const noValueConditions = [
        'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
        'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'
      ];
      if (noValueConditions.includes(f.condition)) return true;
      return f.value && f.value.length > 0;
    });

    if (validFilters.length === 0) return null;

    const transformed = transformFiltersToBackendFormat(validFilters);
    return transformed;
  }, [activeFilters]);

  const availablePersonFilterFields = useMemo(() => {
    // Always provide both options - backend supports filtering even if fields aren't visible
    return ['assignedTo', 'createdBy'] as Array<'assignedTo' | 'createdBy'>;
  }, []);

  // Transform users data for PersonFilterModal
  const peopleForFilter = useMemo(() => {
    if (!companyUsersData?.users) return [];

    return companyUsersData.users.map((user: unknown) => {
      const u = user as Record<string, unknown>;
      return {
        id: u.id as string,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email as string,
        email: u.email as string,
        role: u.role,
        avatar: u.avatar as string
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

  // NEW: Build filter rules from search query and selected columns
  const buildFilterRules = useMemo(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;

    // Build filter group with OR logic (match any column)
    const rules = selectedColumns.map(columnKey => ({
      fieldKey: columnKey,
      condition: 'CONTAINS',
      value: searchQuery
    }));

    return {
      logic: 'OR' as const,
      rules
    };
  }, [searchQuery, selectedColumns]);

  // NEW: Fetch deals whenever filters change
  useEffect(() => {
    if (!hasActiveSearchOrFilters && !savedFilterId) {
      // No filters, just use filterDeals with basic params
      const fetchBasicDeals = async () => {
        try {
          const params: Record<string, unknown> = {
            page,
            limit: pageSize,
            sortBy: sort?.field || 'createdAt',
            sortOrder: sort?.direction || 'desc',
            includeConverted: false,
          };
          const result = await filterDeals(params).unwrap();
          setCurrentDealsData(result);
        } catch (error) {
          console.error('Failed to fetch deals:', error);
          customToast.error('Failed to load deals');
        }
      };
      fetchBasicDeals();
      return;
    }

    const fetchDeals = async () => {
      try {
        const params: Record<string, unknown> = {
          page,
          limit: pageSize,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
          includeConverted: false,
        };

        if (savedFilterId) {
          params.savedFilterId = savedFilterId;
        } else {
          const filterRules = [];

          if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules);
          if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules);
          if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules);

          if (filterRules.length > 0) {
            params.filterGroup = filterRules.length === 1
              ? filterRules[0]
              : ({
                logic: 'AND',
                rules: filterRules as (FilterGroup | FilterRule)[]
              } as FilterGroup);
          }
        }

        const result = await filterDeals(params).unwrap();
        setCurrentDealsData(result);
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        customToast.error('Failed to load deals');
      }
    };

    fetchDeals();
  }, [
    searchQuery,
    selectedColumns,
    sort,
    activeFilters,
    selectedPeopleIds,
    personFilterField,
    filterDeals,
    savedFilterId,
    page,
    pageSize
  ]);

  // Reset to first page whenever criteria change
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [searchQuery, selectedColumns, JSON.stringify(activeFilters), selectedPeopleIds, personFilterField, savedFilterId, sort?.field, sort?.direction]);

  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setPage(1);
    setSelectedPeopleIds(selectedIds);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setPage(1);
    setPersonFilterField(field);
  };

  // Centralized refetch to immediately refresh the deals list after a mutation
  const refetchDeals = async () => {
    try {
      const params: Record<string, unknown> = {
        page,
        limit: pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: sort?.direction || 'desc',
        includeConverted: false,
      };

      if (savedFilterId) {
        params.savedFilterId = savedFilterId;
      } else {
        if (buildSearchFilterRules && buildAdvancedFilterRules) {
          params.filterGroup = ({
            logic: 'AND',
            rules: [buildSearchFilterRules, buildAdvancedFilterRules] as (FilterGroup | FilterRule)[],
          } as FilterGroup);
        } else if (buildSearchFilterRules) {
          params.filterGroup = buildSearchFilterRules;
        } else if (buildAdvancedFilterRules) {
          params.filterGroup = buildAdvancedFilterRules;
        }
      }

      const result = await filterDeals(params).unwrap();
      setCurrentDealsData(result);
    } catch (err) {
      console.error('Failed to refetch deals:', err);
    }
  };

  // Include all required dynamic fields for backend validation; add sensible fallbacks
  const makeUpdateBody = (field: FieldDefinition, row: Record<string, unknown>, nextValue: unknown) => {
    const body: Record<string, unknown> = {};
    const requiredDefs = (finalFields || []).filter((f) => f?.isRequired);
    for (const f of requiredDefs) {
      let val = row?.[f.fieldKey];

      // createdBy fallback to createdByName or composed name if available
      if (f.fieldKey === 'createdBy') {
        const createdByName = row?.createdByName as string | undefined;
        const createdByObj = row?.createdBy as Record<string, unknown> | undefined;
        const fullName = typeof createdByName === 'string' && createdByName.trim().length > 0
          ? createdByName
          : createdByObj
            ? [createdByObj.firstName, createdByObj.lastName].filter(Boolean).join(' ').trim()
            : '';
        val = fullName || val;
      }

      // primary required title field typically 'dealName'
      if (f.fieldKey === 'dealName') {
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          const composed = row?.title || row?.name;
          val = (typeof composed === 'string' && composed.trim().length > 0) ? composed : (row?.recordId || 'Deal');
        }
      }

      // Deal stage required in some setups: 'dealStage'
      if (f.fieldKey === 'dealStage') {
        if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
          const stageDef = (finalFields || []).find(ff => ff.fieldKey === 'dealStage');
          const choices = (
            stageDef?.options as
            | { choices?: Array<{ value?: unknown; label?: string; color?: string }> }
            | undefined
          )?.choices || [];
          if (choices.length > 0) {
            const c = choices[0];
            val = { value: c.value, label: c.label ?? String(c.value), color: c.color ?? '#6b7280' };
          } else {
            val = { value: 'draft', label: 'Draft', color: '#6b7280' };
          }
        }
      }

      body[f.fieldKey] = val ?? '';
    }
    body[field.fieldKey] = nextValue; // override edited field
    return body;
  };

  // Optimistic local patching for Monday-like UX (no list refetch on each inline edit)
  const patchDealRowLocally = (dealId: string, patch: Partial<Record<string, unknown>> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
    setCurrentDealsData((prev: unknown) => {
      const prevObj = prev as { items?: unknown[] };
      if (!prevObj?.items) return prev;
      const items = Array.isArray(prevObj.items) ? [...prevObj.items] : [];
      const idx = items.findIndex((r: unknown) => {
        const row = r as Record<string, unknown>;
        return (row?.id ?? row?._id) === dealId;
      });
      if (idx === -1) return prev;
      const before = items[idx] as Record<string, unknown>;
      const nextRow = typeof patch === 'function' ? patch(before) : { ...before, ...patch };
      items[idx] = nextRow;
      return { ...prevObj, items };
    });
  };

  const optimisticCellUpdate = async (
    dealId: string,
    prevRow: Record<string, unknown>,
    localPatch: Partial<Record<string, unknown>>,
    performUpdate: () => Promise<unknown>,
  ) => {
    // apply local change immediately
    patchDealRowLocally(dealId, localPatch);
    try {
      await performUpdate();
    } catch (err) {
      // rollback on failure
      patchDealRowLocally(dealId, prevRow);
      throw err;
    }
  };

  const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
    if (!field.id) return;
    const clean = newName.trim();
    if (!clean || clean === field.displayName) return;
    try {
      await updateField({ fieldId: field.id, data: { displayName: clean } }).unwrap();
      await refetchDeals();
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
      const err = e as { status?: number; data?: { statusCode?: number } };
      const status = err?.status ?? err?.data?.statusCode;
      if (status === 404 || status === 400 || status === 405) {
        try {
          const byKey = new Map(finalFields.map(f => [f.fieldKey, f] as const));
          const updates = orderedFieldKeys
            .map((k, idx) => ({ f: byKey.get(k), order: idx + 1 }))
            .filter((x) => x.f && x.f.id)
            .map(({ f, order }) => updateField({ fieldId: (f as FieldDefinition).id!, data: { displayOrder: order } }).unwrap());
          await Promise.allSettled(updates);
        } catch (e2) {
          console.error('Failed to reorder fields via per-field updates', e2);
        }
      } else {
        console.error('Failed to reorder fields', e);
      }
    }
  };

  const handleOpenOpportunitiesModal = (deal: Record<string, unknown>, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dealId = (deal?.id ?? deal?._id) as string;
    if (!dealId) return;
    setSelectedDealId(dealId);
    const name = deal?.dealName || deal?.name || deal?.title || deal?.recordId || 'Deal';
    setSelectedDealName(String(name));
    setLinkModalOpen(true);
  };

  const handleRowClick = (row: Record<string, unknown>) => {
    if (row?.id) {
      setSelectedDealId(row.id as string);
    }
  };



  const dealTitleBtn = [
    {
      name: "Export",
      icon: <FiPlus />,
      onClick: () => setShowExportModal(true)
    },
    {
      name: "Add Deal",
      icon: <FiPlus />,
      onClick: handleAddDeal
    },
  ];

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
                    { label: 'Deals', href: '/dashboard/biz-accelerator/deals' },

                  ]}
                />
              </div>
              <div
                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                style={{
                  backgroundColor: isDark ? colors.dark.sidebar : undefined
                }}
              >
                <Title projectTitleObj={dealTitleBtn} name="Deal List" />
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
                  className={activeFilters.some(f => f.value.length > 0) ? 'bg-red-100 border-gray-400' : ''}
                />
                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={() => setIsFilterDropdownOpen(false)}
                  fields={finalFields.map(f => ({
                    value: f.fieldKey,
                    label: f.displayName,
                    fieldType: f.fieldType,
                    isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : false
                  }))}
                  currentFilters={activeFilters} // ADD THIS
                  onApplyFilters={(filters) => {
                    setActiveFilters(filters);
                    setIsFilterDropdownOpen(false);
                    setSavedFilterId(null);
                  }}
                  hasActiveFilters={activeFilters.some(f => {
                    const noValueConditions = [
                      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
                      'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'
                    ];
                    if (noValueConditions.includes(f.condition)) return true;
                    return f.value && f.value.length > 0;
                  })}
                  savedFilters={savedFiltersData || []}
                  onLoadSavedFilter={async (filterId: string) => {
                    try {
                      const filter = savedFiltersData?.find(f => f.id === filterId);
                      if (filter) {
                        setActiveFilters(transformBackendFiltersToFrontend((filter as { filterGroup?: unknown }).filterGroup));
                        setSavedFilterId(filter.id);
                      }
                    } catch (e) {
                      console.error('Failed to load saved filter', e);
                    }
                  }}
                  onSaveFilter={async (filterName: string, filters: { id: string; field: string; condition: string; value: string[]; logicalOperator: 'AND' | 'OR' }[]) => {
                    try {
                      const filterGroup = transformFiltersToBackendFormat(filters);
                      if (!filterGroup) {
                        customToast.error('Please add at least one filter condition');
                        return;
                      }

                      await saveFilter({
                        name: filterName,
                        entityType: 'deal',
                        filterGroup: filterGroup,
                        isDefault: false,
                        isShared: false
                      }).unwrap();

                      customToast.success('Filter saved successfully');
                    } catch (error) {
                      console.error('Failed to save filter:', error);
                      customToast.error('Failed to save filter');
                    }
                  }}
                  onDeleteSavedFilter={async (filterId: string) => {
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
                  total={initialDealsObj?.pagination?.total ?? 0}
                  currentPage={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPage(1); setPageSize(size); }}
                  onToggleColumns={() => setShowLessColumns((s) => !s)}
                  showLessColumns={showLessColumns}
                  viewToggle={<ViewModeToggle mode={viewMode} onChange={setViewMode} size={{ width: 105, height: 30 }} />}
                />
              </div>
              <div className="flex items-center gap-3 ml-auto" />

              <div className={[ 'flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 w-full min-w-0 min-h-0', viewMode === 'kanban' ? 'overflow-hidden' : 'overflow-auto' ].join(' ')}>
                {loading ? (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                    <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                  </div>
                ) : viewMode === 'kanban' ? (
                  <KanbanBoard
                    className="h-full"
                    items={rows as Record<string, any>[]}
                    fieldDefinitions={finalFields}
                    columnKey={statusField?.fieldKey || 'dealStage'}
                    columns={kanbanColumns.map(c => ({ id: c.id, title: c.title, value: c.value, color: c.color }))}
                    rowKey="id"
                    addColumnLabel="Add a New Status"
                    onAddColumn={async ({ name, color }) => {
                      try {
                        if (!statusField?.id) return;
                        const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'status';
                        let val = base;
                        const existing = new Set(kanbanColumns.map((c) => String(c.value)));
                        let i = 1;
                        while (existing.has(val)) { val = `${base}_${i++}`; }
                        await addChoice({ fieldId: statusField.id as string, value: val, label: name.trim(), color }).unwrap();
                        customToast.success('Status added');
                        return { id: val, title: name.trim(), value: val, color };
                      } catch (e) {
                        customToast.error('Failed to add status');
                      }
                    }}
                    renderColumnHeader={(title, items, textColor) => (
                      <>
                        <h3 className="font-[500]" style={{ color: textColor }}>{title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ 
                          backgroundColor: textColor === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)', 
                          color: textColor 
                        }}>{items.length}</span>
                      </>
                    )}
                    renderColumnHeaderRight={(title, items, textColor) => {
                      const key = dealValueField?.fieldKey;
                      let sum = 0;
                      if (key) {
                        for (const it of (items as Record<string, unknown>[])) {
                          const raw = it?.[key as keyof typeof it];
                          const num = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/[^0-9.\-]/g, ''));
                          if (Number.isFinite(num)) sum += num as number;
                        }
                      }
                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-[400]" style={{ color: textColor }}>Sum: ${sum.toLocaleString()}</span>
                        </div>
                      );
                    }}
                    renderCard={(row) => <DealKanbanCard row={row as Record<string, unknown>} />}
                    onItemMove={async ({ item, destColumnId }) => {
                      if (!statusField) return;
                      const dealId = String((item as any)?.id ?? (item as any)?._id ?? '');
                      if (!dealId) return;
                      const sel = kanbanColumns.find((c) => String(c.id) === String(destColumnId));
                      if (!sel) return;
                      const current = (item as any)?.[statusField.fieldKey];
                      const objectPayload = { value: sel.value, label: sel.title, color: sel.color } as unknown;
                      const stringPayload = sel.value as unknown;
                      const prevRow = rows.find(r => String((r as any)?.id ?? (r as any)?._id) === dealId) as Record<string, unknown> | undefined;
                      const doUpdate = async (payload: unknown) => {
                        if (prevRow) {
                          await optimisticCellUpdate(
                            dealId,
                            prevRow,
                            { [statusField.fieldKey]: payload },
                            () => updateDeal({ dealId, data: makeUpdateBody(statusField, prevRow, payload) }).unwrap()
                          );
                        } else {
                          patchDealRowLocally(dealId, { [statusField.fieldKey]: payload });
                          await updateDeal({ dealId, data: { [statusField.fieldKey]: payload } }).unwrap();
                        }
                      };
                      try {
                        // try based on current shape first
                        if (current && typeof current === 'object' && 'value' in current) {
                          await doUpdate(objectPayload);
                        } else {
                          await doUpdate(stringPayload);
                        }
                      } catch (_e) {
                        try {
                          // retry with alternative shape
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
                        await reorderChoices({ fieldId: statusField.id as string, choices }).unwrap();
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
                    frozenColumnKeys={["dealName"]}
                    sortConfig={sort}
                    onSortChange={(cfg) => setSort(cfg)}
                    loading={false}
                    columnWidths={columnWidths}
                    onColumnResize={(key, width) => setColumnWidths((prev) => ({ ...prev, [key]: width }))}
                    onRenameColumn={handleRenameColumn}
                    onHideColumn={handleHideColumn}
                    onToggleColumnVisibility={handleToggleColumnVisibility}
                    onColumnOrderChange={handleReorderColumns}
                    getCellRenderer={({ field, row, value }: { field: FieldDefinition; row: Record<string, unknown>; value: unknown }) => {
                      const dealId = row?.id ?? row?._id;

                      if (field.fieldKey === 'action') {
                        return (
                          <div className="flex items-center gap-2 h-6 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDeal(row);
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
                                const id = String(dealId || '');
                                if (!id) return;
                                const name = String(row?.dealName || row?.name || row?.recordId || 'Deal');
                                setToDelete({ id, name });
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
                        const name = String(field.displayName || '').toLowerCase();
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

                      // DATE rendering with DatePicker
                      if (field.fieldType === 'DATE') {
                        const v = typeof value === 'string'
                          ? value
                          : (value ? new Date(value as string | number | Date).toISOString().slice(0, 10) : '');
                        return (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DatePicker
                              value={v}
                              onChange={async (newDate: string) => {
                                if (!dealId) return;
                                const prevSnap = row;
                                try {
                                  await optimisticCellUpdate(
                                    dealId as string,
                                    prevSnap,
                                    { [field.fieldKey]: newDate },
                                    () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, newDate) }).unwrap()
                                  );
                                } catch (e) {
                                  console.error('Failed to update deal date', e);
                                  customToast.error('Failed to update date');
                                }
                              }}
                            />
                          </div>
                        );
                      }

                      // Deal name with notes component
                      if (field.fieldKey === 'dealName') {
                        const display = String(value ?? '').trim();
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={display}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, next) }).unwrap()
                                );
                                customToast.success('Deal name updated');
                              } catch (e) {
                                console.error('Failed to update deal name', e);
                                customToast.error('Failed to update name');
                              }
                            }}
                            onNotesClick={() => {
                              handleEditDeal(row); // This should open the edit form
                            }}
                          />
                        );
                      }

                      // Link Opportunity button
                      if (field.fieldKey === 'linkOpportunity') {
                        return (
                          <div className="flex items-center justify-center">
                            <button
                              onClick={(e) => handleOpenOpportunitiesModal(row, e)}
                              className="px-3 h-5 text-xs font-medium rounded transition-colors border"
                              style={{ borderColor: '#C81C1F', color: '#C81C1F', backgroundColor: 'transparent' }}
                            >
                              Link Opportunity
                            </button>
                          </div>
                        );
                      }
                      
                       if (field.fieldKey === 'manageQuotations') {
                        return (
                          <div className="flex items-center justify-center">
                            <button
                              onMouseEnter={(e) => { 
                                e.stopPropagation();
                                const el = e.currentTarget as unknown as { __pf?: number; __pfDone?: boolean };
                                if (el.__pfDone) return;
                                el.__pf = window.setTimeout(() => {
                                  const id = String(row?.id || row?._id || '');
                                  if (!id) return;
                                  dispatch(DealsApi.util.prefetch('getDeal', id, { ifOlderThan: 300 }));
                                  dispatch(DealsApi.util.prefetch('getDealOpportunities', id, { ifOlderThan: 300 }));
                                  dispatch(FieldDefinitionsApi.util.prefetch('getFieldDefinitionsByEntity', 'deal', { ifOlderThan: 1800 }));
                                  dispatch(FieldDefinitionsApi.util.prefetch('getFieldDefinitionsByEntity', 'quotation', { ifOlderThan: 1800 }));
                                  import('../../../components/BizAccelerator/ManageQuotationsModal');
                                  el.__pfDone = true;
                                }, 1000);
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as unknown as { __pf?: number };
                                if (el.__pf) { window.clearTimeout(el.__pf); el.__pf = undefined; }
                              }}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const id = String(row?.id || row?._id || '');
                                if (!id) return;
                                setQuotationsDealId(id);
                                setQuotationsDealName(String(row?.dealName || row?.name || row?.title || 'Deal'));
                                setIsQuotationsModalOpen(true);
                              }}
                              className="px-3 h-5 text-xs font-medium rounded transition-colors border"
                              style={{ borderColor: '#C81C1F', color: '#C81C1F', backgroundColor: 'transparent' }}
                            >
                              Manage Quotations
                            </button>
                          </div>
                        );
                      }

                      // Create Deal button (if configured on deals table)
                      if (field.fieldKey === 'createDeal') {
                        return (
                          <div className="flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); customToast.info('Create Deal'); }}
                              className="px-3 h-6 text-xs font-medium text-white rounded transition-colors"
                              style={{ backgroundColor: '#C81C1F' }}
                            >
                              Create Deal
                            </button>
                          </div>
                        );
                      }

                      // Files/Links button
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

                      // Name with Notes Icon for deal name
                      if (field.fieldKey === 'dealName' || field.fieldKey === 'name') {
                        const display = String(value ?? '').trim();
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={display}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, next) }).unwrap()
                                );
                                customToast.success('Deal name updated');
                              } catch (e) {
                                console.error('Failed to update deal name', e);
                                customToast.error('Failed to update name');
                              }
                            }}
                            onNotesClick={() => {
                              handleEditDeal(row);
                            }}
                          />
                        );
                      }

                      // Name with Notes Icon for deal name
                      if (field.fieldKey === 'dealName' || field.fieldKey === 'name') {
                        const display = String(value ?? '').trim();
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={display}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await updateDeal({ dealId: dealId as string, data: updateBody }).unwrap();
                                await refetchDeals();
                              } catch (e) {
                                console.error('Failed to update deal name', e);
                                customToast.error('Failed to update name');
                              }
                            }}
                            onNotesClick={() => {
                              handleEditDeal(row);
                            }}
                          />
                        );
                      }

                      {
                        const key = String(field.fieldKey || '').toLowerCase();
                        const name = String(field.displayName || '').toLowerCase();
                        const isUpdatesCol = key === 'updates' || name === 'updates' || key === 'lastupdate' || key === 'latestupdate';
                        if (isUpdatesCol) {
                          const tryParse = (v: unknown) => {
                            if (Array.isArray(v) || (v && typeof v === 'object')) return v;
                            if (typeof v === 'string') {
                              try { return JSON.parse(v); } catch { return v; }
                            }
                            return v;
                          };
                          const source = tryParse(value) ?? tryParse(row?.updates);
                          let latest: unknown = null;
                          if (Array.isArray(source) && source.length > 0) {
                            latest = source[0];
                          } else if (source && typeof source === 'object') {
                            latest = source;
                          }
                          const latestObj = latest as Record<string, unknown>;
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
                          return (
                            <span className="truncate" title={content}>{content || '-'}</span>
                          );
                        }
                      }

                      if (field.fieldKey === 'tags') {
                        return (
                          <EditableTagsCell
                            tags={value}
                            onCommit={async (newTags: string[]) => {
                              const dealId = row?.id ?? row?._id;
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                const body = makeUpdateBody(field, row, newTags);
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: newTags },
                                  () => updateDeal({ dealId: dealId as string, data: body }).unwrap()
                                );
                                customToast.success('Tags updated');
                              } catch (e) {
                                console.error('Failed to update tags', e);
                                customToast.error('Failed to update tags');
                              }
                            }}
                          />
                        );
                      }

                      // Dropdowns (e.g., dealStage, priority)
                      if (field.fieldType === 'DROPDOWN') {
                        const choices = (field.options as { choices?: unknown[] })?.choices ?? [];
                        const options: { fieldKey: string; displayName: string; color: string }[] = choices.map((c: unknown) => {
                          const choice = c as Record<string, unknown>;
                          return {
                            fieldKey: String(choice.value),
                            displayName: (choice.label as string) ?? String(choice.value),
                            color: (choice.color as string) ?? '#6b7280',
                          };
                        });
                        let currentKey = '';
                        const valueObj = value as Record<string, unknown>;
                        if (value && typeof value === 'object' && valueObj.value) {
                          currentKey = String(valueObj.value);
                        } else {
                          const raw = String(value ?? '');
                          const matched = options.find(o => o.fieldKey === raw) || options.find(o => o.displayName === raw);
                          currentKey = matched ? matched.fieldKey : raw;
                        }
                        const fieldId = field.id;
                        return (
                          <StatusDropdown
                            currentStatus={currentKey}
                            options={options}
                            placeholder={`Select ${field.displayName}`}
                            onStatusChange={async (newKey: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                const sel = options.find((o) => o.fieldKey === newKey);
                                const payload = sel ? { value: sel.fieldKey, label: sel.displayName, color: sel.color } : newKey;
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: payload },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, payload) }).unwrap()
                                );
                                customToast.success('Updated');
                              } catch (e) {
                                console.error('Failed to update dropdown field', e);
                                customToast.error('Failed to update');
                              }
                            }}
                            onUpdateOption={async (choiceKey: string, updates: { displayName?: string; color?: string }) => {
                              try {
                                if (!fieldId) return;
                                const apiUpdates: Record<string, unknown> = {};
                                if (typeof updates.displayName === 'string') apiUpdates.label = updates.displayName;
                                if (typeof updates.color === 'string') apiUpdates.color = updates.color;
                                if (Object.keys(apiUpdates).length === 0) return;
                                await updateChoice({ fieldId, value: choiceKey, updates: apiUpdates }).unwrap();
                                await refetchDeals();
                              } catch (err) {
                                console.error('Failed to update dropdown choice', err);
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
                                await addChoice({ fieldId, value: val, label: opt.displayName, color: opt.color }).unwrap();
                                await refetchDeals();
                              } catch (err) {
                                console.error('Failed to add dropdown choice', err);
                              }
                            }}
                            onDeleteOption={async (choiceKey: string) => {
                              try {
                                if (!fieldId) return;
                                await deleteChoice({ fieldId, value: choiceKey }).unwrap();
                                customToast.success('Dropdown option deleted');
                                await refetchDeals();
                              } catch (err) {
                                console.error('Failed to delete dropdown choice', err);
                                customToast.error('Failed to delete dropdown option');
                              }
                            }}
                            onReorderOptions={async (ordered: { fieldKey: string; displayName: string; color: string }[]) => {
                              try {
                                if (!fieldId) return;
                                const payload = ordered.map((o, idx) => ({ value: o.fieldKey, order: idx + 1, label: o.displayName, color: o.color }));
                                await reorderChoices({ fieldId, choices: payload }).unwrap();
                                await refetchDeals();
                              } catch (err) {
                                console.error('Failed to reorder dropdown choices', err);
                              }
                            }}
                            disabled={false}
                            className="min-w-[140px]"
                          />
                        );
                      }

                      // PHONE inline editing
                      if (field.fieldType === 'PHONE') {
                        return (
                          <PhoneValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, next) }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update deal phone', e);
                              }
                            }}
                          />
                        );
                      }

                      // EMAIL inline editing
                      if (field.fieldType === 'EMAIL') {
                        return (
                          <EmailValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, next) }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update deal email', e);
                              }
                            }}
                          />
                        );
                      }

                      // URL inline editing
                      if (field.fieldType === 'URL') {
                        return (
                          <UrlValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, next) }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update deal URL', e);
                              }
                            }}
                          />
                        );
                      }

                      // Generic TEXT inline editing
                      if (field.fieldType === 'TEXT' && field.fieldKey !== 'dealName' && field.fieldKey !== 'name' && field.fieldKey !== 'title') {
                        return (
                          <TextValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!dealId) return;
                              const prevSnap = row;
                              try {
                                await optimisticCellUpdate(
                                  dealId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateDeal({ dealId: dealId as string, data: makeUpdateBody(field, row, next) }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update text field', e);
                              }
                            }}
                          />
                        );
                      }

                      return <></>;
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal for Deals */}
        <FormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            if (activeView === "default") {
              setIsFormModalOpen(false);
            } else {
              setActiveView("default");
            }
          }}
          title={getModalTitle()}
          size="xl"
          disabled={!isEditMode && activeView === "default"}
          onBack={shouldShowBackButton ? () => setActiveView("default") : undefined}
          showBackButton={shouldShowBackButton}
        >
          <TabbedFormLayout
            tabs={getTabs()}
            activeTab={activeView !== "default" ? "overview" : activeTab}
            onTabChange={setActiveTab}
            className="h-[80vh]"
          />
        </FormModal>

        {/* Activity Modal */}
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          type={activityModalType}
          relatedEntity={
            editData?.id ? {
              id: editData.id as string,
              name: String(editData.dealName || editData.name || editData.title || 'Deal'),
              type: 'deal' as const
            } : undefined
          }
          onCreateActivity={handleCreateActivity}
        />

        {linkModalOpen && selectedDealId && (
          <DealOpportunitiesModal
            dealId={selectedDealId}
            dealName={selectedDealName}
            onClose={() => { setLinkModalOpen(false); setSelectedDealId(null); }}
          />
        )}
        {isQuotationsModalOpen && quotationsDealId && (
          <ManageQuotationsModal
            isOpen={isQuotationsModalOpen}
            onClose={() => { setIsQuotationsModalOpen(false); setQuotationsDealId(null); }}
            dealId={quotationsDealId}
            dealName={quotationsDealName}
          />
        )}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          entityLabel="deals"
          fields={finalFields}
          rows={rows}
          fetchAll={async () => {
            try {
              const pageSizeAll = 1000;
              let p = 1;
              const all: Record<string, unknown>[] = [];
              while (true) {
                const res = await filterDeals({
                  page: p,
                  limit: pageSizeAll,
                  sortBy: sort?.field || 'createdAt',
                  sortOrder: sort?.direction || 'desc',
                  includeConverted: false,
                }).unwrap();
                const r = res as { items?: Record<string, unknown>[]; pagination?: { total?: number } };
                const items = r?.items ?? [];
                all.push(...items);
                const total = r?.pagination?.total ?? items.length;
                if (items.length < pageSizeAll || all.length >= total) break;
                p += 1;
              }
              return all;
            } catch (e) {
              console.error('Export fetchAll (deals) failed', e);
              return [];
            }
          }}
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
              const fieldDef = (finalFields || []).find((f) => String(f.fieldKey).toLowerCase().includes('description') || String((f as FieldDefinition)?.displayName || '').toLowerCase().includes('description'));
              const prevSnap = theRow as Record<string, unknown>;
              const body = fieldDef ? makeUpdateBody(fieldDef, theRow as Record<string, unknown>, text) : { description: text } as Record<string, unknown>;
              await optimisticCellUpdate(
                id as string,
                prevSnap,
                { description: text },
                () => updateDeal({ dealId: id as string, data: body }).unwrap()
              );
              setIsDescriptionModalOpen(false);
              customToast.success('Description updated');
            } catch (e) {
              customToast.error('Failed to update description');
            }
          }}
        />
      </div>
    </ProtectedRoute>
  );
};

export default DealsPage;