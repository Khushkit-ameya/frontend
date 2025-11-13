"use client";
import React, { useState, useRef } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, Popover } from '@mui/material';
import { DateTime } from 'luxon';
import { DueDateHistoryPopover } from './DueDateHistoryPopover';

interface DueDatePickerProps {
    currentValue: unknown;
    onDateChange: (newDate: string | null) => Promise<void>;
    disabled?: boolean;
    className?: string;
}

export const DueDatePicker: React.FC<DueDatePickerProps> = (props) => {
    const {
        currentValue,
        onDateChange,
        disabled = false,
        className = ""
    } = props;
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [historyAnchorEl, setHistoryAnchorEl] = useState<HTMLElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const clickRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Extract the actual date value from the current value
    const getCurrentDate = () => {
        if (!currentValue) return null;
        
        let dateValue;
        if (Array.isArray(currentValue) && currentValue.length > 0) {
            const latestDueDate = currentValue[0];
            dateValue = typeof latestDueDate === "object" && latestDueDate?.newDueDate
                ? latestDueDate.newDueDate
                : latestDueDate;
        } else {
            dateValue = currentValue;
        }

        if (!dateValue) return null;
        
        const dt = DateTime.fromISO(String(dateValue));
        return dt.isValid ? dt.toJSDate() : null;
    };

    const currentDate = getCurrentDate();

    const handleDateChange = async (newDate: Date | null) => {
        if (disabled || isLoading) return;
        
        setIsLoading(true);
        try {
            const dateString = newDate ? newDate.toISOString() : null;
            await onDateChange(dateString);
        } catch (error) {
            console.error('Failed to update due date:', error);
        } finally {
            setIsLoading(false);
            setAnchorEl(null);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!disabled && !isLoading) {
            // Clear any hover timeout to prevent history popover from showing
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
            setHistoryAnchorEl(null);
            setAnchorEl(e.currentTarget);
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        // Show history if there's any history data (even 1 entry)
        if (Array.isArray(currentValue) && currentValue.length > 0 && clickRef.current) {
            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            // Delay showing the history popover slightly
            hoverTimeoutRef.current = setTimeout(() => {
                if (clickRef.current) {
                    setHistoryAnchorEl(clickRef.current);
                }
            }, 300);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        // Clear the timeout if user leaves before it triggers
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        
        // Delay closing to allow moving to the popover
        setTimeout(() => {
            setHistoryAnchorEl(null);
        }, 200);
    };

    const handleHistoryClose = () => {
        setHistoryAnchorEl(null);
    };

    const handlePopoverMouseEnter = () => {
        // Keep the popover open when hovering over it
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handlePopoverMouseLeave = () => {
        // Close the popover when leaving it
        setHistoryAnchorEl(null);
    };

    const renderDisplayValue = () => {
        if (!currentDate) {
            return (
                <div 
                    ref={clickRef}
                    className={`text-sm text-gray-500 border border-dashed border-gray-300 px-4 py-1.5 rounded-full cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    title="Click to set due date"
                >
                    Set due date
                </div>
            );
        }

        const dt = DateTime.fromJSDate(currentDate);
        const isPast = dt.startOf("day") < DateTime.local().startOf("day");
        const color = isPast ? "#fe5137" : "#40a37c";

        return (
            <div
                ref={clickRef}
                className={`text-sm font-semibold border-[1px] px-9 py-0.5 w-fit rounded-full cursor-pointer hover:opacity-80 transition-opacity ${className}`}
                style={{ borderColor: color, color }}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                title="Click to change due date · Hover for history"
            >
                {dt.toFormat("dd/MM/yyyy")}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="text-sm font-semibold border-[1px] border-gray-300 px-4 py-1.5 rounded-full text-gray-500">
                Updating...
            </div>
        );
    }

    const isOpen = Boolean(anchorEl);

    return (
        <div className="relative">
            {renderDisplayValue()}
            
            {/* History Popover - Shown on hover */}
            {Array.isArray(currentValue) && currentValue.length > 0 && (
                <DueDateHistoryPopover
                    dueDateHistory={currentValue}
                    anchorEl={historyAnchorEl}
                    onClose={handleHistoryClose}
                    onMouseEnter={handlePopoverMouseEnter}
                    onMouseLeave={handlePopoverMouseLeave}
                />
            )}

            {/* Date Picker Popover - Shown on click */}
            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{
                    style: {
                        marginTop: 8,
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }
                }}
            >
                <div className="p-4 min-w-[280px] w-fit">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-800">Update Due Date</h3>
                        <p className="text-xs text-gray-600">Select a new due date for this project</p>
                    </div>
                    
                    <div className="date-picker-wrapper">
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                value={currentDate}
                                onChange={handleDateChange}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'outlined' as const,
                                        size: 'small' as const,
                                    },
                                }}
                                minDate={currentDate ? new Date(currentDate) : new Date()}
                            />
                        </LocalizationProvider>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={() => setAnchorEl(null)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Popover>
        </div>
    );
};

export default DueDatePicker;