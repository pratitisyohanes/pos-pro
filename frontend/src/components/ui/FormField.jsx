import { forwardRef } from 'react';

const controlClass = (error) =>
  `block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
    error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
  }`;

// Label, control and error message share one layout for every form field
function Field({ id, label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ id, label, error, hint, className = '', ...props }, ref) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input id={id} ref={ref} className={`${controlClass(error)} ${className}`} aria-invalid={!!error} {...props} />
    </Field>
  );
});

export const Select = forwardRef(function Select({ id, label, error, hint, options, placeholder, className = '', ...props }, ref) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select id={id} ref={ref} className={`${controlClass(error)} ${className}`} aria-invalid={!!error} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ id, label, error, hint, className = '', ...props }, ref) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <textarea id={id} ref={ref} rows={3} className={`${controlClass(error)} ${className}`} aria-invalid={!!error} {...props} />
    </Field>
  );
});
