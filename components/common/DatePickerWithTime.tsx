"use client";
import React, { useState, useRef, useEffect } from 'react';

interface DatePickerWithTimeProps {
  value?: string;
  onChange?: (datetime: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  timeFormat?: '12h' | '24h';
}

const DatePickerWithTime: React.FC<DatePickerWithTimeProps> = ({
  value = '',
  onChange,
  placeholder = 'Select date & time',
  className = '',
  disabled = false,
  minDate,
  maxDate,
  timeFormat = '12h',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const [hours, setHours] = useState(
    value ? new Date(value).getHours() : new Date().getHours()
  );
  const [minutes, setMinutes] = useState(
    value ? new Date(value).getMinutes() : new Date().getMinutes()
  );
  const [period, setPeriod] = useState<'AM' | 'PM'>(
    value ? (new Date(value).getHours() >= 12 ? 'PM' : 'AM') : 'AM'
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date);
      setHours(date.getHours());
      setMinutes(date.getMinutes());
      setPeriod(date.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDateTime = (date: Date | null, hrs: number, mins: number) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(hrs).padStart(2, '0');
    const minute = String(mins).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  };

  const formatDisplayDateTime = (date: Date | null, hrs: number, mins: number) => {
    if (!date) return '';
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (timeFormat === '12h') {
      const displayHours = hrs % 12 || 12;
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      return `${dateStr}, ${displayHours}:${String(mins).padStart(2, '0')} ${ampm}`;
    } else {
      return `${dateStr}, ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
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
  };

  const handleApply = () => {
    if (selectedDate && onChange) {
      onChange(formatDateTime(selectedDate, hours, minutes));
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

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    if (timeFormat === '12h') {
      if (val >= 1 && val <= 12) {
        const actualHour = period === 'PM' ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val);
        setHours(actualHour);
      }
    } else {
      if (val >= 0 && val <= 23) {
        setHours(val);
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    if (val >= 0 && val <= 59) {
      setMinutes(val);
    }
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    if (hours < 12) {
      setHours(hours + 12);
    } else {
      setHours(hours - 12);
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
  const displayHours = timeFormat === '12h' ? (hours % 12 || 12) : hours;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 border rounded-md cursor-pointer transition-all ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed opacity-60'
            : 'bg-white hover:border-[#C81C1F] focus-within:border-[#C81C1F] focus-within:ring-1 focus-within:ring-[#C81C1F]'
        }`}
        style={{ minWidth: '240px', borderColor: isOpen ? '#C81C1F' : '#D1D5DB' }}
      >
        <span className={selectedDate ? 'text-[#656462]' : 'text-[#8F8E8C]'}>
          {selectedDate ? formatDisplayDateTime(selectedDate, hours, minutes) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedDate && !disabled && (
            <button
              onClick={handleClear}
              className="text-[#8F8E8C] hover:text-[#C81C1F] transition-colors"
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#656462]">
            <path
              d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M8 4V8L10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
          style={{ minWidth: '320px' }}
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

          <div className="grid grid-cols-7 gap-1 mb-4">
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

          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={timeFormat === '12h' ? 1 : 0}
                  max={timeFormat === '12h' ? 12 : 23}
                  value={displayHours}
                  onChange={handleHourChange}
                  className="w-14 px-2 py-1 text-center border border-gray-300 rounded focus:border-[#C81C1F] focus:ring-1 focus:ring-[#C81C1F] text-[#656462]"
                />
                <span className="text-[#656462] font-semibold">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={String(minutes).padStart(2, '0')}
                  onChange={handleMinuteChange}
                  className="w-14 px-2 py-1 text-center border border-gray-300 rounded focus:border-[#C81C1F] focus:ring-1 focus:ring-[#C81C1F] text-[#656462]"
                />
              </div>
              {timeFormat === '12h' && (
                <button
                  onClick={handlePeriodToggle}
                  className="px-3 py-1 bg-[#C81C1F] text-white rounded hover:bg-[#a01618] transition-colors font-medium"
                  type="button"
                >
                  {period}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-[#656462] border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedDate}
              className={`px-4 py-2 rounded transition-colors ${
                selectedDate
                  ? 'bg-[#C81C1F] text-white hover:bg-[#a01618]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              type="button"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerWithTime;
