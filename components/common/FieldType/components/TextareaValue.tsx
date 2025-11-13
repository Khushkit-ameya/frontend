"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const TextareaValue: React.FC<FieldValueProps> = ({ value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  const str = String(value);
  const base = className ?? '';
  const shouldTruncate = base.includes('truncate');
  const cls = shouldTruncate ? base : `${base} whitespace-pre-wrap`;
  return <span className={className ? `${cls} justify-center` : `${cls} justify-center`} title={str}>{str}</span>;
};

export default TextareaValue;
