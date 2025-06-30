import React, { useState } from 'react';
import { HexColorType } from '../../commons';
// Enhanced Switch component with better accessibility and state management
// Based on Material Tailwind patterns: https://www.material-tailwind.com/docs/html/switch

type SwitchSize = 'sm' | 'md' | 'lg';
type SwitchColor = 'slate' | 'blue' | 'green' | 'red';

interface SwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  size?: SwitchSize;
  color?: SwitchColor;
  customColor?: HexColorType,
  disabled?: boolean;
  label?: string;
  description?: string;
  onChange?: (checked: boolean) => void;
}

const sizeStyles: Record<SwitchSize, { container: string; toggle: string; translate: string }> = {
  sm: {
    container: 'w-8 h-4',
    toggle: 'w-3 h-3',
    translate: 'peer-checked:translate-x-4'
  },
  md: {
    container: 'w-11 h-5',
    toggle: 'w-4 h-4',
    translate: 'peer-checked:translate-x-6'
  },
  lg: {
    container: 'w-14 h-7',
    toggle: 'w-6 h-6',
    translate: 'peer-checked:translate-x-7'
  }
};

const colorStyles: Record<SwitchColor, string> = {
  slate: 'peer-checked:bg-slate-800 peer-focus:ring-slate-300',
  blue: 'peer-checked:bg-blue-600 peer-focus:ring-blue-300',
  green: 'peer-checked:bg-green-600 peer-focus:ring-green-300',
  red: 'peer-checked:bg-red-600 peer-focus:ring-red-300'
};

export default function Switch({
  id,
  checked,
  defaultChecked = false,
  size = 'md',
  color = 'slate',
  customColor,
  disabled = false,
  label,
  description,
  onChange
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const generatedId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    
    onChange?.(newChecked);
  };

  const switchElement = (
    <div className={`relative inline-block ${sizeStyles[size].container}`}>
      <input
        id={generatedId}
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        className={`
          peer sr-only
        `}
        onChange={handleChange}
        aria-describedby={description ? `${generatedId}-description` : undefined}
      />
      <label
        htmlFor={generatedId}
        className={`
          absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full
          transition-colors duration-300 ease-in-out
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${customColor ? '' : 'bg-gray-200'}
          ${customColor ? '' : colorStyles[color]}
          peer-focus:ring-4 peer-focus:ring-opacity-20
          ${sizeStyles[size].container}
        `}
        style={customColor ? {
          backgroundColor: isChecked ? customColor : `${customColor}33`,
          border: !isChecked ? `1px solid ${customColor}` : 'none',
        } : undefined}
      />
      <span
        className={`
          absolute top-0.5 left-0.5 bg-white rounded-full shadow-md
          transition-transform duration-300 ease-in-out
          ${sizeStyles[size].toggle}
          ${sizeStyles[size].translate}
          pointer-events-none
        `}
      />
    </div>
  );

  if (label || description) {
    return (
      <div className="flex items-start space-x-3">
        {switchElement}
        <div className="flex-1">
          {label && (
            <label
              htmlFor={generatedId}
              className={`
                block text-sm font-medium text-gray-900 
                ${disabled ? 'text-gray-400' : 'cursor-pointer'}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={`${generatedId}-description`}
              className="text-sm text-gray-500"
            >
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return switchElement;
}