'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DragDropContext, DropResult, DragStart, DragUpdate, Droppable, Draggable } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CustomScrollArea from './CustomScrollArea';
import type { FieldDefinition } from '@/types/FieldDefinitions';
import ColorPicker from '@/components/common/ColorPicker';

/**
 * Calculate the relative luminance of a color
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const [rs, gs, bs] = [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Get contrast text color for a background
 */
function getContrastTextColor(backgroundColor: string): string {
  try {
    const luminance = getLuminance(backgroundColor);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

export type KanbanColumnConfig = {
  id: string;
  title: string;
  value: string | number | null;
  color?: string;
};

export type KanbanBoardProps<T extends Record<string, any>> = {
  items: T[];
  fieldDefinitions: FieldDefinition[];
  columnKey: string;
  columns: KanbanColumnConfig[];
  rowKey?: string | ((row: T, index: number) => string | number);
  cardTitleFieldKey?: string;
  cardFieldKeys?: string[];
  getCardFieldKeys?: (item: T) => string[];
  onItemMove?: (args: { item: T; sourceColumnId: string; destColumnId: string; destIndex: number }) => void;
  onColumnOrderChange?: (ordered: KanbanColumnConfig[]) => void;
  renderCard?: (item: T, index: number) => React.ReactNode;
  className?: string;
  renderColumnHeader?: (title: string, items: T[], textColor: string) => React.ReactNode;
  renderColumnHeaderRight?: (title: string, items: T[], textColor: string) => React.ReactNode;
  onAddColumn?: (args: { name: string; color: string }) => Promise<KanbanColumnConfig | void> | KanbanColumnConfig | void;
  addColumnLabel?: string;
};

const getRowId = <T extends Record<string, any>>(row: T, index: number, rowKey?: string | ((row: T, index: number) => string | number)) => {
  if (typeof rowKey === 'function') return rowKey(row, index);
  if (typeof rowKey === 'string' && rowKey in row) return row[rowKey] as any;
  const id = row['id'] ?? row['_id'] ?? index;
  return typeof id === 'string' || typeof id === 'number' ? id : String(index);
};

const KanbanBoard = <T extends Record<string, any>>({ items, fieldDefinitions, columnKey, columns, rowKey, cardTitleFieldKey, cardFieldKeys, getCardFieldKeys, onItemMove, onColumnOrderChange, renderCard, className, renderColumnHeader, renderColumnHeaderRight, onAddColumn, addColumnLabel }: KanbanBoardProps<T>) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);

  type ColumnState = { id: string; title: string; value: KanbanColumnConfig['value']; color?: string; items: T[] };
  const [stateColumns, setStateColumns] = useState<ColumnState[]>([]);
  const [hasUserReordered, setHasUserReordered] = useState(false);

  useEffect(() => {
    if (isDragging) return;
    setStateColumns(prev => {
      // keep existing order if present; otherwise initialize from props
      const base = (prev && prev.length > 0)
        ? prev.map((c) => {
            const match = columns.find(x => String(x.id) === String(c.id));
            return {
              id: String((match ?? c).id),
              title: (match ?? c).title,
              value: (match ?? c).value,
              color: (match ?? c).color as any,
              items: [] as T[],
            };
          })
        : columns.map(c => ({ id: c.id, title: c.title, value: c.value, color: c.color, items: [] as T[] }));
      return base.map(c => ({
        ...c,
        items: items.filter(it => {
          const raw = (it as any)[columnKey];
          const norm = raw && typeof raw === 'object' && 'value' in raw ? (raw as any).value : raw;
          return String(norm) === String(c.value);
        })
      }));
    });
  }, [items, columns, columnKey, isDragging]);

  const mouseMoveHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);

  const onDragStart = (start: DragStart) => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!scrollContainerRef.current) return;
      const { clientX } = event;
      const { left, right } = scrollContainerRef.current.getBoundingClientRect();
      const scrollSpeed = 10;
      const deadZone = 60;
      const startScrolling = (direction: 'left' | 'right') => {
        if (scrollIntervalRef.current) return;
        scrollIntervalRef.current = window.setInterval(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += direction === 'left' ? -scrollSpeed : scrollSpeed;
          }
        }, 16);
      };
      const stopScrolling = () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
      };
      if (clientX < left + deadZone) startScrolling('left');
      else if (clientX > right - deadZone) startScrolling('right');
      else stopScrolling();
    };
    mouseMoveHandlerRef.current = handleMouseMove;
    window.addEventListener('mousemove', mouseMoveHandlerRef.current);
    setIsDragging(true);
  };

  const onDragUpdate = (_update: DragUpdate) => {};

  const onDragEnd = (result: DropResult) => {
    setIsDropping(true);
    const endDropCycle = () => requestAnimationFrame(() => setIsDropping(false));
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null; }
    if (mouseMoveHandlerRef.current) { window.removeEventListener('mousemove', mouseMoveHandlerRef.current); mouseMoveHandlerRef.current = null; }

    // Column reorder
    if ((result as any).type === 'column') {
      const { destination, source } = result;
      if (!destination) { setIsDragging(false); endDropCycle(); return; }
      if (destination.droppableId === source.droppableId && destination.index === source.index) { setIsDragging(false); endDropCycle(); return; }
      const next = [...stateColumns];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      setStateColumns(next);
      setHasUserReordered(true);
      setIsDragging(false);
      endDropCycle();
      if (typeof onColumnOrderChange === 'function') {
        onColumnOrderChange(next.map(c => ({ id: String(c.id), title: c.title, value: c.value, color: c.color })));
      }
      return;
    }

    const { destination, source } = result;
    if (!destination) { setIsDragging(false); endDropCycle(); return; }
    if (destination.droppableId === source.droppableId && destination.index === source.index) { setIsDragging(false); endDropCycle(); return; }

    setStateColumns(prev => {
      const sourceIdx = prev.findIndex(c => c.id === source.droppableId);
      const destIdx = prev.findIndex(c => c.id === destination.droppableId);
      if (sourceIdx === -1 || destIdx === -1) return prev;
      const next = [...prev];
      const sourceCol = next[sourceIdx];
      const destCol = next[destIdx];
      const srcItems = [...sourceCol.items];
      const dstItems = sourceCol === destCol ? srcItems : [...destCol.items];
      const [moved] = srcItems.splice(source.index, 1);
      const updatedMoved: T = { ...moved, [columnKey]: prev[destIdx].value } as T;
      dstItems.splice(destination.index, 0, updatedMoved);
      next[sourceIdx] = { ...sourceCol, items: srcItems };
      if (sourceIdx !== destIdx) next[destIdx] = { ...destCol, items: dstItems };
      return next;
    });

    setHasUserReordered(true);
    setIsDragging(false);
    endDropCycle();

    const sourceColumnId = source.droppableId;
    const destColumnId = destination.droppableId;
    const sourceColumn = stateColumns.find(c => c.id === sourceColumnId);
    const item = sourceColumn ? sourceColumn.items[source.index] : undefined;
    if (item && onItemMove) onItemMove({ item, sourceColumnId, destColumnId, destIndex: destination.index });
  };

  // Add-status column local UI state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addColor, setAddColor] = useState('#6b7280');

  return (
    <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
      <div
        ref={scrollContainerRef}
        className={`h-full overflow-x-auto overflow-y-hidden px-6 pt-2 ${className ?? ''}`}
        style={{ scrollbarGutter: 'stable' }}
      >
        <Droppable droppableId="columns-droppable" direction="horizontal" type="column">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4 min-w-max h-full items-stretch">
              {stateColumns.map((col, colIdx) => (
                <Draggable draggableId={`col-${col.id}`} index={colIdx} key={`col-${col.id}`}>
                  {(dragProvided) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                      <KanbanColumn
                        id={col.id}
                        title={col.title}
                        items={col.items}
                        getItemId={(item, i) => String(getRowId(item, i, rowKey))}
                        renderCard={(item, index) => renderCard
                          ? renderCard(item, index)
                          : (
                            <KanbanCard
                              item={item}
                              fieldDefinitions={fieldDefinitions}
                              titleFieldKey={cardTitleFieldKey}
                              fieldKeys={getCardFieldKeys ? getCardFieldKeys(item) : cardFieldKeys}
                            />
                          )}
                        isDropping={isDropping}
                        headerColor={col.color}
                        headerDragHandleProps={dragProvided.dragHandleProps ?? undefined}
                        renderHeader={renderColumnHeader ? (title, items) => {
                          const textColor = getContrastTextColor(col.color || '#E5F2FF');
                          return renderColumnHeader(title, items, textColor);
                        } : undefined}
                        renderHeaderRight={renderColumnHeaderRight ? (title, items) => {
                          const textColor = getContrastTextColor(col.color || '#E5F2FF');
                          return renderColumnHeaderRight(title, items, textColor);
                        } : undefined}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {onAddColumn && (
                <div className="bg-gray-50 rounded-lg w-[355px] flex flex-col h-full flex-shrink-0">
                  <div className="flex items-center justify-center p-4 flex-shrink-0 rounded-t-lg sticky top-0 z-10 text-gray-900" style={{ backgroundColor: '#E5F2FF' }}>
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-white/40 text-gray-900"
                      onClick={() => setAddOpen(true)}
                      title="Add a New Status"
                      aria-label="Add a New Status"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <CustomScrollArea className="h-full">
                      <div className="p-4">
                        <div className="text-center text-sm text-gray-700 mb-3">{addColumnLabel || 'Add a New Status'}</div>
                        {addOpen ? (
                          <div className="flex flex-col gap-3">
                            <input
                              type="text"
                              value={addName}
                              onChange={(e) => setAddName(e.target.value)}
                              placeholder="Status name"
                              className="px-2 py-1 border rounded text-sm"
                            />
                            <ColorPicker value={addColor} onChange={(hex: string) => setAddColor(hex)} />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                                disabled={!addName.trim()}
                                onClick={async () => {
                                  if (!onAddColumn || !addName.trim()) return;
                                  const result = await onAddColumn({ name: addName.trim(), color: addColor });
                                  if (result && typeof result === 'object') {
                                    setStateColumns((prev) => [
                                      ...prev,
                                      { id: String(result.id), title: result.title, value: result.value, color: result.color, items: [] as T[] },
                                    ]);
                                  }
                                  setAddName('');
                                  setAddOpen(false);
                                }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 text-sm border rounded"
                                onClick={() => { setAddOpen(false); setAddName(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </CustomScrollArea>
                  </div>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
