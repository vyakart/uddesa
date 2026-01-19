import React, { useState, useRef, useEffect } from 'react';
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

    const rows: React.ReactElement[] = [];
    let days: React.ReactElement[] = [];
    let day = startDate;

    // Header with day names
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const headerRow = (
      <div
        key="header"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '4px',
        }}
      >
        {dayNames.map((name) => (
          <div
            key={name}
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#888888',
              padding: '4px',
            }}
          >
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
            onClick={() => handleDateSelect(currentDay)}
            style={{
              padding: '6px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isSelected
                ? '#4A90A4'
                : isCurrentDay
                ? '#E8F4F8'
                : 'transparent',
              color: isSelected
                ? '#FFFFFF'
                : isCurrentMonth
                ? '#1A1A1A'
                : '#CCCCCC',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: isCurrentDay ? 600 : 400,
            }}
          >
            {format(day, 'd')}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div
          key={day.toISOString()}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
          }}
        >
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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Date Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: '1px solid #E0E0E0',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          fontSize: '1rem',
          color: '#1A1A1A',
        }}
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
          style={{ color: '#666666' }}
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
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            padding: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: '280px',
          }}
        >
          {/* Month Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <button
              onClick={handlePrevMonth}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: '#666666',
              }}
              aria-label="Previous month"
            >
              &lt;
            </button>
            <span
              style={{
                fontWeight: 600,
                fontSize: '1rem',
                color: '#1A1A1A',
              }}
            >
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: '#666666',
              }}
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          {/* Calendar Grid */}
          {renderCalendar()}

          {/* Today Button */}
          <button
            onClick={handleToday}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '8px',
              border: '1px solid #4A90A4',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#4A90A4',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
