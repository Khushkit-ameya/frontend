export type FieldType =
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "TEXTAREA"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "DROPDOWN"
  | "CHECKBOX"
  | "FILE_UPLOAD";

// components/BizAccelerator/DynamicForm/types.ts
export interface FieldDefinition {
  fieldKey: string;
  displayName: string;
  fieldType: FieldType;
  isRequired?: boolean;
  isEditable?: boolean;
  isReadOnly?: boolean;
  options?: {
    choices?: Array<{
      label: string;
      value: string | number;
      disabled?: boolean;
    }>;
    placeholder?: string;
    rows?: number;
    min?: number;
    max?: number;
    multiple?: boolean;
    allowMultiple?: boolean;
    allowCustomTags?: boolean;
    actionType?: "create_deal";
    buttonText?: string;
    columnType?: "action_button";
  };
  displayOrder?: number;
  helpText?: string;
  fieldId?: string;
  id?: string;
  icon?: string;
  tooltip?: string;
  iconBg?: string;
  [key: string]: unknown;
}