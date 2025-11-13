"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty, fmtDate } from '../utils';

interface RangeObject {
  start?: any;
  from?: any;
  end?: any;
  to?: any;
}

const RangeValue: React.FC<FieldValueProps> = ({ value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  const range = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
    ? [(value as RangeObject).start ?? (value as RangeObject).from, (value as RangeObject).end ?? (value as RangeObject).to]
    : [undefined, undefined];
  const [from, to] = range;
  return (
    <span className={className ? `${className} justify-center` : 'justify-center'}>
      {fmtDate(from)} — {fmtDate(to)}
    </span>
  );
};

export default RangeValue;
export const DateRangeValue = RangeValue;
export const DateTimeRangeValue = RangeValue;
export const TimeRangeValue = RangeValue;
