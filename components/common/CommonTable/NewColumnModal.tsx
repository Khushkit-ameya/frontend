'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FieldDefinition, FieldType } from '@/types/FieldDefinitions';
import { useTheme } from '@/store/hooks';
import { FiX, FiPlus } from 'react-icons/fi';

export type NewColumnModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (field: FieldDefinition) => void;
  suggestNextOrder?: number;
};

const FIELD_TYPES: FieldType[] = [
  'TEXT','EMAIL','PHONE','URL','TEXTAREA','NUMBER','CURRENCY','DATE','DATE_TIME','DATE_RANGE','DATE_TIME_RANGE','TIME','TIME_RANGE','CHECKBOX','RADIO','DROPDOWN','CREATABLE_DROPDOWN','MULTISELECT','FILE_UPLOAD'
];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const NewColumnModal: React.FC<NewColumnModalProps> = ({ open, onClose, onCreate, suggestNextOrder }) => {
  const { isDark } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('TEXT');
  const [isRequired, setIsRequired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [columnWidth, setColumnWidth] = useState<number>(180);

  // Options
  const [choicesText, setChoicesText] = useState(''); // comma separated
  const [min, setMin] = useState<number | ''>('');
  const [max, setMax] = useState<number | ''>('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [multiple, setMultiple] = useState(false);
  const [fileTypes, setFileTypes] = useState('');
  const [rows, setRows] = useState<number | ''>('');
  const [wordLimit, setWordLimit] = useState<number | ''>('');

  useEffect(() => {
    if (!displayName) return;
    setFieldKey((prev) => (prev ? prev : slugify(displayName)));
  }, [displayName]);

  const canSave = displayName.trim().length > 0 && fieldKey.trim().length > 0;

  const buildOptions = () => {
    const opt: NonNullable<FieldDefinition['options']> = {};
    if (['DROPDOWN','CREATABLE_DROPDOWN','MULTISELECT','RADIO'].includes(fieldType)) {
      const list = choicesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length) opt.choices = list;
      if (fieldType === 'MULTISELECT') opt.multiple = true;
    }
    if (['NUMBER','CURRENCY'].includes(fieldType)) {
      if (min !== '') opt.min = Number(min);
      if (max !== '') opt.max = Number(max);
      if (prefix) opt.prefix = prefix;
      if (suffix) opt.suffix = suffix;
    }
    if (fieldType === 'FILE_UPLOAD') {
      if (multiple) opt.multiple = true;
      if (fileTypes) opt.fileTypes = fileTypes; // e.g. .pdf,.docx,image/*
    }
    if (fieldType === 'TEXTAREA') {
      if (rows !== '') opt.rows = Number(rows);
      if (wordLimit !== '') opt.wordLimit = Number(wordLimit);
    }
    return opt;
  };

  const handleCreate = () => {
    const field: FieldDefinition = {
      fieldKey,
      displayName,
      fieldType,
      isRequired,
      isVisible,
      isEditable: true,
      displayOrder: suggestNextOrder ?? 9999,
      columnWidth,
      options: buildOptions(),
    };
    onCreate(field);
    onClose();
    // reset
    setDisplayName('');
    setFieldKey('');
    setFieldType('TEXT');
    setIsRequired(false);
    setIsVisible(true);
    setColumnWidth(180);
    setChoicesText('');
    setMin(''); setMax(''); setPrefix(''); setSuffix('');
    setMultiple(false); setFileTypes(''); setRows(''); setWordLimit('');
  };

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black/50' : 'bg-black/40'} flex items-center justify-center`}>
      <div className={`w-[720px] max-w-full max-h-[85vh] overflow-hidden rounded-lg shadow-xl ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className="font-semibold">New Column</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="p-4 overflow-auto" style={{ maxHeight: '68vh' }}>
          <div className="grid grid-cols-12 gap-4">
            <label className="col-span-6 text-sm">
              <div className="mb-1">Display name</div>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder="e.g., Status" />
            </label>
            <label className="col-span-6 text-sm">
              <div className="mb-1">Field key</div>
              <input value={fieldKey} onChange={(e) => setFieldKey(slugify(e.target.value))} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder="status" />
            </label>

            <label className="col-span-6 text-sm">
              <div className="mb-1">Type</div>
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value as FieldType)} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`}>
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="col-span-3 text-sm flex items-center gap-2">
              <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
              <span>Required</span>
            </label>
            <label className="col-span-3 text-sm flex items-center gap-2">
              <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
              <span>Visible</span>
            </label>

            <label className="col-span-6 text-sm">
              <div className="mb-1">Column width (px)</div>
              <input type="number" value={columnWidth} onChange={(e) => setColumnWidth(Math.max(80, Number(e.target.value) || 180))} className={`w-full px-3 py-2 rounded border text-right ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
            </label>

            {/* Conditional options */}
            {['DROPDOWN','CREATABLE_DROPDOWN','MULTISELECT','RADIO'].includes(fieldType) && (
              <label className="col-span-12 text-sm">
                <div className="mb-1">Choices (comma separated)</div>
                <input value={choicesText} onChange={(e) => setChoicesText(e.target.value)} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder="New Lead, Contacted, Qualified" />
              </label>
            )}

            {['NUMBER','CURRENCY'].includes(fieldType) && (
              <>
                <label className="col-span-3 text-sm">
                  <div className="mb-1">Min</div>
                  <input type="number" value={min} onChange={(e) => setMin(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full px-3 py-2 rounded border text-right ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                </label>
                <label className="col-span-3 text-sm">
                  <div className="mb-1">Max</div>
                  <input type="number" value={max} onChange={(e) => setMax(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full px-3 py-2 rounded border text-right ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                </label>
                <label className="col-span-3 text-sm">
                  <div className="mb-1">Prefix</div>
                  <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder="$" />
                </label>
                <label className="col-span-3 text-sm">
                  <div className="mb-1">Suffix</div>
                  <input value={suffix} onChange={(e) => setSuffix(e.target.value)} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder="/mo" />
                </label>
              </>
            )}

            {fieldType === 'FILE_UPLOAD' && (
              <>
                <label className="col-span-6 text-sm flex items-center gap-2">
                  <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} />
                  <span>Allow multiple files</span>
                </label>
                <label className="col-span-6 text-sm">
                  <div className="mb-1">Accepted file types</div>
                  <input value={fileTypes} onChange={(e) => setFileTypes(e.target.value)} className={`w-full px-3 py-2 rounded border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder=".pdf,.docx,image/*" />
                </label>
              </>
            )}

            {fieldType === 'TEXTAREA' && (
              <>
                <label className="col-span-6 text-sm">
                  <div className="mb-1">Rows</div>
                  <input type="number" value={rows} onChange={(e) => setRows(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full px-3 py-2 rounded border text-right ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                </label>
                <label className="col-span-6 text-sm">
                  <div className="mb-1">Word limit</div>
                  <input type="number" value={wordLimit} onChange={(e) => setWordLimit(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full px-3 py-2 rounded border text-right ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                </label>
              </>
            )}
          </div>
        </div>

        <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="text-sm text-gray-500 dark:text-gray-400">Configure column basics; advanced settings can be added later.</div>
          <div className="flex items-center gap-2">
            <button className={`px-4 py-1.5 rounded border ${isDark ? 'border-gray-700' : 'border-gray-300'}`} onClick={onClose}>Cancel</button>
            <button className="px-4 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50" onClick={handleCreate} disabled={!canSave}>
              <span className="inline-flex items-center gap-2"><FiPlus /> Create</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewColumnModal;
