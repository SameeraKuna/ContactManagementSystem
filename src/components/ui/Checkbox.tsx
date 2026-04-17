'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={`relative flex items-start ${className}`}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-colors ${
              error ? 'border-red-500' : ''
            }`}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={inputId}
                className={`font-medium ${
                  props.disabled ? 'text-gray-400' : 'text-gray-700'
                } cursor-pointer`}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={
                  props.disabled ? 'text-gray-400' : 'text-gray-500'
                }
              >
                {description}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-500 absolute -bottom-5 left-0">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;