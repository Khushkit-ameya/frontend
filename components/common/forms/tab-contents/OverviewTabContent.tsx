"use client";

import React, { useState, useMemo } from "react";
import DynamicForm from "@/components/common/forms/DynamicForm";
import { FormActionsBar } from "../FormActionsBar/FormActionsBar";
import { EmailComposer } from "@/components/common/forms/EmailComposer/EmailComposer";
import { EmailSignatureModal } from "@/components/common/forms/EmailSignatureModal/EmailSignatureModal";
import { PipelineRibbon } from "@/components/common/forms/tab-contents/PipelineRibbon";
import { usePathname } from "next/navigation";
import Activities from "./Activities";
import Image from "next/image";
import { customToast as toast } from '@/utils/toast';

interface Filter {
  id: number;
  activity: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface OverviewTabContentProps {
  formFields: any[];
  repetitiveTaskFields?: any[];
  onSubmit: (values: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  isEditMode?: boolean;
  userRole?: string;
  className?: string;
  customColor?: string;
  suiteApp?: string;
  relatedItem?: {
    type: "project" | "task" | "subtask";
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskName?: string;
    subTaskId?: string;
    subTaskName?: string;
  };
  mdmId?: string;
  activeView?: "default" | "email" | "signature";
  onViewChange?: (view: "default" | "email" | "signature") => void;
  taskType?: "regular" | "repetitive";
  onTaskTypeChange?: (type: "regular" | "repetitive") => void;
  isTaskForm?: boolean;
  watch?: (fieldName?: string) => any;
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  formFields,
  repetitiveTaskFields = [],
  onSubmit,
  isEditMode = false,
  initialValues = {},
  userRole = "user",
  className = "",
  customColor = "#C81C1F",
  suiteApp = "",
  relatedItem,
  mdmId,
  activeView: externalActiveView,
  onViewChange,
  taskType: externalTaskType,
  onTaskTypeChange,
  isTaskForm = false,
  watch,
}) => {
  console.log(relatedItem, "relatedItem in OverviewTabContent");

  const [internalActiveView, setInternalActiveView] = useState<
    "default" | "email" | "signature"
  >("default");
  const [internalTaskType, setInternalTaskType] = useState<"regular" | "repetitive">("regular");
  const [formValues, setFormValues] = useState<Record<string, unknown>>(initialValues);

  const activeView = externalActiveView !== undefined ? externalActiveView : internalActiveView;
  const taskType = externalTaskType !== undefined ? externalTaskType : internalTaskType;

  const handleViewChange = (view: "default" | "email" | "signature") => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      setInternalActiveView(view);
    }
  };

  const handleTaskTypeChange = (type: "regular" | "repetitive") => {
    if (onTaskTypeChange) {
      onTaskTypeChange(type);
    } else {
      setInternalTaskType(type);
    }
  };

  // Custom watch function that uses local state
  const localWatch = (fieldName?: string) => {
    if (!fieldName) return formValues;
    return formValues[fieldName];
  };

  // Handle form value changes
  const handleFormChange = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Determine which form fields to use based on task type
  const baseFormFields = useMemo(() => {
    if (taskType === "repetitive" && repetitiveTaskFields && repetitiveTaskFields.length > 0) {
      return repetitiveTaskFields;
    }
    return formFields;
  }, [taskType, formFields, repetitiveTaskFields]);

  // Get current frequency type value
  const currentFrequenceType = useMemo(() => {
    // Try to get from local state first
    let value = formValues.frequenceType;
    
    // If not in local state, try the watch function
    if (!value && watch) {
      value = watch('frequenceType');
    }
    
    // If still not found, use initial values
    if (!value && initialValues?.frequenceType) {
      value = initialValues.frequenceType;
    }
    
    // Extract value from object if needed
    if (value && typeof value === 'object' && value !== null) {
      return (value as { value?: string }).value || '';
    }
    
    return String(value || '');
  }, [formValues.frequenceType, watch, initialValues]);

  console.log('Current frequency type:', currentFrequenceType);

  // Filter fields based on conditions
  const currentFormFields = useMemo(() => {
    if (!baseFormFields || !Array.isArray(baseFormFields)) return [];

    return baseFormFields.map(field => {
      // If field has a condition, check if it matches
      if (field.condition) {
        const conditionValue = String(field.condition.value).toLowerCase();
        const currentValue = String(currentFrequenceType).toLowerCase();
        const shouldShow = currentValue === conditionValue;
        
        console.log(`Field ${field.fieldKey}: condition ${field.condition.field}=${conditionValue}, current=${currentValue}, show=${shouldShow}`);
        
        return {
          ...field,
          // We'll handle visibility in the form renderer
          isVisible: shouldShow
        };
      }

      // Always show fields without conditions
      return {
        ...field,
        isVisible: true
      };
    });
  }, [baseFormFields, currentFrequenceType]);

  const pathname = usePathname();
  const [filters, setFilters] = useState<Filter[]>([
    { id: Date.now(), activity: null, startDate: null, endDate: null },
  ]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // FIX: Properly detect create mode - no related item and not in edit mode
  const isCreateMode = !isEditMode && !relatedItem?.taskId && !relatedItem?.subTaskId && !relatedItem?.projectId;

  // Enhanced form submission that updates local state
  const handleSubmit = async (values: Record<string, unknown>) => {
    setFormValues(values);
    await onSubmit(values);
  };

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {suiteApp === "biz-accelator" && pathname.startsWith("/bizaccelerator/leads") && (
        <div className={isCreateMode ? "opacity-50 pointer-events-none" : ""}>
          <PipelineRibbon
            leadId={relatedItem?.projectId}
            currentStatus={initialValues?.status as string | undefined}
            fieldId="cmg6gyh1a00yjsmy8bumk23dh"
            initialStep={0}
            onStepChange={isCreateMode ? undefined : (index, statusId) => console.log("Step changed to:", index, "Status ID:", statusId)}
            onStatusChange={isCreateMode ? undefined : (statusId) => console.log("Status changed to:", statusId)}
          />
        </div>
      )}

      {activeView === "default" && (
        <div className={`flex gap-4 ${isCreateMode ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-200px)]'}`}>
          {/* LEFT SIDE - ACTIVITIES & ACTIONS BAR */}
          <div className={`w-2/3 border border-[#0000004F] rounded-lg bg-[#f5f5f5] dark:border-gray-700 dark:bg-gray-700 flex flex-col ${
            isCreateMode ? "opacity-50 pointer-events-none" : ""
          }`}>
            {/* Only show FormActionsBar in edit mode */}
            {!isCreateMode && (
              <FormActionsBar
                onEmailClick={() => handleViewChange("email")}
                onSettingsClick={() => handleViewChange("signature")}
                relatedItem={relatedItem}
                filters={filters}
                onFiltersChange={setFilters}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Only show Activities in edit mode when we have a related item */}
              {!isCreateMode && relatedItem ? (
                <Activities
                  projectId={relatedItem?.projectId}
                  taskId={relatedItem?.taskId}
                  subTaskId={relatedItem?.subTaskId}
                  filters={filters}
                  searchQuery={searchQuery}
                />
              ) : (
                // Show empty state or message in create mode
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">Create Mode</div>
                    <p className="text-sm">Save the task first to view activities and updates</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className={`w-1/3 border border-[#0000004F] rounded-lg bg-white dark:bg-gray-900 overflow-y-auto`}>
            <div className="p-5">
              {isTaskForm && (
                <div className="mb-6">
                  <div className="flex bg-[#F3F4F6] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          toast.info("Regular task form cannot be changed to repetitive in edit mode");
                          return;
                        }
                        handleTaskTypeChange("regular");
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-1 ${
                        taskType === "regular"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      } ${isEditMode ? "cursor-pointer" : ""}`}
                    >
                      <Image src="/logo/user1.svg" alt="Regular" width={18} height={18} />
                      Regular
                      {taskType === "regular" && (
                        <Image src="/logo/Dot.svg" alt="Active" width={18} height={18} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          toast.info("Regular task form cannot be changed to repetitive in edit mode");
                          return;
                        }
                        handleTaskTypeChange("repetitive");
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-1 ${
                        taskType === "repetitive"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      } ${isEditMode ? "cursor-pointer" : ""}`}
                    >
                      <Image src="/logo/repeat.svg" alt="Repetitive" width={18} height={18} />
                      Repetitive
                      {taskType === "repetitive" && (
                        <Image src="/logo/Dot.svg" alt="Active" width={18} height={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <DynamicForm
                fields={currentFormFields}
                onSubmit={handleSubmit}
                isEditMode={isEditMode}
                initialValues={initialValues}
                userRole={userRole}
                mdmId={mdmId}
                onFieldChange={handleFormChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Only show email and signature views in edit mode */}
      {!isCreateMode && (
        <>
          {activeView === "email" && (
            <div className="w-full overflow-y-auto h-[95vh]">
              <EmailComposer
                initialRecipients={[""]}
                onSend={(data) => {
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
                onSave={(data) => {
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