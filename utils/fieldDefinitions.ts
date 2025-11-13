import { FieldDefinition, FieldType } from '@/types/FieldDefinitions';

// Map backend FieldType strings to our frontend FieldType union
const normalizeFieldType = (value: string): FieldType => {
  const v = String(value).toUpperCase();
  const allowed: FieldType[] = [
    'TEXT','EMAIL','PHONE','URL','TEXTAREA','NUMBER','CURRENCY','DATE','DATE_TIME','DATE_RANGE','DATE_TIME_RANGE','TIME','TIME_RANGE','CHECKBOX','RADIO','DROPDOWN','CREATABLE_DROPDOWN','MULTISELECT','FILE_UPLOAD'
  ];
  if ((allowed as string[]).includes(v)) return v as FieldType;
  // Map common backend types
  if (v === 'DATETIME') return 'DATE_TIME';
  if (v === 'BOOLEAN') return 'CHECKBOX';
  return 'TEXT';
};

export type BackendFieldDefinition = {
  id?: string;
  fieldKey: string;
  displayName: string;
  fieldType: string;
  isCoreField?: boolean;
  isVisible?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  displayOrder?: number;
  columnWidth?: string | number;
  fieldGroup?: string;
  options?: Record<string, unknown>;
  defaultValue?: unknown;
  placeholder?: string;
  helpText?: string;
  icon?: string;
  isSortable?: boolean;
};

export const mapBackendToFrontend = (b: BackendFieldDefinition): FieldDefinition => ({
  id: b.id,
  fieldKey: b.fieldKey,
  displayName: b.displayName,
  fieldType: normalizeFieldType(b.fieldType),
  isCoreField: b.isCoreField,
  isVisible: b.isVisible,
  isRequired: b.isRequired,
  isReadOnly: b.isReadOnly,
  isSearchable: b.isSearchable,
  isFilterable: b.isFilterable,
  isSortable: b.isSortable,
  displayOrder: b.displayOrder,
  columnWidth: b.columnWidth,
  fieldGroup: b.fieldGroup,
  options: b.options,
  defaultValue: b.defaultValue,
  placeholder: b.placeholder,
  helpText: b.helpText,
  icon: b.icon,
});

export const mapBackendListToFrontend = (list: BackendFieldDefinition[]): FieldDefinition[] =>
  list.map(mapBackendToFrontend).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));