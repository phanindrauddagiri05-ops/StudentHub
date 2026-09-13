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
  title?: string;
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
  title,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? styles['btn--full'] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <span className={styles.btn__icon}>{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className={styles.btn__icon}>{icon}</span>
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={cls} id={id} title={title} aria-label={ariaLabel}>
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
      title={title}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
