import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormLayout } from "../FormLayout";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { DynamicFormProps } from "./types";

export default function DynamicForm({
  fields,
  onSubmit,
  isEditMode = false,
  initialValues = {},
  formTitle,
  submitButtonText,
  cancelButtonText,
  className,
  mdmId,
  onFieldChange
}: DynamicFormProps & { onFieldChange?: (field: string, value: any) => void }) {
  const form = useForm({ defaultValues: initialValues });
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
  console.log("DYNAMICFORM DEBUG - initialValues received:", initialValues);
  console.log("DYNAMICFORM DEBUG - taskType value:", initialValues?.taskType);
  
  if (initialValues && Object.keys(initialValues).length > 0) {
    // Use setTimeout to ensure form is ready
    setTimeout(() => {
      form.reset(initialValues);
      console.log("DYNAMICFORM DEBUG - Form reset completed");
      
      // Double check if taskType is set
      const currentTaskType = form.getValues('taskType');
      console.log("DYNAMICFORM DEBUG - Current taskType in form:", currentTaskType);
    }, 100);
  }
}, [initialValues, form]);

  // Watch for form changes and notify parent component of changes
  useEffect(() => {
    // form.watch may not have a consistent typed return across versions; cast to a callable unsubscribe function if present
    const unsubscribe = form.watch((value) => {
      // Notify parent component of changes
      Object.entries(value as Record<string, unknown>).forEach(([field, fieldValue]) => {
        onFieldChange?.(field, fieldValue);
      });
    }) as unknown as (() => void) | undefined;
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [form, onFieldChange]);

  // Filter fields based on visibility (use a cast to avoid missing property on the FieldDefinition type)
  const visibleFields = fields.filter(field => (field as any).isVisible !== false);

  return (
    <FormLayout
      fields={visibleFields}
      renderField={(field) => (
        <FormFieldRenderer
          key={field.fieldKey}
          field={field}
          form={form}
          watch={form.watch}
          setValue={form.setValue}
          customOptions={customOptions}
          setCustomOptions={setCustomOptions}
          mdmId={mdmId}
        />
      )}
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => window.history.back()}
      isEditMode={isEditMode}
      formTitle={formTitle}
      submitButtonText={submitButtonText}
      cancelButtonText={cancelButtonText}
      className={className}
    />
  );
}