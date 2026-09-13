import React from 'react';
import styles from './StateViews.module.css';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h3 className={styles.emptyTitle}>{title}</h3>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className={styles.loadingState}>
      <div className={styles.spinner} />
      <p className={styles.loadingMsg}>{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>⚠️</div>
      <h3 className={styles.errorTitle}>{title}</h3>
      <p className={styles.errorMsg}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Placeholder for future Google AdSense integration.
 * Renders nothing in production until ads are configured.
 */
export function AdSlot({ placement }: { placement: string }) {
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <div
      className={styles.adSlot}
      data-placement={placement}
      aria-hidden="true"
    >
      <span>Ad Slot: {placement}</span>
    </div>
  );
}
