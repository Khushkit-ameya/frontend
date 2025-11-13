"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty, normalizeChoices, mapChoiceLabel } from '../utils';

const DropdownValue: React.FC<FieldValueProps> = ({ field, value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  const norm = normalizeChoices(field.options?.choices);
  if (Array.isArray(value)) return <span className={className ? `${className} justify-center` : 'justify-center'}>{value.map((v) => (norm ? mapChoiceLabel(norm, v) : String(v))).join(', ')}</span>;
  return <span className={className ? `${className} justify-center` : 'justify-center'}>{norm ? mapChoiceLabel(norm, value) : String(value)}</span>;
};

export default DropdownValue;
export const CreatableDropdownValue = DropdownValue;
export const MultiselectValue = DropdownValue;
