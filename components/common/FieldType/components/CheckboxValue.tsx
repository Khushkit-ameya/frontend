"use client";
import React from 'react';
import { FieldValueProps } from '../utils';

const CheckboxValue: React.FC<FieldValueProps> = ({ value }) => {
  return <div className="flex justify-start"><input type="checkbox" checked={!!value} readOnly className="pointer-events-none" /></div>;
};

export default CheckboxValue;
