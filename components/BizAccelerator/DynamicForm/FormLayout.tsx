"use client";

import React from 'react';
import { FieldDefinition } from './types';

interface FormLayoutProps {
  fields: FieldDefinition[];
  renderField: (field: FieldDefinition) => React.ReactNode;
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
  submitButtonText = 'Create',
  cancelButtonText = 'Cancel',
  className = ''
}) => {
  return (
    <form onSubmit={onSubmit} className={`w-full ${className}`}>
      {formTitle && (
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {formTitle}
        </h2>
      )}

      <div className="space-y-4">
        {[...fields]
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((field) => renderField(field))}
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {cancelButtonText}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          {submitButtonText}
        </button>
      </div>
    </form>
  );
};