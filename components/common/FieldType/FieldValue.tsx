"use client";
import React from 'react';
import type { FieldDefinition } from '@/types/FieldDefinitions';
import {
  TextValue,
  EmailValue,
  PhoneValue,
  UrlValue,
  TextareaValue,
  NumberValue,
  CurrencyValue,
  DateValue,
  DateTimeValue,
  TimeValue,
  DateRangeValue,
  DateTimeRangeValue,
  TimeRangeValue,
  CheckboxValue,
  RadioValue,
  DropdownValue,
  CreatableDropdownValue,
  MultiselectValue,
  FileUploadValue,
} from './components';

export type FieldValueProps = {
  field: FieldDefinition;
  value: unknown;
  className?: string;
};

export const FieldValue: React.FC<FieldValueProps> = ({ field, value, className }) => {
  const type = field.fieldType;
  switch (type) {
    case 'TEXT': return <TextValue field={field} value={value} className={className} />;
    case 'EMAIL': return <EmailValue field={field} value={value} className={className} />;
    case 'PHONE': return <PhoneValue field={field} value={value} className={className} />;
    case 'URL': return <UrlValue field={field} value={value} className={className} />;
    case 'TEXTAREA': return <TextareaValue field={field} value={value} className={className} />;
    case 'NUMBER': return <NumberValue field={field} value={value} className={className} />;
    case 'CURRENCY': return <CurrencyValue field={field} value={value} className={className} />;
    case 'DATE': return <DateValue field={field} value={value} className={className} />;
    case 'DATE_TIME': return <DateTimeValue field={field} value={value} className={className} />;
    case 'TIME': return <TimeValue field={field} value={value} className={className} />;
    case 'DATE_RANGE': return <DateRangeValue field={field} value={value} className={className} />;
    case 'DATE_TIME_RANGE': return <DateTimeRangeValue field={field} value={value} className={className} />;
    case 'TIME_RANGE': return <TimeRangeValue field={field} value={value} className={className} />;
    case 'CHECKBOX': return <CheckboxValue field={field} value={value} className={className} />;
    case 'RADIO': return <RadioValue field={field} value={value} className={className} />;
    case 'DROPDOWN': return <DropdownValue field={field} value={value} className={className} />;
    case 'CREATABLE_DROPDOWN': return <CreatableDropdownValue field={field} value={value} className={className} />;
    case 'MULTISELECT': return <MultiselectValue field={field} value={value} className={className} />;
    case 'FILE_UPLOAD': return <FileUploadValue field={field} value={value} className={className} />;
    default: return <TextValue field={field} value={value} className={className} />;
  }
};

export default FieldValue;
