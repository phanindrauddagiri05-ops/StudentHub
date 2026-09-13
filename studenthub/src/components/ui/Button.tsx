import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';
import type { ButtonVariant, ButtonSize } from '@/types';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant | 'outline';
  size?: ButtonSize;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  id?: string;
  'aria-label'?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  id,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={cls} id={id} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      id={id}
      aria-label={ariaLabel}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      {content}
    </button>
  );
}
