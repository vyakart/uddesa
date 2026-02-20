import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonAccessibilityProps =
  | {
      iconOnly: true;
      'aria-label': string;
      'aria-labelledby'?: string;
    }
  | {
      iconOnly?: false;
    };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonAccessibilityProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    active = false,
    fullWidth = false,
    iconOnly = false,
    leadingIcon,
    trailingIcon,
    className,
    type = 'button',
    children,
    ...buttonProps
  },
  ref
) {
  const classes = ['muwi-button', fullWidth ? 'is-full-width' : null, className ?? null]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      data-variant={variant}
      data-size={size}
      data-active={active ? 'true' : 'false'}
      data-icon-only={iconOnly ? 'true' : 'false'}
      {...buttonProps}
    >
      {leadingIcon ? <span className="muwi-button__icon" aria-hidden="true">{leadingIcon}</span> : null}
      {children ? <span className="muwi-button__label">{children}</span> : null}
      {trailingIcon ? <span className="muwi-button__icon" aria-hidden="true">{trailingIcon}</span> : null}
    </button>
  );
});
