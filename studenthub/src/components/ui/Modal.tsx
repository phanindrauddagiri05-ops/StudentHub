'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', id }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id}-title` : undefined}
      id={id}
    >
      <div className={[styles.modal, styles[`modal--${size}`]].join(' ')}>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title} id={`${id}-title`}>
              {title}
            </h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button className={styles.closeBtnAbs} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
