"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const NumberValue: React.FC<FieldValueProps> = ({ field, value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  const num = Number(value);
  const prefix = field.options?.prefix ?? '';
  const suffix = field.options?.suffix ?? '';
  return <span className={className ? `${className} justify-center` : 'justify-center'}>{`${prefix}${Number.isFinite(num) ? num.toLocaleString() : String(value)}${suffix}`}</span>;
};

export default NumberValue;
