"use client";
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({ top: 0, left: 0, placement: 'bottom' });
  const [panelReady, setPanelReady] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideTrigger && !insidePanel) {
        setIsOpen(false);
      }
    };

    const computePosition = () => {
      const trigger = containerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelW = panelRef.current?.offsetWidth ?? 300;
      const panelH = panelRef.current?.offsetHeight ?? 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < panelH + 8;
      const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - panelW - 8));
      const top = placeAbove ? Math.max(8, rect.top - panelH - 8) : Math.min(window.innerHeight - panelH - 8, rect.bottom + 8);
      setPanelPos({ top, left, placement: placeAbove ? 'top' : 'bottom' });
    };

    if (isOpen) {
      setPanelReady(false);
      computePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', computePosition);
      window.addEventListener('scroll', computePosition, true);
      // re-measure after render then mark ready
      requestAnimationFrame(() => {
        computePosition();
        setPanelReady(true);
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
    };
  }, [isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (minDate && newDate < new Date(minDate)) return;
    if (maxDate && newDate > new Date(maxDate)) return;

    setSelectedDate(newDate);
    if (onChange) {
      onChange(formatDate(newDate));
    }
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    if (onChange) {
      onChange('');
    }
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-0 border rounded-full cursor-pointer transition-all h-[21px] min-h-[21px] input ${
            disabled
              ? 'bg-gray-100 cursor-not-allowed opacity-60'
              : 'bg-white hover:border-emerald-600 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600'
          }`}
          style={{ minWidth: '160px', borderColor: isOpen ? '#059669' : '#10b981' }}
        >
          <span className={selectedDate ? 'text-emerald-700 font-medium' : 'text-emerald-600'}>
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedDate && !disabled && (
              <button
                onClick={handleClear}
                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-700">
              <path
                d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10.6667 1.33333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5.33333 1.33333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M2 6.66667H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 p-4"
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, minWidth: '280px', visibility: panelReady ? 'visible' : 'hidden' }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-gray-100 text-[#656462] transition-colors"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="font-semibold text-[#656462]">{monthYear}</span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-gray-100 text-[#656462] transition-colors"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-[#8F8E8C] py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();
              const disabled = isDateDisabled(day);

              return (
                <button
                  key={day}
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    p-2 text-sm rounded transition-all
                    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${isSelected ? 'bg-[#C81C1F] text-white hover:bg-[#C81C1F]' : ''}
                    ${isToday && !isSelected ? 'border border-[#C81C1F] text-[#C81C1F]' : ''}
                    ${!isSelected && !isToday && !disabled ? 'text-[#656462]' : ''}
                  `}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DatePicker;
