import { useState, useRef, useEffect, type ReactElement } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  dateFormat?: string;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  dateFormat = 'EEEE, MMMM d, yyyy',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMonth(selectedDate);
  }, [selectedDate]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewMonth(subMonths(viewMonth, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(addMonths(viewMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setViewMonth(today);
    onDateChange(today);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows: ReactElement[] = [];
    let days: ReactElement[] = [];
    let day = startDate;

    // Header with day names
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const headerRow = (
      <div key="header" className="muwi-personal-date-picker__weekdays">
        {dayNames.map((name) => (
          <div key={name} className="muwi-personal-date-picker__weekday">
            {name}
          </div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentDay = isToday(day);

        days.push(
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => handleDateSelect(currentDay)}
            className="muwi-personal-date-picker__day"
            data-selected={isSelected ? 'true' : 'false'}
            data-outside-month={isCurrentMonth ? 'false' : 'true'}
            data-today={isCurrentDay ? 'true' : 'false'}
            aria-pressed={isSelected}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toISOString()} className="muwi-personal-date-picker__week">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <>
        {headerRow}
        {rows}
      </>
    );
  };

  return (
    <div ref={containerRef} className="muwi-personal-date-picker">
      {/* Date Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="muwi-personal-date-picker__trigger"
        aria-label="Select date"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="muwi-personal-date-picker__trigger-icon"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{format(selectedDate, dateFormat)}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Date picker"
          className="muwi-personal-date-picker__dialog"
        >
          {/* Month Navigation */}
          <div className="muwi-personal-date-picker__month-nav">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="muwi-personal-date-picker__month-button"
              aria-label="Previous month"
            >
              &lt;
            </button>
            <span className="muwi-personal-date-picker__month-label">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="muwi-personal-date-picker__month-button"
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="muwi-personal-date-picker__calendar">{renderCalendar()}</div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="muwi-personal-date-picker__today"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
