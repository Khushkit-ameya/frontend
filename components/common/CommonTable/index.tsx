'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldDefinition, SortConfig } from '@/types/FieldDefinitions';
import { useTheme } from '@/store/hooks';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import ColumnOptionsIcon from '@/components/ui buttons/ColumnOptionsIcon';
import SortArrowsIcon from '@/components/ui buttons/SortArrowsIcon';
import { FieldValue } from '../FieldType';
import { Edit2, Trash2 } from 'lucide-react';
import Checkbox from '@/components/ui buttons/Checkbox';

export type FinalTableProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  fieldDefinitions: FieldDefinition[];
  data: T[];
  rowKey?: string | ((row: T, index: number) => string | number);
  loading?: boolean;
  selectable?: boolean;
  stickyHeader?: boolean;
  className?: string;
  style?: React.CSSProperties;
  appearance?: 'default' | 'figma';
  frozenColumnKeys?: string[]; // columns that cannot be dragged/repositioned
  pinnedColumnKeys?: string[]; // columns to pin (sticky left, non-removable)

  // Sorting (controlled or uncontrolled)
  sortConfig?: SortConfig;
  onSortChange?: (config: SortConfig) => void;

  // Column behavior
  initialColumnOrder?: string[]; // list of fieldKey
  controlledColumnOrder?: string[]; // if provided, table follows this order
  columnWidths?: Record<string, number>; // px
  hiddenFieldKeys?: string[];
  onColumnOrderChange?: (orderedFieldKeys: string[]) => void;
  onColumnResize?: (fieldKey: string, width: number) => void;
  onHiddenFieldKeysChange?: (keys: string[]) => void;

  // Events
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRowKeys: (string | number)[], selectedRows: T[]) => void;
  onAddColumn?: () => void; // open external UI to add column
  onOpenColumnManager?: () => void; // open external column manager modal
  onRenameColumn?: (field: FieldDefinition, newName: string) => void;
  onHideColumn?: (field: FieldDefinition) => void;
  onToggleColumnVisibility?: (field: FieldDefinition, visible: boolean) => void;

  // Rendering hooks for future dynamic components
  getCellRenderer?: (args: { field: FieldDefinition; row: T; value: unknown; rowIndex: number }) => React.ReactNode;
  headerRenderer?: (field: FieldDefinition) => React.ReactNode;
  hideScrollbars?: boolean;
};

const DEFAULT_COL_WIDTH = 180;
const SELECT_COL_WIDTH = 40;
// const ADD_COL_WIDTH = 40; // disabled when add-column is hidden

// Convert hex color to rgba with alpha
const hexToRgba = (hex: string, alpha = 1): string => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Safely get nested values using dot-notation path e.g. "owner.name"
const getDeepValue = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== 'object' || !path) return undefined;
  const keys = path.includes('.') ? path.split('.') : [path];
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur;
};

const getDefaultOrder = (fields: FieldDefinition[]) =>
  [...fields]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((f) => f.fieldKey);

const getRowId = <T extends Record<string, unknown>>(
  row: T,
  index: number,
  rowKey?: string | ((row: T, index: number) => string | number)
): string | number => {
  if (typeof rowKey === 'function') return rowKey(row, index);
  if (typeof rowKey === 'string' && rowKey in row) return (row as Record<string, unknown>)[rowKey] as string | number;
  const anyRow = row as Record<string, unknown>;
  const id = anyRow['id'] ?? anyRow['_id'];
  return typeof id === 'string' || typeof id === 'number' ? id : index;
};

const FinalTable = <T extends Record<string, unknown> = Record<string, unknown>>({
  fieldDefinitions,
  data,
  rowKey,
  loading = false,
  selectable = true,
  stickyHeader = true,
  className,
  style,
  appearance = 'default',
  frozenColumnKeys,
  sortConfig,
  onSortChange,
  initialColumnOrder,
  controlledColumnOrder,
  columnWidths,
  hiddenFieldKeys,
  onColumnOrderChange,
  onColumnResize,
  onHiddenFieldKeysChange,
  onRowClick,
  onSelectionChange,
  onAddColumn,
  onOpenColumnManager,
  onRenameColumn,
  onHideColumn,
  onToggleColumnVisibility,
  getCellRenderer,
  headerRenderer,
  hideScrollbars,
  pinnedColumnKeys,
}: FinalTableProps<T>) => {
  const { isDark } = useTheme();

  // Pinned columns (sticky horizontally, always visible, non-removable, and non-draggable)
  const defaultPinned = (frozenColumnKeys && Array.isArray(frozenColumnKeys) && frozenColumnKeys[0] == "projectId") ? ["projectId"] : ['name', 'leadname', 'contactname', 'dealname', 'opportunityname', 'clientname', 'projectname', 'activityname', 'subject'];
  const pinnedKeys = useMemo(() => new Set<string>(((pinnedColumnKeys ?? defaultPinned).map((k: string) => String(k).toLowerCase()))), [pinnedColumnKeys?.join(',')]);
  const isPinned = useCallback((key: string) => pinnedKeys.has(String(key).toLowerCase()) || pinnedKeys.has(String(key)), [pinnedKeys]);

  // Controlled/uncontrolled sort
  const [internalSort, setInternalSort] = useState<SortConfig>(sortConfig ?? null);
  useEffect(() => setInternalSort(sortConfig ?? null), [sortConfig]);
  const currentSort = sortConfig ?? internalSort;

  // Column order
  const defaultOrder = useMemo(() => getDefaultOrder(fieldDefinitions), [fieldDefinitions]);
  const [order, setOrder] = useState<string[]>(initialColumnOrder ?? defaultOrder);
  useEffect(() => {
    if (controlledColumnOrder && controlledColumnOrder.length > 0) {
      setOrder(controlledColumnOrder);
    }
  }, [controlledColumnOrder?.join(',')]);
  // Keep order in sync when fields change
  useEffect(() => {
    const keys = new Set(order);
    const newKeys = fieldDefinitions.map((f) => f.fieldKey);
    let nextOrder = [...order];
    // Add any new keys at the end
    newKeys.forEach((k) => {
      if (!keys.has(k)) nextOrder.push(k);
    });
    // Remove keys that no longer exist
    nextOrder = nextOrder.filter((k) => newKeys.includes(k));
    setOrder(nextOrder);
  }, [fieldDefinitions]);

  // Column widths
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    fieldDefinitions.forEach((f) => {
      const fromProp = columnWidths?.[f.fieldKey];
      const fromField = typeof f.columnWidth === 'string'
        ? parseInt(String(f.columnWidth).replace(/px|rem|em|%/, ''), 10)
        : (f.columnWidth as number | undefined);
      map[f.fieldKey] = fromProp ?? fromField ?? DEFAULT_COL_WIDTH;
    });
    return map;
  });
  useEffect(() => {
    // update when props change
    if (columnWidths) setWidths((prev) => ({ ...prev, ...columnWidths }));
  }, [columnWidths]);

  // Visibility: drive UI from local hidden set; seed from props and backend isVisible
  const [hidden, setHidden] = useState<Set<string>>(new Set(hiddenFieldKeys ?? []));
  useEffect(() => setHidden(new Set(hiddenFieldKeys ?? [])), [hiddenFieldKeys]);
  useEffect(() => {
    // incorporate backend invisible fields into local hidden set
    setHidden((prev) => {
      const next = new Set(prev);
      fieldDefinitions.forEach((f) => {
        if (f.isVisible === false) next.add(f.fieldKey);
      });
      return next;
    });
  }, [fieldDefinitions.map(f => `${f.fieldKey}:${f.isVisible === false ? 0 : 1}`).join(',')]);

  // Selection
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  // Drag reorder state
  const dragFromKey = useRef<string | null>(null);

  // Resize state
  const resizeState = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const handleSort = (fieldKey: string) => {
    // 3-click cycle: none -> desc -> asc -> none
    let next: SortConfig = null;
    if (!currentSort || currentSort.field !== fieldKey) {
      next = { field: fieldKey, direction: 'desc' };
    } else if (currentSort.direction === 'desc') {
      next = { field: fieldKey, direction: 'asc' };
    } else if (currentSort.direction === 'asc') {
      next = null; // reset to default (unsorted)
    }
    setInternalSort(next);
    onSortChange?.(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    const newSet = new Set<string | number>();
    if (checked) {
      data.forEach((row, idx) => newSet.add(getRowId(row, idx, rowKey)));
    }
    setSelected(newSet);
    onSelectionChange?.(Array.from(newSet), data.filter((row, idx) => newSet.has(getRowId(row, idx, rowKey))));
  };

  const toggleSelectRow = (row: T, index: number, checked: boolean) => {
    const id = getRowId(row, index, rowKey);
    const newSet = new Set(selected);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelected(newSet);
    onSelectionChange?.(Array.from(newSet), data.filter((r, i) => newSet.has(getRowId(r, i, rowKey))));
  };

  const startDrag = (key: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
    dragFromKey.current = key;
    e.dataTransfer.effectAllowed = 'move';
  };

  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragOverSide, setDragOverSide] = useState<'left' | 'right' | null>(null);
  const frozenSet = useMemo(() => {
    const s = new Set(frozenColumnKeys ?? []);
    fieldDefinitions.forEach((f) => {
      if (f.isFreezed) s.add(f.fieldKey);
    });
    // Ensure pinned keys are also frozen (non-draggable)
    pinnedKeys.forEach((k) => s.add(String(k)));
    // Always freeze the special action column so it cannot be dragged
    s.add('action');
    return s;
  }, [pinnedKeys, frozenColumnKeys?.join(','), fieldDefinitions.map((f) => `${f.fieldKey}:${f.isFreezed ? 1 : 0}`).join(',')]);

  const allowDragOver = (targetKey: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLTableCellElement).getBoundingClientRect();
    const side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
    setDragOverKey(targetKey);
    setDragOverSide(side);
  };

  const dropOn = (targetKey: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    const from = dragFromKey.current;
    dragFromKey.current = null;
    setDragOverKey(null);
    setDragOverSide(null);
    if (!from || from === targetKey) return;
    if (frozenSet.has(from)) return; // do not allow moving frozen column
    const newOrder = [...order];
    const fromIdx = newOrder.indexOf(from);
    const toIdx = newOrder.indexOf(targetKey);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    // If dragging over right side, insert after target
    let insertIndex = dragOverSide === 'right' ? toIdx + 1 : toIdx;
    // Adjust insert index if removal was before insertion point
    if (fromIdx < insertIndex) insertIndex -= 1;
    newOrder.splice(insertIndex, 0, from);
    setOrder(newOrder);
    onColumnOrderChange?.(newOrder);
  };

  const startResize = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { key, startX: e.clientX, startWidth: widths[key] ?? DEFAULT_COL_WIDTH };
    window.addEventListener('mousemove', onResizing);
    window.addEventListener('mouseup', endResize);
  };

  const onResizing = (e: MouseEvent) => {
    if (!resizeState.current) return;
    const { key, startX, startWidth } = resizeState.current;
    const delta = e.clientX - startX;
    const next = Math.max(80, startWidth + delta);
    setWidths((prev) => ({ ...prev, [key]: next }));
  };

  const endResize = () => {
    if (!resizeState.current) return;
    const { key } = resizeState.current;
    const newWidth = widths[key];
    resizeState.current = null;
    window.removeEventListener('mousemove', onResizing);
    window.removeEventListener('mouseup', endResize);
    if (newWidth) onColumnResize?.(key, newWidth);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onResizing);
      window.removeEventListener('mouseup', endResize);
    };
  }, []);

  const visibleFields = useMemo(() => {
    const hiddenKeys = hidden;
    const byKey: Record<string, FieldDefinition> = Object.fromEntries(
      fieldDefinitions.map((f) => [f.fieldKey, f])
    );
    return order
      .map((k) => byKey[k])
      .filter((f): f is FieldDefinition => !!f && (!hiddenKeys.has(f.fieldKey) || isPinned(f.fieldKey)));
  }, [order, fieldDefinitions, hidden, isPinned]);

  // Render order: pinned fields first, then the rest (keeps pinned columns on the left like monday.com)
  const renderFields = useMemo(() => {
    const fields = visibleFields.slice();
    const pinned = fields.filter((f) => pinnedKeys.has(f.fieldKey));
    const others = fields.filter((f) => !pinnedKeys.has(f.fieldKey));
    // Keep any action-type columns strictly at the far right
    const actionKeys = new Set(['action']);
    const isAction = (f: FieldDefinition) => actionKeys.has(String(f.fieldKey).toLowerCase()) || String(f.fieldType).toUpperCase() === 'ACTION';
    const nonAction = others.filter((f) => !isAction(f));
    const actions = others.filter((f) => isAction(f));
    return [...pinned, ...nonAction, ...actions];
  }, [visibleFields, pinnedKeys]);

  const isFigma = appearance === 'figma';
  const tableClasses = isFigma
    ? `rounded-[5px] bg-white border border-separate border-spacing-0 ${className ?? ''}`
    : `min-w-full border rounded border-separate border-spacing-0 ${isDark ? 'border-gray-700' : 'border-gray-200'} ${className ?? ''}`;
  // Hardcode header background (disable dynamic theme color)
  // const headerBg = hexToRgba(companyThemeColor || '#1C75BB', 0.15);
  const HEAD_BG = '#656462';
  const DIVIDER = isDark ? '#374151' : '#e5e7eb';
  const headClasses = `text-white`;
  const rowClasses = (i: number) => isFigma
    ? `${i % 2 === 0 ? 'bg-white' : 'bg-[rgba(232,241,248,0.5)]'} hover:bg-[rgba(28,117,187,0.05)]`
    : `${isDark ? (i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800') : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50')} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`;
  const cellBase = isFigma
    ? `px-3 text-sm text-[#4F5051] text-left`
    : `px-3 text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} text-left`;

  // Track horizontal scroll to avoid double-left border when scrolled to far-left
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atLeftEdge, setAtLeftEdge] = useState(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setAtLeftEdge(el.scrollLeft <= 0);
    onScroll(); // initialize
    // passive cast to satisfy TS in older DOM lib targets
    const opts: AddEventListenerOptions = { passive: true };
    el.addEventListener('scroll', onScroll, opts);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  // When at left edge: draw only the RIGHT inner divider (between checkbox and next column)
  // When scrolled: draw BOTH left outer divider and right inner divider
  const leftEdgeShadow = useMemo(
    () => (atLeftEdge ? `inset -1px 0 0 ${DIVIDER}` : `inset -1px 0 0 ${DIVIDER}, inset 1px 0 0 ${DIVIDER}`),
    [atLeftEdge, DIVIDER]
  );

  // Header/menu state
  const [menuOpenForKey, setMenuOpenForKey] = useState<string | null>(null);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [displayNameOverrides, setDisplayNameOverrides] = useState<Record<string, string>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [fieldsMenuOpen, setFieldsMenuOpen] = useState(false);
  const fieldsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!menuRef.current.contains(e.target)) {
        setMenuOpenForKey(null);
      }
    };
    if (menuOpenForKey) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpenForKey]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!fieldsMenuRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!fieldsMenuRef.current.contains(e.target)) {
        setFieldsMenuOpen(false);
      }
    };
    if (fieldsMenuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [fieldsMenuOpen]);

  const headerNameFor = (f: FieldDefinition) => displayNameOverrides[f.fieldKey] ?? f.displayName;

  const defaultCell = ({ field, value }: { field: FieldDefinition; value: unknown }) => {
    // Ensure long text doesn't grow row height and left align content
    return (
      <div className="flex justify-start items-center w-full">
        <FieldValue field={field} value={value} className="truncate text-left" />
      </div>
    );
  };

  // Compute background color for sticky body cells to avoid overlap artifacts
  const getRowBgColor = useCallback((i: number) => {
    // Use OPAQUE backgrounds for sticky cells so content behind doesn't bleed through
    if (isFigma) return i % 2 === 0 ? '#FFFFFF' : '#E8F1F8';
    return isDark ? (i % 2 === 0 ? '#111827' : '#1F2937') : (i % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
  }, [isFigma, isDark]);

  // Compute left offset for a pinned (sticky) column
  const computeStickyLeft = useCallback((fieldKey: string) => {
    let left = 0;
    if (selectable) left += SELECT_COL_WIDTH;
    for (const f of renderFields) {
      if (f.fieldKey === fieldKey) break;
      if (isPinned(f.fieldKey)) {
        left += widths[f.fieldKey] ?? DEFAULT_COL_WIDTH;
      }
    }
    return left;
  }, [renderFields, widths, selectable, isPinned]);

  const containerStyle: React.CSSProperties | undefined = {
    maxHeight: style?.maxHeight ?? '70vh',
    ...style,
    ...(hideScrollbars ? { msOverflowStyle: 'none', scrollbarWidth: 'none' } : {}),
  };
  const tableStyle: React.CSSProperties | undefined = isFigma
    ? { borderColor: DIVIDER, width: 'max-content', tableLayout: 'fixed' }
    : { width: 'max-content', tableLayout: 'fixed' };

  return (
    <div className="w-full min-w-0 h-full flex flex-col" style={containerStyle}>
      {/* Toolbar (static) */}
      <div className={`flex items-center justify-between px-2 py-2 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center gap-2">
          {selectable && (
            <label className="inline-flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.size > 0 && selected.size === data.length}
                onChange={() => toggleSelectAll(!(selected.size > 0 && selected.size === data.length))}
              />
              <span>{selected.size} selected</span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/**
           * Add column button hidden per request
           * <button
           *   className={`${isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-700'} flex items-center gap-1 px-2 py-1 rounded text-sm`}
           *   onClick={() => onAddColumn?.()}
           *   title="Add column"
           * >
           *   <AddColumnIcon /> Add column
           * </button>
           */}
          <div className="relative" ref={fieldsMenuRef}>
            <button
              className={`px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFieldsMenuOpen((o) => !o)}
              title="Manage columns"
            >
              <ColumnOptionsIcon />
            </button>
            {fieldsMenuOpen && (
              <div
                className={`fixed z-50 bg-white rounded-[5px] shadow-lg`}
                style={{ right: 8, top: 48, width: 382, maxHeight: '70vh', overflow: 'auto', border: '1px solid rgba(0,0,0,0.18)' }}
              >
                <div className="px-3 py-2 text-xs font-semibold text-[#4F5051]">Columns for your {/** context-aware */}contacts board</div>
                <div className="py-1">
                  {fieldDefinitions
                    .slice()
                    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                    // Exclude pinned and special action column from the list
                    .filter((f) => !isPinned(f.fieldKey) && String(f.fieldKey).toLowerCase() !== 'action' && String(f.fieldType).toUpperCase() !== 'ACTION')
                    .map((f) => {
                      const checked = !hidden.has(f.fieldKey);
                      const iconSrc = `/${f.fieldKey}.svg`;
                      return (
                        <label key={f.fieldKey} className="flex items-start gap-2 px-3 py-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={(e) => {
                              const willShow = e.target.checked;
                              const next = new Set(hidden);
                              if (willShow) next.delete(f.fieldKey); else next.add(f.fieldKey);
                              setHidden(next);
                              onHiddenFieldKeysChange?.(Array.from(next));
                              onToggleColumnVisibility?.(f, willShow);
                            }}
                          />
                          <div className="flex items-start gap-2 min-w-0">
                            {/* Icon loaded from public/{fieldKey}.svg; render at original size */}
                            <img src={iconSrc} alt="" className="shrink-0" style={{ maxWidth: 'none', maxHeight: 'none' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] leading-[18px] text-black font-medium truncate">{f.displayName}</span>
                              {Boolean(f.helpText) && (
                                <span className="text-[13px] leading-[18px] text-black/70 whitespace-normal break-words pr-2">{String(f.helpText)}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table: horizontal and vertical scroll */}
      <div ref={scrollRef} className={`w-full min-w-0 overflow-auto ${hideScrollbars ? 'no-scrollbar' : ''} flex-1 relative`}>
        <table className={tableClasses} style={tableStyle}>
          <colgroup>
            {selectable && <col style={{ width: SELECT_COL_WIDTH }} />}
            {renderFields.map((f, i) => (
              <col key={`col-${(f.id ?? f.fieldKey)}-${i}`} style={{ width: widths[f.fieldKey] ?? DEFAULT_COL_WIDTH }} />
            ))}
          </colgroup>
          <thead className={headClasses} style={{ backgroundColor: HEAD_BG }}>
          <tr>
            {selectable && (
              <th
                className={`${cellBase} w-10 text-white`}
                style={{
                  width: SELECT_COL_WIDTH,
                  minWidth: SELECT_COL_WIDTH,
                  height: 35,
                  boxSizing: 'border-box',
                  // Draw the inner divider always; draw left divider only when not at the far-left
                  boxShadow: leftEdgeShadow,
                  borderBottom: '1px solid #CBD5E1',
                  // Sticky vertically and horizontally (left locked); top sticks within scroll container
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  zIndex: 25,
                  backgroundColor: HEAD_BG,
                  // Promote to its own layer to avoid sub-pixel jitter
                  transform: 'translateZ(0)'
                }}
              >
                <Checkbox
                  checked={selected.size > 0 && selected.size === data.length}
                  onChange={() => toggleSelectAll(!(selected.size > 0 && selected.size === data.length))}
                />
              </th>
            )}
            {renderFields.map((field, colIdx) => {
              const isSorted = currentSort?.field === field.fieldKey;
              const direction = currentSort?.direction ?? 'asc';
              const width = widths[field.fieldKey] ?? DEFAULT_COL_WIDTH;
              const isLast = colIdx === renderFields.length - 1;
              const isActionCol = String(field.fieldKey).toLowerCase() === 'action' || String(field.fieldType).toUpperCase() === 'ACTION';
              return (
                <th
                  key={`h-${(field.id ?? field.fieldKey)}-${colIdx}`}
                  data-key={field.fieldKey}
                  draggable={!frozenSet.has(field.fieldKey)}
                  onDragStart={startDrag(field.fieldKey)}
                  onDragOver={allowDragOver(field.fieldKey)}
                  onDragLeave={() => { setDragOverKey(null); setDragOverSide(null); }}
                  onDrop={dropOn(field.fieldKey)}
                  className={`${cellBase} text-left whitespace-nowrap relative text-white`}
                  style={{
                    width,
                    minWidth: width,
                    height: 35,
                    boxSizing: 'border-box',
                    borderBottom: '1px solid #CBD5E1',
                    boxShadow: isLast ? undefined : `inset -1px 0 0 ${DIVIDER}`,
                    // Sticky vertically for all header cells; horizontally for pinned columns
                    position: 'sticky',
                    top: 0,
                    left: isPinned(field.fieldKey) ? computeStickyLeft(field.fieldKey) : undefined,
                    right: undefined,
                    zIndex: isPinned(field.fieldKey) ? 22 : 20,
                    backgroundColor: HEAD_BG,
                    transform: 'translateZ(0)',
                  }}
                >
                  <div className="flex items-center justify-start gap-2 select-none w-full relative pr-8 min-w-0">
                    {/* Reorder icon hidden as requested; drag is still enabled */}
                    {(() => {
                      const sortable = field.isSortable !== false;
                      const isRenaming = renamingKey === field.fieldKey;
                      const labelNode = headerRenderer ? (
                        headerRenderer(field)
                      ) : isRenaming ? (
                        <input
                          autoFocus
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onBlur={() => {
                            const committed = renameInput.trim();
                            if (committed) {
                              setDisplayNameOverrides((prev) => ({ ...prev, [field.fieldKey]: committed }));
                              onRenameColumn?.(field, committed);
                            }
                            setRenamingKey(null);
                          }}
                          onKeyDown={(e) => {
                            // prevent any keypress (incl. space) from bubbling to header and triggering sort
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            } else if (e.key === 'Escape') {
                              setRenamingKey(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="border rounded px-1 text-sm"
                        />
                      ) : (
                        <span>{headerNameFor(field)}</span>
                      );
                      const labelContent = isRenaming ? labelNode : (
                        <span className="truncate block max-w-full">{labelNode}</span>
                      );
                      const content = (
                        <span className="inline-flex items-center gap-1 min-w-0">
                          {typeof field.icon === 'function' ? (
                            // ts-expect-error: icon can be a component type
                            React.createElement(field.icon)
                          ) : null}
                          <span className="flex-1 min-w-0">{labelContent}</span>
                          {isRenaming ? null : sortable ? (
                            isSorted ? (
                              direction === 'asc' ? <FiArrowUp className="ml-1 shrink-0" /> : <FiArrowDown className="ml-1 shrink-0" />
                            ) : (
                              <SortArrowsIcon className="shrink-0" />
                            )
                          ) : null}
                        </span>
                      );
                      // Do not render clickable sort button while renaming; also non-sortable renders as static
                      if (!sortable || isRenaming) {
                        return (
                          <div className={`flex items-center justify-start gap-1 font-semibold`} title={String(field.helpText ?? field.placeholder ?? '')}>
                            {content}
                          </div>
                        );
                      }
                      return (
                        <button
                          className={`flex items-center justify-start gap-1 font-semibold`}
                          onClick={() => handleSort(field.fieldKey)}
                          title={String(field.helpText ?? field.placeholder ?? '')}
                          type="button"
                        >
                          {content}
                        </button>
                      );
                    })()}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        className="p-1 rounded"
                        title="Column options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenForKey((k) => (k === field.fieldKey ? null : field.fieldKey));
                          setRenameInput(headerNameFor(field));
                        }}
                      >
                        <ColumnOptionsIcon className="text-white/60" />
                      </button>
                      {menuOpenForKey === field.fieldKey && (
                        <div
                          ref={menuRef}
                          className={`absolute right-0 top-7 z-30 bg-white rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-lg w-44 py-1 text-sm`}
                        >
                          <button
                            className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingKey(field.fieldKey);
                              setMenuOpenForKey(null);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                            <span>Rename</span>
                          </button>
                          {!isPinned(field.fieldKey) && String(field.fieldKey).toLowerCase() !== 'action' && String(field.fieldType).toUpperCase() !== 'ACTION' && (
                            <button
                              className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-100 text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = new Set(hidden);
                                next.add(field.fieldKey);
                                setHidden(next);
                                onHiddenFieldKeysChange?.(Array.from(next));
                                onHideColumn?.(field);
                                setMenuOpenForKey(null);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-gray-500" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Drag position indicator */}
                  {dragOverKey === field.fieldKey && dragOverSide && (
                    <div
                      className="absolute top-[15%] h-[70%] w-[6px]"
                      style={{ [dragOverSide === 'left' ? 'left' : 'right']: 0, backgroundColor: '#C81C1F' } as React.CSSProperties}
                    />
                  )}
                  {/* Resize handle */}
                  <div
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize"
                    onMouseDown={startResize(field.fieldKey)}
                    style={{ userSelect: 'none' }}
                    title="Drag to resize"
                  />
                </th>
              );
            })}
            {/** Add column affordance at end hidden per request
            <th className={`${cellBase} w-10 text-center`}>
              <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => onAddColumn?.()} title="Add column">
                <AddColumnIcon />
              </button>
            </th>
            */}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={renderFields.length + (selectable ? 1 : 0)} className={`${cellBase} text-center`}>
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={renderFields.length + (selectable ? 1 : 0)} className={`${cellBase} text-center text-gray-500`}>
                No data
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={`${String(getRowId(row, rowIndex, rowKey))}-${rowIndex}`}
                className={rowClasses(rowIndex)}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {selectable && (
                  <td
                    className={`${cellBase} w-10`}
                    style={{
                      width: SELECT_COL_WIDTH,
                      minWidth: SELECT_COL_WIDTH,
                      boxSizing: 'border-box',
                      // Draw the inner divider always; draw left divider only when not at the far-left
                      boxShadow: leftEdgeShadow,
                      borderTop: rowIndex === 0 ? undefined : '1px solid #CBD5E1',
                      position: 'sticky',
                      left: 0,
                      zIndex: 11,
                      backgroundColor: getRowBgColor(rowIndex),
                      transform: 'translateZ(0)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.has(getRowId(row, rowIndex, rowKey))}
                      onChange={() => toggleSelectRow(row, rowIndex, !selected.has(getRowId(row, rowIndex, rowKey)))}
                    />
                  </td>
                )}
                {renderFields.map((field, colIdx) => {
                  const value = getDeepValue(row, field.fieldKey);
                  let content: React.ReactNode;
                  if (getCellRenderer) {
                    const custom = getCellRenderer({ field, row, value, rowIndex });
                    content = custom === undefined ? defaultCell({ field, value }) : custom;
                  } else {
                    content = defaultCell({ field, value });
                  }
                  const width = widths[field.fieldKey] ?? DEFAULT_COL_WIDTH;
                  const isLast = colIdx === renderFields.length - 1;
                  const isActionCol = String(field.fieldKey).toLowerCase() === 'action' || String(field.fieldType).toUpperCase() === 'ACTION';
                  return (
                    <td
                      key={`c-${(field.id ?? field.fieldKey)}-${colIdx}`}
                      data-key={field.fieldKey}
                      className={`${cellBase} whitespace-nowrap align-middle ${isActionCol ? 'py-0 leading-none' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRowClick?.(row, rowIndex);
                      }}
                      style={{
                        width,
                        minWidth: width,
                        height: 24,
                        boxSizing: 'border-box',
                        borderTop: rowIndex === 0 ? undefined : '1px solid #CBD5E1',
                        boxShadow: isLast ? undefined : `inset -1px 0 0 ${DIVIDER}`,
                        // Sticky horizontally for pinned columns
                        position: isPinned(field.fieldKey) ? 'sticky' : undefined,
                        left: isPinned(field.fieldKey) ? computeStickyLeft(field.fieldKey) : undefined,
                        right: undefined,
                        zIndex: isPinned(field.fieldKey) ? 20 : undefined,
                        backgroundColor: isPinned(field.fieldKey) ? getRowBgColor(rowIndex) : undefined,
                        transform: isPinned(field.fieldKey) ? 'translateZ(0)' : undefined,
                        paddingTop: isActionCol ? 0 : undefined,
                        paddingBottom: isActionCol ? 0 : undefined,
                        lineHeight: isActionCol ? 1 : undefined,
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
                {/** End placeholder cell to align with add-column header (hidden per request) */}
                {/** <td className={`${cellBase} w-10`} /> */}
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalTable;
