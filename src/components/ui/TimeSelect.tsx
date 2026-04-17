'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface TimeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
}

// Generate time options in 30-minute intervals
function generateTimeOptions(
  startHour: number = 7,
  endHour: number = 19,
  intervalMinutes: number = 30
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      if (hour === endHour && minute > 0) break;

      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const value = `${hourStr}:${minuteStr}`;

      // Format label as "9:00 AM" or "2:30 PM"
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${minuteStr} ${ampm}`;

      options.push({ value, label });
    }
  }

  return options;
}

const TimeSelect = forwardRef<HTMLSelectElement, TimeSelectProps>(
  (
    {
      label,
      error,
      startHour = 7,
      endHour = 19,
      intervalMinutes = 30,
      className = '',
      ...props
    },
    ref
  ) => {
    const timeOptions = generateTimeOptions(startHour, endHour, intervalMinutes);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        >
          <option value="">Select time...</option>
          {timeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

TimeSelect.displayName = 'TimeSelect';

export default TimeSelect;