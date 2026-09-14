'use client';

import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatFileSize } from '@/lib/pdf';
import styles from './image-converter.module.css';

interface ImagePreviewCardProps {
  file: File;
  sourceFormat: string;
  targetFormat: string;
  onRemove: () => void;
  onConvert: () => void;
  converting: boolean;
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({
  file,
  sourceFormat,
  targetFormat,
  onRemove,
  onConvert,
  converting,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [canPreview, setCanPreview] = useState(true);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    // Check if the format can be previewed natively in modern browsers
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isDirectlyViewable = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(
      ext || ''
    );

    if (!isDirectlyViewable) {
      setCanPreview(false);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCanPreview(true);

    // Read image dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className={styles.previewCard}>
      <div className={styles.previewThumbnailContainer}>
        {canPreview && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={file.name}
            className={styles.previewThumbnail}
          />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <ImageIcon size={48} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {sourceFormat.toUpperCase()} Document
            </div>
            <div style={{ fontSize: '0.75rem' }}>Direct browser preview unavailable</div>
          </div>
        )}
      </div>

      <div className={styles.previewDetails}>
        <div className={styles.previewFilename}>{file.name}</div>
        <div className={styles.previewMeta}>
          <span>{formatFileSize(file.size)}</span>
          {dimensions && (
            <span>
              • {dimensions.width} × {dimensions.height} px
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span className={styles.conversionRelationBadge}>
            {sourceFormat.toUpperCase()} <ArrowRight size={13} /> {targetFormat.toUpperCase()}
          </span>
        </div>

        <div className={styles.actionsRow}>
          <Button
            variant="outline"
            onClick={onRemove}
            disabled={converting}
          >
            <Trash2 size={16} />
            Remove
          </Button>

          <Button
            variant="primary"
            onClick={onConvert}
            disabled={converting}
          >
            Convert to {targetFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
};
