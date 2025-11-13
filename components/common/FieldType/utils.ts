"use client";
import React from 'react';
import type { FieldDefinition } from '@/types/FieldDefinitions';

export type FieldValueProps = {
  field: FieldDefinition;
  value: unknown;
  className?: string;
  // Optional commit handler for inline-editing cells
  onCommit?: (next: string) => void | Promise<void>;
};

export const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

export const Fallback = ({ className }: { className?: string }) => {
  const cls = className ? `${className} text-gray-400` : 'text-gray-400';
  return React.createElement('span', { className: cls }, '-');
};

export const fmtDate = (v: unknown) => {
  try {
    const iv = typeof v === 'number' || typeof v === 'string' || v instanceof Date ? v : String(v ?? '');
    const d = new Date(iv as string | number | Date);
    if (isNaN(d.getTime())) return String(v ?? '-');
    return d.toLocaleString();
  } catch {
    return String(v ?? '-');
  }
};

export const normalizeChoices = (choices: unknown) => {
  if (!choices) return undefined;
  if (Array.isArray(choices)) {
    if (choices.length > 0 && typeof choices[0] === 'string') {
      return (choices as string[]).map((c) => ({ label: c, value: c }));
    }
    return choices as Array<{ label: string; value: unknown }>;
  }
  return undefined;
};

export const mapChoiceLabel = (choices: Array<{ label: string; value: unknown }>, v: unknown) => {
  const found = choices.find((c) => String(c.value) === String(v));
  return found ? found.label : String(v);
};

