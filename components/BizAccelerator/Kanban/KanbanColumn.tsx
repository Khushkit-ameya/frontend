'use client';

import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import CustomScrollArea from './CustomScrollArea';

/**
 * Calculate the relative luminance of a color
 * Returns a value between 0 (darkest) and 1 (lightest)
 */
function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const [rs, gs, bs] = [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  
  // Calculate relative luminance using ITU-R BT.709 coefficients
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine whether to use dark or light text based on background color
 * Returns '#000000' for light backgrounds and '#ffffff' for dark backgrounds
 */
function getContrastTextColor(backgroundColor: string): string {
  try {
    const luminance = getLuminance(backgroundColor);
    // Use dark text if luminance is above 0.5 (lighter backgrounds)
    return luminance > 0.5 ? '#000000' : '#ffffff';
  } catch {
    // Fallback to white text if color parsing fails
    return '#ffffff';
  }
}

export type KanbanColumnProps<T> = {
  id: string;
  title: string;
  items: T[];
  getItemId: (item: T, index: number) => string;
  renderCard: (item: T, index: number) => React.ReactNode;
  isDropping?: boolean;
  headerColor?: string;
  headerDragHandleProps?: DraggableProvidedDragHandleProps;
  renderHeader?: (title: string, items: T[], textColor: string) => React.ReactNode;
  renderHeaderRight?: (title: string, items: T[], textColor: string) => React.ReactNode;
};

const KanbanColumn = <T,>({ id, title, items, getItemId, renderCard, isDropping, headerColor, headerDragHandleProps, renderHeader, renderHeaderRight }: KanbanColumnProps<T>) => {
  const bgColor = headerColor || '#E5F2FF';
  const textColor = getContrastTextColor(bgColor);
  
  return (
    <div className="bg-gray-50 rounded-lg w-[355px] flex flex-col h-full flex-shrink-0">
      <div className="flex items-center justify-between p-4 flex-shrink-0 rounded-t-lg sticky top-0 z-10" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="flex items-center space-x-2">
          {renderHeader ? (
            renderHeader(title, items, textColor)
          ) : (
            <>
              <h3 className="font-[500]" style={{ color: textColor }}>{title}</h3>
              <span className="text-xs px-2 py-1 rounded-full" style={{ 
                backgroundColor: textColor === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)', 
                color: textColor 
              }}>{items.length}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {renderHeaderRight && (
            <div className="flex items-center gap-3">
              {renderHeaderRight(title, items, textColor)}
            </div>
          )}
          {headerDragHandleProps && (
            <button
              type="button"
              title="Drag to reorder columns"
              className="p-1 rounded hover:bg-white/20 cursor-grab"
              {...headerDragHandleProps}
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <circle cx="2" cy="2" r="1.5" />
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="2" cy="8" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="2" cy="14" r="1.5" />
                <circle cx="8" cy="14" r="1.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <CustomScrollArea className="h-full">
          <Droppable droppableId={id}>
            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-4 flex-1 flex flex-col min-h-full ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
              >
                {items.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No items
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {items.map((item, index) => {
                      const dndId = getItemId(item, index);
                      return (
                        <div className="relative" key={dndId}>
                          <Draggable draggableId={String(dndId)} index={index}>
                            {(providedItem: DraggableProvided, snapshotItem: DraggableStateSnapshot) => {
                              const style: React.CSSProperties = {
                                ...(providedItem.draggableProps as any).style,
                              };
                              return (
                                <div
                                  ref={providedItem.innerRef}
                                  {...providedItem.draggableProps}
                                  {...providedItem.dragHandleProps}
                                  className={snapshotItem.isDragging ? 'is-dragging' : ''}
                                  style={style}
                                >
                                  <motion.div layout={!snapshotItem.isDragging && !isDropping} transition={{ type: 'spring', stiffness: 500, damping: 50 }}>
                                    {renderCard(item, index)}
                                  </motion.div>
                                </div>
                              );
                            }}
                          </Draggable>
                        </div>
                      );
                    })}
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CustomScrollArea>
      </div>
    </div>
  );
};

export default KanbanColumn;
