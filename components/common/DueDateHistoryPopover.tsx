"use client";
import React, { useState, useEffect } from 'react';
import { Popover } from '@mui/material';
import { DateTime } from 'luxon';

interface DueDateHistoryEntry {
    id: string;
    projectId: string;
    oldDueDate: string | null;
    newDueDate: string | null;
    reason: string | null;
    changedById: string | null;
    updatedAt: string;
}

interface DueDateHistoryPopoverProps {
    dueDateHistory: DueDateHistoryEntry[];
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const DueDateHistoryPopover: React.FC<DueDateHistoryPopoverProps> = ({
    dueDateHistory,
    anchorEl,
    onClose,
    onMouseEnter,
    onMouseLeave
}) => {
    const isOpen = Boolean(anchorEl);
    const [anchorPosition, setAnchorPosition] = useState<'top' | 'bottom'>('bottom');

    // Calculate available space and determine position
    useEffect(() => {
        if (anchorEl && isOpen) {
            const rect = anchorEl.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            // Estimate popover height (approximate based on content)
            const estimatedPopoverHeight = 250;
            
            // If there's more space above and not enough below, show above
            if (spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow) {
                setAnchorPosition('top');
            } else {
                setAnchorPosition('bottom');
            }
        }
    }, [anchorEl, isOpen]);

    // Sort by updatedAt descending (newest first)
    const sortedHistory = [...dueDateHistory].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Get the initial (target) date - the oldest entry with newDueDate
    const initialEntry = [...dueDateHistory]
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        .find(entry => entry.newDueDate);

    // Get the current (latest) due date
    const currentEntry = sortedHistory.find(entry => entry.newDueDate);

    // Get all revision entries (exclude initial and entries with null newDueDate)
    const revisions = sortedHistory.filter(entry => 
        entry.newDueDate && 
        entry.id !== initialEntry?.id
    );

    // Calculate days exceeded
    const calculateDaysExceeded = () => {
        if (!initialEntry?.newDueDate || !currentEntry?.newDueDate) return 0;
        
        const targetDate = DateTime.fromISO(initialEntry.newDueDate).startOf('day');
        const currentDate = DateTime.fromISO(currentEntry.newDueDate).startOf('day');
        
        const diff = currentDate.diff(targetDate, 'days').days;
        return Math.max(0, Math.floor(diff));
    };

    const daysExceeded = calculateDaysExceeded();

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not set';
        const dt = DateTime.fromISO(dateString);
        if (!dt.isValid) return 'Invalid date';
        
        // Format as "8th August 2025"
        const day = dt.day;
        const suffix = getOrdinalSuffix(day);
        return `${day}${suffix} ${dt.toFormat('MMMM yyyy')}`;
    };

    const getOrdinalSuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    const formatOrdinal = (index: number) => {
        return index + 1;
    };

    return (
        <Popover
            open={isOpen}
            anchorEl={anchorEl}
            onClose={onClose}
            disableRestoreFocus
            anchorOrigin={{
                vertical: anchorPosition === 'top' ? 'top' : 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: anchorPosition === 'top' ? 'bottom' : 'top',
                horizontal: 'left',
            }}
            // Allow MUI to automatically adjust position when there's no space
            slotProps={{
                paper: {
                    sx: {
                        marginTop: anchorPosition === 'bottom' ? '8px' : '0px',
                        marginBottom: anchorPosition === 'top' ? '8px' : '0px',
                    }
                }
            }}
            PaperProps={{
                style: {
                    borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    minWidth: 280,
                    maxWidth: 350,
                    pointerEvents: 'auto',
                    backgroundColor: 'white',
                }
            }}
            sx={{
                pointerEvents: 'none',
                zIndex: 9999, // Very high z-index
                '& .MuiBackdrop-root': {
                    backgroundColor: 'transparent',
                }
            }}
        >
            <div 
                className="p-4 bg-white border-x-2 border-y-4 border-[#656462] rounded-md flex flex-col items-center"
                // onMouseEnter={onMouseEnter}
                // onMouseLeave={onMouseLeave}
            >
                {/* Target Date */}
                {initialEntry?.newDueDate && (
                    <div className="mb-2 flex justify-center">
                        <div className="flex items-start gap-1">
                            <span className="text-[#f96332] font-semibold text-xl">Target Date:</span>
                            <span className="text-[#f96332] font-semibold text-xl">
                                {formatDate(initialEntry.newDueDate)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Revised Dates */}
                {revisions.length > 0 && (
                    <div className="mb-2 space-y-1 max-h-[100px] min-h-fit overflow-y-scroll pr-1">
                        {revisions.map((entry, index) => (
                            <div key={entry.id} className="flex items-start gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 rounded-full border-[1px] border-[#f7a19f]">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span className="text-sm text-gray-700">
                                    <span>Revised Date {formatOrdinal(index)}:</span>
                                    {' '}
                                    <span>{formatDate(entry.newDueDate)}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Days Exceeded */}
                {daysExceeded > 0 && (
                    <div className="mt-3">
                        <div className="bg-white border-2 border-red-500 rounded-md px-4 py-2 text-center">
                            <span className="text-lg font-bold text-red-500 italic">
                                Exceeded by {daysExceeded} {daysExceeded === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {sortedHistory.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-xs text-gray-500">No due date history available</p>
                    </div>
                )}
            </div>
        </Popover>
    );
};

export default DueDateHistoryPopover;
