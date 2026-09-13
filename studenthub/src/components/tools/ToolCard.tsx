'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import styles from './ToolCard.module.css';
import type { Tool } from '@/types';

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const [showModal, setShowModal] = useState(false);
  const isAvailable = tool.status === 'available';

  const cardContent = (
    <div className={[styles.card, !isAvailable ? styles.cardDisabled : ''].join(' ')}>
      {/* Icon */}
      <div className={styles.iconWrapper} style={{ '--tool-color': tool.color } as React.CSSProperties}>
        <span className={styles.icon} role="img" aria-label={tool.name}>
          {tool.icon}
        </span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{tool.name}</h3>
        <p className={styles.desc}>{tool.description}</p>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <StatusBadge status={tool.status} />
        {isAvailable ? (
          <span className={styles.action}>
            Open Tool <ArrowRight size={14} />
          </span>
        ) : (
          <span className={styles.actionDisabled}>
            <Clock size={12} /> Coming Soon
          </span>
        )}
      </div>
    </div>
  );

  if (isAvailable) {
    return (
      <Link href={tool.path} className={styles.link} id={`tool-card-${tool.id}`}>
        {cardContent}
      </Link>
    );
  }

  return (
    <>
      <button
        className={styles.link}
        onClick={() => setShowModal(true)}
        id={`tool-card-${tool.id}`}
        aria-label={`${tool.name} — Coming Soon`}
      >
        {cardContent}
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Coming Soon"
        size="sm"
        id={`modal-${tool.id}`}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalIcon}>{tool.icon}</div>
          <h3 className={styles.modalTitle}>{tool.name}</h3>
          <p className={styles.modalDesc}>
            This tool is currently under development. We&apos;re building it as part of the
            StudentHub academic toolkit.
          </p>
          <p className={styles.modalNote}>
            Check back soon — new tools are added regularly.
          </p>
        </div>
      </Modal>
    </>
  );
}
