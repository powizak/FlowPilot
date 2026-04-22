import React from 'react';

interface BankAccountFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

export function BankAccountField({
  label,
  htmlFor,
  children,
}: BankAccountFieldProps) {
  return (
    <div className="block text-sm">
      <label
        htmlFor={htmlFor}
        className="block text-xs uppercase tracking-wider text-gray-500 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
