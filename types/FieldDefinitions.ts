// Frontend mirror of backend Field Definitions
// Keep this in sync with src/BizAccelerator/field-definitions/dto/create-field-definition.dto.ts
import type React from 'react';

export type FieldType =
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'CURRENCY'
  | 'DATE'
  | 'DATE_TIME'
  | 'DATE_RANGE'
  | 'DATE_TIME_RANGE'
  | 'TIME'
  | 'TIME_RANGE'
  | 'CHECKBOX'
  | 'RADIO'
  | 'DROPDOWN'
  | 'CREATABLE_DROPDOWN'
  | 'MULTISELECT'
  | 'FILE_UPLOAD'
  | "ACTION"

export type FieldDefinition = {
  // Backend identifier (optional, used for persistence like renaming)
  id?: string;
  // Core identity
  fieldKey: string;
  displayName: string;
  fieldType: FieldType;

  // Behavior flags
  isRequired?: boolean;
  isEditable?: boolean;
  isCoreField?: boolean;
  isVisible?: boolean; // default true
  isReadOnly?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  // Sorting behavior (if false, hide sort UI and disable sorting)
  isSortable?: boolean;
  // Prevent drag-reorder for this column when true
  isFreezed?: boolean;

  // UI and layout
  displayOrder?: number; // ordering between columns
  columnWidth?: string | number; // e.g. '150px' or numeric px value
  fieldGroup?: string; // optional grouping

  // Value/meta
  defaultValue?: unknown;
  placeholder?: string;
  helpText?: string;

  // Field-specific options, differs per type
  options?: {
    choices?: string[]; // dropdown/radio/multiselect choices
    min?: number; // number constraints
    max?: number;
    prefix?: string; // number/currency formatting
    suffix?: string;
    multiple?: boolean; // multiselect or multi-upload
    fileTypes?: string; // file upload accept
    wordLimit?: number; // textarea
    rows?: number; // textarea rows
  };

  // Optional header icon
  icon?: string | React.ComponentType<unknown>;
};

export type SortDirection = 'asc' | 'desc';

export type SortConfig = {
  field: string;
  direction: SortDirection;
} | null;