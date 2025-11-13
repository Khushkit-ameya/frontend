// components/BizAccelerator/DynamicForm/DynamicForm.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormLayout } from './FormLayout';
import { FormFieldRenderer } from './FormFieldRenderer';
import { FieldDefinition } from './types';

interface DropdownOption {
  displayName: string;
  color: string;
  fieldKey?: string;
  value?: string | number;
}

type DealData = Record<string, unknown>; // replace `any` with generic object

interface CustomFieldHandler {
  onChange: (value: unknown, option?: DropdownOption) => void;
}

interface DynamicFormProps {
  fields: FieldDefinition[];
  onSubmit: (values: Record<string, unknown>) => void;
  isEditMode?: boolean;
  initialValues?: Record<string, unknown>;
  formTitle?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  className?: string;
  onAddDropdownOption?: (fieldId: string, option: DropdownOption) => Promise<void>;
  onUpdateDropdownOption?: (fieldId: string, value: string, updates: Partial<DropdownOption>) => Promise<void>;
  onReorderDropdownOptions?: (fieldId: string, orderedOptions: DropdownOption[]) => Promise<void>;
  onDeleteDropdownOption?: (fieldId: string, value: string) => Promise<void>;
  opportunityId?: string;
  opportunityName?: string;
  onLinkOpportunity?: (dealData: unknown) => void;
  dealData?: unknown;

  onConvertToLead?: (contactId: string) => Promise<void>;
  convertingIds?: Set<string | number>;
  onConvertToOpportunity?: (leadId: string) => Promise<void>;
  customFieldHandlers?: Record<string, CustomFieldHandler>;
}


export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  isEditMode = false,
  initialValues = {},
  formTitle,
  submitButtonText = isEditMode ? 'Update' : 'Create',
  cancelButtonText = 'Cancel',
  className = '',
  onAddDropdownOption,
  onUpdateDropdownOption,
  onReorderDropdownOptions,
  onDeleteDropdownOption,
  opportunityId,
  opportunityName,
  onLinkOpportunity,
  dealData,
  onConvertToLead,
  convertingIds,
  onConvertToOpportunity,
  customFieldHandlers = {},
}) => {

  // Debug logging
  console.log("DynamicForm - fields received:", fields);
  console.log("DynamicForm - fields count:", fields?.length);
  console.log("DynamicForm - initialValues:", initialValues);

  const form = useForm({ defaultValues: initialValues });

  const { watch, setValue } = form;

  // Watch for field changes to handle custom logic
  const watchedValues = watch();

  // Handle custom field changes
  useEffect(() => {
    Object.keys(customFieldHandlers).forEach(fieldKey => {
      if (watchedValues[fieldKey] !== undefined && watchedValues[fieldKey] !== null) {
        const field = fields.find(f => f.fieldKey === fieldKey);
        let selectedOption: DropdownOption | undefined;

        if (field?.options?.choices) {
          selectedOption = (field.options.choices as unknown as DropdownOption[]).find(
            (choice) => choice.value === watchedValues[fieldKey] || choice === watchedValues[fieldKey]
          );
        }


        customFieldHandlers[fieldKey].onChange(watchedValues[fieldKey], selectedOption);

      }
    });
  }, [watchedValues, customFieldHandlers, fields]);

  const handleSubmit = (values: Record<string, unknown>) => {
    onSubmit(values);
  };


  const handleCancel = () => {
    window.history.back();
  };

  // Filter fields based on custom conditions (like showing relatedEntity only when relatedTo is selected)
  const filteredFields = fields.filter(field => {
    // Only show relatedEntity field if relatedTo has a value
    if (field.fieldKey === 'relatedEntity') {
      const relatedTo = watchedValues.relatedTo as unknown[] | undefined;
      return relatedTo && relatedTo.length > 0;
    }

    return true;
  });

  if (!fields || fields.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-lg mb-2">No fields to display</div>
        <p className="text-gray-600">The form has no field definitions.</p>
      </div>
    );
  }

  return (
    <FormLayout
      fields={filteredFields}
      renderField={(field: FieldDefinition) => (
        <FormFieldRenderer
          key={field.fieldKey}
          field={field}
          form={form}
          onAddDropdownOption={onAddDropdownOption}
          onUpdateDropdownOption={onUpdateDropdownOption}
          onReorderDropdownOptions={onReorderDropdownOptions}
          onDeleteDropdownOption={onDeleteDropdownOption}
          onLinkOpportunity={onLinkOpportunity}
          dealData={dealData}
          onConvertToLead={onConvertToLead}
          convertingIds={convertingIds}
          onConvertToOpportunity={onConvertToOpportunity}
        />
      )}
      onSubmit={form.handleSubmit(handleSubmit)}
      onCancel={handleCancel}
      isEditMode={isEditMode}
      formTitle={formTitle}
      submitButtonText={submitButtonText}
      cancelButtonText={cancelButtonText}
      className={className}
    />
  );
};

export default DynamicForm;