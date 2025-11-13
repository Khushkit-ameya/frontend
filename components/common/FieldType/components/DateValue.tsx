"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty, fmtDate } from '../utils';

const DateValue: React.FC<FieldValueProps> = ({ value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  return <span className={className ? `${className} justify-center` : 'justify-center'}>{fmtDate(value)}</span>;
};

export default DateValue;
export const DateTimeValue = DateValue;
export const TimeValue = DateValue;
