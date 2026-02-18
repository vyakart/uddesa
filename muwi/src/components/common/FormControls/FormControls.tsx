import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

interface FieldMetaProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

function joinDescribedBy(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(' ');
  return value.length > 0 ? value : undefined;
}

interface FieldShellProps extends FieldMetaProps {
  id: string;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  labelClassName?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  className,
  disabled = false,
  invalid = false,
  label,
  hint,
  error,
  labelClassName,
  children,
}: FieldShellProps) {
  const classes = [
    'muwi-field',
    disabled ? 'is-disabled' : null,
    invalid ? 'is-invalid' : null,
    className ?? null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-invalid={invalid ? 'true' : 'false'}>
      {label ? (
        <label htmlFor={id} className={labelClassName ?? 'muwi-field__label'}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? (
        <div id={`${id}-hint`} className="muwi-field__hint">
          {hint}
        </div>
      ) : null}
      {error ? (
        <div id={`${id}-error`} className="muwi-field__error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldMetaProps {
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, containerClassName, className, disabled, 'aria-describedby': ariaDescribedBy, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? `muwi-input-${generatedId}`;
  const isInvalid = Boolean(error);
  const describedBy = joinDescribedBy(ariaDescribedBy, hint ? `${inputId}-hint` : undefined, error ? `${inputId}-error` : undefined);

  return (
    <FieldShell
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      className={containerClassName}
      disabled={disabled}
      invalid={isInvalid}
    >
      <input
        ref={ref}
        id={inputId}
        className={['muwi-form-control', 'muwi-input', className ?? null].filter(Boolean).join(' ')}
        data-invalid={isInvalid ? 'true' : 'false'}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldMetaProps {
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, containerClassName, className, disabled, 'aria-describedby': ariaDescribedBy, children, ...props },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? `muwi-select-${generatedId}`;
  const isInvalid = Boolean(error);
  const describedBy = joinDescribedBy(ariaDescribedBy, hint ? `${selectId}-hint` : undefined, error ? `${selectId}-error` : undefined);

  return (
    <FieldShell
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      className={containerClassName}
      disabled={disabled}
      invalid={isInvalid}
    >
      <div className="muwi-select-wrap">
        <select
          ref={ref}
          id={selectId}
          className={['muwi-form-control', 'muwi-select', className ?? null].filter(Boolean).join(' ')}
          data-invalid={isInvalid ? 'true' : 'false'}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          {...props}
        >
          {children}
        </select>
        <span className="muwi-select__chevron" aria-hidden="true">
          ▾
        </span>
      </div>
    </FieldShell>
  );
});

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>, FieldMetaProps {
  containerClassName?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { id, label, hint, error, containerClassName, className, disabled, 'aria-describedby': ariaDescribedBy, ...props },
  ref
) {
  const generatedId = useId();
  const toggleId = id ?? `muwi-toggle-${generatedId}`;
  const isInvalid = Boolean(error);
  const describedBy = joinDescribedBy(ariaDescribedBy, hint ? `${toggleId}-hint` : undefined, error ? `${toggleId}-error` : undefined);

  return (
    <FieldShell
      id={toggleId}
      label={label}
      hint={hint}
      error={error}
      className={containerClassName}
      labelClassName="muwi-field__label muwi-toggle-row"
      disabled={disabled}
      invalid={isInvalid}
    >
      <span className="muwi-toggle">
        <input
          ref={ref}
          id={toggleId}
          type="checkbox"
          role="switch"
          className={['muwi-toggle__input', className ?? null].filter(Boolean).join(' ')}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          {...props}
        />
        <span className="muwi-toggle__track" data-invalid={isInvalid ? 'true' : 'false'} aria-hidden="true">
          <span className="muwi-toggle__thumb" />
        </span>
      </span>
    </FieldShell>
  );
});
