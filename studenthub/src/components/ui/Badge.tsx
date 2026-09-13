import styles from './Badge.module.css';
import type { BadgeVariant } from '@/types';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const LABELS: Record<BadgeVariant, string> = {
  available: 'Available',
  'coming-soon': 'Coming Soon',
  new: 'New',
  default: '',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[`badge--${variant}`], className].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: 'available' | 'coming-soon' }) {
  return (
    <Badge variant={status}>
      {LABELS[status]}
    </Badge>
  );
}
