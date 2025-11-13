"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const CurrencyValue: React.FC<FieldValueProps> = ({ value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  const num = Number(value) || 0;
  const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
  return <span className={className ? `${className} justify-center` : 'justify-center'}>{formatted}</span>;
};

export default CurrencyValue;
