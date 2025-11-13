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
  | 'INPUT_WITH_BUTTON'
  | 'BUTTON'
  | 'USER_DROPDOWN'
  | 'JSON'
  | 'MULTI_SELECT'
  | 'DATETIME'
  | 'CUSTOM_DAILY'
  | 'CUSTOM_WEEKLY'
  | 'CUSTOM_MONTHLY'
  | 'CUSTOM_QUARTERLY'
  | 'SWITCH'
  | 'CUSTOM_ESTIMATE_TIME'
  | 'CUSTOM_MONTHLY_VALIDATED'
  | 'CUSTOM_QUARTERLY_VALIDATED'
  | 'CUSTOM_YEARLY';

export interface FileUploadOptions {
  multiple?: boolean;
  fileTypes?: string;
  allowLinks?: boolean;
}

export interface FileUploadItem {
  type: 'file' | 'link';
  id: string;
}

export interface FileItem extends FileUploadItem {
  type: 'file';
  file: File;
}

export interface LinkItem extends FileUploadItem {
  type: 'link';
  url: string;
  displayText: string;
}

export type UploadItem = FileItem | LinkItem;

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role?: string | { name: string; [key: string]: unknown };
}

export interface FieldOptionChoice {
  value?: string;
  label?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

export interface FieldOptions {
  choices?: FieldOptionChoice[] | string[];
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  multiple?: boolean;
  fileTypes?: string;
  wordLimit?: number;
  rows?: number;
  placeholder?: string;
  allowLinks?: boolean;
  allowCustom?: boolean;
}

export interface FieldDefinition {
  fieldKey: string;
  displayName: string;
  fieldType: FieldType;
  isRequired?: boolean;
  isEditable?: boolean;
  options?: FieldOptions;
  displayOrder?: number;
  icon?: string | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tooltip?: string;
  iconBg?: boolean | string;
  helpText?: string;
  id?: string;
}

export interface DynamicFormProps {
  fields: FieldDefinition[];
  onSubmit: (values: Record<string, unknown>) => void;
  isEditMode?: boolean;
  initialValues?: Record<string, unknown>;
  userRole?: string;
  formTitle?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  className?: string;
  mdmId?: string;
  onFieldChange?: (field: string, value: any) => void;
}

export const fieldTypeConfig: Record<string, { icon: string; tooltip: string }> = {
  TEXT: { icon: '/icons/text.svg', tooltip: 'Enter plain text value' },
  EMAIL: { icon: '/icons/email.svg', tooltip: 'Provide a valid email address' },
  PHONE: { icon: '/icons/phone.svg', tooltip: 'Provide a phone number' },
  URL: { icon: '/icons/url.svg', tooltip: 'Provide a valid URL (https://...)' },
  TEXTAREA: { icon: '/icons/textarea.svg', tooltip: 'Enter a longer text description' },
  NUMBER: { icon: '/icons/number.svg', tooltip: 'Enter a numeric value' },
  CURRENCY: { icon: '/icons/currency.svg', tooltip: 'Enter an amount in currency' },
  DATE: { icon: '/icons/date.svg', tooltip: 'Pick a calendar date' },
  DATE_TIME: { icon: '/icons/datetime.svg', tooltip: 'Pick a date and time' },
  DATE_RANGE: { icon: '/icons/date-range.svg', tooltip: 'Pick a start and end date' },
  DATE_TIME_RANGE: { icon: '/icons/date-time-range.svg', tooltip: 'Pick a start and end date with time' },
  TIME: { icon: '/icons/time.svg', tooltip: 'Select a time of day' },
  TIME_RANGE: { icon: '/icons/time-range.svg', tooltip: 'Select a time range' },
  CHECKBOX: { icon: '/icons/checkbox.svg', tooltip: 'Choose one or more options' },
  RADIO: { icon: '/icons/radio.svg', tooltip: 'Select a single option' },
  DROPDOWN: { icon: '/icons/dropdown.svg', tooltip: 'Pick one value from the list' },
  CREATABLE_DROPDOWN: { icon: '/icons/creatable-dropdown.svg', tooltip: 'Pick or create a new option' },
  MULTISELECT: { icon: '/icons/multiselect.svg', tooltip: 'Select multiple values' },
  FILE_UPLOAD: { icon: '/icons/upload.svg', tooltip: 'Upload one or more files' },
};