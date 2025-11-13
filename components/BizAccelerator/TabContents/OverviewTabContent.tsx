"use client";

import React, { useState } from "react";
import DynamicForm from "../DynamicForm/DynamicForm";
import { FormActionsBar } from "./FormActionsBar";
import { EmailComposer } from "@/components/common/forms/EmailComposer/EmailComposer";
import { EmailSignatureModal } from "@/components/common/forms/EmailSignatureModal/EmailSignatureModal";
import { PipelineRibbon } from './PipelineRibbon'
import { usePathname } from "next/navigation";
import Activities from "./Activities";
import type { FieldDefinition } from "../DynamicForm/types";

// Define the Stage interface to match PipelineRibbon's expectations
interface Stage {
  id: string;
  name: string;
  order: number;
  color: string; // Remove optional, make required
  isActive: boolean;
  metadata: Record<string, unknown>;
}

interface Filter {
  id: number;
  activity: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Activity {
  id: string;
  type: string;
  subject?: string;
  description?: string;
  status: string;
  priority?: string;
  duration?: number;
  location?: string;
  scheduledAt?: string;
  createdAt: string;
  assignedTo?: { id: string; firstName?: string; lastName?: string; email?: string };
  createdBy?: string;
  filesLinks?: string[];
}

interface DropdownOption {
  fieldKey: string;
  displayName: string;
  color: string;
}

interface OverviewTabContentProps {
  formFields: FieldDefinition[];
  onSubmit: (values: Record<string, unknown>) => void;
  isEditMode?: boolean;
  initialValues?: Record<string, unknown>;
  userRole?: string;
  className?: string;
  customColor?: string;
  suiteApp?: string;
  relatedItem?: string | Record<string, unknown>;
  activeView?: "default" | "email" | "signature";
  onViewChange?: (view: "default" | "email" | "signature") => void;
  activitiesData?: Activity[];
  activitiesLoading?: boolean;
  opportunityId?: string;
  onAddActivity?: (type: 'meeting' | 'call' | 'notes' | 'todo' | 'email') => void;
  onAddDropdownOption?: (fieldId: string, option: { displayName: string; color: string }) => Promise<void>;
  onUpdateDropdownOption?: (fieldId: string, value: string, updates: Partial<{ displayName: string; color: string }>) => Promise<void>;
  onReorderDropdownOptions?: (fieldId: string, orderedOptions: { displayName: string; color: string }[]) => Promise<void>;
  onDeleteDropdownOption?: (fieldId: string, value: string) => Promise<void>;
  onLinkOpportunity?: (dealData: unknown) => void;
  dealData?: Record<string, unknown>;
  onConvertToLead?: (contactId: string) => Promise<void>;
  convertingIds?: Set<string | number>;
  pipelineStages?: Stage[];
  stagesLoading?: boolean;
  onConvertToOpportunity?: (leadId: string) => Promise<void>;
  highlightActivityId?: string;
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  formFields,
  onSubmit,
  isEditMode = false,
  initialValues = {},
  userRole = "user",
  className = "",
  customColor = "#C81C1F",
  suiteApp = "",
  relatedItem,
  activeView: externalActiveView,
  onViewChange,
  activitiesData = [],
  activitiesLoading = false,
  opportunityId,
  onAddActivity,
  onAddDropdownOption,
  onUpdateDropdownOption,
  onReorderDropdownOptions,
  onDeleteDropdownOption,
  onLinkOpportunity,
  dealData: editData,
  onConvertToLead,
  convertingIds,
  pipelineStages = [],
  stagesLoading = false,
  onConvertToOpportunity,
  highlightActivityId,
}) => {
  console.log(relatedItem, "relatedItem in OverviewTabContent");

  const [internalActiveView, setInternalActiveView] = useState<
    "default" | "email" | "signature"
  >("default");

  const activeView = externalActiveView !== undefined ? externalActiveView : internalActiveView;

  const handleViewChange = (view: "default" | "email" | "signature") => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      setInternalActiveView(view);
    }
  };

  const pathname = usePathname();

  const [filters, setFilters] = useState<Filter[]>([
    { id: Date.now(), activity: null, startDate: null, endDate: null },
  ]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isCreateMode = !isEditMode && !relatedItem;

  // Transform pipeline stages to ensure they have required properties
  const transformedStages: Stage[] = pipelineStages.map(stage => ({
    ...stage,
    color: stage.color || "#808080", 
    isActive: stage.isActive !== undefined ? stage.isActive : true,
    metadata: stage.metadata || {}
  }));

  // Transform dropdown options to remove fieldKey if needed
  const handleAddDropdownOption = async (fieldId: string, option: { displayName: string; color: string }) => {
    if (onAddDropdownOption) {
      await onAddDropdownOption(fieldId, option);
    }
  };

  const handleUpdateDropdownOption = async (fieldId: string, value: string, updates: Partial<{ displayName: string; color: string }>) => {
    if (onUpdateDropdownOption) {
      await onUpdateDropdownOption(fieldId, value, updates);
    }
  };

  const handleReorderDropdownOptions = async (fieldId: string, orderedOptions: { displayName: string; color: string }[]) => {
    if (onReorderDropdownOptions) {
      await onReorderDropdownOptions(fieldId, orderedOptions);
    }
  };

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {suiteApp === "biz-accelerator" && pathname.startsWith("/bizaccelerator/leads") && (
        <div className={isCreateMode ? "opacity-50 pointer-events-none" : ""}>
          <PipelineRibbon
            leadId={typeof relatedItem === 'string' ? relatedItem : (relatedItem as Record<string, unknown>)?.id as string || undefined}
            currentStatus={initialValues?.status as string}
            initialStep={0}
            onStepChange={isCreateMode ? undefined : (index: number, statusId: string) => console.log("Step changed to:", index, "Status ID:", statusId)}
            onStatusChange={isCreateMode ? undefined : (statusId: string) => console.log("Status changed to:", statusId)}
            stages={transformedStages}
          />
        </div>
      )}

      {activeView === "default" && (
        <div className={`flex gap-4 ${isCreateMode ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-200px)]'}`}>
          <div className={`w-2/3 border border-[#0000004F] rounded-lg bg-[#f5f5f5] dark:border-gray-700 dark:bg-gray-700 flex flex-col ${isCreateMode ? "opacity-50 pointer-events-none" : ""
            }`}>
            <FormActionsBar
              onEmailClick={isCreateMode ? undefined : () => handleViewChange("email")}
              onSettingsClick={isCreateMode ? undefined : () => handleViewChange("signature")}
              filters={filters}
              onFiltersChange={setFilters}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAddActivity={onAddActivity}
            />
            <div className="flex-1 overflow-y-auto p-4">
              <Activities
                activitiesData={activitiesData}
                filters={filters}
                searchQuery={searchQuery}
                highlightActivityId={highlightActivityId}
              />
            </div>
          </div>

          <div className={`w-1/3 border border-[#0000004F] rounded-lg bg-white dark:bg-gray-900 overflow-y-auto`}>
            <div className="p-5">
              <DynamicForm
                fields={formFields}
                onSubmit={onSubmit}
                isEditMode={isEditMode}
                initialValues={initialValues}
                onAddDropdownOption={handleAddDropdownOption}
                onUpdateDropdownOption={handleUpdateDropdownOption}
                onReorderDropdownOptions={handleReorderDropdownOptions}
                onDeleteDropdownOption={onDeleteDropdownOption}
                onConvertToOpportunity={onConvertToOpportunity}
                opportunityId={typeof relatedItem === 'string' ? relatedItem : (relatedItem as Record<string, unknown>)?.id as string || opportunityId}
                opportunityName={initialValues?.name as string || 'Opportunity'}
                dealData={initialValues}
                onLinkOpportunity={onLinkOpportunity}
                onConvertToLead={onConvertToLead}
                convertingIds={convertingIds}
              />
            </div>
          </div>
        </div>
      )}

      {!isCreateMode && (
        <>
          {activeView === "email" && (
            <div className="w-full overflow-y-auto h-[95vh]">
              <EmailComposer
                initialRecipients={[""]}
                onSend={(data: unknown) => {
                  console.log("Email sent:", data);
                  handleViewChange("default");
                }}
                onBack={() => handleViewChange("default")}
                className="w-full"
              />
            </div>
          )}

          {activeView === "signature" && (
            <div className="w-full overflow-y-auto h-[95vh]">
              <EmailSignatureModal
                onClose={() => handleViewChange("default")}
                onSave={(data: unknown) => {
                  console.log("Signature saved:", data);
                  handleViewChange("default");
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};