'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ConversionCategory, ConversionDefinition, DocumentFormat } from '@/lib/converters/types';
import {
  CONVERSION_CATEGORIES,
  getConversionsByCategory,
} from '@/lib/converters/registry';
import { FormatBadge } from './FormatBadge';
import styles from './converter.module.css';

interface ConversionCardsGridProps {
  onSelectPair: (source: DocumentFormat, target: DocumentFormat) => void;
}

export const ConversionCardsGrid: React.FC<ConversionCardsGridProps> = ({
  onSelectPair,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ConversionCategory>('popular');
  const conversions = getConversionsByCategory(selectedCategory);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: '0.25rem' }}>
          Explore Conversions by Category
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
          Select a popular conversion preset or use the interactive format builder above.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className={styles.categoriesNav}>
        {CONVERSION_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={[styles.catPill, isActive ? styles.catPillActive : ''].join(' ')}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      <div className={styles.cardsGrid}>
        {conversions.map((conv: ConversionDefinition) => {
          const isAvail = conv.available;

          return (
            <div
              key={conv.id}
              className={styles.conversionCard}
              style={{ opacity: isAvail ? 1 : 0.75 }}
            >
              <div>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <FormatBadge format={conv.sourceFormat} size="sm" />
                    <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                    <FormatBadge format={conv.targetFormat} size="sm" />
                  </div>

                  {isAvail ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        textTransform: 'uppercase',
                      }}
                    >
                      Available
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        textTransform: 'uppercase',
                      }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>

                <p className={styles.cardDesc} style={{ marginTop: '0.75rem' }}>
                  {conv.description}
                </p>
              </div>

              <div className={styles.cardFooter}>
                <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                  Max {conv.maxFileSizeMB} MB
                </span>

                {isAvail ? (
                  <button
                    type="button"
                    onClick={() => onSelectPair(conv.sourceFormat, conv.targetFormat)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary-600)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Convert <ArrowRight size={13} />
                  </button>
                ) : (
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
