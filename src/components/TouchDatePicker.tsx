import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTouchGestures, useIsTouchDevice, useHapticFeedback } from '../hooks/useTouchGestures';

interface TouchDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  min?: string;
  label?: string;
  error?: boolean;
  className?: string;
  'data-testid'?: string;
}

interface MonthYear {
  month: number;
  year: number;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TouchDatePicker: React.FC<TouchDatePickerProps> = ({
  value,
  onChange,
  max,
  min,
  label,
  error = false,
  className = '',
  'data-testid': testId
}) => {
  const { t } = useTranslation();
  const isTouch = useIsTouchDevice();
  const { lightTap } = useHapticFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Parse the current value to get initial month/year
  const initialDate = useMemo(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      return { month: month - 1, year };
    }
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  }, [value]);

  const [viewDate, setViewDate] = useState<MonthYear>(initialDate);

  // Parse min/max dates
  const minDate = useMemo(() => min ? new Date(min) : null, [min]);
  const maxDate = useMemo(() => max ? new Date(max) : null, [max]);

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewDate.year, viewDate.month, 1);
    const lastDay = new Date(viewDate.year, viewDate.month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [viewDate.month, viewDate.year]);

  // Check if a date is selectable (within min/max range)
  const isDateSelectable = useCallback((day: number) => {
    const date = new Date(viewDate.year, viewDate.month, day);
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  }, [viewDate.month, viewDate.year, minDate, maxDate]);

  // Check if the current month can navigate forward/backward
  const canGoBack = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = new Date(viewDate.year, viewDate.month - 1, 1);
    return prevMonth >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }, [viewDate, minDate]);

  const canGoForward = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = new Date(viewDate.year, viewDate.month + 1, 1);
    return nextMonth <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  }, [viewDate, maxDate]);

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    if (!canGoBack) return;
    lightTap();
    setViewDate(prev => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  }, [canGoBack, lightTap]);

  const goToNextMonth = useCallback(() => {
    if (!canGoForward) return;
    lightTap();
    setViewDate(prev => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  }, [canGoForward, lightTap]);

  // Swipe gestures for month navigation
  const { ref: swipeRef } = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: goToNextMonth,
    onSwipeRight: goToPrevMonth
  }, {
    enabled: isOpen,
    swipeThreshold: 30
  });

  // Select a date
  const handleSelectDate = useCallback((day: number) => {
    if (!isDateSelectable(day)) return;
    lightTap();
    const month = String(viewDate.month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${viewDate.year}-${month}-${dayStr}`;
    onChange(dateString);
    setIsOpen(false);
  }, [viewDate, onChange, isDateSelectable, lightTap]);

  // Handle clicks outside the picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) &&
          pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Format the displayed date
  const displayValue = useMemo(() => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }, [value]);

  // Check if current day is selected
  const isSelected = useCallback((day: number) => {
    if (!value) return false;
    const [year, month, dayStr] = value.split('-').map(Number);
    return year === viewDate.year && month === viewDate.month + 1 && dayStr === day;
  }, [value, viewDate]);

  // Check if current day is today
  const isToday = useCallback((day: number) => {
    const today = new Date();
    return today.getFullYear() === viewDate.year &&
           today.getMonth() === viewDate.month &&
           today.getDate() === day;
  }, [viewDate]);

  // For non-touch devices, fall back to native date input
  if (!isTouch) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={min}
        data-testid={testId}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-input ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        } ${className}`}
      />
    );
  }

  return (
    <div className="relative" ref={pickerRef}>
      {/* Input Button */}
      <button
        type="button"
        onClick={() => {
          lightTap();
          setIsOpen(true);
        }}
        data-testid={testId}
        className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between touch-target active:bg-gray-100 ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
        } ${className}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || t('common.selectDate')}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>

      {/* Date Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
          <div
            ref={modalRef}
            className="bg-white w-full sm:w-auto sm:min-w-[320px] rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] overflow-hidden animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {label || t('common.selectDate')}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="touch-target p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button
                onClick={goToPrevMonth}
                disabled={!canGoBack}
                className={`touch-target p-3 rounded-full ${
                  canGoBack
                    ? 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                aria-label={t('common.previousMonth')}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {MONTHS[viewDate.month]}
                </div>
                <div className="text-sm text-gray-500">{viewDate.year}</div>
              </div>
              <button
                onClick={goToNextMonth}
                disabled={!canGoForward}
                className={`touch-target p-3 rounded-full ${
                  canGoForward
                    ? 'hover:bg-gray-100 active:bg-gray-200 text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                aria-label={t('common.nextMonth')}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Swipe hint for mobile */}
            <div className="text-center text-xs text-gray-400 py-1">
              {t('common.swipeToNavigate')}
            </div>

            {/* Calendar Grid */}
            <div ref={swipeRef} className="p-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div
                    key={index}
                    className="text-center text-sm font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="aspect-square" />;
                  }

                  const selectable = isDateSelectable(day);
                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectDate(day)}
                      disabled={!selectable}
                      className={`
                        aspect-square flex items-center justify-center rounded-full text-sm font-medium
                        touch-target-small transition-colors
                        ${selected
                          ? 'bg-blue-600 text-white'
                          : today
                            ? 'bg-blue-100 text-blue-600'
                            : selectable
                              ? 'text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                              : 'text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const dateString = today.toISOString().split('T')[0];
                  if (!maxDate || today <= maxDate) {
                    onChange(dateString);
                    setIsOpen(false);
                  }
                }}
                className="flex-1 py-3 px-4 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg touch-target active:bg-blue-100"
              >
                {t('common.today')}
              </button>
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex-1 py-3 px-4 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg touch-target active:bg-gray-200"
              >
                {t('common.clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouchDatePicker;
