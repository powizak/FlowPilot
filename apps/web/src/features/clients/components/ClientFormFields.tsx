import React from 'react';

type ClientInputFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id'
> & {
  id: string;
  label: string;
  containerClassName?: string;
};

type ClientTextareaFieldProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id'
> & {
  id: string;
  label: string;
  containerClassName?: string;
};

export function ClientInputField({
  id,
  label,
  containerClassName = 'space-y-1',
  ...props
}: ClientInputFieldProps) {
  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="text-sm font-medium text-gray-400">
        {label}
      </label>
      <input id={id} {...props} />
    </div>
  );
}

export function ClientTextareaField({
  id,
  label,
  containerClassName = 'space-y-1',
  ...props
}: ClientTextareaFieldProps) {
  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="text-sm font-medium text-gray-400">
        {label}
      </label>
      <textarea id={id} {...props} />
    </div>
  );
}
