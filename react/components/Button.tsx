import React from 'react';
// Enhanced Button component with variants, sizes, and better accessibility
// Based on Material Tailwind patterns: https://www.material-tailwind.com/docs/html/button

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-slate-800 text-white hover:bg-slate-700 focus:bg-slate-700 active:bg-slate-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:bg-gray-300 active:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:bg-green-700 active:bg-green-700',
  outline: 'border-2 border-slate-800 text-slate-800 bg-transparent hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        rounded-md border border-transparent text-center font-medium
        transition-all duration-200 shadow-md
        hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500
        disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
}