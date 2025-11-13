"use client";

import React from 'react';
import { FieldDefinition } from '../DynamicForm/types';
import { setTheme, setCompanyThemeColor } from '@/store/api_query/global';
import { useTheme, useCompanyTheme } from '@/store/hooks';

interface FormLayoutProps {
  fields: FieldDefinition[];
  renderField: (f: FieldDefinition) => React.ReactNode;
  onCancel: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  isEditMode?: boolean;
  formTitle?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  className?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  fields,
  renderField,
  onCancel,
  onSubmit,
  isEditMode = false,
  formTitle,
  submitButtonText = isEditMode ? 'Update' : 'Create',
  cancelButtonText = 'Cancel',
  className = '',
}

) => {
  const { isDark, colors, companyThemeColor } = useTheme()
  return (
  <form onSubmit={onSubmit} className={`w-full ${className}`}>
    {formTitle && (
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {formTitle}
      </h2>
    )}

    {[...(fields || [])]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((field) => renderField(field))}

    <div className="flex justify-end gap-4 mt-6">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded-md text-white dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        style={{ backgroundColor: "#C81C1F" }}
      >
        {cancelButtonText}
      </button>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        style={{ backgroundColor: "#C81C1F" }}
      >
        {submitButtonText}
      </button>
    </div>
  </form>
)};