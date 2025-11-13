"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/common/Sidebar/Sidebar';
import Header from '../../../components/common/Header';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FinalTable from '../../../components/common/CommonTable';
import StatusDropdown from '../../../components/dropdowns/StatusDropdown';
import { useTheme } from '../../../store/hooks';
import {
  useGetLeadFieldsQuery,
  useGetLeadsQuery,
  useFilterLeadsMutation,
  useUpdateLeadFieldMutation,
  useReorderLeadFieldsMutation,
  useUpdateLeadMutation,
  useConvertToOpportunityMutation,
  useGetLeadQuery,
  useCreateLeadMutation,
  useGetFieldStagesQuery,
  useGetLeadUpdatesQuery,
  useAddLeadUpdateMutation,
  useEditLeadUpdateMutation,
  useDeleteLeadMutation
} from '../../../store/api_query/leads.api';
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
import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import ViewIcon from '../../../components/ui buttons/ViewButton';
import { FiPlus, FiEdit2 } from "react-icons/fi";
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
import { TableTagsRenderer } from '@/components/dropdowns/TableTagsRenderer';
import { Popover, TextField, Button } from '@mui/material';
import { Edit } from 'lucide-react';
import ExportModal from '@/components/common/ExportModal';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import { useGetUsersQuery } from '@/store/api_query/user.api'
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api'
import DescriptionModal from '../../../components/common/DescriptionModal';
import DeleteConfirmationModal from '../../../components/common/DeleteConfirmationModal';
import ViewModeToggle from '@/components/common/ViewModeToggle';
import KanbanBoard from '@/components/BizAccelerator/Kanban/KanbanBoard';
import NotesIcon from '@/components/ui buttons/NotesIcon';

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

const LeadsPage: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery();

  // Sort and pagination
  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showLessColumns, setShowLessColumns] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [savedFilterId, setSavedFilterId] = useState<string | null>(null);

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeView, setActiveView] = useState<"default" | "email" | "signature">("default");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionRow, setDescriptionRow] = useState<Record<string, unknown> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  // Activities and conversion state
  const [convertingIds, setConvertingIds] = useState<Set<string | number>>(new Set());
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalType, setActivityModalType] = useState<'meeting' | 'call' | 'notes' | 'todo' | 'email'>('call');

  // API queries and mutations
  const { data: allFieldsFull, refetch: refetchFieldDefinitions } = useGetFieldDefinitionsByEntityQuery('lead');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetLeadFieldsQuery();
  const { data: initialLeadsData, isLoading: initialLeadsLoading } = useGetLeadsQuery({
    page: currentPage,
    limit: pageSize,
    sortBy: sort?.field || 'createdAt',
    sortOrder: sort?.direction || 'desc',
    includeConverted: false,
  });
  const [filterLeads, { data: leadsData, isLoading: leadsLoading }] = useFilterLeadsMutation();
  const [currentLeadsData, setCurrentLeadsData] = useState<unknown>(null);

  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [createLead] = useCreateLeadMutation();
  const [convertToOpportunity] = useConvertToOpportunityMutation();
  const [updateField] = useUpdateLeadFieldMutation();
  const [reorderFields] = useReorderLeadFieldsMutation();

  // Dropdown CRUD mutations
  const [addDropdownChoice] = useAddDropdownChoiceMutation();
  const [updateDropdownChoice] = useUpdateDropdownChoiceMutation();
  const [reorderDropdownChoices] = useReorderDropdownChoicesMutation();
  const [deleteDropdownChoice] = useDeleteDropdownChoiceMutation();

  // Saved filters
  const { data: savedFiltersData } = useGetSavedFiltersQuery('lead');
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteFilterMutation();

  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  // Selected lead data for form
  const { data: selectedLeadData } = useGetLeadQuery(
    String(editData?.id ?? ''),
    { skip: !isFormModalOpen || !editData?.id }
  );

  // Pipeline stages
  const initialLeadsObj = initialLeadsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const currentLeadsObj = currentLeadsData as { items?: unknown[]; pagination?: { total?: number }; fieldDefinitions?: unknown[] } | undefined;
  const fieldsRawArray = useMemo(() => {
    const fr = fieldsRaw as unknown;
    if (Array.isArray(fr)) return fr as unknown[];
    const items = (fr as { items?: unknown[] } | undefined)?.items;
    return Array.isArray(items) ? items : [];
  }, [fieldsRaw]);

  const statusField = useMemo(() => {
    const found = fieldsRawArray.find((field) => (field as { fieldKey?: string })?.fieldKey === 'status');
    return found as { id?: string } | undefined;
  }, [fieldsRawArray]);

  const { data: stagesData, isLoading: stagesLoading } = useGetFieldStagesQuery(
    {
      fieldId: String((statusField as { id?: string } | undefined)?.id ?? ''),
      includeInactive: false
    },
    { skip: !((statusField as { id?: string } | undefined)?.id) }
  );

  const pipelineStages = ((stagesData as { data?: { stages?: unknown[] } } | undefined)?.data?.stages) ?? [];

  // Build Kanban columns from status dropdown choices (fallback to pipeline stages)
  const kanbanColumns = useMemo(() => {
    if (!statusField) return [] as { id: string; title: string; value: string; color?: string }[];
    const choices = (((statusField as Record<string, unknown>)?.options as Record<string, unknown> | undefined)?.choices) as Array<Record<string, unknown> | string> | undefined;
    if (Array.isArray(choices) && choices.length > 0) {
      return choices.map((c) => {
        if (typeof c === 'string') return ({ id: c, title: c, value: c, color: '#6b7280' });
        const value = String((c as Record<string, unknown>).value ?? '');
        const title = String((c as Record<string, unknown>).label ?? value);
        const color = String((c as Record<string, unknown>).color ?? '#6b7280');
        return { id: value, title, value, color };
      });
    }
    // Fallback to stages API if options are missing
    return (pipelineStages as Array<Record<string, unknown>>).map((s) => ({
      id: String(s.id ?? s.value ?? s.name ?? ''),
      title: String(s.name ?? s.label ?? s.value ?? ''),
      value: String(s.id ?? s.value ?? s.name ?? ''),
      color: String((s as any).color ?? '#6b7280')
    }));
  }, [statusField, pipelineStages]);

  // Activities data
  const { data: activitiesResponse } = useGetActivitiesByEntityQuery(
    { entityType: 'lead', entityId: String(editData?.id ?? '') },
    { skip: !isFormModalOpen || !editData?.id }
  );

  const activitiesData = ((activitiesResponse as { data?: { items?: unknown[] }, items?: unknown[] } | undefined)?.data?.items) ?? ((activitiesResponse as { items?: unknown[] } | undefined)?.items) ?? [];

  // Updates data
  const { data: updatesData, isLoading: updatesLoading } = useGetLeadUpdatesQuery(
    String(editData?.id ?? ''),
    { skip: !isFormModalOpen || !editData?.id }
  );

  const { data: companyUsersData } = useGetCompanyUsersQuery({});

  const [addLeadUpdate] = useAddLeadUpdateMutation();
  const [editLeadUpdate] = useEditLeadUpdateMutation();

  const { data: usersData } = useGetUsersQuery({});

  // Field definitions for table
  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    let fields: FieldDefinition[] = [];
    if (fromShared.length > 0) {
      fields = mapBackendListToFrontend(fromShared as unknown as BackendFieldDefinition[]);
    } else {
      const fromApi = fieldsRawArray as unknown[];
      const fromData = ((currentLeadsObj?.fieldDefinitions ?? initialLeadsObj?.fieldDefinitions) ?? []) as unknown[];
      const mergedByKey = new Map<string, Record<string, unknown>>();
      [...fromApi, ...fromData].forEach((f: unknown) => {
        if (!f) return;
        const field = f as Record<string, unknown>;
        mergedByKey.set(field.fieldKey as string, { ...mergedByKey.get(field.fieldKey as string), ...field });
      });
      fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as BackendFieldDefinition[]);
    }
    // Ensure Action column exists at the far-right
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
  }, [allFieldsFull, fieldsRawArray, currentLeadsObj?.fieldDefinitions, initialLeadsObj?.fieldDefinitions]);

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

  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    return [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
  }, [finalFields, showLessColumns]);

  // Form fields configuration
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
          f.fieldKey !== 'filesLinks' &&
          f.fieldKey !== 'createOpportunity';
      })

      .map((field: unknown) => {
        const f = field as Record<string, unknown>;
        const dynamicConfig = getDynamicFieldConfig(
          f.fieldKey as string,
          (f.fieldType as unknown) as import('@/components/common/forms/DynamicForm/types').FieldType,
          f.displayName as string
        );

        const transformedOptions: Record<string, unknown> = {};

        const fo = (f.options ?? {}) as Record<string, unknown>;
        if (fo) {
          if (fo.choices && Array.isArray(fo.choices)) {
            transformedOptions.choices = fo.choices.map((choice: unknown) => {
              const c = choice as { value?: unknown; label?: string; color?: string };
              return {
                value: c?.value ?? choice,
                label: c?.label ?? String(c?.value ?? choice),
                color: c?.color
              };
            });
          }

          if (fo.placeholder) transformedOptions.placeholder = fo.placeholder;
          if (fo.rows) transformedOptions.rows = fo.rows;
          if (fo.multiple) transformedOptions.multiple = fo.multiple;
          if (fo.allowCustomTags) transformedOptions.allowCustom = fo.allowCustomTags;

          Object.keys(fo).forEach(key => {
            if (!['choices', 'placeholder', 'rows', 'multiple', 'allowCustomTags'].includes(key)) {
              transformedOptions[key] = fo[key];
            }
          });
        }

        return {
          fieldKey: f.fieldKey,
          displayName: f.displayName,
          fieldType: f.fieldType,
          isRequired: (f.isRequired as boolean) || false,
          isEditable: (f.isReadOnly as boolean) !== true,
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

    // Add convert to opportunity button field
    transformedFields.push({
      fieldKey: 'createOpportunity',
      displayName: 'Convert to Opportunity',
      fieldType: 'BUTTON',
      isRequired: false,
      isEditable: true,
      isReadOnly: false,
      options: {},
      displayOrder: transformedFields.length + 1,
      helpText: 'Convert this lead to an opportunity',
      fieldId: 'create-opportunity-field',
      id: 'create-opportunity-field',
      icon: '🔄',
      tooltip: 'Convert to Opportunity',
      iconBg: "#C81C1F",
    });

    return transformedFields;
  }, [fieldsRawArray]);

  // Refetch leads helper
  const refetchLeads = async () => {
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
        sortBy: sort?.field || 'createdAt',
        sortOrder: sort?.direction || 'desc',
        includeConverted: false,
      };

      if (savedFilterId) {
        params.savedFilterId = String(savedFilterId);
      } else {
        const filterRules: Array<FilterGroup | FilterRule> = [];
        if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules as FilterGroup);
        if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules as FilterGroup);
        if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules as FilterGroup | FilterRule);

        if (filterRules.length > 0) {
          params.filterGroup = filterRules.length === 1
            ? filterRules[0]
            : ({ logic: 'AND', rules: filterRules } as FilterGroup);
        }
      }

      const result = await filterLeads(params).unwrap();
      setCurrentLeadsData(result);
    } catch (error) {
      console.error('Failed to refetch leads:', error);
    }
  };

  // Handle form submission
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
        await updateLead({
          leadId: String(editData.id),
          data: values
        }).unwrap();
        customToast.success("Lead updated successfully!");
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

        await createLead({ data: createData }).unwrap();
        customToast.success("Lead created successfully!");
      }

      setIsFormModalOpen(false);

      // Refresh leads list
      await refetchLeads();
    } catch (error: unknown) {
      console.error("Failed to save lead:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to save lead");
    }
  };

  // Handle convert to opportunity from form
  const handleConvertToOpportunity = async (leadId: string) => {
    console.log('handleConvertToOpportunity called with leadId:', leadId);

    try {
      setConvertingIds(prev => new Set(prev).add(leadId));

      const leadData = editData || selectedLeadData;
      console.log('Lead data for conversion:', leadData);

      const opportunityData: Record<string, unknown> = {
        name: leadData?.name || `Opportunity from ${leadData?.firstName || 'Lead'}`,
        email: leadData?.email,
        phone: leadData?.phone,
        company: leadData?.company,
        description: leadData?.description,
      };

      console.log('Opportunity data to create:', opportunityData);

      const result = await convertToOpportunity({
        leadId,
        opportunityData
      }).unwrap();

      console.log('Conversion successful:', result);
      customToast.success('Lead successfully converted to opportunity');
      setIsFormModalOpen(false);

      // Refresh the leads data
      await refetchLeads();

    } catch (error: unknown) {
      console.error('Failed to convert lead to opportunity:', error);
      const err = error as { data?: { message?: string }, message?: string };
      console.error('Error details:', err?.data);
      customToast.error(err?.data?.message || "Failed to convert lead to opportunity");
    } finally {
      setConvertingIds(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  // Dropdown CRUD handlers for form
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
    } catch (error: unknown) {
      console.error("Failed to add dropdown option:", error);
      const err = error as { data?: { message?: string } };
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
    } catch (error: unknown) {
      console.error("Failed to update dropdown option:", error);
      const err = error as { data?: { message?: string } };
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
    } catch (error: unknown) {
      console.error("Failed to reorder dropdown options:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to reorder dropdown options");
    }
  };

  const handleDeleteDropdownOption = async (fieldId: string, value: string) => {
    try {
      await deleteDropdownChoice({ fieldId, value }).unwrap();
      customToast.success("Dropdown option deleted successfully!");
    } catch (error: unknown) {
      console.error("Failed to delete dropdown option:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to delete dropdown option");
    }
  };

  // Modal handlers
  const handleAddLead = () => {
    setIsEditMode(false);
    setEditData(null);
    setActiveTab("overview");
    setActiveView("default");
    setIsFormModalOpen(true);
  };
  const handleEditLead = (leadData: Record<string, unknown>) => {
    // Process the data before setting it for editing
    const processedData = { ...leadData };

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
    setActiveTab("overview");
    setActiveView("default");
    setIsFormModalOpen(true);
  };
  // Activity modal handlers
  const handleOpenActivityModal = (type: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => {
    if (!editData?.id) {
      customToast.error("Please select a lead first");
      return;
    }

    setActivityModalType(type);
    setIsActivityModalOpen(true);
  };

  const [createActivityMutation] = useCreateActivityMutation();

  const handleCreateActivity = async (activityPayload: ActivityData): Promise<void> => {
    try {
      if (!currentUser?.id) {
        throw new Error('User information not available');
      }

      const type = (activityPayload.type as string | undefined)?.toUpperCase();
      const subject = (activityPayload.subject as string | undefined) ?? (activityPayload as unknown as { title?: string }).title ?? '';
      if (!subject?.trim()) {
        throw new Error('Subject is required');
      }
      const scheduledAt = (activityPayload.scheduledAt as string | undefined);
      if (!scheduledAt) {
        throw new Error('Scheduled date is required');
      }

      const apiPayload = {
        type,
        title: subject,
        description: activityPayload.description || '',
        scheduledAt,
        assignedToId: currentUser.companyUserId,
        status: 'SCHEDULED',
        documents: undefined as unknown,
      } as unknown;

      const createData = apiPayload as import('../../../store/api_query/BizAccelerator/activities.api').CreateActivityData;
      await createActivityMutation(createData).unwrap();
      customToast.success("Activity created successfully!");
      setIsActivityModalOpen(false);
    } catch (error: unknown) {
      console.error('Failed to create activity:', error);
      const err = error as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || "Failed to create activity");
      throw error;
    }
  };

  // Updates handlers
  const handleCreateLeadUpdate = async (content: string) => {
    if (!editData?.id) {
      customToast.error("No lead selected");
      return;
    }

    try {
      await addLeadUpdate({
        leadId: String(editData.id),
        content: content
      }).unwrap();

      customToast.success("Update added successfully");
      await refetchLeads();
    } catch (error) {
      console.error("Failed to add update:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to add update");
    }
  };

  const handleEditLeadUpdate = async (updateId: string, content: string) => {
    if (!editData?.id) {
      customToast.error("No lead selected");
      return;
    }

    try {
      await editLeadUpdate({
        leadId: String(editData.id),
        updateId: updateId,
        content: content
      }).unwrap();

      customToast.success("Update edited successfully");
      await refetchLeads();
    } catch (error: unknown) {
      console.error("Failed to edit update:", error);
      const err = error as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || "Failed to edit update");
    }
  };

  // View handlers
  const getModalTitle = () => {
    if (activeView === "email") return "New Email";
    if (activeView === "signature") return "Email Signature";
    return isEditMode ? "Edit Lead" : "Create Lead";
  };

  const handleBackToDefault = () => {
    setActiveView("default");
  };

  const shouldShowBackButton = activeView !== "default";

  // Tabs configuration
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
          initialValues: (() => {
            const data = editData || {};
            // Process updates field
            if (data.updates && Array.isArray(data.updates)) {
              const updatesArray = data.updates as any[];
              const processedData = { ...data };
              if (updatesArray.length > 0) {
                const latestUpdate = updatesArray[0];
                processedData.updates = latestUpdate.content || latestUpdate.updateNotes || '';
              } else {
                processedData.updates = '';
              }
              return processedData;
            }
            return data;
          })(),
          className: "h-full",
          isLoading: fieldsLoading,
          activitiesData: activitiesData,
          onAddActivity: handleOpenActivityModal,
          activeView: activeView,
          onViewChange: setActiveView,
          onAddDropdownOption: handleAddDropdownOption,
          onUpdateDropdownOption: handleUpdateDropdownOption,
          onReorderDropdownOptions: handleReorderDropdownOptions,
          onDeleteDropdownOption: handleDeleteDropdownOption,
          dealData: editData || selectedLeadData || {},
          convertingIds: convertingIds,
          suiteApp: "biz-accelator",
          relatedItem: editData?.id,
          pipelineStages: pipelineStages,
          stagesLoading: stagesLoading,
          onConvertToOpportunity: handleConvertToOpportunity,
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
          leadId: isEditMode && editData?.id ? editData.id : undefined,
          updatesData: updatesData || [],
          isLoading: updatesLoading,
          onCreateUpdate: handleCreateLeadUpdate,
          onEditUpdate: handleEditLeadUpdate,
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

  // Filter transformation functions
  const transformBackendFiltersToFrontend = (filterGroup: unknown): FilterCondition[] => {
    const group = filterGroup as { logic?: string; rules?: unknown[] } | undefined;
    if (!group || !Array.isArray(group.rules)) return [];
    const logic = group.logic || 'AND';
    return group.rules.flatMap((rule: unknown, index: number): FilterCondition[] => {
      const r = rule as { logic?: string; rules?: unknown[]; values?: unknown[]; value?: unknown; fieldKey?: string; condition?: string };
      if (r.logic && r.rules) {
        return transformBackendFiltersToFrontend(rule);
      }
      const raw = r.values || (r.value ? [r.value] : []);
      const value = (Array.isArray(raw) ? raw : [raw]).map(v => String(v ?? ''));
      return [{
        id: `filter-${Date.now()}-${index}`,
        field: (r.fieldKey as string) || '',
        condition: (r.condition as string) || 'CONTAINS',
        value,
        logicalOperator: logic as 'AND' | 'OR',
      }];
    });
  };

  const transformFiltersToBackendFormat = (filters: FilterCondition[]): FilterGroup | null => {
    if (filters.length === 0) return null;

    const noValueConditions = [
      'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
      'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK', 'IS_THIS_MONTH',
      'IS_LAST_MONTH', 'IS_NEXT_MONTH', 'IS_TRUE', 'IS_FALSE',
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
        } as FilterRule);
        return;
      }

      if (!filter.value || filter.value.length === 0) {
        return;
      }

      if (['IN', 'NOT_IN'].includes(filter.condition)) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          values: filter.value,
          value: filter.value.join(','),
        } as FilterRule);
        return;
      }

      if (filter.value.length === 1) {
        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0],
        } as FilterRule);
        return;
      }

      if (filter.value.length > 1) {
        if (orMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map((val) => ({
            fieldKey: filter.field,
            condition: filter.condition,
            value: val,
          }));

          transformedRules.push({
            logic: 'OR',
            rules: nestedRules,
          } as FilterGroup);
          return;
        }

        if (andMultiValueConditions.includes(filter.condition)) {
          const nestedRules: FilterRule[] = filter.value.map((val) => ({
            fieldKey: filter.field,
            condition: filter.condition,
            value: val,
          }));

          transformedRules.push({
            logic: 'AND',
            rules: nestedRules,
          } as FilterGroup);
          return;
        }

        transformedRules.push({
          fieldKey: filter.field,
          condition: filter.condition,
          value: filter.value[0],
        } as FilterRule);
      }
    });

    if (transformedRules.length === 0) return null;

    const logic = filters[0]?.logicalOperator || 'AND';

    return {
      logic: logic as 'AND' | 'OR',
      rules: transformedRules,
    } as FilterGroup;
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

  // Search and filter logic
  const buildSearchFilterRules = useMemo<FilterGroup | null>(() => {
    if (!searchQuery || selectedColumns.length === 0) return null;

    const rules: FilterRule[] = selectedColumns.map((columnKey) => ({
      fieldKey: columnKey,
      condition: 'CONTAINS',
      value: searchQuery,
    }));

    return {
      logic: 'OR',
      rules,
    } as FilterGroup;
  }, [searchQuery, selectedColumns]);

  const buildAdvancedFilterRules = useMemo<FilterGroup | null>(() => {
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
      const u = user as { id?: string; firstName?: string; lastName?: string; email?: string; role?: unknown; avatar?: string };
      return {
        id: u.id as string,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || (u.email as string),
        email: u.email as string,
        role: u.role,
        avatar: u.avatar as string
      };
    });
  }, [companyUsersData]);

  // Build person filter rules
  const buildPersonFilterRules = useMemo<FilterGroup | FilterRule | null>(() => {
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
    const personRules = selectedPeopleIds.map((personId) => {
      // For each person, create rules that check all relevant fields
      const fieldRules: FilterRule[] = fieldKeys.map((fieldKey) => ({
        fieldKey: fieldKey,
        condition: 'EQUALS',
        value: personId,
      }));

      // If multiple fields, wrap in OR logic for this person
      if (fieldRules.length > 1) {
        return {
          logic: 'OR',
          rules: fieldRules,
        } as FilterGroup;
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
      logic: 'OR',
      rules: personRules,
    } as FilterGroup;
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

  // Fetch leads with server-side pagination and filters
  useEffect(() => {
    if (!hasActiveSearchOrFilters && !savedFilterId) {
      const fetchBasicLeads = async () => {
        try {
          const params: Record<string, unknown> = {
            page: currentPage,
            limit: pageSize,
            sortBy: sort?.field || 'createdAt',
            sortOrder: sort?.direction || 'desc',
            includeConverted: false,
          };
          const result = await filterLeads(params).unwrap();
          setCurrentLeadsData(result);
        } catch (error) {
          console.error('Failed to fetch leads:', error);
          customToast.error('Failed to load leads');
        }
      };

      fetchBasicLeads();
      return;
    }

    const fetchLeads = async () => {
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
          const filterRules = [];

          if (buildSearchFilterRules) filterRules.push(buildSearchFilterRules);
          if (buildAdvancedFilterRules) filterRules.push(buildAdvancedFilterRules);
          if (buildPersonFilterRules) filterRules.push(buildPersonFilterRules); // Add person filter

          if (filterRules.length > 0) {
            params.filterGroup = filterRules.length === 1
              ? filterRules[0]
              : {
                logic: 'AND',
                rules: filterRules
              };
          }
        }

        const result = await filterLeads(params).unwrap();
        setCurrentLeadsData(result);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        customToast.error('Failed to load leads');
      }
    };

    fetchLeads();
  }, [
    searchQuery,
    selectedColumns,
    sort,
    activeFilters,
    selectedPeopleIds,
    personFilterField,
    filterLeads,
    savedFilterId,
    currentPage,
    pageSize
  ]);

  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setCurrentPage(1);
    setSelectedPeopleIds(selectedIds);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setCurrentPage(1);
    setPersonFilterField(field);
  };

  // Table configuration
  const rows = ((currentLeadsObj?.items ?? initialLeadsObj?.items) ?? []) as Record<string, unknown>[];
  const loading = fieldsLoading || leadsLoading || initialLeadsLoading;

  // Export: fetch all contacts in DB (ignoring current pagination/filters)
  const fetchAllForExport = async (): Promise<Record<string, unknown>[]> => {
    try {
      const pageSizeAll = 1000;
      let page = 1;
      const all: Record<string, unknown>[] = [];
      // loop until we fetched all
      // using filterLeads endpoint without filterGroup to fetch entire DB
      // keep sort consistent with current sort
      while (true) {
        const res = await filterLeads({
          page,
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
        page += 1;
      }
      return all;
    } catch (e) {
      console.error('Export fetchAll failed', e);
      return [];
    }
  };



  const leadTitleBtn = [
    {
      name: "Export",
      icon: <FiPlus />,
      onClick: () => setShowExportModal(true)
    },
    {
      name: "Add Lead",
      icon: <FiPlus />,
      onClick: handleAddLead
    },
  ];

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    leadName: 260,
    email: 200,
    phone: 180,
    status: 160,
    createdByName: 180,
    createdBy: 180,
    createdById: 180,
    action: 140,
    createdAt: 160,
    assignDate: 150,
    followUpDate: 160,
    createdDate: 150,
    updatedAt: 160,
    filesLinks: 150,
    activityTimeline: 240,
    createOpportunity: 180,
    alternatePhone: 200,
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

  // Optimistic local patching for Monday-like UX (no list refetch on each inline edit)
  const patchLeadRowLocally = (leadId: string, patch: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
    setCurrentLeadsData((prev: unknown) => {
      const p = prev as { items?: unknown[] } | undefined;
      if (!p?.items) return prev;
      const items = Array.isArray(p.items) ? [...p.items] : [];
      const idx = items.findIndex((r: unknown) => ((r as Record<string, unknown>)?.id ?? (r as Record<string, unknown>)?._id) === leadId);
      if (idx === -1) return prev;
      const before = items[idx] as Record<string, unknown>;
      const nextRow = typeof patch === 'function'
        ? (patch as (prev: Record<string, unknown>) => Record<string, unknown>)(before)
        : { ...before, ...(patch as Record<string, unknown>) };
      items[idx] = nextRow as unknown as Record<string, unknown>;
      return { ...(p as Record<string, unknown>), items } as unknown;
    });
  };

  const optimisticCellUpdate = async (
    leadId: string,
    prevRow: Record<string, unknown>,
    localPatch: Record<string, unknown>,
    performUpdate: () => Promise<unknown>,
  ) => {
    patchLeadRowLocally(leadId, localPatch);
    try {
      await performUpdate();
    } catch (err) {
      patchLeadRowLocally(leadId, prevRow);
      throw err;
    }
  };

  const handleRenameColumn = async (field: FieldDefinition, newName: string) => {
    const fid = field.id ?? fieldIdByKey.get(field.fieldKey);
    if (!fid) return;
    const clean = newName.trim();
    if (!clean || clean === field.displayName) return;
    try {
      await updateField({ fieldId: fid, data: { displayName: clean } }).unwrap();
      await refetchFieldDefinitions(); // Refetch shared field definitions
      await refetchLeads();
    } catch (e) {
      console.error('Failed to update field displayName', e);
    }
  };

  const handleHideColumn = async (field: FieldDefinition) => {
    const fid = field.id ?? fieldIdByKey.get(field.fieldKey);
    if (!fid) return;
    try {
      await updateField({ fieldId: fid, data: { isVisible: false } }).unwrap();
    } catch (e) {
      console.error('Failed to hide field', e);
    }
  };

  const handleToggleColumnVisibility = async (field: FieldDefinition, visible: boolean) => {
    const fid = field.id ?? fieldIdByKey.get(field.fieldKey);
    if (!fid) return;
    try {
      await updateField({ fieldId: fid, data: { isVisible: visible } }).unwrap();
    } catch (e) {
      console.error('Failed to toggle visibility', e);
    }
  };

  const handleReorderColumns = async (orderedFieldKeys: string[]) => {
    try {
      const fieldOrders = orderedFieldKeys
        .map((k, idx) => {
          const fid = fieldIdByKey.get(k) ?? finalFields.find(f => f.fieldKey === k)?.id;
          return fid ? { fieldId: fid, displayOrder: idx + 1 } : null;
        })
        .filter((x): x is { fieldId: string; displayOrder: number } => !!x);
      if (fieldOrders.length > 0) {
        await reorderFields({ fieldOrders }).unwrap();
      }
    } catch (e) {
      console.error('Failed to reorder fields', e);
    }
  };

  const handleConvertToOpportunityInTable = async (leadId: string, row: Record<string, unknown>) => {
    try {
      setConvertingIds(prev => new Set(prev).add(leadId));

      const opportunityData: Record<string, unknown> = {
        name: (row as Record<string, unknown>)?.name || `Opportunity from ${(row as Record<string, unknown>)?.name || 'Lead'}`,
        email: (row as Record<string, unknown>)?.email,
        phone: (row as Record<string, unknown>)?.phone,
        company: (row as Record<string, unknown>)?.company,
        description: (row as Record<string, unknown>)?.description,
      };

      await convertToOpportunity({
        leadId,
        opportunityData
      }).unwrap();

      customToast.success('Lead successfully converted to opportunity');
      await refetchLeads();

    } catch (error: unknown) {
      console.error('Failed to convert lead to opportunity:', error);
      const err = error as { data?: { message?: string }, message?: string };
      customToast.error(err?.data?.message || err?.message || 'Failed to convert lead to opportunity');
    } finally {
      setConvertingIds(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
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
                    { label: 'Leads', href: '/dashboard/biz-accelerator/leads' },
                  ]}
                />
              </div>
              <div
                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                style={{
                  backgroundColor: isDark ? colors.dark.sidebar : undefined
                }}
              >
                <Title projectTitleObj={leadTitleBtn} name="Lead List" />
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
                  currentFilters={activeFilters}
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
                        entityType: 'lead',
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
                  total={currentLeadsObj?.pagination?.total ?? initialLeadsObj?.pagination?.total ?? 0}
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
                    columnKey={(statusField as unknown as { fieldKey?: string })?.fieldKey || 'status'}
                    columns={kanbanColumns.map(c => ({ id: c.id, title: c.title, value: c.value, color: c.color }))}
                    rowKey="id"
                    addColumnLabel="Add a New Status"
                    onAddColumn={async ({ name, color }) => {
                      try {
                        const fieldId = (statusField as unknown as { id?: string })?.id;
                        if (!fieldId) return;
                        const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'status';
                        let val = base;
                        const existing = new Set(kanbanColumns.map((c) => String(c.value)));
                        let i = 1;
                        while (existing.has(val)) { val = `${base}_${i++}`; }
                        await addDropdownChoice({ fieldId, value: val, label: name.trim(), color }).unwrap();
                        customToast.success('Status added');
                        return { id: val, title: name.trim(), value: val, color };
                      } catch (e) {
                        customToast.error('Failed to add status');
                      }
                    }}
                    renderCard={(row) => {
                      const r = row as Record<string, unknown>;
                      const leadId = String((r as any)?.id ?? (r as any)?._id ?? '');
                      const defsByKey = Object.fromEntries(finalFields.map((f) => [String(f.fieldKey), f] as const));
                      const defsByKeyLc = Object.fromEntries(finalFields.map((f) => [String(f.fieldKey).toLowerCase(), f] as const));
                      const emailDef = (defsByKeyLc['email'] ?? finalFields.find((f) => f.fieldType === 'EMAIL')) as FieldDefinition | undefined;
                      const phoneDef = (defsByKeyLc['phone'] ?? finalFields.find((f) => f.fieldType === 'PHONE')) as FieldDefinition | undefined;
                      const companyDef = (defsByKey['company'] ?? defsByKey['companyName']) as FieldDefinition | undefined;
                      const followUpDef = (defsByKey['followUpDate'] ?? defsByKey['followupDate'] ?? defsByKey['nextFollowUp'] ?? defsByKey['nextFollowUpDate']) as FieldDefinition | undefined;
                      const get = (keys: string[]): unknown => {
                        for (const k of keys) {
                          const v = r?.[k as keyof typeof r];
                          if (v !== undefined) return v;
                          const lc = k.toLowerCase();
                          const found = Object.keys(r || {}).find((kk) => kk.toLowerCase() === lc);
                          if (found) return (r as any)[found];
                        }
                        return undefined;
                      };
                      const getDisplay = (val: unknown): string => {
                        if (!val) return '';
                        if (typeof val === 'string' || typeof val === 'number') return String(val);
                        if (typeof val === 'object') {
                          const o = val as Record<string, unknown>;
                          return String(o.label ?? o.displayName ?? o.value ?? '');
                        }
                        return '';
                      };
                      const titleText = String(r?.name || r?.leadName || r?.title || r?.recordId || '');
                      return (
                        <div className={['text-card-foreground overflow-hidden bg-white shadow-sm border border-gray-200 rounded-xl', 'transition-all duration-200 relative select-none px-3 hover:shadow-md hover:border-gray-400', 'pt-[0.4375rem] pb-1.5 w-full'].join(' ')}>
                          <button type="button" onClick={() => handleEditLead(r)} className="absolute top-2 right-2 p-1.5 rounded hover:bg-gray-100" title="Notes" aria-label="Notes">
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
                                    {getDisplay(r?.[companyDef.fieldKey as keyof typeof r]) || '-'}
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
                                        const id = leadId; if (!id) return; const prevSnap = r;
                                        await optimisticCellUpdate(
                                          id,
                                          prevSnap,
                                          { [emailDef.fieldKey]: next },
                                          () => updateLead({ leadId: id, data: makeUpdateBody(emailDef, prevSnap, next) }).unwrap()
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
                                        const id = leadId; if (!id) return; const prevSnap = r;
                                        await optimisticCellUpdate(
                                          id,
                                          prevSnap,
                                          { [phoneDef.fieldKey]: next },
                                          () => updateLead({ leadId: id, data: makeUpdateBody(phoneDef, prevSnap, next) }).unwrap()
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {/* Lead Type removed from Kanban card */}
                              {followUpDef && (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="shrink-0 text-[11px] text-gray-500">Follow Up</span>
                                  <div className="truncate flex-1">
                                    {(() => {
                                      const raw = r?.[followUpDef.fieldKey as keyof typeof r];
                                      if (!raw) return '-';
                                      const d = new Date(String(raw));
                                      return isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString();
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                    cardTitleFieldKey={finalFields.find(f => ['name', 'leadName'].includes(String(f.fieldKey).toLowerCase()))?.fieldKey}
                    getCardFieldKeys={(item) => {
                      const defsByKey = Object.fromEntries(finalFields.map(f => [String(f.fieldKey).toLowerCase(), f] as const));
                      const pickKey = (cands: string[]) => cands.find(k => defsByKey[k.toLowerCase()]) || '';
                      const keys = [
                        pickKey(['company', 'companyName', 'account', 'accountName']),
                        pickKey(['email']),
                        pickKey(['phone', 'mobile', 'phoneNumber']),
                        pickKey(['followUpDate', 'followupDate', 'nextFollowUp', 'nextFollowUpDate'])
                      ].filter(Boolean);
                      return keys as string[];
                    }}
                    onItemMove={async ({ item, destColumnId }) => {
                      if (!statusField) return;
                      const leadId = String((item as any)?.id ?? (item as any)?._id ?? '');
                      if (!leadId) return;
                      const sel = kanbanColumns.find((c) => String(c.id) === String(destColumnId));
                      if (!sel) return;
                      const current = (item as any)?.[(statusField as any).fieldKey];
                      const objectPayload = { value: sel.value, label: sel.title, color: sel.color } as unknown;
                      const stringPayload = sel.value as unknown;
                      const prevRow = rows.find(r => String((r as any)?.id ?? (r as any)?._id) === leadId) as Record<string, unknown> | undefined;
                      const doUpdate = async (payload: unknown) => {
                        if (prevRow) {
                          await optimisticCellUpdate(
                            leadId,
                            prevRow,
                            { [(statusField as any).fieldKey]: payload },
                            () => updateLead({ leadId, data: makeUpdateBody(statusField as any, prevRow, payload) }).unwrap()
                          );
                        } else {
                          await updateLead({ leadId, data: { [(statusField as any).fieldKey]: payload } }).unwrap();
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
                        const fieldId = (statusField as unknown as { id?: string })?.id;
                        if (!fieldId) return;
                        const choices = ordered.map((c, idx) => ({ value: String(c.value), order: idx + 1, label: c.title, color: c.color }));
                        await reorderDropdownChoices({ fieldId, choices }).unwrap();
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
                    getCellRenderer={({ field, row, value, rowIndex }: { field: FieldDefinition; row: Record<string, unknown>; value: unknown; rowIndex: number }) => {
                      const rawId = (row as Record<string, unknown>)?.id ?? (row as Record<string, unknown>)?._id;
                      const leadId = String(rawId ?? '');

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

                    // Files/Links button
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

                      // Updates field
                      {
                        const key = String(field.fieldKey || '').toLowerCase();
                        const name = String((field.displayName || '')).toLowerCase();
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
                          const raw = (() => {
                            if (latest && typeof latest === 'object' && 'content' in (latest as Record<string, unknown>)) {
                              const c = (latest as Record<string, unknown>).content;
                              return typeof c === 'string' ? c : '';
                            }
                            return typeof source === 'string' ? source : '';
                          })();
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

                      // Tags field
                      if (field.fieldKey === 'tags') {
                        return (
                          <EditableTagsCell
                            tags={value}
                            onCommit={async (newTags: string[]) => {
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const body = makeUpdateBody(field, row, newTags);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: newTags },
                                  () => updateLead({ leadId, data: body }).unwrap()
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

                      // Action column
                      if (field.fieldKey === 'action') {
                        return (
                          <div className="flex items-center gap-2 h-6 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-6 h-6 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLead(row);
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
                                if (!leadId) return;
                                const name = String(row?.name || row?.leadName || row?.recordId || 'Lead');
                                setToDelete({ id: leadId, name });
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
                              }}
                            >
                              <span className="text-white text-sm leading-none">⋯</span>
                            </button>
                          </div>
                        );
                      }

                      // Convert to Opportunity button
                      if (field.fieldKey === 'createOpportunity') {
                        const isConverted = !!row.isConverted || !!row.convertedOpportunity;
                        const isLoading = convertingIds.has(leadId);

                        return (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!leadId) return;
                              handleConvertToOpportunityInTable(leadId, row);
                            }}
                            className="px-3 h-5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border"
                            style={{ borderColor: '#C81C1F', color: '#C81C1F', backgroundColor: 'transparent' }}
                            disabled={isLoading || isConverted}
                            title={isConverted ? 'Already converted' : 'Convert this lead to opportunity'}
                          >
                            {isLoading ? 'Converting...' : isConverted ? 'Converted' : 'Convert to Opportunity'}
                          </button>
                        );
                      }

                      // Name field with notes icon
                      if (field.fieldKey === 'name' || field.fieldKey === 'leadName') {
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateLead({ leadId, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update lead name', e);
                                customToast.error('Failed to update name');
                              }
                            }}
                            onNotesClick={() => {
                              handleEditLead(row);
                            }}
                          />
                        );
                      }

                      // Dropdown fields
                      if (field.fieldType === 'DROPDOWN') {
                        const choices = ((field.options as { choices?: unknown[] } | undefined)?.choices) ?? [];
                        const options: { fieldKey: string; displayName: string; color: string }[] = choices.map((c: unknown) => {
                          const choice = c as { value?: unknown; label?: string; color?: string };
                          return {
                            fieldKey: String(choice.value),
                            displayName: choice.label ?? String(choice.value),
                            color: choice.color ?? '#6b7280',
                          };
                        });

                        let currentKey = '';
                        if (value && typeof value === 'object' && value !== null && 'value' in (value as Record<string, unknown>)) {
                          currentKey = String((value as { value: unknown }).value);
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
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const sel = options.find((o) => o.fieldKey === newKey);
                                const payload = sel ? { value: sel.fieldKey, label: sel.displayName, color: sel.color } : newKey;
                                const updateBody = makeUpdateBody(field, row, payload);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: payload },
                                  () => updateLead({ leadId, data: updateBody }).unwrap()
                                );
                                customToast.success('Status updated');
                              } catch (e) {
                                console.error('Failed to update lead status', e);
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
                                await refetchLeads();
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
                                await refetchLeads();
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
                                await refetchLeads();
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
                                await refetchLeads();
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
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateLead({ leadId, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update lead phone', e);
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
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateLead({ leadId, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update lead email', e);
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
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateLead({ leadId, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update lead url', e);
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
                              if (!leadId) return;
                              const prevSnap = row;
                              try {
                                const updateBody = makeUpdateBody(field, row, next);
                                await optimisticCellUpdate(
                                  leadId,
                                  prevSnap,
                                  { [field.fieldKey]: next },
                                  () => updateLead({ leadId, data: updateBody }).unwrap()
                                );
                              } catch (e) {
                                console.error('Failed to update text field', e);
                              }
                            }}
                          />
                        );
                      }

                      if (field.fieldType === 'CURRENCY' && value !== null && value !== undefined) {
                        return (
                          <span className="font-medium">
                            ${parseFloat(String(value)).toLocaleString()}
                          </span>
                        );
                      }

                      if (field.fieldType === 'DATE' && value) {
                        const dateStr = (() => {
                          if (!value) return '';
                          if (typeof value === 'string') return value;
                          const d = value instanceof Date ? value : new Date(String(value));
                          return isNaN(d.getTime()) ? '' : d.toISOString();
                        })();
                        if (!dateStr) return <span className="text-sm">-</span>;
                        const d = new Date(dateStr);
                        return (
                          <span className="text-sm">{d.toLocaleDateString()}</span>
                        );
                      }

                      return null;
                    }}
                  />
                )}
              </div>

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
                entityLabel="leads"
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
                    const fieldDef = (finalFields || []).find((f) => String(f.fieldKey).toLowerCase().includes('description') || String((f as unknown as { displayName?: string })?.displayName || '').toLowerCase().includes('description'));
                    const prevSnap = (theRow || {}) as Record<string, unknown>;
                    const body: Record<string, unknown> = fieldDef ? makeUpdateBody(fieldDef, prevSnap, text) : { description: text };
                    await optimisticCellUpdate(
                      String(id),
                      prevSnap,
                      { description: text },
                      () => updateLead({ leadId: String(id), data: body }).unwrap()
                    );
                    setIsDescriptionModalOpen(false);
                    customToast.success('Description updated');
                  } catch (e) {
                    customToast.error('Failed to update description');
                  }
                }}
              />

              <DeleteConfirmationModal
                isOpen={isDeleteOpen}
                onClose={() => { if (!isDeleting) { setIsDeleteOpen(false); setToDelete(null); } }}
                onConfirm={async () => {
                  if (!toDelete?.id) return;
                  try {
                    setIsDeleting(true);
                    await deleteLead(toDelete.id).unwrap();
                    customToast.success('Lead deleted');
                    setIsDeleteOpen(false);
                    setToDelete(null);
                    await refetchLeads();
                  } catch (err) {
                    const e = err as { data?: { message?: string } };
                    customToast.error(e?.data?.message || 'Failed to delete lead');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                title={`Are you sure to delete`}
                message={''}
                itemName={`${toDelete?.name || ''} Lead`}
                isDeleting={isDeleting}
              />

              <ActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                type={activityModalType}
                relatedEntity={
                  editData?.id ? {
                    id: String(editData.id as string | undefined ?? ''),
                    name: String((editData.name as string | undefined) || (editData.leadName as string | undefined) || 'Lead'),
                    type: 'lead'
                  } : undefined
                }
                onCreateActivity={handleCreateActivity}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default LeadsPage;