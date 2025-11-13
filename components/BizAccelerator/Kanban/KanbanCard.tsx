'use client';
import React, { CSSProperties, useMemo } from 'react';
import type { FieldDefinition } from '@/types/FieldDefinitions';
import { FieldValue } from '@/components/common/FieldType/FieldValue';

export type KanbanCardProps<T extends Record<string, any> = Record<string, any>> = {
  item: T;
  fieldDefinitions: FieldDefinition[];
  titleFieldKey?: string;
  fieldKeys?: string[];
  onClick?: () => void;
};

const pinnedNameKeys = ['name','leadname','contactname','dealname','opportunityname','clientname','projectname','activityname','subject'];

const getRowId = <T extends Record<string, any>>(row: T, index: number): string | number => {
  const id = row['id'] ?? row['_id'] ?? index;
  return typeof id === 'string' || typeof id === 'number' ? id : String(index);
};

const getDeepValue = (obj: any, path: string) => {
  if (!obj || typeof obj !== 'object' || !path) return undefined;
  const keys = path.includes('.') ? path.split('.') : [path];
  let cur: any = obj;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in cur) cur = cur[k]; else return undefined;
  }
  return cur;
};

const KanbanCard = <T extends Record<string, any>>({ item, fieldDefinitions, titleFieldKey, fieldKeys, onClick }: KanbanCardProps<T>) => {
  const defsByKey = useMemo(() => Object.fromEntries(fieldDefinitions.map(f => [f.fieldKey, f])), [fieldDefinitions]);
  const titleKey = useMemo(() => {
    if (titleFieldKey && defsByKey[titleFieldKey]) return titleFieldKey;
    for (const k of pinnedNameKeys) if (defsByKey[k]) return k;
    return fieldDefinitions[0]?.fieldKey ?? 'name';
  }, [titleFieldKey, defsByKey, fieldDefinitions]);

  const displayKeys = useMemo(() => {
    if (fieldKeys && fieldKeys.length) return fieldKeys.filter(k => !!defsByKey[k] && k !== titleKey);
    const fallback = fieldDefinitions.map(f => f.fieldKey).filter(k => k !== titleKey);
    return fallback.slice(0, 3);
  }, [fieldKeys, defsByKey, fieldDefinitions, titleKey]);

  const titleValue = getDeepValue(item, titleKey);
  const cardStyle: CSSProperties = {
    ['--tw-shadow' as any]: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    ['--tw-shadow-colored' as any]: '0 1px 2px 0 var(--tw-shadow-color)'
  };

  return (
    <div
      className={[
        'text-card-foreground overflow-hidden bg-white shadow-sm border border-gray-200 rounded-xl',
        'transition-all duration-200 relative select-none px-3 cursor-grab hover:shadow-md hover:border-gray-400',
        'active:border-blue-500 pt-[0.4375rem] pb-1.5 w-full'
      ].join(' ')}
      role="button"
      tabIndex={0}
      onClick={onClick}
      style={cardStyle}
    >
      <div className="flex flex-col gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm leading-tight truncate" title={String(titleValue ?? getRowId(item, 0))}>
            {(typeof titleValue === 'string' || typeof titleValue === 'number')
              ? String(titleValue)
              : defsByKey[titleKey]
                ? (<FieldValue field={defsByKey[titleKey]} value={titleValue} className="truncate" />)
                : String(titleValue ?? '')}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {displayKeys.map((k) => (
            <div key={k} className="flex items-center gap-2 text-xs text-gray-600 min-w-0">
              <span className="shrink-0 text-[11px] text-gray-500 capitalize">{defsByKey[k]?.displayName ?? k}</span>
              <div className="truncate flex-1">
                {defsByKey[k]
                  ? (<FieldValue field={defsByKey[k]} value={getDeepValue(item, k)} className="truncate" />)
                  : String(getDeepValue(item, k) ?? '')}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full h-[1px] bg-gray-200 my-1" />
    </div>
  );
};

export default KanbanCard;
