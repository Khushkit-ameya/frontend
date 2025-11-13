// C:\Users\Nezuko\Desktop\ameya suite\AmeyaSuite_Frontend\app\bizaccelerator\activities\page.tsx
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '../../../components/common/Sidebar/Sidebar';
import Header from '../../../components/common/Header';
import Footer from '../../../components/common/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import FinalTable from '../../../components/common/CommonTable';
import { useTheme } from '../../../store/hooks';
import {
  useGetActivityFieldsQuery,
  useGetActivitiesQuery,
  useUpdateActivityMutation,
  useUpdateActivityFieldMutation,
  useReorderActivityFieldsMutation,
} from '../../../store/api_query/BizAcceleratorActivities.api';
import {
  useGetActivityQuery, useCreateActivityMutation, type CreateActivityData,
  useCreateActivityUpdateMutation,
  useGetActivityUpdatesQuery,
  useEditActivityUpdateMutation,
  useDeleteActivityMutation
} from '../../../store/api_query/BizAccelerator/activities.api';
import {
  useGetFieldDefinitionsByEntityQuery
} from '../../../store/api_query/field_definitions.api';
import { mapBackendListToFrontend } from '../../../utils/fieldDefinitions';
import { customToast } from '../../../utils/toast';
import type { FieldDefinition, SortConfig } from '../../../types/FieldDefinitions';
import PhoneValue from '../../../components/common/FieldType/components/PhoneValue';
import EmailValue from '../../../components/common/FieldType/components/EmailValue';
import UrlValue from '../../../components/common/FieldType/components/UrlValue';
import TextValue from '../../../components/common/FieldType/components/TextValue';
import NameWithNotesIcon from '../../../components/common/FieldType/components/NameWithNotesIcon';
import ViewIcon from '../../../components/ui buttons/ViewButton';
import DatePicker from '../../../components/common/DatePicker';
import { FiPlus } from "react-icons/fi";
import ExportModal from '@/components/common/ExportModal';
import { BASEURL } from '@/store/baseUrl';
import BreadcrumbsNavBar from "@/components/common/BreadcrumbNav";
import Title from "@/components/Project/ProjectTitle";
import Bar from "@/components/Project/PaginationBar";
import SearchBoard from "@/components/common/SearchBoard";
import FilterDropdown, { FilterCondition } from "@/components/common/FilterDropdown";
import PersonButton from '@/components/ui buttons/PersonButton';
import AddFiltersButton from '@/components/ui buttons/AddFiltersButton';
import DescriptionModal from '../../../components/common/DescriptionModal';
import PersonFilterModal from '@/components/common/PersonFIlterModal/index';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';
import { Edit } from 'lucide-react';
import DeleteConfirmationModal from '../../../components/common/DeleteConfirmationModal';

// ADD THESE IMPORTS
import { FormModal } from '@/components/BizAccelerator/FormModal/FormModal';
import { TabbedFormLayout } from '@/components/BizAccelerator/TabbedFormLayout/TabbedFormLayout';
import { OverviewTabContent } from '@/components/BizAccelerator/TabContents/OverviewTabContent';
import { UpdatesTabContent } from '@/components/BizAccelerator/TabContents/UpdatesTabContent';
import { FilesLinksTabContent } from '@/components/BizAccelerator/TabContents/FilesLinksTabContent';
import { getDynamicFieldConfig } from '@/components/common/forms/DynamicForm/dynamicFieldConfig';
import search from "@/public/icons/search 1.svg";
import home from "@/public/icons/home (1) 1.svg";
import update from "@/public/icons/gallery-_1_ 1.svg";
import { useGetCurrentUserQuery } from "@/store/api_query/auth.api";

// ADD THESE API IMPORTS FOR RELATED ENTITIES
import { useGetContactsQuery } from '@/store/api_query/contacts.api';
import { useGetLeadsQuery } from '@/store/api_query/leads.api';
import { useGetDealsQuery } from '@/store/api_query/deals.api';
import { useGetOpportunitiesQuery } from '@/store/api_query/opportunities.api';
import DynamicForm from '@/components/BizAccelerator/DynamicForm/DynamicForm';
import type { FieldDefinition as DFFieldDefinition } from '@/components/BizAccelerator/DynamicForm/types';
import { useGetAccountsQuery } from '@/store/api_query/BizAcceleratorAccounts.api';
import { useGetCustomersQuery } from '@/store/api_query/BizAcceleratorCustomers.api';

type DFDropdownOption = { displayName: string; color: string; fieldKey?: string; value?: string | number };

const ActivityFormOverviewTabContent: React.FC<{
  formFields: DFFieldDefinition[];
  onSubmit: (values: Record<string, unknown>) => void;
  isEditMode?: boolean;
  initialValues?: Record<string, unknown>;
  className?: string;
  onAddDropdownOption?: (fieldId: string, option: DFDropdownOption) => Promise<void>;
  onUpdateDropdownOption?: (fieldId: string, value: string, updates: Partial<DFDropdownOption>) => Promise<void>;
  onReorderDropdownOptions?: (fieldId: string, orderedOptions: DFDropdownOption[]) => Promise<void>;
  onDeleteDropdownOption?: (fieldId: string, value: string) => Promise<void>;
}> = ({
  formFields,
  onSubmit,
  isEditMode = false,
  initialValues = {},
  className = "",
  onAddDropdownOption,
  onUpdateDropdownOption,
  onReorderDropdownOptions,
  onDeleteDropdownOption,
}) => {
    // State for related entity data
    const [selectedRelatedType, setSelectedRelatedType] = useState<string>(
      String((initialValues as Record<string, unknown>)?.relatedTo ?? '')
    );
    const [selectedRelatedEntity, setSelectedRelatedEntity] = useState<Record<string, unknown> | null>(null);

    // Fetch data for different entity types
    const { data: contactsData } = useGetContactsQuery({ page: 1, limit: 1000 });
    const { data: leadsData } = useGetLeadsQuery({ page: 1, limit: 1000 });
    const { data: dealsData } = useGetDealsQuery({ page: 1, limit: 1000 });
    const { data: opportunitiesData } = useGetOpportunitiesQuery({ page: 1, limit: 1000 });
    const { data: customerData } = useGetCustomersQuery({ page: 1, limit: 1000 });
    const { data: accountData } = useGetAccountsQuery({ page: 1, limit: 1000 });

    const contactsObj = contactsData as { items?: unknown[] } | undefined;
    const leadsObj = leadsData as { items?: unknown[] } | undefined;
    const dealsObj = dealsData as { items?: unknown[] } | undefined;
    const opportunitiesObj = opportunitiesData as { items?: unknown[] } | undefined;
    const customerObj = customerData as { items?: unknown[] } | undefined;
    const accountObj = accountData as { items?: unknown[] } | undefined;

    // Get entities based on selected type
    const getRelatedEntities = () => {
      switch (selectedRelatedType) {
        case 'contact':
          return contactsObj?.items || [];
        case 'lead':
          return leadsObj?.items || [];
        case 'deal':
          return dealsObj?.items || [];
        case 'opportunity':
          return opportunitiesObj?.items || [];
        case 'account':
          return accountObj?.items || [];
        case 'customer':
          return customerObj?.items || [];
        default:
          return [];
      }
    };

    // Transform initial values to handle object data
    const transformInitialValues = useMemo(() => {
      const values = { ...initialValues };

      // Handle assignedTo object
      if (values.assignedTo && typeof values.assignedTo === 'object' && values.assignedTo !== null) {
        const assignedToObj = values.assignedTo as { id?: string };
        if (assignedToObj.id) {
          values.assignedTo = assignedToObj.id;
        }
      }

      // Handle related entity data
      if (values.relatedTo) {
        if (values.lead && typeof values.lead === 'object' && values.lead !== null) {
          const leadObj = values.lead as { id?: string };
          if (leadObj.id) values.relatedEntity = leadObj.id;
        } else if (values.contact && typeof values.contact === 'object' && values.contact !== null) {
          const contactObj = values.contact as { id?: string };
          if (contactObj.id) values.relatedEntity = contactObj.id;
        } else if (values.opportunity && typeof values.opportunity === 'object' && values.opportunity !== null) {
          const oppObj = values.opportunity as { id?: string };
          if (oppObj.id) values.relatedEntity = oppObj.id;
        } else if (values.deal && typeof values.deal === 'object' && values.deal !== null) {
          const dealObj = values.deal as { id?: string };
          if (dealObj.id) values.relatedEntity = dealObj.id;
        } else if (values.account && typeof values.account === 'object' && values.account !== null) {
          const accountObj = values.account as { id?: string };
          if (accountObj.id) values.relatedEntity = accountObj.id;
        } else if (values.customer && typeof values.customer === 'object' && values.customer !== null) {
          const customerObj = values.customer as { id?: string };
          if (customerObj.id) values.relatedEntity = customerObj.id;
        }
      }

      return values;
    }, [initialValues]);

    // Handle form submission with related entity data
    const handleSubmit = (values: Record<string, unknown>) => {
      const submitData = { ...values };

      // Remove the temporary relatedEntity field
      delete submitData.relatedEntity;

      // Set the proper related entity field based on selected type
      if (selectedRelatedType && selectedRelatedEntity) {
        const entityFieldMap = {
          contact: 'contactId',
          lead: 'leadId',
          opportunity: 'opportunityId',
          deal: 'dealId',
          account: 'accountId',
          customer: 'customerId'
        };

        const fieldName = entityFieldMap[selectedRelatedType as keyof typeof entityFieldMap];
        if (fieldName) {
          submitData[fieldName] = selectedRelatedEntity.id;
        }
      }

      onSubmit(submitData);
    };

    // Enhanced form fields with related entity dropdown
    const enhancedFormFields: DFFieldDefinition[] = useMemo(() => {
      const fields: DFFieldDefinition[] = [...formFields];

      // Find the assignedTo field and make it read-only in edit mode
      const assignedToFieldIndex = fields.findIndex(field => field.fieldKey === 'assignedTo');
      if (assignedToFieldIndex !== -1 && isEditMode) {
        fields[assignedToFieldIndex] = {
          ...fields[assignedToFieldIndex],
          isReadOnly: true,
          helpText: "Assigned To cannot be changed once activity is created"
        };
      }

      // Find the relatedTo field and make it read-only in edit mode
      const relatedToFieldIndex = fields.findIndex(field => field.fieldKey === 'relatedTo');
      if (relatedToFieldIndex !== -1 && isEditMode) {
        fields[relatedToFieldIndex] = {
          ...fields[relatedToFieldIndex],
          isReadOnly: true
        };
      }

      // Add related entity selection field after relatedTo
      if (selectedRelatedType) {
        const relatedEntities = getRelatedEntities();
        const relatedEntityOptions = (relatedEntities as Array<Record<string, unknown>>).map((entity) => {
          const e = entity as { id?: string; recordId?: string; name?: string };
          return {
            value: e.id as string,
            label: e.name || e.recordId || (e.id as string),
            recordId: e.recordId,
            entity: entity
          };
        });

        const relatedEntityField: DFFieldDefinition = {
          fieldKey: 'relatedEntity',
          displayName: `Select ${selectedRelatedType.charAt(0).toUpperCase() + selectedRelatedType.slice(1)}`,
          fieldType: 'DROPDOWN',
          isRequired: false,
          isEditable: true,
          isReadOnly: isEditMode, // Make read-only in edit mode
          options: {
            choices: relatedEntityOptions,
            placeholder: `Select a ${selectedRelatedType}`
          },
          displayOrder: ((fields[relatedToFieldIndex]?.displayOrder as number) || 0) + 1,
          helpText: `Select the specific ${selectedRelatedType} this activity is related to`,
          fieldId: `related-entity-${selectedRelatedType}`,
          id: `related-entity-${selectedRelatedType}`,
        };

        // Insert after relatedTo field
        if (relatedToFieldIndex !== -1) {
          fields.splice(relatedToFieldIndex + 1, 0, relatedEntityField);
        } else {
          fields.push(relatedEntityField);
        }
      }

      return fields;
    }, [formFields, selectedRelatedType, contactsData, leadsData, dealsData, opportunitiesData, isEditMode]);

    return (
      <div className={`p-4 ${className}`}>
        <DynamicForm
          fields={enhancedFormFields}
          onSubmit={handleSubmit}
          isEditMode={isEditMode}
          initialValues={transformInitialValues}
          onAddDropdownOption={onAddDropdownOption}
          onUpdateDropdownOption={onUpdateDropdownOption}
          onReorderDropdownOptions={onReorderDropdownOptions}
          onDeleteDropdownOption={onDeleteDropdownOption}
          submitButtonText={isEditMode ? "Update Activity" : "Create Activity"}
          // Pass custom handlers for related entity fields
          customFieldHandlers={{
            relatedTo: {
              onChange: (value: unknown) => {
                setSelectedRelatedType(String(value ?? ''));
                setSelectedRelatedEntity(null);
              }
            },
            relatedEntity: {
              onChange: (value: unknown, option?: DFDropdownOption) => {
                const opt = option as unknown as { entity?: Record<string, unknown> | null } | null;
                setSelectedRelatedEntity(opt?.entity || null);
              }
            }
          }}
        />
      </div>
    );
  };

const ActivitiesPage: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { data: currentUser } = useGetCurrentUserQuery();
  console.log(currentUser, "currentUsercurrentUsercurrentUsercurrentUser")

  const [sort, setSort] = useState<SortConfig>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showLessColumns, setShowLessColumns] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  type GenericRow = Record<string, unknown> & { id?: string | number; _id?: string | number; createdByName?: string; createdBy?: { firstName?: string; lastName?: string } | null; updates?: unknown; assignedToId?: unknown; assignedTo?: unknown; createdById?: unknown };
  const [descriptionRow, setDescriptionRow] = useState<GenericRow | null>(null);

  // Search and column filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);

  // ADD FORM MODAL STATE
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("form-overview");

  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [personFilterField, setPersonFilterField] = useState<'assignedTo' | 'createdBy'>('assignedTo');

  const { data: companyUsersData } = useGetCompanyUsersQuery({});

  // Prefer shared field-defs; fallback to activities API
  const { data: allFieldsFull } = useGetFieldDefinitionsByEntityQuery('activity');
  const { data: fieldsRaw, isLoading: fieldsLoading } = useGetActivityFieldsQuery();
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useGetActivitiesQuery({
    page,
    limit: pageSize,
    sortBy: sort?.field,
    sortOrder: sort?.direction,
  });

  // ADD ACTIVITY MUTATIONS
  const [updateActivity] = useUpdateActivityMutation();
  const [updateActivityField] = useUpdateActivityFieldMutation();
  const [reorderActivityFields] = useReorderActivityFieldsMutation();
  const [createActivity] = useCreateActivityMutation();
  const { data: selectedActivityData } = useGetActivityQuery(
    String(editData?.id ?? ''),
    { skip: !isFormModalOpen || !editData?.id }
  );

  // ADD ACTIVITY UPDATES MUTATIONS AND QUERIES
  const [createActivityUpdate] = useCreateActivityUpdateMutation();
  const [editActivityUpdate] = useEditActivityUpdateMutation();
  const [deleteActivity] = useDeleteActivityMutation();

  const { data: activityUpdatesData, isLoading: activityUpdatesLoading } = useGetActivityUpdatesQuery(
    String(editData?.id ?? ''),
    { skip: !isFormModalOpen || !editData?.id }
  );

  // ADD ACTIVITY UPDATES HANDLERS
  const [updatesContent, setUpdatesContent] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreateActivityUpdate = async (content: string) => {
    if (!editData?.id) {
      customToast.error("No activity selected");
      return;
    }

    try {
      await createActivityUpdate({
        activityId: String(editData.id),
        content: content
      }).unwrap();

      customToast.success("Update added successfully");
      setUpdatesContent("");
      // You might want to refetch activities data here if needed
    } catch (error: unknown) {
      console.error("Failed to add update:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to add update");
    }
  };

  const handleEditActivityUpdate = async (updateId: string, content: string) => {
    if (!editData?.id) {
      customToast.error("No activity selected");
      return;
    }

    try {
      await editActivityUpdate({
        activityId: String(editData.id),
        updateId: updateId,
        content: content
      }).unwrap();

      customToast.success("Update edited successfully");
      // You might want to refetch activities data here if needed
    } catch (error: unknown) {
      console.error("Failed to edit update:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to edit update");
    }
  };

  const activitiesObj = activitiesData as { items?: unknown[]; fieldDefinitions?: unknown[]; pagination?: { total?: number } } | undefined;

  const finalFields: FieldDefinition[] = useMemo(() => {
    const fromShared = (allFieldsFull ?? []) as unknown[];
    if (fromShared.length > 0) return mapBackendListToFrontend(fromShared as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
    const fromApi = (Array.isArray(fieldsRaw) ? (fieldsRaw as unknown[]) : (((fieldsRaw as { items?: unknown[] } | undefined)?.items ?? []) as unknown[]));
    const fromData = (activitiesObj?.fieldDefinitions ?? []) as unknown[];
    const mergedByKey = new Map<string, Record<string, unknown>>();
    [...fromApi, ...fromData].forEach((f: unknown) => { if (!f) return; const k = String((f as { fieldKey?: unknown }).fieldKey || ''); if (!k) return; mergedByKey.set(k, { ...(mergedByKey.get(k) || {}), ...(f as Record<string, unknown>) }); });
    const fields = mapBackendListToFrontend(Array.from(mergedByKey.values()) as unknown as import('../../../utils/fieldDefinitions').BackendFieldDefinition[]);
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
  }, [allFieldsFull, fieldsRaw, activitiesObj?.fieldDefinitions]);

  // ADD FORM FIELDS CONFIGURATION
  const formFields = useMemo(() => {
    if (!fieldsRaw || !Array.isArray(fieldsRaw)) {
      return [];
    }

    const transformedFields = fieldsRaw
      .filter((field) => {
        return field &&
          field.fieldKey &&
          field.fieldType &&
          field.isVisible !== false &&
          field.fieldKey !== 'filesLinks';
      })
      .map((field) => {
        const dynamicConfig = getDynamicFieldConfig(
          field.fieldKey,
          field.fieldType,
          field.displayName
        );

        const transformedOptions: Record<string, unknown> = {};

        if (field.options) {
          if (field.options.choices && Array.isArray(field.options.choices)) {
            transformedOptions.choices = field.options.choices.map((choice: unknown) => {
              const c = choice as { value?: unknown; label?: string; color?: string };
              return {
                value: c?.value ?? choice,
                label: c?.label ?? String(c?.value ?? choice),
                color: c?.color
              };
            });
          }

          if (field.options.placeholder) transformedOptions.placeholder = field.options.placeholder;
          if (field.options.rows) transformedOptions.rows = field.options.rows;
          if (field.options.multiple) transformedOptions.multiple = field.options.multiple;
          if (field.options.allowCustomTags) transformedOptions.allowCustom = field.options.allowCustomTags;

          Object.keys(field.options).forEach(key => {
            if (!['choices', 'placeholder', 'rows', 'multiple', 'allowCustomTags'].includes(key)) {
              transformedOptions[key] = field.options[key];
            }
          });
        }

        return {
          fieldKey: field.fieldKey,
          displayName: field.displayName,
          fieldType: field.fieldType,
          isRequired: field.isRequired || false,
          isEditable: field.isReadOnly !== true,
          isReadOnly: field.isReadOnly || false,
          options: transformedOptions,
          displayOrder: field.displayOrder || 0,
          helpText: field.helpText,
          fieldId: field.id,
          id: field.id,
          icon: dynamicConfig.icon,
          tooltip: dynamicConfig.tooltip,
          iconBg: "#C81C1F",
        };
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return transformedFields;
  }, [fieldsRaw]);

  const visibleFields: FieldDefinition[] = useMemo(() => {
    if (!showLessColumns) return finalFields;
    const less = [...finalFields]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .slice(0, 6);
    const isAction = (f: FieldDefinition) => String(f.fieldKey).toLowerCase() === 'action' || String(f.fieldType).toUpperCase() === 'ACTION';
    if (!less.some(isAction)) {
      const actionField = finalFields.find(isAction);
      if (actionField) less.push(actionField);
    }
    return less;
  }, [finalFields, showLessColumns]);

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

  const rows = (activitiesObj?.items ?? []) as Array<Record<string, unknown>>;

  const loading = fieldsLoading || activitiesLoading;

  // Column Width Manager: edit widths per fieldKey here (px)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    title: 260,
    description: 320,
    type: 160,
    status: 160,
    scheduleTimeFrom: 200,
    scheduleTimeTo: 200,
    assignedTo: 200,
    createdByName: 180,
    createdBy: 180,
    createdById: 180,
    project: 200,
    createdAt: 160,
    updatedAt: 160,
    filesLinks: 160,
    duration: 210,
    priority: 160,
    action: 150,
  });

  // Reset to first page when search/sort/filters change
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [sort, searchQuery, selectedColumns, activeFilters, selectedPeopleIds, personFilterField]);

  const handleApplyPersonFilter = (selectedIds: string[]) => {
    setPage(1);
    setSelectedPeopleIds(selectedIds);
    setIsPersonFilterOpen(false);
  };

  const handlePersonFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setPage(1);
    setPersonFilterField(field);
  };

  // Filter rows based on selected people (client-side filtering for now)
  const filteredRows = useMemo(() => {
    if (selectedPeopleIds.length === 0) return rows;

    return rows.filter((row) => {
      if (personFilterField === 'assignedTo') {
        const assigned = row as { assignedToId?: unknown; assignedTo?: { id?: unknown } };
        const assignedId = assigned.assignedToId ?? assigned.assignedTo?.id ?? (row as Record<string, unknown>)?.assignedTo;
        return selectedPeopleIds.includes(String(assignedId));
      } else {
        const created = row as { createdById?: unknown; createdBy?: { id?: unknown } };
        const createdById = created.createdById ?? created.createdBy?.id ?? (row as Record<string, unknown>)?.createdBy;
        return selectedPeopleIds.includes(String(createdById));
      }
    });
  }, [rows, selectedPeopleIds, personFilterField]);

  // Compose update body including all required dynamic fields to satisfy backend validation
  const makeUpdateBody = (field: FieldDefinition, row: GenericRow, nextValue: unknown) => {
    const body: Record<string, unknown> = {};
    (finalFields || []).forEach((f) => {
      if (f?.isRequired) {
        body[f.fieldKey] = row?.[f.fieldKey] ?? '';
      }
    });
    body[field.fieldKey] = nextValue;
    return body;
  };

  // ADD FORM HANDLERS
  const handleFormSubmit = async (values: Record<string, unknown>) => {
    try {
      if (!currentUser?.id && !isEditMode) {
        customToast.error("User information not available. Please refresh and try again.");
        return;
      }

      if (isEditMode && editData?.id) {
        await updateActivity({
          activityId: String(editData.id),
          data: values
        }).unwrap();
        customToast.success("Activity updated successfully!");
      } else {
        const userId = currentUser?.id;
        if (!userId) {
          customToast.error("User information not available. Please refresh and try again.");
          return;
        }

        // Ensure we pass a CreateActivityData-shaped object to createActivity.
        // We cast values to unknown first, then assert the final object as CreateActivityData
        // so the call satisfies the expected parameter type.
        const createData = ({
          ...(values as Record<string, unknown>),
          createdBy: userId,
        } as unknown) as CreateActivityData;

        await createActivity(createData).unwrap();
        customToast.success("Activity created successfully!");
      }

      setIsFormModalOpen(false);
    } catch (error: unknown) {
      console.error("Failed to save activity:", error);
      const err = error as { data?: { message?: string } };
      customToast.error(err?.data?.message || "Failed to save activity");
    }
  };

  const handleAddActivity = () => {
    setIsEditMode(false);
    setEditData(null);
    setActiveTab("form-overview");
    setIsFormModalOpen(true);
  };

  // Add this function before the ActivityFormOverviewTabContent component
  const transformUserDataForForm = (data: Record<string, unknown>): Record<string, unknown> => {
    const transformed = { ...data };

    // Transform assignedTo from object to ID
    if (transformed.assignedTo && typeof transformed.assignedTo === 'object' && transformed.assignedTo !== null) {
      const assignedObj = transformed.assignedTo as { id?: string };
      if (assignedObj.id) {
        transformed.assignedTo = assignedObj.id;
      }
    }

    // Transform createdBy from object to ID if needed
    if (transformed.createdBy && typeof transformed.createdBy === 'object' && transformed.createdBy !== null) {
      const createdObj = transformed.createdBy as { id?: string };
      if (createdObj.id) {
        transformed.createdBy = createdObj.id;
      }
    }

    // Set relatedEntity based on the related entity object
    if (transformed.relatedTo) {
      const relatedType = String(transformed.relatedTo);
      const entityFieldMap = {
        contact: 'contact',
        lead: 'lead',
        opportunity: 'opportunity',
        deal: 'deal',
        account: 'account',
        customer: 'customer'
      };

      const entityField = entityFieldMap[relatedType as keyof typeof entityFieldMap];
      if (entityField && transformed[entityField] && typeof transformed[entityField] === 'object') {
        const entityObj = transformed[entityField] as { id?: string };
        if (entityObj.id) {
          transformed.relatedEntity = entityObj.id;
        }
      }
    }

    return transformed;
  };

  const handleEditActivity = (activityData: GenericRow) => {
    // Process the data before setting it for editing
    const processedData = transformUserDataForForm(activityData);

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
    setActiveTab("form-overview");
    setIsFormModalOpen(true);
  };

  // ADD TABS CONFIGURATION
  const getTabs = () => {
    const baseTabs = [
      {
        key: "form-overview",
        label: "Activity Form",
        icon: search,
        component: ActivityFormOverviewTabContent,
        componentProps: {
          formFields,
          onSubmit: handleFormSubmit,
          isEditMode,
          initialValues: editData || {},
          className: "h-full",
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
          // ADD THESE PROPS FOR ACTIVITY UPDATES
          activityId: isEditMode && editData?.id ? editData.id : undefined,
          updatesData: activityUpdatesData || [],
          isLoading: activityUpdatesLoading,
          onCreateUpdate: handleCreateActivityUpdate,
          onEditUpdate: handleEditActivityUpdate,
        },
        disabled: !isEditMode
      },
      {
        key: "files/links",
        label: "Files / Links",
        icon: update,
        component: FilesLinksTabContent,
        componentProps: {
          className: "h-full"
        },
        disabled: !isEditMode
      },
    ];

    return baseTabs;
  };

  const getModalTitle = () => {
    return isEditMode ? "Edit Activity" : "Create Activity";
  };

  // Column reorder handler - no refetch, instant update like payments page
  const handleReorderColumns = async (orderedFieldKeys: string[]) => {
    try {
      const byKey = new Map(finalFields.map(f => [f.fieldKey, f] as const));
      const fieldOrders = orderedFieldKeys
        .map((k, idx) => byKey.get(k))
        .filter((f): f is FieldDefinition => !!f && !!f.id)
        .map((f, idx) => ({ fieldId: f.id!, displayOrder: idx + 1 }));
      if (fieldOrders.length > 0) {
        await reorderActivityFields({ fieldOrders }).unwrap();
      }
    } catch (e) {
      console.error('Failed to reorder fields', e);
    }
  };

  const activityTitleBtn = [
    {
      name: "Export",
      icon: <FiPlus />,
      onClick: () => setShowExportModal(true)
    },
    {
      name: "Add Activity",
      icon: <FiPlus />,
      onClick: handleAddActivity
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
                    { label: 'Activities', href: '/dashboard/biz-accelerator/activities' }
                  ]}
                />
              </div>
              <div
                className='mx-5 mt-5 px-3 py-2 rounded shadow bg-black h-fit'
                style={{
                  backgroundColor: isDark ? colors.dark.sidebar : undefined
                }}
              >
                <Title projectTitleObj={activityTitleBtn} name="Activity List" />
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
                  fields={finalFields
                    .filter(f => String(f.fieldKey).toLowerCase() !== 'action' && String(f.fieldType).toUpperCase() !== 'ACTION')
                    .map(f => ({
                      value: f.fieldKey,
                      label: f.displayName,
                      fieldType: f.fieldType,
                      isSearchable: typeof f.isSearchable === 'boolean' ? f.isSearchable : false
                    }))}
                  onApplyFilters={(filters) => {
                    setActiveFilters(filters);
                    setIsFilterDropdownOpen(false);
                    console.log('Applied filters:', filters);
                  }}
                  hasActiveFilters={activeFilters.some(f => f.value.length > 0)}
                />
              </div>
              <div className='mx-5 mt-11 py-2 px-2 rounded flex h-fit min-w-0 overflow-x-auto'>
                <Bar
                  total={activitiesObj?.pagination?.total ?? 0}
                  currentPage={page}
                  pageSize={pageSize}
                  onPageChange={(p) => setPage(p)}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  onToggleColumns={() => setShowLessColumns(s => !s)}
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
                    data={filteredRows}
                    fieldDefinitions={visibleFields}
                    rowKey="id"
                    stickyHeader
                    appearance="figma"
                    sortConfig={sort}
                    onSortChange={(cfg) => setSort(cfg)}
                    loading={false}
                    columnWidths={columnWidths}
                    onColumnResize={(key, width) => setColumnWidths((prev) => ({ ...prev, [key]: width }))}
                    onColumnOrderChange={handleReorderColumns}
                    getCellRenderer={({ field, row, value }: { field: FieldDefinition; row: GenericRow; value: unknown }) => {
                      const activityId = row?.id ?? row?._id;
                      // Actions column
                      if (field.fieldKey === 'action') {
                        return (
                          <div className="flex items-center gap-2 h-8 py-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Edit"
                              className="w-8 h-8 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditActivity(row);
                              }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              className="w-8 h-8 p-0 rounded-full bg-black flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = String(activityId || '');
                                if (!id) return;
                                const name = String((row as Record<string, unknown>)?.title || (row as Record<string, unknown>)?.subject || (row as Record<string, unknown>)?.recordId || 'Activity');
                                setToDelete({ id, name });
                                setIsDeleteOpen(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6M14 11v6"></path>
                                <path d="M9 6V4h6v2"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              title="More"
                              className="w-8 h-8 p-0 rounded-full bg-[#c81c1f] flex items-center justify-center text-white shadow hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <span className="text-white text-lg leading-none">⋯</span>
                            </button>
                          </div>
                        );
                      }
                      {
                        const key = String(field.fieldKey || '').toLowerCase();
                        const name = String(field.displayName || '').toLowerCase();
                        if (key === 'description' || key.includes('description') || name.includes('description')) {
                          const text = typeof value === 'string' ? value : (value ?? '');
                          return (
                            <span
                              className="truncate block max-w-[280px] cursor-pointer"
                              title={String(text || '')}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDescriptionRow(row);
                                setDescriptionDraft(String(text || ''));
                                setIsDescriptionModalOpen(true);
                              }}
                            >
                              {String(text || '')}
                            </span>
                          );
                        }
                      }
                      // Created By field
                      // In the getCellRenderer function, update the createdBy section:
                      if (field.fieldKey === 'createdBy' || field.fieldKey === 'createdById' || field.fieldKey === 'createdByName') {
                        const createdByName = row?.createdByName as string | undefined;
                        const createdByObj = row?.createdBy as Record<string, unknown> | undefined;

                        let displayName = '-';

                        if (createdByName && createdByName !== '[object Object]') {
                          displayName = createdByName;
                        } else if (createdByObj) {
                          if (typeof createdByObj === 'object' && createdByObj !== null) {
                            const userObj = createdByObj as { firstName?: string; lastName?: string; name?: string; email?: string };
                            if (userObj.firstName || userObj.lastName) {
                              displayName = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
                            } else if (userObj.name) {
                              displayName = userObj.name;
                            } else if (userObj.email) {
                              displayName = userObj.email;
                            }
                          }
                        }

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
                            <span className="truncate" title={displayName}>{displayName}</span>
                          </div>
                        );
                      }
                      // In the getCellRenderer function, add this case for assignedTo:
                      if (field.fieldKey === 'assignedTo') {
                        const assignedTo = row?.assignedTo;
                        let displayName = '-';

                        if (assignedTo && typeof assignedTo === 'object' && assignedTo !== null) {
                          const assignedObj = assignedTo as { firstName?: string; lastName?: string; name?: string };
                          if (assignedObj.firstName || assignedObj.lastName) {
                            displayName = `${assignedObj.firstName || ''} ${assignedObj.lastName || ''}`.trim();
                          } else if (assignedObj.name) {
                            displayName = assignedObj.name;
                          } else {
                            displayName = 'Unknown User';
                          }
                        } else if (typeof assignedTo === 'string' && assignedTo !== '[object Object]') {
                          displayName = assignedTo;
                        }

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
                            <span className="truncate" title={displayName}>{displayName}</span>
                          </div>
                        );
                      }
                      // Activity title with notes component
                      if (field.fieldKey === 'title' || field.fieldKey === 'subject') {
                        return (
                          <NameWithNotesIcon
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!activityId) return;
                              try {
                                await updateActivity({
                                  activityId: String(activityId),
                                  data: makeUpdateBody(field, row, next)
                                }).unwrap();
                              } catch (e) {
                                console.error('Failed to update activity title', e);
                                customToast.error('Failed to update title');
                              }
                            }}
                            onNotesClick={() => {
                              handleEditActivity(row); // Opens the form modal
                            }}
                          />
                        );
                      }

                      // filesLinks -> View button
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

                      // PHONE inline editing
                      if (field.fieldType === 'PHONE') {
                        return (
                          <PhoneValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!activityId) return;
                              try {
                                await updateActivity({
                                  activityId: String(activityId),
                                  data: makeUpdateBody(field, row, next)
                                }).unwrap();
                              } catch (e) {
                                console.error('Failed to update activity phone', e);
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
                              if (!activityId) return;
                              try {
                                await updateActivity({
                                  activityId: String(activityId),
                                  data: makeUpdateBody(field, row, next)
                                }).unwrap();
                              } catch (e) {
                                console.error('Failed to update activity email', e);
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
                              if (!activityId) return;
                              try {
                                await updateActivity({
                                  activityId: String(activityId),
                                  data: makeUpdateBody(field, row, next)
                                }).unwrap();
                              } catch (e) {
                                console.error('Failed to update activity url', e);
                              }
                            }}
                          />
                        );
                      }

                      // DATE with DatePicker
                      if (field.fieldType === 'DATE') {
                        const v = typeof value === 'string'
                          ? value
                          : (value ? (() => { const d = new Date((value as string | number | Date)); return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10); })() : '');
                        return (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DatePicker
                              value={v}
                              onChange={async (newDate) => {
                                if (!activityId) return;
                                try {
                                  await updateActivity({
                                    activityId: String(activityId),
                                    data: makeUpdateBody(field, row, newDate)
                                  }).unwrap();
                                  customToast.success('Date updated');
                                } catch (e) {
                                  console.error('Failed to update date', e);
                                  customToast.error('Failed to update date');
                                }
                              }}
                            />
                          </div>
                        );
                      }

                      // TEXT inline editing
                      if (field.fieldType === 'TEXT') {
                        return (
                          <TextValue
                            field={field}
                            value={value}
                            onCommit={async (next: string) => {
                              if (!activityId) return;
                              try {
                                await updateActivity({
                                  activityId: String(activityId),
                                  data: makeUpdateBody(field, row, next)
                                }).unwrap();
                                customToast.success('Updated');
                              } catch (e) {
                                console.error('Failed to update text field', e);
                                customToast.error('Update failed');
                              }
                            }}
                          />
                        );
                      }
                      return undefined;
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ADD FORM MODAL */}
        <FormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={getModalTitle()}
          size="lg"
        >
          <TabbedFormLayout
            tabs={getTabs()}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </FormModal>

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          entityLabel="activities"
          fields={finalFields}
          rows={rows}
          fetchAll={async () => {
            try {
              const pageSizeAll = 1000;
              let p = 1;
              const all: Array<Record<string, unknown>> = [];
              while (true) {
                const url = new URL('activities', BASEURL);
                url.searchParams.set('page', String(p));
                url.searchParams.set('limit', String(pageSizeAll));
                url.searchParams.set('sortBy', sort?.field || 'createdAt');
                url.searchParams.set('sortOrder', sort?.direction || 'desc');
                const resp = await fetch(url.toString(), { credentials: 'include', headers: { Accept: 'application/json' } });
                const json = await resp.json();
                const res = json?.data ?? json;
                const items = res?.items ?? [];
                all.push(...items);
                const total = res?.pagination?.total ?? items.length;
                if (items.length < pageSizeAll || all.length >= total) break;
                p += 1;
              }
              return all;
            } catch (e) {
              console.error('Export fetchAll (activities) failed', e);
              return [];
            }
          }}
        />
      </div>
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
            const fieldDef = (finalFields || []).find((f) => String(f.fieldKey).toLowerCase().includes('description') || String(f.displayName || '').toLowerCase().includes('description'));
            const body = fieldDef ? makeUpdateBody(fieldDef, theRow as GenericRow, text) : ({ description: text } as Record<string, unknown>);
            await updateActivity({ activityId: String(id), data: body }).unwrap();
            setIsDescriptionModalOpen(false);
            customToast.success('Description updated');
          } catch (e) {
            customToast.error('Failed to update description');

          }
        }}
      />
    </ProtectedRoute>
  );
};

export default ActivitiesPage;