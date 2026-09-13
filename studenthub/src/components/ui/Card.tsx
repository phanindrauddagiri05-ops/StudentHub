import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  flat?: boolean;
  raised?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hoverable = false,
  flat = false,
  raised = false,
  size = 'md',
  style,
  onClick,
}: CardProps) {
  const cls = [
    styles.card,
    hoverable ? styles['card--hoverable'] : '',
    flat ? styles['card--flat'] : '',
    raised ? styles['card--raised'] : '',
    size !== 'md' ? styles[`card--${size}`] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} style={style} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={[styles.cardHeader, className].filter(Boolean).join(' ')}>{children}</div>;
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={[styles.cardBody, className].filter(Boolean).join(' ')}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={[styles.cardFooter, className].filter(Boolean).join(' ')}>{children}</div>;
}
