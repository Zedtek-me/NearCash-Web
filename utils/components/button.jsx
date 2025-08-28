// src/components/Button.js
import React from 'react';

export const Button = ({ children, className = '', variant = 'default', ...props }) => {
  const base = 'px-4 py-2 rounded-lg font-medium transition-all';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
