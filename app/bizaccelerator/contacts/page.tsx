// C:\Users\Nezuko\Desktop\ameya suite\AmeyaSuite_Frontend\app\bizaccelerator\contacts\page.tsx
"use client";

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/common/Sidebar/Sidebar';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FinalTable from '../../../components/common/CommonTable';
import StatusDropdown from '../../../components/dropdowns/StatusDropdown';
import { useTheme } from '../../../store/hooks';
import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import { customToast } from '../../../utils/toast';
import { Edit } from 'lucide-react';
import NotesIcon from '@/components/ui buttons/NotesIcon';
import { useCreateActivityMutation } from '@/store/api_query/BizAccelerator/activities.api';
import { useGetActivitiesByEntityQuery } from '../../../store/api_query/BizAccelerator/activities.api';
import {
  useGetContactFieldsQuery,
  useGetContactsQuery, useFilterContactsMutation,
  useUpdateContactFieldMutation,
  useReorderContactFieldsMutation,
  useUpdateContactMutation,
  useConvertContactToLeadMutation,
  useGetContactActivitiesQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useCreateContactUpdateMutation,
  useUpdateFormContactMutation,
  useGetContactUpdatesQuery,
  useEditContactUpdateMutation,
  useDeleteContactMutation
} from '../../../store/api_query/contacts.api';
import { useGetFieldDefinitionsByEntityQuery, useAddDropdownChoiceMutation, useUpdateDropdownChoiceMutation, useReorderDropdownChoicesMutation, useDeleteDropdownChoiceMutation } from '../../../store/api_query/field_definitions.api';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';
import PhoneValue from '../../../components/common/FieldType/components/PhoneValue';
import EmailValue from '../../../components/common/FieldType/components/EmailValue';
import UrlValue from '../../../components/common/FieldType/components/UrlValue';
import TextValue from '../../../components/common/FieldType/components/TextValue';
import ViewIcon from '../../../components/ui buttons/ViewButton';
import ActivityTimeline from '../../../components/ui buttons/ActivityTimeline';
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import Bar from "@/components/Project/PaginationBar";
import SearchBoard from "@/components/common/SearchBoard";
import FilterDropdown, { FilterCondition } from "@/components/common/FilterDropdown";
import PersonButton from '@/components/ui buttons/PersonButton';
import AddFiltersButton from '@/components/ui buttons/AddFiltersButton';
import { useGetSavedFiltersQuery, useSaveFilterMutation, useDeleteFilterMutation } from '@/store/api_query/BizAccelerator/filter.api';
import type { FilterGroup, FilterRule } from '@/store/api_query/BizAccelerator/filter.api';
import { Popover, TextField, Button } from '@mui/material';
import { TableTagsRenderer } from '@/components/dropdowns/TableTagsRenderer';
import ExportModal from '@/components/common/ExportModal';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import { useGetUsersQuery } from '@/store/api_query/user.api'
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api'
import DescriptionModal from '../../../components/common/DescriptionModal';
import DeleteConfirmationModal from '../../../components/common/DeleteConfirmationModal';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import { KanbanBoard } from '@/components/BizAccelerator/Kanban';

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

const ActivityTimelineCell: React.FC<{ contactId?: string; count?: number | undefined; onOpen: (activityId?: string) => void }> = ({ contactId, count, onOpen }) => {
  const skip = !contactId || (typeof count === 'number' && count === 0);
  const { data: activities } = useGetContactActivitiesQuery(String(contactId || ''), { skip });
  const list = (activities as Array<{ id?: string; createdAt?: string | Date; scheduledAt?: string | Date }> | undefined) || [];
  const last = list[0]?.createdAt ?? list[0]?.scheduledAt ?? null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(new Date()).getTime();
  const diffs = list
    .map(a => {
      const raw = a?.createdAt || a?.scheduledAt;
      const d = raw ? new Date(raw as string | Date) : null;
      if (!d) return -1;
      const t = startOfDay(d).getTime();
      return Math.floor((todayStart - t) / (1000 * 60 * 60 * 24));
    })
    .filter(n => n >= 0);
  const uniqueDiffs = Array.from(new Set(diffs));
  const dayCounts = diffs.reduce((acc, n) => { acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<number, number>);
  const maxDiff = diffs.length ? Math.max(...diffs) : 0;
  const totalDays = Math.max(maxDiff + 1, 8);
  if (!contactId) return <ActivityTimeline />;
  if (typeof count === 'number' && count === 0) return <ActivityTimeline />;
  return (
    <ActivityTimeline
      visibleCount={8}
      totalDays={totalDays}
      lastActivityDate={last as any}
      activeDayDiffs={uniqueDiffs}
      dayCounts={dayCounts}
      showLabel={true}
      onCandleClick={({ dayDiff, date }) => {
        // find the most recent activity on that calendar day
        const targetStart = startOfDay(date).getTime();
        const match = list
          .filter(a => {
            const raw = a?.createdAt || a?.scheduledAt;
            if (!raw) return false;
            const d = new Date(raw as string | Date);
            return startOfDay(d).getTime() === targetStart;
          })
          .sort((a, b) => {
            const ta = new Date((a.createdAt || a.scheduledAt || 0) as any).getTime();
            const tb = new Date((b.createdAt || b.scheduledAt || 0) as any).getTime();
            return tb - ta; // desc
          })[0];
        onOpen(match?.id);
      }}
    />
  );
};
// NEW: Import the same components used in Opportunities page
import { FormModal } from '@/components/BizAccelerator/FormModal/FormModal';
import { TabbedFormLayout } from '@/components/BizAccelerator/TabbedFormLayout/TabbedFormLayout';
import { OverviewTabContent } from '@/components/BizAccelerator/TabContents/OverviewTabContent';
import { UpdatesTabContent } from '@/components/BizAccelerator/TabContents/UpdatesTabContent';
import { FilesLinksTabContent } from '@/components/BizAccelerator/TabContents/FilesLinksTabContent';
import { getDynamicFieldConfig } from '@/components/common/forms/DynamicForm/dynamicFieldConfig';
import search from "@/public/icons/search 1.svg";
import home from "@/public/icons/home (1) 1.svg";
import updateIcon from "@/public/icons/gallery-_1_ 1.svg";
import { ActivityModal } from '@/components/BizAccelerator/TabContents/ActivityModal';
import type { ActivityData } from '@/components/BizAccelerator/TabContents/ActivityModal';

const ContactsPage: React.FC = () => {
  const { isDark, colors } = useTheme();

  // Sort state wired to API
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Column visibility: Show Less (first 6 by displayOrder)
  const [showLessColumns, setShowLessColumns] = useState(false);

  // Search and column filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilterId, setSavedFilterId] = useState<string | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'meeting' | 'call' | 'notes' | 'todo' | 'email'>('call');

  // NEW: State for modal and form (same as opportunities)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeView, setActiveView] = useState<"default" | "email" | "signature">("default");
  const [highlightActivityId, setHighlightActivityId] = useState<string | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionRow, setDescriptionRow] = useState<Record<string, unknown> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  // Queries
  const { data: allFieldsFull } = useGetFieldDefinitionsByEntityQuery('contact');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetContactFieldsQuery();
  const { data: initialContactsData, isLoading: initialContactsLoading } = useGetContactsQuery({
    page: currentPage,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
    includeConverted: false,
  });
  const [filterContacts, { data: contactsData, isLoading: contactsLoading }] = useFilterContactsMutation();
  const [currentContactsData, setCurrentContactsData] = useState<unknown>(null);

  const { data: savedFiltersData } = useGetSavedFiltersQuery('contact');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();

  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  // NEW: Contact form APIs from contacts.api.ts
  const { data: selectedContactData } = useGetContactQuery(
    (editData?.id as string) || '',
    { skip: !isFormModalOpen || !editData?.id }
  );
  const { data: updatesData, isLoading: updatesLoading } = useGetContactUpdatesQuery(
    (editData?.id as string) || '',
    { skip: !isFormModalOpen || !editData?.id }
  );

  const { data: companyUsersData } = useGetCompanyUsersQuery({});

  const [editContactUpdate] = useEditContactUpdateMutation();


  const [updateContact] = useUpdateContactMutation();
  const [createContact] = useCreateContactMutation();
  const [updateField] = useUpdateContactFieldMutation();
  const [reorderFields] = useReorderContactFieldsMutation();
  const [convertToLead] = useConvertContactToLeadMutation();
  const [deleteContact] = useDeleteContactMutation();
  const [convertingIds, setConvertingIds] = useState<Set<string | number>>(new Set());
  const { data: usersData } = useGetUsersQuery({});

  // NEW: Dropdown CRUD mutations
  const [addDropdownChoice] = useAddDropdownChoiceMutation();
  const [updateDropdownChoice] = useUpdateDropdownChoiceMutation();
  const [reorderDropdownChoices] = useReorderDropdownChoicesMutation();
  const [deleteDropdownChoice] = useDeleteDropdownChoiceMutation();
  const [createActivityMutation, { isLoading: isCreatingActivity }] = useCreateActivityMutation();
  const [createContactUpdate] = useCreateContactUpdateMutation();
  // NEW: Activities data
  const { data: activitiesResponse } = useGetActivitiesByEntityQuery(
    { entityType: 'contact', entityId: (editData?.id as string) || '' }, // Add entityType here
    { skip: !isFormModalOpen || !editData?.id }
  );

  // Normalize common response shapes for TS
  const initialContactsObj = initialContactsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentContactsObj = currentContactsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const fieldsRawArray = useMemo(() => {
    const fr = fieldsRaw as unknown;
    if (Array.isArray(fr)) return fr as unknown[];
    const items = (fr as { items?: unknown[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  }, [fieldsRaw]);

  const activitiesData = ((activitiesResponse as { data?: { items?: unknown[] }, items?: unknown[] } | undefined)?.data?.items) ?? ((activitiesResponse as { items?: unknown[] } | undefined)?.items) ?? [];

  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    let fields: FieldDefinition[] = [];
    if (fromShared.length > 0) {
      fields = mapBackendListToFrontend(fromShared as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    } else {
      const fromApi = fieldsRawArray as unknown[];
      const fromData = ((currentContactsObj?.fieldDefinitions ?? initialContactsObj?.fieldDefinitions) ?? []) as unknown[];
      const mergedByKey = new Map<string, Record<string, unknown>>();
      [...fromApi, ...fromData].forEach((f: unknown) => { if (!f || typeof f !== 'object') return; const fObj = f as Record<string, unknown>; if (!fObj.fieldKey || typeof fObj.fieldKey !== 'string') return; mergedByKey.set(fObj.fieldKey, { ...mergedByKey.get(fObj.fieldKey), ...fObj }); });
      fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    }
    // Add action column
    return [...fields, {
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
    }];
  }, [allFieldsFull, fieldsRawArray, initialContactsObj?.fieldDefinitions, currentContactsObj?.fieldDefinitions]);

  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    return [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
  }, [finalFields, showLessColumns]);

  // Contact status field (prefer contactStatus, fallback to status/stage by key/name)
  const statusField = useMemo(() => {
    const lc = (s?: string) => String(s || '').toLowerCase();
    const byKey = (finalFields || []).find((f) => ['contactstatus', 'status', 'stage'].includes(lc(f.fieldKey)));
    if (byKey) return byKey;
    const byName = (finalFields || []).find((f) => /status|stage/.test(lc(f.displayName)));
    return byName;
  }, [finalFields]);

  // Build Kanban columns from contact status dropdown choices
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

  // Add this function to refetch contacts data
  const refetchContacts = async () => {
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: sort?.direction || 'desc',
        includeConverted: false,
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
            : ({ logic: 'AND', rules: filterRules } as FilterGroup);
        }
      }

      const result = await filterContacts(params).unwrap();
      setCurrentContactsData(result);
    } catch (error) {
      console.error('Failed to refetch contacts:', error);
    }
  };

  const formFields = useMemo(() => {
    if (!fieldsRaw || !Array.isArray(fieldsRaw)) {
      return [];
    }

    const transformedFields = fieldsRaw
      .filter((field: unknown) => {
        const f = field as Record<string, unknown>;
        return f &&
          f.fieldKey &&
          f.fieldType &&
          f.isVisible !== false
      })
      .map((field: unknown) => {
        const f = field as Record<string, unknown>;
        if (f.fieldKey === 'updates') {
          // Get the latest update content from the contact data and remove HTML tags
          const updates = editData?.updates as unknown[] | undefined;
          const latestUpdate = updates?.[0];
          let updateContent = '';

          const latestUpdateObj = latestUpdate as Record<string, unknown> | undefined;
          if (latestUpdateObj?.content) {
            // Remove HTML tags and decode HTML entities
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = latestUpdateObj.content as string;
            updateContent = tempDiv.textContent || tempDiv.innerText || '';
          }

          return {
            fieldKey: 'updates',
            displayName: 'Updates',
            fieldType: 'TEXTAREA',
            isRequired: false,
            isEditable: true,
            isReadOnly: false,
            options: {
              placeholder: 'Enter updates about this contact...',
              rows: 4
            },
            displayOrder: (f.displayOrder as number) || 0,
            helpText: 'Notes and updates about this contact',
            fieldId: f.id as string,
            id: f.id as string,
            icon: '',
            tooltip: 'Contact updates',
            iconBg: "#C81C1F",
          };
        }

        // ... rest of your field transformations
        const dynamicConfig = getDynamicFieldConfig(
          f.fieldKey as string,
          f.fieldType as 'TEXT' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'URL' | 'DATE' | 'DATE_TIME' | 'TEXTAREA' | 'DROPDOWN' | 'MULTISELECT' | 'CHECKBOX' | 'RADIO' | 'CURRENCY',
          f.displayName as string
        );

        const transformedOptions: Record<string, unknown> = {};

        if (f.options) {
          const opts = f.options as Record<string, unknown>;
          if (opts.choices && Array.isArray(opts.choices)) {
            transformedOptions.choices = opts.choices.map((choice: { value: unknown; label: unknown; color: unknown }) => ({
              value: choice.value || choice,
              label: choice.label || String(choice.value || choice),
              color: choice.color
            }));
          }

          if (opts.placeholder) transformedOptions.placeholder = opts.placeholder;
          if (opts.rows) transformedOptions.rows = opts.rows;
          if (opts.multiple) transformedOptions.multiple = opts.multiple;
          if (opts.allowCustomTags) transformedOptions.allowCustom = opts.allowCustomTags;

          Object.keys(opts).forEach(key => {
            if (!['choices', 'placeholder', 'rows', 'multiple', 'allowCustomTags', 'allowMultiple'].includes(key)) {
              transformedOptions[key] = opts[key];
            }
          });
        }

        return {
          fieldKey: f.fieldKey as string,
          displayName: f.displayName as string,
          fieldType: f.fieldType as string,
          isRequired: (f.isRequired as boolean) || f.fieldKey === 'name',
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
      .sort((a: unknown, b: unknown) => {
        const aOrder = (a as Record<string, unknown>).displayOrder as number | undefined;
        const bOrder = (b as Record<string, unknown>).displayOrder as number | undefined;
        return (aOrder || 0) - (bOrder || 0);
      });

    const hasCreateLead = transformedFields.some((f: unknown) => (f as Record<string, unknown>).fieldKey === 'createLead');
    if (!hasCreateLead) {
      transformedFields.push({
        fieldKey: 'createLead',
        displayName: 'Convert to Lead',
        fieldType: 'BUTTON',
        isRequired: false,
        isEditable: true,
        isReadOnly: false,
        options: {},
        displayOrder: transformedFields.length + 1,
        helpText: 'Convert this contact into a lead',
        fieldId: 'create-lead-field',
        id: 'create-lead-field',
        icon: '',
        tooltip: 'Convert to Lead',
        iconBg: "#C81C1F",
      });
    }

    return transformedFields;
  }, [fieldsRaw, editData?.updates]); // Add editData.updates as dependency

  const rows = ((currentContactsObj?.items ?? initialContactsObj?.items) ?? []) as Record<string, unknown>[];
  const loading = fieldsLoading || contactsLoading;

  // Export: fetch all contacts in DB (ignoring current pagination/filters)
  const fetchAllForExport = async (): Promise<Record<string, unknown>[]> => {
    try {
      const pageSizeAll = 1000;
      let page = 1;
      const all: Record<string, unknown>[] = [];
      // loop until we fetched all
      // using filterContacts endpoint without filterGroup to fetch entire DB
      // keep sort consistent with current sort
      while (true) {
        const res = await filterContacts({
          page,
          limit: pageSizeAll,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
          includeConverted: false,
        }).unwrap();
        const r = res as { items?: unknown[]; pagination?: { total?: number } };
        if (!r.items || !Array.isArray(r.items) || r.items.length === 0) break;
        all.push(...(r.items as Record<string, unknown>[]));
        const total = r?.pagination?.total ?? r.items.length;
        if (r.items.length < pageSizeAll || all.length >= total) break;
        page += 1;
      }
      return all;
    } catch (e) {
      console.error('Export fetchAll failed', e);
      return [];
    }
  };



  // Column Width Manager: edit widths for columns by fieldKey here (in pixels)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    // Primary identifiers
    name: 200,
    contactName: 260,
    // Common contact fields
    email: 200,
    phone: 180,
    contactStatus: 160,
    // Creator fields
    createdByName: 180,
    createdBy: 180,
    createdById: 180,
    // Action column
    action: 150,
    // Timestamps
    createdAt: 160,
    updatedAt: 160,
    // Utilities
    filesLinks: 150,
    activityTimeline: 240,
    createLead: 120,
    alternatePhone: 200,
  });
  const [hiddenKeys, setHiddenKeys] = useState<string[]>(['companyName']);

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    try {
      console.log("🔍 Form values received:", values);

      // Ensure required fields are present
      const submitData = { ...values };

      console.log("📦 Submit data before validation:", submitData);

      // Make sure name field is not empty
      const name = submitData.name as string | undefined;
      if (!name?.trim()) {
        console.error("❌ Name validation failed:", submitData.name);
        customToast.error("Contact Name is required");
        return;
      }

      // Ensure contactStatus has a value
      if (!submitData.contactStatus) {
        submitData.contactStatus = 'active'; // Default value
      }

      // Handle updates field - ensure it's properly formatted
      if (submitData.updates && !Array.isArray(submitData.updates)) {
        // If updates is a string, convert it to array format
        if (typeof submitData.updates === 'string' && submitData.updates.trim()) {
          submitData.updates = [{
            content: submitData.updates.trim(),
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.id
          }];
        } else {
          submitData.updates = [];
        }
      }

      if (isEditMode && editData?.id) {
        console.log("📝 Updating existing contact:", editData.id);
        const result = await updateContact({
          contactId: editData.id as string,
          data: submitData
        }).unwrap();
        customToast.success("Contact updated successfully!");

        // Refresh the contacts data after update
        await refetchContacts();
      } else {
        const userId = currentUser?.id;
        if (!userId) {
          customToast.error("User information not available. Please refresh and try again.");
          return;
        }

        const createData = {
          ...submitData,
          createdBy: userId
        };

        console.log("✨ Creating new contact:", createData);

        const result = await createContact({ data: createData }).unwrap();
        console.log("✅ Contact created successfully:", result);
        customToast.success("Contact created successfully!");

        // Refresh the contacts data after creation
        await refetchContacts();
      }

      setIsFormModalOpen(false);
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("❌ Failed to save contact:", error);
      console.error("Error response:", err?.data);
      customToast.error(err?.data?.message || "Failed to save contact");
    }
  };

  // NEW: Dropdown CRUD handlers for form (same as opportunities)
  const handleAddDropdownOption = async (fieldId: string, option: { displayName: string; color: string }) => {
    try {
      await addDropdownChoice({
        fieldId,
        value: option.displayName.toLowerCase().replace(/\s+/g, '_'),
        label: option.displayName,
        color: option.color,
        order: Date.now()
      }).unwrap();
      customToast.success("Dropdown option added successfully!");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to add dropdown option:", error);
      customToast.error(err?.data?.message || "Failed to add dropdown option");
    }
  };

  const handleUpdateDropdownOption = async (fieldId: string, value: string, updates: { displayName?: string; color?: string }) => {
    try {
      await updateDropdownChoice({
        fieldId,
        value,
        updates: {
          ...(updates.displayName && { label: updates.displayName }),
          ...(updates.color && { color: updates.color })
        }
      }).unwrap();
      customToast.success("Dropdown option updated successfully!");
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

      await reorderDropdownChoices({
        fieldId,
        choices
      }).unwrap();
      customToast.success("Dropdown options reordered successfully!");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to reorder dropdown options:", error);
      customToast.error(err?.data?.message || "Failed to reorder dropdown options");
    }
  };

  const handleDeleteDropdownOption = async (fieldId: string, value: string) => {
    try {
      await deleteDropdownChoice({ fieldId, value }).unwrap();
      customToast.success("Dropdown option deleted successfully!");
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to delete dropdown option:", error);
      customToast.error(err?.data?.message || "Failed to delete dropdown option");
    }
  };

  // NEW: Modal handlers (same as opportunities)
  const handleAddContact = () => {
    setIsEditMode(false);
    setEditData({
      name: '', // Ensure name field exists
      contactStatus: 'active', // Default status
      tags: [],
      updates: ''
    });
    setActiveTab("overview");
    setIsFormModalOpen(true);
  };

  const handleEditContact = (contactData: Record<string, unknown>) => {
    setIsEditMode(true);

    // SIMPLE FIX: Clean the data by converting objects to strings
    const cleanData: Record<string, unknown> = {};
    Object.keys(contactData).forEach(key => {
      const value = contactData[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // If it's an object, use its display value or stringify
        const valueObj = value as Record<string, unknown>;
        cleanData[key] = valueObj.label || valueObj.displayName || valueObj.value || JSON.stringify(value);
      } else {
        cleanData[key] = value;
      }
    });

    // Handle updates field
    let updatesValue = '';
    if (cleanData.updates && Array.isArray(cleanData.updates) && cleanData.updates.length > 0) {
      const latestUpdate = cleanData.updates[0];
      if (latestUpdate?.content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = latestUpdate.content;
        updatesValue = tempDiv.textContent || tempDiv.innerText || '';
      }
    }

    setEditData({
      ...cleanData,
      name: cleanData.name || '',
      contactStatus: cleanData.contactStatus || 'active',
      updates: updatesValue
    });
    setActiveTab("overview");
    setIsFormModalOpen(true);
  };
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();

  // NEW: View handlers for email/signature
  const handleEmailClick = () => {
    setActiveView("email");
  };

  const handleSettingsClick = () => {
    setActiveView("signature");
  };

  const handleBackToDefault = () => {
    setActiveView("default");
  };

  const getModalTitle = () => {
    if (activeView === "email") return "New Email";
    if (activeView === "signature") return "Email Signature";
    return isEditMode ? "Edit Contact" : "Create Contact";
  };

  const shouldShowBackButton = activeView !== "default";

  // Activity creation handler
  const handleCreateActivity = async (activityPayload: ActivityData): Promise<void> => {
    try {
      if (!currentUser?.id) {
        throw new Error('User information not available');
      }

      // Ensure we have the contact ID
      const contactId = editData?.id;
      if (!contactId) {
        throw new Error('Contact ID is required to create activity');
      }

      const type = activityPayload.type as string | undefined;
      const apiPayload: Record<string, unknown> = {
        type: type?.toUpperCase(),
        subject: activityPayload.subject,
        description: activityPayload.description || '',
        scheduledAt: activityPayload.scheduledAt,
        duration: parseInt(String(activityPayload.duration || 30)),
        status: 'SCHEDULED',
        priority: activityPayload.priority || 'MEDIUM',
        assignedToId: currentUser.companyUserId || currentUser.id,
        createdBy: currentUser.id,
        contactId: contactId,
      };
      if (activityPayload.dealId) apiPayload.dealId = activityPayload.dealId;
      if (activityPayload.opportunityId) apiPayload.opportunityId = activityPayload.opportunityId;
      if (activityPayload.leadId) apiPayload.leadId = activityPayload.leadId;

      console.log("📤 Creating activity with payload:", apiPayload);

      // Validate required fields
      const subject = apiPayload.subject as string | undefined;
      if (!subject?.trim()) {
        throw new Error('Subject is required');
      }

      if (!apiPayload.scheduledAt) {
        throw new Error('Scheduled date is required');
      }

      if (!apiPayload.type) {
        throw new Error('Activity type is required');
      }

      // ACTUALLY CALL THE MUTATION
      await createActivityMutation(apiPayload as unknown as import('../../../store/api_query/BizAccelerator/activities.api').CreateActivityData).unwrap();

      console.log("✅ Activity created successfully");
      customToast.success("Activity created successfully!");

      // Close modal and refresh activities data
      setIsActivityModalOpen(false);
    } catch (error) {
      const err = error as { data?: { message?: string }, message?: string };
      console.error('❌ Failed to create activity:', error);
      console.error('Error details:', err?.data);
      customToast.error(err?.data?.message || err?.message || "Failed to create activity");
      throw error;
    }
  };
  const [updatesContent, setUpdatesContent] = useState("");

  const handleCreateContactUpdate = async (content: string) => {
    if (!editData?.id) {
      customToast.error("No contact selected");
      return;
    }

    try {
      await createContactUpdate({
        contactId: editData.id as string,
        content: content
      }).unwrap();

      customToast.success("Update added successfully");
      setUpdatesContent("");
      await refetchContacts();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to add update:", error);
      customToast.error(err?.data?.message || "Failed to add update");
    }
  };

  const handleEditContactUpdate = async (updateId: string, content: string) => {
    if (!editData?.id) {
      customToast.error("No contact selected");
      return;
    }

    try {
      await editContactUpdate({
        contactId: editData.id as string,
        updateId: updateId,
        content: content
      }).unwrap();

      customToast.success("Update edited successfully");
      await refetchContacts();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      console.error("Failed to edit update:", error);
      customToast.error(err?.data?.message || "Failed to edit update");
    }
  };

  // NEW: Tabs configuration (same structure as opportunities)
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
          contactId: editData?.id,
          highlightActivityId: highlightActivityId,
          onAddActivity: (type: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => {
            setActivityModalType(type);
            setIsActivityModalOpen(true);
          },
          activeView: activeView,
          onViewChange: setActiveView,
          onAddDropdownOption: handleAddDropdownOption,
          onUpdateDropdownOption: handleUpdateDropdownOption,
          onReorderDropdownOptions: handleReorderDropdownOptions,
          onDeleteDropdownOption: handleDeleteDropdownOption,
          onConvertToLead: async (contactId: string) => {
            try {
              setConvertingIds((prev) => new Set(prev).add(contactId));
              await convertToLead({ contactId, data: {} }).unwrap();
              customToast.success('Contact converted to lead successfully!');
              await refetchContacts(); // Add this line
              setIsFormModalOpen(false);
            } catch (error) {
              const err = error as { data?: { message?: string } };
              console.error('Failed to convert contact to lead:', error);
              customToast.error(err?.data?.message || 'Failed to convert contact to lead');
            } finally {
              setConvertingIds((prev) => {
                const next = new Set(prev);
                next.delete(contactId);
                return next;
              });
            }
          },
          convertingIds: convertingIds
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
          contactId: isEditMode && editData?.id ? editData.id : undefined,
          updatesData: updatesData || [],
          isLoading: updatesLoading,
          onCreateUpdate: handleCreateContactUpdate,
          onEditUpdate: handleEditContactUpdate,
        },
        // Hide updates tab when in email/signature view
        disabled: !isEditMode || activeView !== "default"
      },
      {
        key: "files/links",
        label: "Files / Links",
        icon: updateIcon,
        component: FilesLinksTabContent,
        componentProps: {
          className: "h-full"
        },
        disabled: !isEditMode || activeView !== "default"
      },
    ];

    // Filter out disabled tabs when in email/signature view
    if (activeView !== "default") {
      return baseTabs.filter(tab => !tab.disabled);
    }

    return baseTabs;
  };

  // Contact title buttons
  const contactTitleBtn = [
    {
      name: "Export",
      icon: <FiPlus />,
      onClick: () => setShowExportModal(true)
    },
    {
      name: "Add Contact",
      icon: <FiPlus />,
      onClick: handleAddContact // Updated to use new handler
    },
  ];

  const transformBackendFiltersToFrontend = (filterGroup: unknown): FilterCondition[] => {
    const group = filterGroup as { logic?: string; rules?: unknown[] };
    if (!group || !group.rules) return [];

    const logic = group.logic || 'AND';

    return group.rules.map((rule: unknown, index: number) => {
      const r = rule as { logic?: string; rules?: unknown[]; values?: unknown[]; value?: unknown; fieldKey?: string; condition?: string };
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

  const transformFiltersToBackendFormat = (filters: FilterCondition[]): FilterGroup | null => {
    if (filters.length === 0) return null;

    const noValueConditions = [
      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
      'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK', 'IS_THIS_MONTH',
      'IS_LAST_MONTH', 'IS_NEXT_MONTH', 'IS_TRUE', 'IS_FALSE',
    ];

    // Conditions that should use OR logic when multiple values are provided
    const orMultiValueConditions = [
      'CONTAINS',
      'DOES_NOT_CONTAIN',
      'IS',
      'STARTS_WITH',
      'ENDS_WITH',
      'EQUALS',
      'IN'
    ];

    // Conditions that should use AND logic when multiple values are provided
    const andMultiValueConditions = [
      'IS_NOT',
      'NOT_EQUALS',
      'DOES_NOT_CONTAIN',
      'NOT_IN'
    ];

    const transformedRules: Array<FilterRule | FilterGroup> = [];

    filters.forEach(filter => {
      // Handle conditions that don't need values
      if (noValueConditions.includes(filter.condition)) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: '',
        });
        return;
      }

      // Handle conditions with values
      if (!filter.value || filter.value.length === 0) {
        return; // Skip invalid filters
      }

      // Handle IN/NOT_IN specially - they expect a values array
      if (['IN', 'NOT_IN'].includes(filter.condition)) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          values: filter.value,
          value: filter.value.join(','),
        } as FilterRule);
        return;
      }

      // Handle single value - straightforward
      if (filter.value.length === 1) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0],
        } as FilterRule);
        return;
      }

      // Handle multiple values based on condition semantics
      if (filter.value.length > 1) {
        // For OR conditions (CONTAINS, IS, etc.) - create a nested OR group
        if (orMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map(val => ({
            fieldKey: filter.field,
            condition: filter.condition,
            value: val,
          }));

          // Create a nested group with OR logic
          transformedRules.push({
            logic: 'OR',
            rules: nestedRules
          } as FilterGroup);
          return;
        }

        // For AND conditions (IS_NOT, NOT_EQUALS, etc.) - create a nested AND group
        if (andMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map(val => ({
            fieldKey: filter.field,
            condition: filter.condition,
            value: val,
          }));

          // Create a nested group with AND logic
          transformedRules.push({
            logic: 'AND',
            rules: nestedRules
          } as FilterGroup);
          return;
        }

        // Fallback for other conditions - use first value
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0],
        } as FilterRule);
      }
    });

    if (transformedRules.length === 0) return null;

    // Use the global logical operator from the first filter
    const logic = (filters[0]?.logicalOperator || 'AND') as 'AND' | 'OR';
    return { logic, rules: transformedRules } as FilterGroup;
  };

  const buildSearchFilterRules = useMemo(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;

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

    return transformFiltersToBackendFormat(validFilters);
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

    // Determine which field to filter on
    let fieldKey = personFilterField === 'assignedTo' ? 'assignedTo' : 'createdBy';

    // Check for alternate field names
    if (personFilterField === 'assignedTo') {
      const assignField = finalFields.find(f => f.fieldKey === 'assignedTo' || f.fieldKey === 'assignTo');
      fieldKey = assignField?.fieldKey || 'assignedTo';
    } else {
      const createdField = finalFields.find(f => f.fieldKey === 'createdBy' || f.fieldKey === 'createdByName' || f.fieldKey === 'createdById');
      fieldKey = createdField?.fieldKey || 'createdBy';
    }

    // Create OR rules for multiple selected people
    if (selectedPeopleIds.length === 1) {
      return {
        fieldKey: fieldKey,
        condition: 'EQUALS',
        value: selectedPeopleIds[0]
      };
    }

    return {
      logic: 'OR' as const,
      rules: selectedPeopleIds.map(personId => ({
        fieldKey: fieldKey,
        condition: 'EQUALS',
        value: personId
      }))
    };
  }, [selectedPeopleIds, personFilterField, finalFields]);

  // Update hasActiveSearchOrFilters to include person filter
  const hasActiveSearchOrFilters = useMemo(() => {
    return (
      savedFilterId ||
      (searchQuery && selectedColumns.length > 0) ||
      selectedPeopleIds.length > 0 || // Add person filter check
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

  // Update the useEffect that fetches contacts to include person filter
  useEffect(() => {
    if (!hasActiveSearchOrFilters && !savedFilterId) {
      const fetchBasicContacts = async () => {
        try {
          const params: Record<string, unknown> = {
            page: currentPage,
            limit: pageSize,
            sortBy: sort?.field || 'createdAt',
            sortOrder: sort?.direction || 'desc',
            includeConverted: false,
          };
          const result = await filterContacts(params).unwrap();
          setCurrentContactsData(result);
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
          customToast.error('Failed to load contacts');
        }
      };

      fetchBasicContacts();
      return;
    }

    const fetchContacts = async () => {
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: pageSize,
          sortBy: sort?.field || 'createdAt',
          sortOrder: sort?.direction || 'desc',
          includeConverted: false,
        };

        if (savedFilterId) {
          params.savedFilterId = savedFilterId;
        } else {
          const filterRules: Array<FilterGroup | FilterRule> = [];

          if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules);
          if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules);
          if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules); // Add person filter

          if (filterRules.length > 0) {
            params.filterGroup = filterRules.length === 1
              ? filterRules[0]
              : ({
                logic: 'AND',
                rules: filterRules
              } as FilterGroup);
          }
        }

        const result = await filterContacts(params).unwrap();
        setCurrentContactsData(result);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        customToast.error('Failed to load contacts');
      }
    };

    fetchContacts();
  }, [
    hasActiveSearchOrFilters,
    searchQuery,
    selectedColumns,
    sort,
    activeFilters,
    selectedPeopleIds,
    personFilterField,
    filterContacts,
    savedFilterId,
    currentPage,
    pageSize
  ]);

  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setSelectedPeopleIds(selectedIds);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setPersonFilterField(field);
  };

  // Rest of your existing table cell renderers and handlers...
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

  // Optimistic local patching for Monday-like UX
  const patchContactRowLocally = (contactId: string, patch: Partial<Record<string, unknown>> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
    setCurrentContactsData((prev: unknown) => {
      const prevObj = prev as { items?: unknown[] };
      if (!prevObj?.items) return prev;
      const items = Array.isArray(prevObj.items) ? [...prevObj.items] : [];
      const idx = items.findIndex((r: unknown) => {
        const row = r as Record<string, unknown>;
        return (row?.id ?? row?._id) === contactId;
      });
      if (idx === -1) return prev;
      const before = items[idx] as Record<string, unknown>;
      const nextRow = typeof patch === 'function' ? patch(before) : { ...before, ...patch };
      items[idx] = nextRow;
      return { ...prevObj, items };
    });
  };

  const optimisticCellUpdate = async (
    contactId: string,
    prevRow: Record<string, unknown>,
    localPatch: Partial<Record<string, unknown>>,
    performUpdate: () => Promise<unknown>,
  ) => {
    patchContactRowLocally(contactId, localPatch);
    try {
      await performUpdate();
    } catch (err) {
      patchContactRowLocally(contactId, prevRow);
      throw err;
    }
  };

  const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
    if (!field.id) return;
    const clean = newName.trim();
    if (!clean || clean === field.displayName) return;
    try {
      await updateField({ fieldId: field.id, data: { displayName: clean } }).unwrap();
      await refetchContacts();
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

  const handleLoadSavedFilter = async (filterId: string) => {
    try {
      const savedFilter = savedFiltersData?.find(f => f.id === filterId);
      if (!savedFilter) {
        customToast.error('Saved filter not found');
        return;
      }
      const transformedFilters = transformBackendFiltersToFrontend(
        savedFilter.filterDefinition
      );
      setActiveFilters(transformedFilters);
    } catch (error) {
      console.error('Failed to load saved filter:', error);
      customToast.error('Failed to load saved filter');
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
                    { label: 'Contacts', href: '/dashboard/biz-accelerator/contacts' },

                  ]}
                />
              </div>
              <div
                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                style={{
                  backgroundColor: isDark ? colors.dark.sidebar : undefined
                }}
              >
                <Title projectTitleObj={contactTitleBtn} name="Contact List" />
              </div>
              <div className='bg-[#f8f8f2] border border-gray-300 mx-5 mt-4 py-3 px-2 rounded flex justify-end items-center gap-[6px] h-fit relative' style={{
                backgroundColor: isDark ? colors.dark.sidebar : undefined
              }}>
                <SearchBoard
                  fieldDefinitions={
                    finalFields.map(f => ({
                      ...f,
                      isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : true
                    }))
                  }
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
                  currentFilters={activeFilters} // Add this prop
                  onApplyFilters={(filters) => {
                    setActiveFilters(filters);
                    setIsFilterDropdownOpen(false);
                    setSavedFilterId(null); // Clear saved filter when manually applying
                  }}
                  hasActiveFilters={activeFilters.some(f => {
                    const noValueConditions = [
                      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
                      'IS_THIS_WEEK', 'IS_THIS_MONTH', 'IS_TRUE', 'IS_FALSE'
                    ];
                    if (noValueConditions.includes(f.condition)) return true;
                    return f.value.length > 0;
                  })}
                  savedFilters={savedFiltersData || []}
                  onLoadSavedFilter={handleLoadSavedFilter}
                  onSaveFilter={async (filterName, filters) => {
                    try {
                      const filterGroup = transformFiltersToBackendFormat(filters);
                      if (!filterGroup) {
                        customToast.error('Please add at least one filter condition');
                        return;
                      }

                      await saveFilter({
                        name: filterName,
                        entityType: 'contact',
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
                  total={currentContactsObj?.pagination?.total ?? initialContactsObj?.pagination?.total ?? 0}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setCurrentPage(1); setPageSize(size); }}
                  onToggleColumns={() => setShowLessColumns((s) => !s)}
                  showLessColumns={showLessColumns}
                  viewToggle={<ViewModeToggle mode={viewMode} onChange={setViewMode} size={{ width: 105, height: 30 }} />}
                />
                {savedFilterId && (
                  <div className="mx-5 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-blue-700">
                        Active saved filter: {savedFiltersData?.find(f => f.id === savedFilterId)?.name}
                      </span>
                      <span className="text-xs text-blue-600">
                        ({activeFilters.length} condition{activeFilters.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSavedFilterId(null);
                        setActiveFilters([]);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-white dark:bg-gray-900 relative rounded-md border border-gray-200 dark:border-gray-800 p-2 w-full min-w-0 min-h-0 overflow-auto">
                {loading ? (
                  <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                    <Image src="/icons/LoadingSpinner.svg" alt="Loading" width={48} height={48} />
                  </div>
                ) : viewMode === 'kanban' ? (
                  <KanbanBoard
                    className="h-full"
                    items={rows as Record<string, any>[]}
                    fieldDefinitions={finalFields}
                    columnKey={statusField?.fieldKey || 'contactStatus'}
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
                        // return newly created column for immediate UI append
                        customToast.success('Status added');
                        return { id: val, title: name.trim(), value: val, color };
                      } catch (e) {
                        customToast.error('Failed to add status');
                      }
                    }}
                    renderCard={(row) => {
                      const r = row as Record<string, unknown>;
                      const contactId = String((r?.id as string) ?? (r?._id as string) ?? '');
                      const defsByKey = Object.fromEntries(finalFields.map((f) => [String(f.fieldKey), f] as const));
                      const defsByKeyLc = Object.fromEntries(finalFields.map((f) => [String(f.fieldKey).toLowerCase(), f] as const));
                      const emailDef = (defsByKeyLc['email'] ?? finalFields.find((f) => f.fieldType === 'EMAIL')) as FieldDefinition | undefined;
                      const phoneDef = (defsByKeyLc['phone'] ?? finalFields.find((f) => f.fieldType === 'PHONE')) as FieldDefinition | undefined;
                      const companyDef = (defsByKey['company'] ?? defsByKey['companyName'] ?? defsByKey['account'] ?? defsByKey['accountName']) as FieldDefinition | undefined;
                      const locationDef = (defsByKey['location'] ?? finalFields.find((f) => /location/i.test(String(f.displayName)))) as FieldDefinition | undefined;
                      const titleText = String(r?.contactName || r?.name || r?.title || '');
                      return (
                        <div className={[ 'text-card-foreground overflow-hidden bg-white shadow-sm border border-gray-200 rounded-xl', 'transition-all duration-200 relative select-none px-3 hover:shadow-md hover:border-gray-400', 'pt-[0.4375rem] pb-1.5 w-full' ].join(' ')}>
                          <button type="button" onClick={() => handleEditContact(r)} className="absolute top-2 right-2 p-1.5 rounded hover:bg-gray-100" title="Notes" aria-label="Notes">
                            <NotesIcon />
                          </button>
                          <div className="flex flex-col gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm leading-tight truncate" title={titleText}>
                                {titleText}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-gray-600">
                              {companyDef && (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="shrink-0 text-[11px] text-gray-500">Company</span>
                                  <div className="truncate flex-1">
                                    <TextValue
                                      field={companyDef}
                                      value={r?.[companyDef.fieldKey as keyof typeof r]}
                                      onCommit={async (next: string) => {
                                        const id = contactId; if (!id) return; const prevSnap = r;
                                        await optimisticCellUpdate(
                                          id,
                                          prevSnap,
                                          { [companyDef.fieldKey]: next },
                                          () => updateContact({ contactId: id, data: makeUpdateBody(companyDef, prevSnap, next) }).unwrap()
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {locationDef && (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="shrink-0 text-[11px] text-gray-500">Location</span>
                                  <div className="truncate flex-1">
                                    <TextValue
                                      field={locationDef}
                                      value={r?.[locationDef.fieldKey as keyof typeof r]}
                                      onCommit={async (next: string) => {
                                        const id = contactId; if (!id) return; const prevSnap = r;
                                        await optimisticCellUpdate(
                                          id,
                                          prevSnap,
                                          { [locationDef.fieldKey]: next },
                                          () => updateContact({ contactId: id, data: makeUpdateBody(locationDef, prevSnap, next) }).unwrap()
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
                                      value={r?.[emailDef.fieldKey as keyof typeof r]}
                                      onCommit={async (next: string) => {
                                        const id = contactId; if (!id) return; const prevSnap = r;
                                        await optimisticCellUpdate(
                                          id,
                                          prevSnap,
                                          { [emailDef.fieldKey]: next },
                                          () => updateContact({ contactId: id, data: makeUpdateBody(emailDef, prevSnap, next) }).unwrap()
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {phoneDef && (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="shrink-0 text-[11px] text-gray-500">Phone</span>
                                  <div className="truncate flex-1">
                                    <PhoneValue
                                      field={phoneDef}
                                      value={r?.[phoneDef.fieldKey as keyof typeof r]}
                                      onCommit={async (next: string) => {
                                        const id = contactId; if (!id) return; const prevSnap = r;
                                        await optimisticCellUpdate(
                                          id,
                                          prevSnap,
                                          { [phoneDef.fieldKey]: next },
                                          () => updateContact({ contactId: id, data: makeUpdateBody(phoneDef, prevSnap, next) }).unwrap()
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
                    }}
                    onItemMove={async ({ item, destColumnId }) => {
                      if (!statusField) return;
                      const contactId = String((item as any)?.id ?? (item as any)?._id ?? '');
                      if (!contactId) return;
                      const sel = kanbanColumns.find((c) => String(c.id) === String(destColumnId));
                      if (!sel) return;
                      const current = (item as any)?.[statusField.fieldKey];
                      const objectPayload = { value: sel.value, label: sel.title, color: sel.color } as unknown;
                      const stringPayload = sel.value as unknown;
                      const prevRow = rows.find(r => String((r as any)?.id ?? (r as any)?._id) === contactId) as Record<string, unknown> | undefined;
                      const doUpdate = async (payload: unknown) => {
                        if (prevRow) {
                          await optimisticCellUpdate(
                            contactId,
                            prevRow,
                            { [statusField.fieldKey]: payload },
                            () => updateContact({ contactId, data: makeUpdateBody(statusField as any, prevRow, payload) }).unwrap()
                          );
                        } else {
                          await updateContact({ contactId, data: { [statusField.fieldKey]: payload } }).unwrap();
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
                          console.error('Failed to update contact status via Kanban', e2);
                        }
                      }
                    }}
                    onColumnOrderChange={async (ordered) => {
                      try {
                        const fieldId = statusField?.id as string | undefined;
                        if (!fieldId) return;
                        const choices = ordered.map((c, idx) => ({ value: String(c.value), order: idx + 1, label: c.title, color: c.color }));
                        await reorderDropdownChoices({ fieldId, choices }).unwrap();
                      } catch (e) {
                        console.error('Failed to reorder contact statuses', e);
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
                    hiddenFieldKeys={hiddenKeys}
                    onHiddenFieldKeysChange={setHiddenKeys}
                    sortConfig={sort}
                    onSortChange={(cfg) => setSort(cfg)}
                    loading={false}
                    columnWidths={columnWidths}
                    onColumnResize={(key, width) => setColumnWidths((prev) => ({ ...prev, [key]: width }))}
                    // onRowClick={handleEditContact} // Updated to use new handler
                    onRenameColumn={handleRenameColumn}
                    onHideColumn={handleHideColumn}
                    onToggleColumnVisibility={handleToggleColumnVisibility}
                    onColumnOrderChange={handleReorderColumns}
                    getCellRenderer={({ field, row, value }: { field: FieldDefinition; row: Record<string, unknown>; value: unknown }) => {
                      const contactId = row?.id ?? row?._id;

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

                      // Created By -> always display createdByName
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

                      if (field.fieldKey === 'contactName' || field.fieldKey === 'name') {
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateContact({ contactId: contactId as string, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update contact name', e);
                                customToast.error('Failed to update name');
                              }
                            }}
                            onNotesClick={() => {
                              handleEditContact(row);
                            }}
                          />
                        );
                      }

                      if (field.fieldKey === 'filesLinks') {
                        return (
                          <div className="flex items-center justify-center h-5 cursor-pointer" onClick={(e) => {
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

                      if (field.fieldKey === 'activityTimeline') {
                        const count = (row as any)?._count?.activities as number | undefined;
                        return (
                          <div className="flex items-center justify-center h-5" onClick={(e) => e.stopPropagation()}>
                            <ActivityTimelineCell
                              contactId={String(contactId || '')}
                              count={count}
                              onOpen={(activityId?: string) => {
                                setEditData(row);
                                setIsEditMode(true);
                                setActiveView('default');
                                setActiveTab('overview');
                                setHighlightActivityId(activityId);
                                setIsFormModalOpen(true);
                              }}
                            />
                          </div>
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
                          const latestObj = latest as Record<string, unknown> | null;
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
                              const contactId = row?.id ?? row?._id;
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const body = makeUpdateBody(field, row, newTags);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: newTags },
                                  () => updateContact({ contactId: contactId as string, data: body }).unwrap()
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

                      // Action column with Edit, Delete, More icons
                      if (field.fieldKey === 'action') {
                        return (
                          <div className="flex items-center gap-2 h-6 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditContact(row);
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
                                const id = String(contactId || '');
                                if (!id) return;
                                const name = String(row?.contactName || row?.name || row?.recordId || 'Contact');
                                setToDelete({ id, name });
                                setIsDeleteOpen(true);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="12"
                                height="12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white"
                              >
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
                                // TODO: open more actions menu
                              }}
                            >
                              <span className="text-white text-sm leading-none">⋯</span>
                            </button>
                          </div>
                        );
                      }

                      if (field.fieldKey === 'createLead') {
                        return (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!contactId) return;
                              const contactIdStr = contactId as string;
                              try {
                                setConvertingIds((prev) => new Set(prev).add(contactIdStr));
                                await convertToLead({ contactId: contactIdStr, data: {} }).unwrap();
                                customToast.success('Contact converted to lead');
                                await refetchContacts();
                              } catch (err) {
                                console.error('Failed to convert contact to lead', err);
                                customToast.error('Failed to convert contact to lead');
                              } finally {
                                setConvertingIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(contactIdStr);
                                  return next;
                                });
                              }
                            }}
                            className="px-3 h-5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border"
                            style={{ borderColor: '#C81C1F', color: '#C81C1F', backgroundColor: 'transparent' }}
                            disabled={convertingIds.has(contactId as string)}
                            title="Move this contact to Leads"
                          >
                            {convertingIds.has(contactId as string) ? 'Converting...' : 'Move To Lead'}
                          </button>
                        );
                      }

                      // DROPDOWN RENDERING WITH CRUD OPERATIONS IN TABLE
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
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const sel = options.find((o) => o.fieldKey === newKey);
                                const payload = sel ? { value: sel.fieldKey, label: sel.displayName, color: sel.color } : newKey;
                                const updateBody = makeUpdateBody(field, row, payload);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: payload },
                                  () => updateContact({ contactId: contactId as string, data: updateBody }).unwrap()
                                );
                                customToast.success('Status updated');
                              } catch (e) {
                                console.error('Failed to update contact status', e);
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
                                await refetchContacts();
                              } catch (err) {
                                console.error('Failed to update dropdown choice', err);
                                customToast.error('Failed to update dropdown option');
                              }
                            }}
                            onAddOption={async (opt: { displayName: string; color: string }) => {
                              try {
                                if (!fieldId) return;
                                const base = opt.displayName.trim().toLowerCase().replace(/\s+/g, '_').replace(/^_|_$/g, '') || 'option';
                                let val = base;
                                const existing = new Set(options.map((o) => o.fieldKey));
                                let i = 1;
                                while (existing.has(val)) { val = `${base}_${i++}`; }
                                await addDropdownChoice({ fieldId, value: val, label: opt.displayName, color: opt.color, order: Date.now() }).unwrap();
                                customToast.success('Dropdown option added');
                                await refetchContacts();
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
                                await refetchContacts();
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
                                await refetchContacts();
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

                      if (field.fieldType === 'PHONE') {
                        return (
                          <PhoneValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateContact({ contactId: contactId as string, data: updateBody }).unwrap()
                                );
                                customToast.success('Phone updated');
                              } catch (e) {
                                console.error('Failed to update phone', e);
                                customToast.error('Failed to update phone');
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'EMAIL') {
                        return (
                          <EmailValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateContact({ contactId: contactId as string, data: updateBody }).unwrap()
                                );
                                customToast.success('Email updated');
                              } catch (e) {
                                console.error('Failed to update email', e);
                                customToast.error('Failed to update email');
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
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateContact({ contactId: contactId as string, data: updateBody }).unwrap()
                                );
                                customToast.success('URL updated');
                              } catch (e) {
                                console.error('Failed to update URL', e);
                                customToast.error('Failed to update URL');
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'TEXT') {
                        return (
                          <TextValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!contactId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  contactId as string,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateContact({ contactId: contactId as string, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update text field', e);
                                customToast.error('Failed to update field');
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'DATE' && value) {
                        try {
                          const date = new Date(value as string);
                          return (
                            <span className="text-sm">
                              {date.toLocaleDateString()}
                            </span>
                          );
                        } catch {
                          return <span>{String(value)}</span>;
                        }
                      }

                      return <></>;
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Contact Form Modal (same structure as opportunities) */}
        <FormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            // Only close completely if we're in default view
            if (activeView === "default") {
              setIsFormModalOpen(false);
            } else {
              // Otherwise, go back to default view
              setActiveView("default");
            }
          }}
          title={getModalTitle()}
          size="xl"
          disabled={!isEditMode && activeView === "default"}
          onBack={shouldShowBackButton ? handleBackToDefault : undefined}
          showBackButton={shouldShowBackButton}
        >
          <TabbedFormLayout
            tabs={getTabs()}
            activeTab={activeView !== "default" ? "overview" : activeTab}
            onTabChange={setActiveTab}
            className="h-[80vh]"
          />
        </FormModal>

        {/* Export CSV Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          entityLabel="contacts"
          fields={finalFields}
          rows={rows}
          fetchAll={fetchAllForExport}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => { if (!isDeleting) { setIsDeleteOpen(false); setToDelete(null); } }}
          onConfirm={async () => {
            if (!toDelete?.id) return;
            try {
              setIsDeleting(true);
              await deleteContact(toDelete.id).unwrap();
              customToast.success('Contact deleted');
              setIsDeleteOpen(false);
              setToDelete(null);
              await refetchContacts();
            } catch (err) {
              const e = err as { data?: { message?: string } };
              customToast.error(e?.data?.message || 'Failed to delete contact');
            } finally {
              setIsDeleting(false);
            }
          }}
          title={`Are you sure to delete`}
          message={''}
          itemName={`${toDelete?.name || ''} Contact`}
          isDeleting={isDeleting}
        />

        <DescriptionModal
          open={isDescriptionModalOpen}
          initialText={descriptionDraft}
          title="Update Description"
          onClose={() => setIsDescriptionModalOpen(false)}
          onSave={async (text) => {
            try {
              if (!descriptionRow) return;
              const id = descriptionRow.id ?? descriptionRow._id;
              if (!id) return;
              const fieldDef = (finalFields || []).find((f) => String(f.fieldKey).toLowerCase() === 'description');
              const prevSnap = descriptionRow;
              const body = fieldDef ? makeUpdateBody(fieldDef, descriptionRow, text) : { description: text } as Record<string, unknown>;
              await optimisticCellUpdate(
                id as string,
                prevSnap,
                { description: text },
                () => updateContact({ contactId: id as string, data: body }).unwrap()
              );
              setIsDescriptionModalOpen(false);
              customToast.success('Description updated');
            } catch (e) {
              customToast.error('Failed to update description');
            }
          }}
        />

        {/* Activity Modal */}
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          type={activityModalType}
          relatedEntity={
            editData?.id ? {
              id: editData.id as string,
              name: String(editData.dealName || editData.name || editData.title || 'Contact'),
              type: 'contact' as const
            } : undefined
          }
          onCreateActivity={handleCreateActivity}
        />

      </div>
    </ProtectedRoute>
  );
};

export default ContactsPage;
