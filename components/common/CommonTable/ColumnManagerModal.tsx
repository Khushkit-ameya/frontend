'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FieldDefinition } from '@/types/FieldDefinitions';
import { FiMove, FiChevronUp, FiChevronDown, FiX } from 'react-icons/fi';
import { useTheme } from '@/store/hooks';

export type ColumnManagerModalProps = {
  open: boolean;
  onClose: () => void;
  fields: FieldDefinition[];
  order: string[]; // fieldKey order
  hiddenFieldKeys: string[];
  widths: Record<string, number>;
  onApply: (args: { order: string[]; hiddenFieldKeys: string[]; widths: Record<string, number> }) => void;
};

const ColumnManagerModal: React.FC<ColumnManagerModalProps> = ({ open, onClose, fields, order, hiddenFieldKeys, widths, onApply }) => {
  const { isDark } = useTheme();
  const [localOrder, setLocalOrder] = useState<string[]>(order);
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set(hiddenFieldKeys));
  const [localWidths, setLocalWidths] = useState<Record<string, number>>({ ...widths });

  useEffect(() => setLocalOrder(order), [order.join(',')]);
  useEffect(() => setLocalHidden(new Set(hiddenFieldKeys)), [hiddenFieldKeys.join(',')]);
  useEffect(() => setLocalWidths({ ...widths }), [JSON.stringify(widths)]);

  const byKey = useMemo(() => Object.fromEntries(fields.map(f => [f.fieldKey, f])), [fields]);

  const move = (key: string, dir: -1 | 1) => {
    const idx = localOrder.indexOf(key);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= localOrder.length) return;
    const copy = [...localOrder];
    const [k] = copy.splice(idx, 1);
    copy.splice(target, 0, k);
    setLocalOrder(copy);
  };

  const toggle = (key: string) => {
    const next = new Set(localHidden);
    if (next.has(key)) next.delete(key); else next.add(key);
    setLocalHidden(next);
  };

  const apply = () => {
    onApply({ order: localOrder, hiddenFieldKeys: Array.from(localHidden), widths: localWidths });
    onClose();
  };

  const resetDefaults = () => {
    const ordered = [...fields].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map(f => f.fieldKey);
    setLocalOrder(ordered);
    setLocalHidden(new Set());
    const w: Record<string, number> = {};
    fields.forEach(f => { w[f.fieldKey] = typeof f.columnWidth === 'number' ? f.columnWidth : 180; });
    setLocalWidths(w);
  };

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isDark ? 'bg-black/50' : 'bg-black/40'} flex items-center justify-center`}>
      <div className={`w-[720px] max-w-full max-h-[80vh] overflow-hidden rounded-lg shadow-xl ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className="font-semibold">Manage Columns</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="p-4 overflow-auto" style={{ maxHeight: '60vh' }}>
          <div className="grid grid-cols-12 text-xs font-semibold uppercase mb-2 opacity-70">
            <div className="col-span-6">Column</div>
            <div className="col-span-2 text-center">Visible</div>
            <div className="col-span-4 text-right">Width (px)</div>
          </div>
          <div className="space-y-2">
            {localOrder.map((key) => {
              const f = byKey[key];
              if (!f) return null;
              return (
                <div key={key} className={`grid grid-cols-12 items-center px-2 py-2 rounded border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <FiMove className="opacity-60" />
                    <div className="truncate" title={f.displayName}>{f.displayName}</div>
                    <div className="ml-auto flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => move(key, -1)} title="Move up"><FiChevronUp /></button>
                      <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => move(key, 1)} title="Move down"><FiChevronDown /></button>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <input type="checkbox" checked={!localHidden.has(key)} onChange={() => toggle(key)} />
                  </div>
                  <div className="col-span-4 text-right">
                    <input
                      type="number"
                      className={`w-24 px-2 py-1 rounded border text-right ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`}
                      value={Number(localWidths[key] ?? 180)}
                      onChange={(e) => setLocalWidths({ ...localWidths, [key]: Math.max(80, Number(e.target.value) || 180) })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button className={`px-3 py-1.5 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} onClick={resetDefaults}>Reset to defaults</button>
          <div className="flex items-center gap-2">
            <button className={`px-4 py-1.5 rounded border ${isDark ? 'border-gray-700' : 'border-gray-300'}`} onClick={onClose}>Cancel</button>
            <button className="px-4 py-1.5 rounded bg-blue-600 text-white" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnManagerModal;
