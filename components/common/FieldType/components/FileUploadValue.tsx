"use client";
import React from 'react';
import { FieldValueProps, Fallback, isEmpty } from '../utils';

const FileUploadValue: React.FC<FieldValueProps> = ({ value, className }) => {
  if (isEmpty(value)) return <Fallback className={className} />;
  if (Array.isArray(value)) return <span className={className ? `${className} justify-center` : 'justify-center'}>{value.length} file(s)</span>;
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    return <span className={className ? `${className} justify-center` : 'justify-center'}>{String(name)}</span>;
  }
  return <span className={className ? `${className} justify-center` : 'justify-center'}>1 file</span>;
};

export default FileUploadValue;
