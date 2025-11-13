"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const RadioValue: React.FC<FieldValueProps> = ({ value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  return <span className={className ? `${className} justify-center` : 'justify-center'}>{String(value)}</span>;
};

export default RadioValue;
