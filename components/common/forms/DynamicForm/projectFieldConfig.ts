import { getDynamicFieldConfig } from './dynamicFieldConfig';
import { FieldType } from './types';

// This becomes a helper function now, not a static config
export const getProjectFieldConfig = (fieldKey: string, fieldType: FieldType, displayName?: string) => {
  return getDynamicFieldConfig(fieldKey, fieldType, displayName);
};

// Keep legacy static config for backward compatibility
export const projectFieldConfig: Record<string, {
  icon: string;
  tooltip: string;
}> = {
 
};